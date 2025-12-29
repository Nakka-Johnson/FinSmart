"""
Category classification service using ML models.
"""

import logging
from typing import Any

import numpy as np
import pandas as pd

from .features import FeatureExtractor, extract_tokens

logger = logging.getLogger(__name__)


class CategoryService:
    """
    Category prediction using Logistic Regression with calibrated probabilities.
    """

    def __init__(
        self,
        feature_extractor: FeatureExtractor | None = None,
        model: Any = None,
        label_encoder: Any = None,
    ):
        """
        Initialize category service.

        Args:
            feature_extractor: Feature extractor instance
            model: Trained classifier
            label_encoder: Label encoder for categories
        """
        self.feature_extractor = feature_extractor
        self._model = model
        self._label_encoder = label_encoder
        self._trained = False

    @property
    def is_trained(self) -> bool:
        return self._trained and self._model is not None

    @property
    def categories(self) -> list[str]:
        if self._label_encoder is not None:
            return list(self._label_encoder.classes_)
        if self.feature_extractor is not None:
            return self.feature_extractor.categories
        return []

    def train(
        self,
        df: pd.DataFrame,
        category_col: str = "category",
        use_calibration: bool = True,
    ) -> dict:
        """
        Train the category classifier.

        Args:
            df: Training DataFrame with merchant, description, amount, direction, date, category
            category_col: Column name for labels
            use_calibration: Use probability calibration

        Returns:
            Training metrics dict
        """
        from sklearn.calibration import CalibratedClassifierCV
        from sklearn.linear_model import LogisticRegression
        from sklearn.model_selection import cross_val_score
        from sklearn.preprocessing import LabelEncoder

        # Prepare data
        df = df.dropna(subset=[category_col])
        if len(df) < 10:
            raise ValueError("Need at least 10 samples for training")

        # Fit feature extractor
        if self.feature_extractor is None:
            self.feature_extractor = FeatureExtractor()
        self.feature_extractor.fit(df)

        # Transform features
        X = self.feature_extractor.transform(df)

        # Encode labels
        self._label_encoder = LabelEncoder()
        y = self._label_encoder.fit_transform(df[category_col])

        logger.info(f"Training on {len(df)} samples, {len(self._label_encoder.classes_)} classes")
        logger.info(f"Feature shape: {X.shape}")

        # Train model (multi_class removed in sklearn 1.8+, multinomial is now default)
        base_model = LogisticRegression(
            max_iter=1000,
            solver="lbfgs",
            class_weight="balanced",
            random_state=42,
        )

        # Determine minimum samples per class for calibration
        unique, counts = np.unique(y, return_counts=True)
        min_samples_per_class = counts.min()

        if use_calibration and len(df) >= 50 and min_samples_per_class >= 5:
            # Use calibration for better probability estimates
            # CV must not exceed min samples per class
            cv_folds = min(5, min_samples_per_class)
            self._model = CalibratedClassifierCV(
                base_model,
                method="sigmoid",
                cv=cv_folds,
            )
        else:
            self._model = base_model

        self._model.fit(X, y)
        self._trained = True

        # Compute metrics
        metrics = {
            "n_samples": len(df),
            "n_classes": len(self._label_encoder.classes_),
            "n_features": X.shape[1],
        }

        # Cross-validation accuracy
        try:
            cv_scores = cross_val_score(base_model, X, y, cv=min(5, len(np.unique(y))))
            metrics["cv_accuracy_mean"] = float(np.mean(cv_scores))
            metrics["cv_accuracy_std"] = float(np.std(cv_scores))
        except Exception as e:
            logger.warning(f"Cross-validation failed: {e}")
            metrics["cv_accuracy_mean"] = None

        logger.info(f"Training complete: {metrics}")
        return metrics

    def predict(
        self,
        df: pd.DataFrame,
        top_k: int = 3,
    ) -> list[dict]:
        """
        Predict categories with explanations.

        Args:
            df: Input DataFrame with merchant, description, amount, direction, date
            top_k: Number of top predictions to return

        Returns:
            List of prediction dicts with top, chosen, confidence, why
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Run scripts/train_all.py first.")

        # Transform features
        X = self.feature_extractor.transform(df)

        # Get probabilities
        probas = self._model.predict_proba(X)
        classes = self._label_encoder.classes_

        results = []
        for i in range(len(df)):
            row = df.iloc[i]
            proba = probas[i]

            # Get top-k predictions
            top_indices = np.argsort(proba)[::-1][:top_k]
            top_preds = [
                {"category": classes[idx], "prob": float(proba[idx])}
                for idx in top_indices
            ]

            # Chosen is the top prediction
            chosen_idx = top_indices[0]
            chosen = classes[chosen_idx]
            confidence = float(proba[chosen_idx])

            # Build explanation
            why = self._explain_prediction(row, X[i], chosen_idx, proba)

            results.append({
                "top": top_preds,
                "chosen": chosen,
                "confidence": confidence,
                "why": why,
            })

        return results

    def _explain_prediction(
        self,
        row: pd.Series,
        features: np.ndarray,
        chosen_idx: int,
        proba: np.ndarray,
    ) -> dict:
        """
        Generate explanation for a prediction.

        Args:
            row: Input row
            features: Feature vector
            chosen_idx: Index of chosen class
            proba: Probability vector

        Returns:
            Explanation dict
        """
        # Extract text tokens
        merchant = str(row.get("merchant", ""))
        description = str(row.get("description", ""))
        combined_text = f"{merchant} {description}"
        tokens = extract_tokens(combined_text)

        # Get feature importance (for logistic regression)
        top_features = []
        if hasattr(self._model, "coef_"):
            coef = self._model.coef_[chosen_idx] if len(self._model.coef_.shape) > 1 else self._model.coef_
            feature_names = self.feature_extractor.get_feature_names()

            # Get non-zero feature contributions
            contributions = features * coef
            top_indices = np.argsort(np.abs(contributions))[::-1][:5]

            for idx in top_indices:
                if idx < len(feature_names) and np.abs(contributions[idx]) > 0.01:
                    name = feature_names[idx]
                    if name.startswith("tfidf_"):
                        name = name[6:]  # Remove prefix
                    top_features.append(name)
        elif hasattr(self._model, "calibrated_classifiers_"):
            # CalibratedClassifierCV - get from base estimator
            try:
                base = self._model.calibrated_classifiers_[0].estimator
                if hasattr(base, "coef_"):
                    coef = base.coef_[chosen_idx] if len(base.coef_.shape) > 1 else base.coef_
                    feature_names = self.feature_extractor.get_feature_names()
                    contributions = features * coef
                    top_indices = np.argsort(np.abs(contributions))[::-1][:5]
                    for idx in top_indices:
                        if idx < len(feature_names) and np.abs(contributions[idx]) > 0.01:
                            name = feature_names[idx]
                            if name.startswith("tfidf_"):
                                name = name[6:]
                            top_features.append(name)
            except (IndexError, AttributeError):
                pass

        # Generate notes
        notes_parts = []
        confidence = proba[chosen_idx]
        if confidence > 0.8:
            notes_parts.append("High confidence prediction")
        elif confidence > 0.5:
            notes_parts.append("Moderate confidence")
        else:
            notes_parts.append("Low confidence - consider manual review")

        # Check for ambiguity
        sorted_proba = np.sort(proba)[::-1]
        if len(sorted_proba) > 1 and sorted_proba[0] - sorted_proba[1] < 0.1:
            notes_parts.append("Multiple categories are similarly likely")

        return {
            "topTokens": tokens[:5],
            "topFeatures": top_features[:5],
            "notes": "; ".join(notes_parts),
        }

    def predict_single(
        self,
        merchant: str | None,
        description: str | None,
        amount: float,
        direction: str = "DEBIT",
        date: str | None = None,
        top_k: int = 3,
    ) -> dict:
        """
        Predict category for a single transaction.

        Args:
            merchant: Merchant name
            description: Transaction description
            amount: Transaction amount
            direction: DEBIT or CREDIT
            date: ISO date string
            top_k: Number of top predictions

        Returns:
            Prediction dict
        """
        df = pd.DataFrame([{
            "merchant": merchant,
            "description": description,
            "amount": amount,
            "direction": direction,
            "date": date,
        }])
        return self.predict(df, top_k=top_k)[0]

    def get_state(self) -> dict:
        """Get serializable state."""
        return {
            "model": self._model,
            "label_encoder": self._label_encoder,
            "feature_extractor": self.feature_extractor.get_state() if self.feature_extractor else None,
            "trained": self._trained,
        }

    def load_state(self, state: dict) -> None:
        """Load from saved state."""
        self._model = state.get("model")
        self._label_encoder = state.get("label_encoder")
        self._trained = state.get("trained", False)

        fe_state = state.get("feature_extractor")
        if fe_state:
            self.feature_extractor = FeatureExtractor.from_state(fe_state)
