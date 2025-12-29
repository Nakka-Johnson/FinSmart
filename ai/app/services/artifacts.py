"""
Artifact management: save, load, and version model artifacts.
"""

import hashlib
import json
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib

logger = logging.getLogger(__name__)


class ArtifactManager:
    """
    Manages model artifacts with versioning.

    Artifacts are stored in models/vYYYYMMDD_HHMMSS/ directories with a
    manifest.json containing metadata.
    """

    def __init__(self, base_dir: str | Path | None = None):
        if base_dir is None:
            # Default to ai/models relative to this file
            base_dir = Path(__file__).parent.parent.parent / "models"
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self._current_version: str | None = None
        self._artifacts: dict[str, Any] = {}

    @property
    def current_version(self) -> str | None:
        """Get the currently loaded version."""
        return self._current_version

    def get_latest_version(self) -> str | None:
        """Find the latest version directory."""
        versions = self._list_versions()
        return versions[-1] if versions else None

    def _list_versions(self) -> list[str]:
        """List all version directories sorted by name (timestamp)."""
        if not self.base_dir.exists():
            return []
        versions = [
            d.name
            for d in self.base_dir.iterdir()
            if d.is_dir() and d.name.startswith("v")
        ]
        return sorted(versions)

    def create_version(self) -> str:
        """Create a new version directory with timestamp."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = f"v{timestamp}"
        version_dir = self.base_dir / version
        version_dir.mkdir(parents=True, exist_ok=True)
        return version

    def get_version_dir(self, version: str | None = None) -> Path | None:
        """Get path to a version directory."""
        if version is None:
            version = self.get_latest_version()
        if version is None:
            return None
        version_dir = self.base_dir / version
        return version_dir if version_dir.exists() else None

    def save_artifact(
        self,
        name: str,
        obj: Any,
        version: str,
        metadata: dict | None = None,
    ) -> Path:
        """
        Save an artifact to a version directory.

        Args:
            name: Artifact name (without extension)
            obj: Object to save (uses joblib)
            version: Version string
            metadata: Optional metadata to store

        Returns:
            Path to saved artifact
        """
        version_dir = self.base_dir / version
        version_dir.mkdir(parents=True, exist_ok=True)

        artifact_path = version_dir / f"{name}.joblib"
        joblib.dump(obj, artifact_path)
        logger.info(f"Saved artifact: {artifact_path}")

        if metadata:
            meta_path = version_dir / f"{name}.meta.json"
            with open(meta_path, "w") as f:
                json.dump(metadata, f, indent=2, default=str)

        return artifact_path

    def load_artifact(
        self, name: str, version: str | None = None
    ) -> tuple[Any | None, dict | None]:
        """
        Load an artifact from a version directory.

        Args:
            name: Artifact name (without extension)
            version: Version string (None for latest)

        Returns:
            Tuple of (artifact, metadata) or (None, None) if not found
        """
        version_dir = self.get_version_dir(version)
        if version_dir is None:
            return None, None

        artifact_path = version_dir / f"{name}.joblib"
        if not artifact_path.exists():
            return None, None

        try:
            obj = joblib.load(artifact_path)
        except Exception as e:
            logger.error(f"Failed to load artifact {artifact_path}: {e}")
            return None, None

        metadata = None
        meta_path = version_dir / f"{name}.meta.json"
        if meta_path.exists():
            with open(meta_path) as f:
                metadata = json.load(f)

        return obj, metadata

    def save_manifest(
        self,
        version: str,
        data_hash: str,
        metrics: dict,
        extra: dict | None = None,
    ) -> Path:
        """
        Save a manifest.json for a version.

        Args:
            version: Version string
            data_hash: Hash of training data
            metrics: Training metrics summary
            extra: Additional metadata

        Returns:
            Path to manifest file
        """
        version_dir = self.base_dir / version
        version_dir.mkdir(parents=True, exist_ok=True)

        manifest = {
            "version": version,
            "createdAt": datetime.now().isoformat(),
            "dataHash": data_hash,
            "metrics": metrics,
            **(extra or {}),
        }

        manifest_path = version_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

        logger.info(f"Saved manifest: {manifest_path}")
        return manifest_path

    def load_manifest(self, version: str | None = None) -> dict | None:
        """Load manifest.json for a version."""
        version_dir = self.get_version_dir(version)
        if version_dir is None:
            return None

        manifest_path = version_dir / "manifest.json"
        if not manifest_path.exists():
            return None

        with open(manifest_path) as f:
            return json.load(f)

    def load_all(self, version: str | None = None) -> bool:
        """
        Load all artifacts for a version into memory.

        Returns:
            True if successful, False otherwise
        """
        if version is None:
            version = self.get_latest_version()

        if version is None:
            logger.warning("No model versions found")
            return False

        version_dir = self.get_version_dir(version)
        if version_dir is None:
            logger.warning(f"Version directory not found: {version}")
            return False

        # Load all .joblib files
        self._artifacts = {}
        for artifact_path in version_dir.glob("*.joblib"):
            name = artifact_path.stem
            try:
                self._artifacts[name] = joblib.load(artifact_path)
                logger.info(f"Loaded artifact: {name}")
            except Exception as e:
                logger.error(f"Failed to load {artifact_path}: {e}")
                return False

        self._current_version = version
        logger.info(f"Loaded all artifacts for version: {version}")
        return True

    def get(self, name: str) -> Any | None:
        """Get a loaded artifact by name."""
        return self._artifacts.get(name)

    def is_loaded(self) -> bool:
        """Check if any artifacts are loaded."""
        return len(self._artifacts) > 0

    def cleanup_old_versions(self, keep: int = 5) -> int:
        """
        Remove old versions, keeping the most recent ones.

        Args:
            keep: Number of versions to keep

        Returns:
            Number of versions removed
        """
        versions = self._list_versions()
        if len(versions) <= keep:
            return 0

        to_remove = versions[:-keep]
        removed = 0
        for version in to_remove:
            version_dir = self.base_dir / version
            try:
                shutil.rmtree(version_dir)
                logger.info(f"Removed old version: {version}")
                removed += 1
            except Exception as e:
                logger.error(f"Failed to remove {version}: {e}")

        return removed


def compute_data_hash(data: bytes | str) -> str:
    """Compute SHA256 hash of data."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()[:16]
