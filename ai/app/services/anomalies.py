"""
Anomaly detection service using Isolation Forest and seasonal residuals.
"""

import logging
from collections import defaultdict
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class AnomalyService:
    """
    Anomaly scoring using Isolation Forest with optional seasonal adjustment.
    """

    # Score thresholds for labels
    SUSPICIOUS_THRESHOLD = 0.6
    SEVERE_THRESHOLD = 0.8

    def __init__(
        self,
        model: Any = None,
        category_stats: dict | None = None,
        merchant_stats: dict | None = None,
    ):
        """
        Initialize anomaly service.

        Args:
            model: Trained Isolation Forest model
            category_stats: Per-category statistics {category: {mean, std}}
            merchant_stats: Per-merchant statistics {merchant: {mean, std}}
        """
        self._model = model
        self._category_stats = category_stats or {}
        self._merchant_stats = merchant_stats or {}
        self._global_stats: dict = {}
        self._trained = False

    @property
    def is_trained(self) -> bool:
        return self._trained

    def train(
        self,
        df: pd.DataFrame,
        contamination: float = 0.05,
        n_estimators: int = 100,
    ) -> dict:
        """
        Train the anomaly detection model.

        Args:
            df: Training DataFrame with amount, category, merchant, direction, date
            contamination: Expected proportion of outliers
            n_estimators: Number of trees in Isolation Forest

        Returns:
            Training metrics dict
        """
        from sklearn.ensemble import IsolationForest

        # Filter to DEBIT transactions
        df_debit = df[df.get("direction", "DEBIT") == "DEBIT"].copy()

        if len(df_debit) < 10:
            raise ValueError("Need at least 10 DEBIT transactions for training")

        # Compute statistics
        self._compute_statistics(df_debit)

        # Prepare features for Isolation Forest
        X = self._prepare_features(df_debit)

        # Train model
        self._model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=42,
            n_jobs=-1,
        )
        self._model.fit(X)
        self._trained = True

        # Compute metrics
        predictions = self._model.predict(X)
        anomaly_count = (predictions == -1).sum()

        metrics = {
            "n_samples": len(df_debit),
            "n_anomalies_detected": int(anomaly_count),
            "anomaly_rate": float(anomaly_count / len(df_debit)),
            "n_categories": len(self._category_stats),
            "n_merchants": len(self._merchant_stats),
        }

        logger.info(f"Training complete: {metrics}")
        return metrics

    def _compute_statistics(self, df: pd.DataFrame) -> None:
        """Compute per-category and per-merchant statistics."""
        # Global stats
        amounts = df["amount"].values
        self._global_stats = {
            "mean": float(np.mean(amounts)),
            "std": float(np.std(amounts)) or 1.0,
            "median": float(np.median(amounts)),
        }

        # Per-category stats
        self._category_stats = {}
        if "category" in df.columns:
            for cat, group in df.groupby("category"):
                if pd.notna(cat) and len(group) >= 3:
                    cat_amounts = group["amount"].values
                    self._category_stats[cat] = {
                        "mean": float(np.mean(cat_amounts)),
                        "std": float(np.std(cat_amounts)) or 1.0,
                        "count": len(group),
                    }

        # Per-merchant stats
        self._merchant_stats = {}
        if "merchant" in df.columns:
            for merchant, group in df.groupby("merchant"):
                if pd.notna(merchant) and len(group) >= 3:
                    merch_amounts = group["amount"].values
                    self._merchant_stats[merchant] = {
                        "mean": float(np.mean(merch_amounts)),
                        "std": float(np.std(merch_amounts)) or 1.0,
                        "count": len(group),
                    }

        logger.info(
            f"Computed stats: {len(self._category_stats)} categories, "
            f"{len(self._merchant_stats)} merchants"
        )

    def _prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare features for Isolation Forest."""
        features = []

        # Log amount
        log_amount = np.log1p(df["amount"].values).reshape(-1, 1)
        features.append(log_amount)

        # Z-score relative to global
        z_global = ((df["amount"].values - self._global_stats["mean"]) /
                    self._global_stats["std"]).reshape(-1, 1)
        features.append(z_global)

        # Z-score relative to category (if available)
        z_category = np.zeros((len(df), 1))
        if "category" in df.columns:
            for i, (_, row) in enumerate(df.iterrows()):
                cat = row.get("category")
                if cat in self._category_stats:
                    stats = self._category_stats[cat]
                    z_category[i] = (row["amount"] - stats["mean"]) / stats["std"]
        features.append(z_category)

        # Day of month feature (for seasonality)
        day_feature = np.zeros((len(df), 1))
        if "date" in df.columns:
            for i, (_, row) in enumerate(df.iterrows()):
                date_val = row.get("date")
                if pd.notna(date_val):
                    try:
                        if isinstance(date_val, str):
                            dt = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
                        else:
                            dt = date_val
                        # Normalize day to 0-1
                        day_feature[i] = dt.day / 31.0
                    except (ValueError, AttributeError):
                        pass
        features.append(day_feature)

        return np.hstack(features)

    def score(
        self,
        df: pd.DataFrame,
        ignore_ids: list[str] | None = None,
    ) -> list[dict]:
        """
        Score transactions for anomalies.

        Args:
            df: Input DataFrame with id, amount, category, merchant, direction, date
            ignore_ids: IDs to skip (already reviewed)

        Returns:
            List of anomaly score dicts
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Run scripts/train_all.py first.")

        ignore_ids = set(ignore_ids or [])
        results = []

        for _, row in df.iterrows():
            txn_id = str(row.get("id", ""))

            # Skip ignored IDs
            if txn_id in ignore_ids:
                results.append({
                    "id": txn_id,
                    "score": 0.0,
                    "label": "NORMAL",
                    "why": {
                        "baseline": 0.0,
                        "residual": 0.0,
                        "notes": "Skipped (in ignore list)",
                    },
                })
                continue

            # Skip CREDIT transactions
            if row.get("direction") == "CREDIT":
                results.append({
                    "id": txn_id,
                    "score": 0.0,
                    "label": "NORMAL",
                    "why": {
                        "baseline": 0.0,
                        "residual": 0.0,
                        "notes": "Credit transactions not scored",
                    },
                })
                continue

            # Prepare single row for prediction
            row_df = pd.DataFrame([row])
            X = self._prepare_features(row_df)

            # Get Isolation Forest score
            # decision_function returns negative scores for outliers
            raw_score = -self._model.decision_function(X)[0]

            # Normalize to 0-1 (higher = more anomalous)
            # Typical range is roughly -0.5 to 0.5
            score = float(np.clip((raw_score + 0.5) / 1.0, 0, 1))

            # Compute baseline and residual for explanation
            amount = row["amount"]
            category = row.get("category")
            merchant = row.get("merchant")

            baseline, residual = self._compute_residual(amount, category, merchant)

            # Determine label
            if score >= self.SEVERE_THRESHOLD:
                label = "SEVERE"
            elif score >= self.SUSPICIOUS_THRESHOLD:
                label = "SUSPICIOUS"
            else:
                label = "NORMAL"

            # Build explanation
            notes = self._build_notes(score, residual, category, merchant)

            results.append({
                "id": txn_id,
                "score": score,
                "label": label,
                "why": {
                    "baseline": round(baseline, 2),
                    "residual": round(residual, 2),
                    "notes": notes,
                },
            })

        return results

    def _compute_residual(
        self,
        amount: float,
        category: str | None,
        merchant: str | None,
    ) -> tuple[float, float]:
        """
        Compute baseline and residual for explanation.

        Returns:
            (baseline, residual) tuple
        """
        # Use category baseline if available, else merchant, else global
        if category and category in self._category_stats:
            stats = self._category_stats[category]
            baseline = stats["mean"]
        elif merchant and merchant in self._merchant_stats:
            stats = self._merchant_stats[merchant]
            baseline = stats["mean"]
        else:
            baseline = self._global_stats.get("mean", 0.0)

        residual = amount - baseline
        return baseline, residual

    def _build_notes(
        self,
        score: float,
        residual: float,
        category: str | None,
        merchant: str | None,
    ) -> str:
        """Build explanation notes."""
        parts = []

        if score >= self.SEVERE_THRESHOLD:
            parts.append("Highly unusual transaction")
        elif score >= self.SUSPICIOUS_THRESHOLD:
            parts.append("Moderately unusual transaction")
        else:
            parts.append("Transaction appears normal")

        if abs(residual) > 100:
            direction = "above" if residual > 0 else "below"
            parts.append(f"Amount is £{abs(residual):.2f} {direction} baseline")

        if category and category in self._category_stats:
            parts.append(f"Based on {self._category_stats[category]['count']} similar {category} transactions")
        elif merchant and merchant in self._merchant_stats:
            parts.append(f"Based on {self._merchant_stats[merchant]['count']} transactions from {merchant}")
        else:
            parts.append("Using global baseline (limited category/merchant data)")

        return "; ".join(parts)

    def score_single(
        self,
        txn_id: str,
        amount: float,
        category: str | None = None,
        merchant: str | None = None,
        direction: str = "DEBIT",
        date: str | None = None,
    ) -> dict:
        """Score a single transaction."""
        df = pd.DataFrame([{
            "id": txn_id,
            "amount": amount,
            "category": category,
            "merchant": merchant,
            "direction": direction,
            "date": date,
        }])
        return self.score(df)[0]

    def get_state(self) -> dict:
        """Get serializable state."""
        return {
            "model": self._model,
            "category_stats": self._category_stats,
            "merchant_stats": self._merchant_stats,
            "global_stats": self._global_stats,
            "trained": self._trained,
        }

    def load_state(self, state: dict) -> None:
        """Load from saved state."""
        self._model = state.get("model")
        self._category_stats = state.get("category_stats", {})
        self._merchant_stats = state.get("merchant_stats", {})
        self._global_stats = state.get("global_stats", {})
        self._trained = state.get("trained", False)
