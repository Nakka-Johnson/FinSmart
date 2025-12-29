"""
Feature extraction for ML models.
"""

import logging
import re
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """
    Extract features from transaction data for ML models.
    """

    # Default categories (can be overridden)
    DEFAULT_CATEGORIES = [
        "Groceries",
        "Transport",
        "Rent",
        "Utilities",
        "Entertainment",
        "Dining",
        "Health",
        "Shopping",
        "Bills",
        "Income",
        "Transfer",
        "Other",
    ]

    def __init__(
        self,
        categories: list[str] | None = None,
        tfidf_vectorizer: Any | None = None,
        max_text_features: int = 100,
    ):
        """
        Initialize feature extractor.

        Args:
            categories: List of category names
            tfidf_vectorizer: Pre-fitted TF-IDF vectorizer
            max_text_features: Maximum text features for TF-IDF
        """
        self.categories = categories or self.DEFAULT_CATEGORIES.copy()
        self._tfidf = tfidf_vectorizer
        self.max_text_features = max_text_features
        self._fitted = False

    def fit(self, df: pd.DataFrame) -> "FeatureExtractor":
        """
        Fit feature extractor on training data.

        Args:
            df: DataFrame with columns: merchant, description, amount, direction, date

        Returns:
            self
        """
        from sklearn.feature_extraction.text import TfidfVectorizer

        # Fit TF-IDF on combined text
        texts = self._combine_text(df)
        self._tfidf = TfidfVectorizer(
            max_features=self.max_text_features,
            ngram_range=(1, 2),
            lowercase=True,
            strip_accents="unicode",
            min_df=2,
            max_df=0.95,
        )
        self._tfidf.fit(texts)
        logger.info(f"Fitted TF-IDF with {len(self._tfidf.vocabulary_)} features")

        # Update categories from data if available
        if "category" in df.columns:
            unique_cats = df["category"].dropna().unique().tolist()
            for cat in unique_cats:
                if cat not in self.categories:
                    self.categories.append(cat)

        self._fitted = True
        return self

    def transform(
        self,
        df: pd.DataFrame,
        include_text: bool = True,
        include_numeric: bool = True,
        include_temporal: bool = True,
    ) -> np.ndarray:
        """
        Transform data to feature matrix.

        Args:
            df: Input DataFrame
            include_text: Include TF-IDF text features
            include_numeric: Include numeric features
            include_temporal: Include temporal features

        Returns:
            Feature matrix (n_samples, n_features)
        """
        features = []

        if include_text and self._tfidf is not None:
            texts = self._combine_text(df)
            text_features = self._tfidf.transform(texts).toarray()
            features.append(text_features)

        if include_numeric:
            numeric_features = self._extract_numeric(df)
            features.append(numeric_features)

        if include_temporal:
            temporal_features = self._extract_temporal(df)
            features.append(temporal_features)

        if not features:
            raise ValueError("No features selected")

        return np.hstack(features)

    def _combine_text(self, df: pd.DataFrame) -> list[str]:
        """Combine merchant and description into single text."""
        texts = []
        for _, row in df.iterrows():
            parts = []
            if pd.notna(row.get("merchant")):
                parts.append(str(row["merchant"]))
            if pd.notna(row.get("description")):
                parts.append(str(row["description"]))
            text = " ".join(parts)
            text = self._clean_text(text)
            texts.append(text)
        return texts

    def _clean_text(self, text: str) -> str:
        """Clean text for TF-IDF."""
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = " ".join(text.split())
        return text

    def _extract_numeric(self, df: pd.DataFrame) -> np.ndarray:
        """Extract numeric features."""
        features = []

        # Log amount (add 1 to handle 0)
        amounts = df.get("amount", pd.Series([0.0] * len(df)))
        log_amount = np.log1p(amounts.fillna(0).values).reshape(-1, 1)
        features.append(log_amount)

        # Direction encoding (DEBIT=1, CREDIT=0)
        directions = df.get("direction", pd.Series(["DEBIT"] * len(df)))
        is_debit = (directions == "DEBIT").astype(float).values.reshape(-1, 1)
        features.append(is_debit)

        return np.hstack(features)

    def _extract_temporal(self, df: pd.DataFrame) -> np.ndarray:
        """Extract temporal features from date."""
        n_samples = len(df)
        features = np.zeros((n_samples, 5))  # dow, is_weekend, is_month_start, is_month_end, month_sin

        dates = df.get("date", pd.Series([None] * n_samples))

        for i, date_val in enumerate(dates):
            if pd.isna(date_val):
                continue

            try:
                if isinstance(date_val, str):
                    dt = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
                elif isinstance(date_val, datetime):
                    dt = date_val
                else:
                    continue

                # Day of week (0=Monday, normalized to 0-1)
                features[i, 0] = dt.weekday() / 6.0

                # Is weekend
                features[i, 1] = 1.0 if dt.weekday() >= 5 else 0.0

                # Is month start (first 3 days)
                features[i, 2] = 1.0 if dt.day <= 3 else 0.0

                # Is month end (last 3 days)
                features[i, 3] = 1.0 if dt.day >= 28 else 0.0

                # Month cyclical encoding (sin)
                features[i, 4] = np.sin(2 * np.pi * dt.month / 12)

            except (ValueError, AttributeError):
                continue

        return features

    def get_feature_names(self) -> list[str]:
        """Get names of all features."""
        names = []

        # Text features
        if self._tfidf is not None:
            names.extend([f"tfidf_{w}" for w in self._tfidf.get_feature_names_out()])

        # Numeric features
        names.extend(["log_amount", "is_debit"])

        # Temporal features
        names.extend([
            "day_of_week",
            "is_weekend",
            "is_month_start",
            "is_month_end",
            "month_sin",
        ])

        return names

    def get_text_feature_names(self) -> list[str]:
        """Get text feature names only."""
        if self._tfidf is not None:
            return list(self._tfidf.get_feature_names_out())
        return []

    def get_state(self) -> dict:
        """Get serializable state."""
        return {
            "categories": self.categories,
            "tfidf": self._tfidf,
            "max_text_features": self.max_text_features,
            "fitted": self._fitted,
        }

    @classmethod
    def from_state(cls, state: dict) -> "FeatureExtractor":
        """Create from saved state."""
        extractor = cls(
            categories=state.get("categories"),
            tfidf_vectorizer=state.get("tfidf"),
            max_text_features=state.get("max_text_features", 100),
        )
        extractor._fitted = state.get("fitted", False)
        return extractor


def extract_tokens(text: str) -> list[str]:
    """Extract significant tokens from text."""
    if not text:
        return []

    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = text.split()

    # Filter short tokens and common words
    stopwords = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
    tokens = [t for t in tokens if len(t) > 2 and t not in stopwords]

    return tokens
