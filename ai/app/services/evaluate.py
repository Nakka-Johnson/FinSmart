"""
Offline evaluation and metrics generation.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def evaluate_merchants(
    merchant_service: Any,
    test_data: list[dict],
) -> dict:
    """
    Evaluate merchant normalisation accuracy.

    Args:
        merchant_service: Trained MerchantService
        test_data: List of {raw, expected_canonical}

    Returns:
        Metrics dict
    """
    if not test_data:
        return {"error": "No test data provided"}

    top1_correct = 0
    top3_correct = 0
    total = 0

    for item in test_data:
        raw = item.get("raw", "")
        expected = item.get("expected_canonical", "").lower()

        if not raw or not expected:
            continue

        result = merchant_service.normalise(raw)
        predicted = result["canonical"].lower()
        candidates = [c["canonical"].lower() for c in result.get("candidates", [])]

        total += 1

        if predicted == expected:
            top1_correct += 1
            top3_correct += 1
        elif expected in candidates[:3]:
            top3_correct += 1

    if total == 0:
        return {"error": "No valid test samples"}

    return {
        "total_samples": total,
        "top1_accuracy": round(top1_correct / total, 4),
        "top3_accuracy": round(top3_correct / total, 4),
        "top1_correct": top1_correct,
        "top3_correct": top3_correct,
    }


def evaluate_categories(
    category_service: Any,
    test_df: pd.DataFrame,
    category_col: str = "category",
) -> dict:
    """
    Evaluate category classification accuracy.

    Args:
        category_service: Trained CategoryService
        test_df: Test DataFrame with features and labels
        category_col: Column name for true labels

    Returns:
        Metrics dict
    """
    if len(test_df) == 0:
        return {"error": "No test data provided"}

    true_labels = test_df[category_col].values
    predictions = category_service.predict(test_df, top_k=3)

    top1_correct = 0
    top3_correct = 0
    total = 0

    confidences = []

    for i, pred in enumerate(predictions):
        true_label = true_labels[i]
        chosen = pred["chosen"]
        top3_cats = [p["category"] for p in pred["top"]]

        total += 1
        confidences.append(pred["confidence"])

        if chosen == true_label:
            top1_correct += 1
            top3_correct += 1
        elif true_label in top3_cats:
            top3_correct += 1

    if total == 0:
        return {"error": "No valid test samples"}

    return {
        "total_samples": total,
        "top1_accuracy": round(top1_correct / total, 4),
        "top3_accuracy": round(top3_correct / total, 4),
        "top1_correct": top1_correct,
        "top3_correct": top3_correct,
        "mean_confidence": round(float(np.mean(confidences)), 4),
        "min_confidence": round(float(np.min(confidences)), 4),
        "max_confidence": round(float(np.max(confidences)), 4),
    }


def evaluate_anomalies(
    anomaly_service: Any,
    test_df: pd.DataFrame,
    known_anomaly_ids: list[str] | None = None,
) -> dict:
    """
    Evaluate anomaly detection.

    Args:
        anomaly_service: Trained AnomalyService
        test_df: Test DataFrame
        known_anomaly_ids: IDs of known anomalies (if available)

    Returns:
        Metrics dict
    """
    if len(test_df) == 0:
        return {"error": "No test data provided"}

    results = anomaly_service.score(test_df)

    scores = [r["score"] for r in results]
    labels = [r["label"] for r in results]

    normal_count = labels.count("NORMAL")
    suspicious_count = labels.count("SUSPICIOUS")
    severe_count = labels.count("SEVERE")

    metrics = {
        "total_samples": len(results),
        "normal_count": normal_count,
        "suspicious_count": suspicious_count,
        "severe_count": severe_count,
        "flagged_rate": round((suspicious_count + severe_count) / len(results), 4),
        "mean_score": round(float(np.mean(scores)), 4),
        "median_score": round(float(np.median(scores)), 4),
        "max_score": round(float(np.max(scores)), 4),
    }

    # If known anomalies provided, compute precision/recall
    if known_anomaly_ids:
        known_set = set(known_anomaly_ids)
        flagged_ids = {r["id"] for r in results if r["label"] != "NORMAL"}

        true_positives = len(known_set & flagged_ids)
        false_positives = len(flagged_ids - known_set)
        false_negatives = len(known_set - flagged_ids)

        precision = true_positives / (true_positives + false_positives) if flagged_ids else 0
        recall = true_positives / len(known_set) if known_set else 0

        metrics["known_anomalies"] = len(known_set)
        metrics["precision"] = round(precision, 4)
        metrics["recall"] = round(recall, 4)

    return metrics


def generate_metrics_report(
    merchant_metrics: dict | None = None,
    category_metrics: dict | None = None,
    anomaly_metrics: dict | None = None,
    output_dir: str | Path | None = None,
) -> tuple[dict, str]:
    """
    Generate combined metrics report.

    Args:
        merchant_metrics: Merchant evaluation results
        category_metrics: Category evaluation results
        anomaly_metrics: Anomaly evaluation results
        output_dir: Directory to write reports

    Returns:
        Tuple of (metrics_dict, markdown_string)
    """
    timestamp = datetime.now().isoformat()

    combined = {
        "generated_at": timestamp,
        "merchant_normalisation": merchant_metrics or {},
        "category_classification": category_metrics or {},
        "anomaly_detection": anomaly_metrics or {},
    }

    # Generate markdown
    md_lines = [
        "# AI Model Evaluation Metrics",
        "",
        f"**Generated:** {timestamp}",
        "",
    ]

    # Merchant metrics
    md_lines.append("## Merchant Normalisation")
    if merchant_metrics and "error" not in merchant_metrics:
        md_lines.extend([
            "",
            "| Metric | Value |",
            "|--------|-------|",
            f"| Total Samples | {merchant_metrics.get('total_samples', 'N/A')} |",
            f"| Top-1 Accuracy | {merchant_metrics.get('top1_accuracy', 'N/A'):.1%} |",
            f"| Top-3 Accuracy | {merchant_metrics.get('top3_accuracy', 'N/A'):.1%} |",
            "",
        ])
    else:
        md_lines.append(f"\n{merchant_metrics.get('error', 'Not evaluated')}\n")

    # Category metrics
    md_lines.append("## Category Classification")
    if category_metrics and "error" not in category_metrics:
        md_lines.extend([
            "",
            "| Metric | Value |",
            "|--------|-------|",
            f"| Total Samples | {category_metrics.get('total_samples', 'N/A')} |",
            f"| Top-1 Accuracy | {category_metrics.get('top1_accuracy', 'N/A'):.1%} |",
            f"| Top-3 Accuracy | {category_metrics.get('top3_accuracy', 'N/A'):.1%} |",
            f"| Mean Confidence | {category_metrics.get('mean_confidence', 'N/A'):.1%} |",
            "",
        ])
    else:
        md_lines.append(f"\n{category_metrics.get('error', 'Not evaluated')}\n")

    # Anomaly metrics
    md_lines.append("## Anomaly Detection")
    if anomaly_metrics and "error" not in anomaly_metrics:
        md_lines.extend([
            "",
            "| Metric | Value |",
            "|--------|-------|",
            f"| Total Samples | {anomaly_metrics.get('total_samples', 'N/A')} |",
            f"| Flagged Rate | {anomaly_metrics.get('flagged_rate', 'N/A'):.1%} |",
            f"| Normal | {anomaly_metrics.get('normal_count', 'N/A')} |",
            f"| Suspicious | {anomaly_metrics.get('suspicious_count', 'N/A')} |",
            f"| Severe | {anomaly_metrics.get('severe_count', 'N/A')} |",
            "",
        ])
        if "precision" in anomaly_metrics:
            md_lines.extend([
                f"| Precision | {anomaly_metrics.get('precision', 'N/A'):.1%} |",
                f"| Recall | {anomaly_metrics.get('recall', 'N/A'):.1%} |",
                "",
            ])
    else:
        md_lines.append(f"\n{anomaly_metrics.get('error', 'Not evaluated')}\n")

    markdown = "\n".join(md_lines)

    # Write to files if output_dir provided
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        json_path = output_dir / "metrics.json"
        with open(json_path, "w") as f:
            json.dump(combined, f, indent=2)
        logger.info(f"Wrote metrics to {json_path}")

        md_path = output_dir / "metrics.md"
        with open(md_path, "w") as f:
            f.write(markdown)
        logger.info(f"Wrote report to {md_path}")

    return combined, markdown
