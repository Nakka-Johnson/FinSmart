"""
Text embedding service using sentence-transformers.
Provides fallback to TF-IDF if sentence-transformers unavailable.
"""

import logging
import re
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

# Try to import sentence-transformers
_SENTENCE_TRANSFORMERS_AVAILABLE = False
_SentenceTransformer = None

try:
    from sentence_transformers import SentenceTransformer as _ST

    _SentenceTransformer = _ST
    _SENTENCE_TRANSFORMERS_AVAILABLE = True
    logger.info("sentence-transformers available")
except ImportError:
    logger.warning(
        "sentence-transformers not available, using TF-IDF fallback for embeddings"
    )

# Try to import sklearn for TF-IDF fallback
try:
    from sklearn.feature_extraction.text import TfidfVectorizer

    _TFIDF_AVAILABLE = True
except ImportError:
    _TFIDF_AVAILABLE = False
    logger.warning("sklearn not available for TF-IDF fallback")


class EmbeddingService:
    """
    Text embedding service with sentence-transformers or TF-IDF fallback.
    """

    # Default model - small and fast, good for merchant matching
    DEFAULT_MODEL = "all-MiniLM-L6-v2"

    def __init__(
        self,
        model_name: str | None = None,
        use_tfidf_fallback: bool = True,
        tfidf_vectorizer: Any | None = None,
    ):
        """
        Initialize embedding service.

        Args:
            model_name: Sentence-transformer model name (None for default)
            use_tfidf_fallback: Whether to use TF-IDF if transformers unavailable
            tfidf_vectorizer: Pre-fitted TF-IDF vectorizer for fallback
        """
        self.model_name = model_name or self.DEFAULT_MODEL
        self.use_tfidf_fallback = use_tfidf_fallback
        self._model = None
        self._tfidf = tfidf_vectorizer
        self._embedding_dim: int | None = None
        self._using_tfidf = False

    def initialize(self) -> bool:
        """
        Initialize the embedding model.

        Returns:
            True if successful
        """
        if _SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                logger.info(f"Loading sentence-transformer model: {self.model_name}")
                self._model = _SentenceTransformer(self.model_name)
                self._embedding_dim = self._model.get_sentence_embedding_dimension()
                logger.info(f"Model loaded, embedding dim: {self._embedding_dim}")
                return True
            except Exception as e:
                logger.error(f"Failed to load sentence-transformer: {e}")

        if self.use_tfidf_fallback and _TFIDF_AVAILABLE:
            logger.info("Using TF-IDF fallback for embeddings")
            self._using_tfidf = True
            if self._tfidf is None:
                # Create default TF-IDF vectorizer
                self._tfidf = TfidfVectorizer(
                    max_features=384,  # Match common embedding dim
                    ngram_range=(1, 2),
                    lowercase=True,
                    strip_accents="unicode",
                )
            self._embedding_dim = 384
            return True

        logger.error("No embedding method available")
        return False

    @property
    def embedding_dim(self) -> int:
        """Get embedding dimension."""
        return self._embedding_dim or 384

    @property
    def is_initialized(self) -> bool:
        """Check if service is initialized."""
        return self._model is not None or (self._using_tfidf and self._tfidf is not None)

    def embed(self, texts: list[str]) -> np.ndarray:
        """
        Embed a list of texts.

        Args:
            texts: List of text strings

        Returns:
            numpy array of shape (len(texts), embedding_dim)
        """
        if not texts:
            return np.array([]).reshape(0, self.embedding_dim)

        # Preprocess texts
        texts = [self._preprocess(t) for t in texts]

        if self._model is not None:
            # Use sentence-transformers
            embeddings = self._model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            return embeddings

        if self._using_tfidf and self._tfidf is not None:
            # Use TF-IDF
            try:
                # Check if fitted
                self._tfidf.vocabulary_
                embeddings = self._tfidf.transform(texts).toarray()
            except AttributeError:
                # Not fitted, fit on these texts (not ideal but works)
                embeddings = self._tfidf.fit_transform(texts).toarray()

            # Pad or truncate to target dim
            if embeddings.shape[1] < self._embedding_dim:
                pad = np.zeros((embeddings.shape[0], self._embedding_dim - embeddings.shape[1]))
                embeddings = np.hstack([embeddings, pad])
            elif embeddings.shape[1] > self._embedding_dim:
                embeddings = embeddings[:, : self._embedding_dim]

            return embeddings

        raise RuntimeError("Embedding service not initialized")

    def embed_single(self, text: str) -> np.ndarray:
        """Embed a single text."""
        return self.embed([text])[0]

    def fit_tfidf(self, texts: list[str]) -> None:
        """
        Fit TF-IDF vectorizer on texts (for fallback mode).

        Args:
            texts: Training texts
        """
        if self._tfidf is not None:
            texts = [self._preprocess(t) for t in texts]
            self._tfidf.fit(texts)
            logger.info(f"Fitted TF-IDF on {len(texts)} texts")

    def _preprocess(self, text: str) -> str:
        """Preprocess text for embedding."""
        if not text:
            return ""
        # Lowercase
        text = text.lower()
        # Remove special characters but keep spaces
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        # Collapse whitespace
        text = " ".join(text.split())
        return text

    def get_state(self) -> dict:
        """Get serializable state for saving."""
        return {
            "model_name": self.model_name,
            "embedding_dim": self._embedding_dim,
            "using_tfidf": self._using_tfidf,
            "tfidf": self._tfidf if self._using_tfidf else None,
        }

    @classmethod
    def from_state(cls, state: dict) -> "EmbeddingService":
        """Create from saved state."""
        service = cls(
            model_name=state.get("model_name"),
            tfidf_vectorizer=state.get("tfidf"),
        )
        service._embedding_dim = state.get("embedding_dim", 384)
        service._using_tfidf = state.get("using_tfidf", False)
        return service


def normalize_merchant_text(text: str | None) -> str:
    """
    Normalize merchant text for embedding/matching.

    Args:
        text: Raw merchant text

    Returns:
        Normalized text
    """
    if not text:
        return ""

    text = text.lower()

    # Remove common business suffixes
    suffixes = [
        r"\b(ltd|limited|inc|incorporated|llc|plc|corp|corporation|co|company)\b",
        r"\b(uk|usa|us|eu|int|intl|international)\b",
        r"\b(online|store|shop|retail|services?)\b",
    ]
    for suffix in suffixes:
        text = re.sub(suffix, "", text, flags=re.IGNORECASE)

    # Remove special characters
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Remove standalone numbers (like store numbers)
    text = re.sub(r"\b\d+\b", "", text)

    # Collapse whitespace
    text = " ".join(text.split())

    return text.strip()
