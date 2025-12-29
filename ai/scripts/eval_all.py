#!/usr/bin/env python3
"""
Evaluate AI models and generate metrics report.

Usage:
    python scripts/eval_all.py [--data path/to/test.csv] [--output _out/metrics.json]

This script:
1. Loads trained models
2. Runs evaluation on test data
3. Generates metrics report (JSON + Markdown)
"""

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd

from app.services.artifacts import ArtifactManager
from app.services.embeddings import EmbeddingService
from app.services.merchants import MerchantService
from app.services.categoriser import CategoryService
from app.services.anomalies import AnomalyService
from app.services.evaluate import (
    evaluate_merchants,
    evaluate_categories,
    evaluate_anomalies,
    generate_metrics_report,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def generate_test_data(n_samples: int = 100) -> pd.DataFrame:
    """
    Generate test data for evaluation.
    Includes known ground truth for evaluation.

    Args:
        n_samples: Number of samples

    Returns:
        DataFrame with test data
    """
    import numpy as np

    np.random.seed(99)  # Different seed from training

    test_cases = [
        # Merchant normalization test cases
        {"raw_merchant": "TESCO STORES 5678", "expected_merchant": "Tesco", "category": "Groceries", "amount": 45.00},
        {"raw_merchant": "AMAZON UK", "expected_merchant": "Amazon", "category": "Shopping", "amount": 29.99},
        {"raw_merchant": "UBER *TRIP XYZ", "expected_merchant": "Uber", "category": "Transport", "amount": 12.50},
        {"raw_merchant": "NETFLIX.COM", "expected_merchant": "Netflix", "category": "Entertainment", "amount": 15.99},
        {"raw_merchant": "SAINSBURYS", "expected_merchant": "Sainsburys", "category": "Groceries", "amount": 65.00},

        # Category classification test cases
        {"raw_merchant": "LIDL", "expected_merchant": "Lidl", "category": "Groceries", "amount": 35.00},
        {"raw_merchant": "COSTA", "expected_merchant": "Costa", "category": "Dining", "amount": 4.50},
        {"raw_merchant": "SHELL STATION", "expected_merchant": "Shell", "category": "Transport", "amount": 55.00},
        {"raw_merchant": "SPOTIFY", "expected_merchant": "Spotify", "category": "Entertainment", "amount": 9.99},
        {"raw_merchant": "BRITISH GAS", "expected_merchant": "British Gas", "category": "Bills", "amount": 75.00},

        # Anomaly test cases (high amounts)
        {"raw_merchant": "TESCO", "expected_merchant": "Tesco", "category": "Groceries", "amount": 500.00, "is_anomaly": True},
        {"raw_merchant": "MCDONALDS", "expected_merchant": "McDonalds", "category": "Dining", "amount": 150.00, "is_anomaly": True},
    ]

    # Extend with more random samples
    categories = ["Groceries", "Transport", "Dining", "Entertainment", "Shopping", "Bills"]
    for _ in range(n_samples - len(test_cases)):
        cat = np.random.choice(categories)
        amount = np.random.uniform(5, 100)
        test_cases.append({
            "raw_merchant": f"TEST MERCHANT {_}",
            "expected_merchant": f"Test Merchant {_}",
            "category": cat,
            "amount": round(amount, 2),
        })

    df = pd.DataFrame(test_cases)
    df["description"] = df["raw_merchant"]
    df["merchant"] = df["raw_merchant"]
    df["direction"] = "DEBIT"
    df["date"] = datetime.now().strftime("%Y-%m-%d")

    return df


def load_services() -> tuple[EmbeddingService, MerchantService, CategoryService, AnomalyService] | None:
    """
    Load all trained services from latest artefacts.

    Returns:
        Tuple of services or None if loading fails
    """
    manager = ArtifactManager()
    loaded = manager.load_all()

    if not loaded:
        logger.error("No trained models found! Run train_all.py first.")
        return None

    # Initialize services with loaded states
    embedding_service = EmbeddingService()
    embedding_service.set_state(loaded.get("embedding_service", {}))

    merchant_service = MerchantService(embedding_service=embedding_service)
    if "merchant_service" in loaded:
        merchant_service.set_state(loaded["merchant_service"])

    category_service = CategoryService()
    if "category_service" in loaded:
        category_service.set_state(loaded["category_service"])

    anomaly_service = AnomalyService()
    if "anomaly_service" in loaded:
        anomaly_service.set_state(loaded["anomaly_service"])

    return embedding_service, merchant_service, category_service, anomaly_service


def eval_all(data_path: str | None = None, output_dir: str = "_out") -> dict:
    """
    Evaluate all models and generate report.

    Args:
        data_path: Path to test data CSV
        output_dir: Output directory for reports

    Returns:
        Evaluation metrics dict
    """
    logger.info("=" * 60)
    logger.info("FinSmart AI Model Evaluation")
    logger.info("=" * 60)

    # Load services
    result = load_services()
    if result is None:
        return {"error": "Failed to load models"}

    embedding_service, merchant_service, category_service, anomaly_service = result

    # Load or generate test data
    if data_path and Path(data_path).exists():
        logger.info(f"Loading test data from: {data_path}")
        df = pd.read_csv(data_path)
    else:
        logger.info("Generating test data...")
        df = generate_test_data()

    metrics = {
        "timestamp": datetime.now().isoformat(),
        "n_test_samples": len(df),
    }

    # ==========================================================================
    # 1. Evaluate Merchant Normalization
    # ==========================================================================
    logger.info("\n[1/3] Evaluating merchant normalization...")

    if merchant_service.is_ready:
        merchant_metrics = evaluate_merchants(merchant_service, df)
        metrics["merchant"] = merchant_metrics
        logger.info(f"Merchant metrics: {merchant_metrics}")
    else:
        logger.warning("Merchant service not ready")
        metrics["merchant"] = {"error": "Service not ready"}

    # ==========================================================================
    # 2. Evaluate Category Classification
    # ==========================================================================
    logger.info("\n[2/3] Evaluating category classification...")

    if category_service.is_trained:
        category_metrics = evaluate_categories(category_service, df)
        metrics["category"] = category_metrics
        logger.info(f"Category accuracy: {category_metrics.get('accuracy', 0):.3f}")
    else:
        logger.warning("Category service not trained")
        metrics["category"] = {"error": "Service not trained"}

    # ==========================================================================
    # 3. Evaluate Anomaly Detection
    # ==========================================================================
    logger.info("\n[3/3] Evaluating anomaly detection...")

    if anomaly_service.is_trained:
        anomaly_metrics = evaluate_anomalies(anomaly_service, df)
        metrics["anomaly"] = anomaly_metrics
        logger.info(f"Anomaly metrics: {anomaly_metrics}")
    else:
        logger.warning("Anomaly service not trained")
        metrics["anomaly"] = {"error": "Service not trained"}

    # ==========================================================================
    # Generate Reports
    # ==========================================================================
    logger.info("\nGenerating reports...")

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # JSON metrics
    json_path = output_path / "metrics.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, default=str)
    logger.info(f"Saved: {json_path}")

    # Markdown report
    md_report = generate_metrics_report(metrics)
    md_path = output_path / "metrics_report.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_report)
    logger.info(f"Saved: {md_path}")

    logger.info("\n" + "=" * 60)
    logger.info("Evaluation complete!")
    logger.info("=" * 60)

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate FinSmart AI models")
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to test data CSV. If not provided, generates test data.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="_out",
        help="Output directory for reports",
    )

    args = parser.parse_args()

    metrics = eval_all(args.data, args.output)

    # Print summary
    print("\n" + "=" * 60)
    print("Evaluation Summary")
    print("=" * 60)
    print(json.dumps(metrics, indent=2, default=str))


if __name__ == "__main__":
    main()
