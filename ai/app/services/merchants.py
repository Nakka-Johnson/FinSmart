"""
Merchant normalisation service using FAISS similarity search.
Falls back to cosine similarity if FAISS unavailable.
"""

import logging
from typing import Any

import numpy as np

from .embeddings import EmbeddingService, normalize_merchant_text

logger = logging.getLogger(__name__)

# Try to import FAISS
_FAISS_AVAILABLE = False
_faiss = None

try:
    import faiss as _faiss_module

    _faiss = _faiss_module
    _FAISS_AVAILABLE = True
    logger.info("FAISS available")
except ImportError:
    logger.warning("FAISS not available, using numpy cosine similarity fallback")


class MerchantService:
    """
    Merchant normalisation using embedding similarity search.
    Uses FAISS for fast nearest neighbor search, with numpy fallback.
    """

    def __init__(
        self,
        embedding_service: EmbeddingService | None = None,
        canonical_merchants: list[str] | None = None,
    ):
        """
        Initialize merchant service.

        Args:
            embedding_service: Embedding service for text encoding
            canonical_merchants: List of canonical merchant names
        """
        self.embedding_service = embedding_service
        self.canonical_merchants = canonical_merchants or []
        self._index = None
        self._embeddings: np.ndarray | None = None
        self._using_faiss = _FAISS_AVAILABLE

    def build_index(self, canonical_merchants: list[str]) -> None:
        """
        Build search index from canonical merchant names.

        Args:
            canonical_merchants: List of canonical merchant names
        """
        self.canonical_merchants = canonical_merchants

        if not canonical_merchants:
            logger.warning("No canonical merchants provided")
            return

        if self.embedding_service is None:
            raise RuntimeError("Embedding service not set")

        # Normalize and embed all merchants
        normalized = [normalize_merchant_text(m) for m in canonical_merchants]
        self._embeddings = self.embedding_service.embed(normalized)
        dim = self._embeddings.shape[1]

        logger.info(f"Building index for {len(canonical_merchants)} merchants, dim={dim}")

        if _FAISS_AVAILABLE:
            # Use FAISS index
            # Normalize embeddings for cosine similarity
            norms = np.linalg.norm(self._embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1  # Avoid division by zero
            normalized_embeddings = self._embeddings / norms

            # Create index
            self._index = _faiss.IndexFlatIP(dim)  # Inner product = cosine sim for normalized
            self._index.add(normalized_embeddings.astype(np.float32))

            self._using_faiss = True
            logger.info(f"FAISS index built with {self._index.ntotal} vectors")
        else:
            # Store embeddings for numpy fallback
            self._index = None
            self._using_faiss = False
            logger.info("Using numpy cosine similarity (no FAISS)")

    def search(
        self,
        query: str,
        hint_merchant: str | None = None,
        hint_description: str | None = None,
        top_k: int = 5,
    ) -> list[dict]:
        """
        Search for canonical merchant matches.

        Args:
            query: Raw merchant string
            hint_merchant: Optional merchant hint
            hint_description: Optional description hint
            top_k: Number of candidates to return

        Returns:
            List of {canonical, score, matched_tokens}
        """
        if not self.canonical_merchants or self._embeddings is None:
            return []

        if self.embedding_service is None:
            raise RuntimeError("Embedding service not set")

        # Combine query with hints
        combined = normalize_merchant_text(query)
        if hint_merchant:
            combined = f"{combined} {normalize_merchant_text(hint_merchant)}"
        if hint_description:
            combined = f"{combined} {normalize_merchant_text(hint_description)}"

        # Embed query
        query_embedding = self.embedding_service.embed_single(combined)
        query_embedding = query_embedding.reshape(1, -1)

        # Normalize for cosine similarity
        query_norm = np.linalg.norm(query_embedding)
        if query_norm > 0:
            query_embedding = query_embedding / query_norm

        if self._using_faiss and self._index is not None:
            # FAISS search
            distances, indices = self._index.search(
                query_embedding.astype(np.float32), min(top_k, len(self.canonical_merchants))
            )
            distances = distances[0]
            indices = indices[0]
        else:
            # Numpy fallback
            # Normalize stored embeddings
            norms = np.linalg.norm(self._embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1
            normalized = self._embeddings / norms

            # Compute cosine similarities
            similarities = (normalized @ query_embedding.T).flatten()

            # Get top-k
            indices = np.argsort(similarities)[::-1][:top_k]
            distances = similarities[indices]

        # Build results
        results = []
        query_tokens = set(combined.split())

        for idx, dist in zip(indices, distances):
            if idx < 0:  # FAISS returns -1 for empty results
                continue

            canonical = self.canonical_merchants[idx]
            canonical_tokens = set(normalize_merchant_text(canonical).split())

            # Convert distance to score (already cosine sim for normalized vectors)
            score = float(max(0, min(1, dist)))  # Clamp to [0, 1]

            # Find matched tokens
            matched = list(query_tokens & canonical_tokens)

            results.append({
                "canonical": canonical,
                "score": score,
                "matched_tokens": matched,
            })

        return results

    def normalise(
        self,
        raw: str,
        hint_merchant: str | None = None,
        hint_description: str | None = None,
        min_score: float = 0.3,
    ) -> dict:
        """
        Normalise a merchant name.

        Args:
            raw: Raw merchant string
            hint_merchant: Optional merchant hint
            hint_description: Optional description hint
            min_score: Minimum score to accept a match

        Returns:
            {canonical, score, candidates, why}
        """
        candidates = self.search(raw, hint_merchant, hint_description, top_k=5)

        if not candidates:
            return {
                "canonical": normalize_merchant_text(raw) or raw,
                "score": 0.0,
                "candidates": [],
                "why": {
                    "matchedTokens": [],
                    "notes": "No canonical merchants in index",
                },
            }

        best = candidates[0]

        if best["score"] < min_score:
            # Below threshold, use normalized raw
            return {
                "canonical": normalize_merchant_text(raw) or raw,
                "score": best["score"],
                "candidates": [
                    {"canonical": c["canonical"], "score": c["score"]}
                    for c in candidates[:3]
                ],
                "why": {
                    "matchedTokens": best.get("matched_tokens", []),
                    "notes": f"Best match below threshold ({best['score']:.2f} < {min_score})",
                },
            }

        return {
            "canonical": best["canonical"],
            "score": best["score"],
            "candidates": [
                {"canonical": c["canonical"], "score": c["score"]}
                for c in candidates[:3]
            ],
            "why": {
                "matchedTokens": best.get("matched_tokens", []),
                "notes": f"Matched with score {best['score']:.2f}",
            },
        }

    def get_state(self) -> dict:
        """Get serializable state."""
        return {
            "canonical_merchants": self.canonical_merchants,
            "embeddings": self._embeddings,
            "using_faiss": self._using_faiss,
        }

    def load_state(self, state: dict) -> None:
        """Load from saved state."""
        self.canonical_merchants = state.get("canonical_merchants", [])
        self._embeddings = state.get("embeddings")

        if self._embeddings is not None and len(self.canonical_merchants) > 0:
            # Rebuild index
            dim = self._embeddings.shape[1]

            if _FAISS_AVAILABLE:
                norms = np.linalg.norm(self._embeddings, axis=1, keepdims=True)
                norms[norms == 0] = 1
                normalized = self._embeddings / norms

                self._index = _faiss.IndexFlatIP(dim)
                self._index.add(normalized.astype(np.float32))
                self._using_faiss = True
                logger.info(f"Rebuilt FAISS index with {self._index.ntotal} vectors")
            else:
                self._using_faiss = False
                logger.info("Using numpy fallback (loaded embeddings)")


def build_canonical_merchants_from_data(
    merchants: list[str],
    min_count: int = 2,
) -> list[str]:
    """
    Build canonical merchant list from raw merchant data.

    Args:
        merchants: List of raw merchant strings
        min_count: Minimum occurrences to include

    Returns:
        List of canonical merchant names
    """
    from collections import Counter

    # Normalize and count
    normalized = [normalize_merchant_text(m) for m in merchants if m]
    counts = Counter(normalized)

    # Filter by count
    canonical = [m for m, c in counts.items() if c >= min_count and m]

    # Sort by frequency
    canonical.sort(key=lambda m: counts[m], reverse=True)

    logger.info(f"Built canonical list: {len(canonical)} merchants from {len(merchants)} raw")
    return canonical
