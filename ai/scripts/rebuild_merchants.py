#!/usr/bin/env python3
"""
Rebuild merchant index from CSV data.

Usage:
    python scripts/rebuild_merchants.py --data path/to/transactions.csv [--min-count 3]

This script:
1. Reads transaction data
2. Extracts unique merchants with frequency > min_count
3. Rebuilds FAISS index
4. Saves to current model version
"""

import argparse
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd

from app.services.artifacts import ArtifactManager
from app.services.embeddings import EmbeddingService
from app.services.merchants import MerchantService, build_canonical_merchants_from_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def rebuild_merchants(data_path: str, min_count: int = 3) -> dict:
    """
    Rebuild merchant index from transaction data.

    Args:
        data_path: Path to CSV with 'merchant' column
        min_count: Minimum occurrence count to include merchant

    Returns:
        Rebuild metrics
    """
    logger.info("=" * 60)
    logger.info("Rebuilding Merchant Index")
    logger.info("=" * 60)

    # Load data
    if not Path(data_path).exists():
        logger.error(f"Data file not found: {data_path}")
        return {"error": f"File not found: {data_path}"}

    df = pd.read_csv(data_path)

    if "merchant" not in df.columns:
        logger.error("CSV must have 'merchant' column")
        return {"error": "Missing 'merchant' column"}

    merchants = df["merchant"].dropna().astype(str).tolist()
    logger.info(f"Loaded {len(merchants)} merchant entries")

    # Load existing embedding service
    manager = ArtifactManager()
    loaded = manager.load_all()

    if not loaded or "embedding_service" not in loaded:
        logger.error("No trained embedding service found! Run train_all.py first.")
        return {"error": "Embedding service not found"}

    # Restore embedding service
    embedding_service = EmbeddingService()
    embedding_service.set_state(loaded["embedding_service"])

    # Build canonical merchants
    canonical_merchants = build_canonical_merchants_from_data(merchants, min_count=min_count)
    logger.info(f"Built {len(canonical_merchants)} canonical merchants (min_count={min_count})")

    if not canonical_merchants:
        logger.warning("No merchants passed min_count filter")
        return {"error": "No merchants passed filter", "min_count": min_count}

    # Build index
    merchant_service = MerchantService(embedding_service=embedding_service)
    merchant_service.build_index(canonical_merchants)

    # Save to current version
    version = manager.get_latest_version()
    if not version:
        version = manager.create_version()

    manager.save_artifact(
        "merchant_service",
        merchant_service.get_state(),
        version,
        {
            "n_canonical_merchants": len(canonical_merchants),
            "min_count": min_count,
            "rebuilt_from": data_path,
        },
    )

    # Update manifest
    manifest_path = manager.models_dir / version / "manifest.json"
    if manifest_path.exists():
        import json
        with open(manifest_path, "r") as f:
            manifest = json.load(f)

        manifest["artifacts"]["merchant_service"] = {
            "n_canonical_merchants": len(canonical_merchants),
            "min_count": min_count,
        }

        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

    logger.info("\n" + "=" * 60)
    logger.info(f"Merchant index rebuilt! Version: {version}")
    logger.info(f"Canonical merchants: {len(canonical_merchants)}")
    logger.info("=" * 60)

    return {
        "version": version,
        "n_canonical_merchants": len(canonical_merchants),
        "min_count": min_count,
    }


def main():
    parser = argparse.ArgumentParser(description="Rebuild merchant index")
    parser.add_argument(
        "--data",
        type=str,
        required=True,
        help="Path to CSV with 'merchant' column",
    )
    parser.add_argument(
        "--min-count",
        type=int,
        default=3,
        help="Minimum merchant occurrence count (default: 3)",
    )

    args = parser.parse_args()

    metrics = rebuild_merchants(args.data, args.min_count)

    print("\nResult:")
    import json
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
