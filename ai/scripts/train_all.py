#!/usr/bin/env python3
"""
Train all AI models for FinSmart.

Usage:
    python scripts/train_all.py [--data path/to/transactions.csv]

This script:
1. Builds canonical merchant dictionary from training data
2. Builds FAISS index for merchant embeddings
3. Trains category classifier (Logistic Regression + calibration)
4. Trains anomaly model (Isolation Forest)
5. Saves artefacts to models/v<timestamp>/ with manifest.json
"""

import argparse
import hashlib
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd

from app.services.artifacts import ArtifactManager, compute_data_hash
from app.services.embeddings import EmbeddingService
from app.services.features import FeatureExtractor
from app.services.merchants import MerchantService, build_canonical_merchants_from_data
from app.services.categoriser import CategoryService
from app.services.anomalies import AnomalyService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def generate_demo_data(n_samples: int = 500) -> pd.DataFrame:
    """
    Generate synthetic demo data for training.

    Args:
        n_samples: Number of samples to generate

    Returns:
        DataFrame with merchant, description, amount, direction, date, category
    """
    logger.info(f"Generating {n_samples} synthetic training samples...")

    # Define merchants per category
    category_merchants = {
        "Groceries": [
            ("Tesco", "TESCO STORES 1234"),
            ("Sainsburys", "SAINSBURYS S/MKT"),
            ("Asda", "ASDA SUPERCENTRE"),
            ("Aldi", "ALDI STORES UK"),
            ("Lidl", "LIDL GB"),
            ("Morrisons", "MORRISONS PETROL"),
            ("Co-op", "COOP FOOD"),
            ("Waitrose", "WAITROSE & PARTNERS"),
        ],
        "Transport": [
            ("Uber", "UBER *TRIP"),
            ("TfL", "TFL TRAVEL CH"),
            ("Shell", "SHELL PETROL STN"),
            ("BP", "BP CONNECT"),
            ("Trainline", "TRAINLINE.COM"),
            ("National Rail", "GWR TICKETS"),
            ("Bolt", "BOLT.EU"),
        ],
        "Dining": [
            ("McDonalds", "MCDONALDS"),
            ("Nandos", "NANDOS"),
            ("Starbucks", "STARBUCKS COFFEE"),
            ("Costa", "COSTA COFFEE"),
            ("Pret", "PRET A MANGER"),
            ("Deliveroo", "DELIVEROO.COM"),
            ("Just Eat", "JUST EAT"),
            ("Uber Eats", "UBER EATS"),
        ],
        "Entertainment": [
            ("Netflix", "NETFLIX.COM"),
            ("Spotify", "SPOTIFY"),
            ("Amazon Prime", "PRIME VIDEO"),
            ("Disney+", "DISNEYPLUS"),
            ("Sky", "SKY UK LIMITED"),
            ("Vue Cinema", "VUE BSL"),
            ("Odeon", "ODEON CINEMAS"),
        ],
        "Shopping": [
            ("Amazon", "AMAZON.CO.UK"),
            ("eBay", "PAYPAL *EBAY"),
            ("ASOS", "ASOS.COM"),
            ("John Lewis", "JOHN LEWIS"),
            ("Argos", "ARGOS"),
            ("Next", "NEXT RETAIL"),
            ("H&M", "H&M ONLINE"),
            ("Primark", "PRIMARK"),
        ],
        "Bills": [
            ("British Gas", "BRITISH GAS"),
            ("EDF", "EDF ENERGY"),
            ("Thames Water", "THAMES WATER"),
            ("Council Tax", "COUNCIL TAX"),
            ("Virgin Media", "VIRGIN MEDIA"),
            ("BT", "BT GROUP PLC"),
            ("O2", "O2 UK"),
            ("EE", "EE LIMITED"),
        ],
        "Health": [
            ("Boots", "BOOTS"),
            ("Lloyds Pharmacy", "LLOYDS PHARMACY"),
            ("Specsavers", "SPECSAVERS"),
            ("Gym", "PUREGYM"),
            ("Dentist", "DENTAL PRACTICE"),
            ("NHS", "NHS PRESCRIPTION"),
        ],
        "Rent": [
            ("Landlord", "RENT PAYMENT"),
            ("Letting Agent", "LETTINGS AGENCY"),
            ("Property Mgmt", "PROPERTY MANAGEMENT"),
        ],
    }

    # Amount ranges per category
    amount_ranges = {
        "Groceries": (15, 150),
        "Transport": (2, 80),
        "Dining": (5, 60),
        "Entertainment": (5, 50),
        "Shopping": (10, 200),
        "Bills": (20, 150),
        "Health": (5, 100),
        "Rent": (500, 2000),
    }

    np.random.seed(42)
    rows = []

    # Generate dates over last 6 months
    end_date = datetime.now()
    start_date = end_date.replace(month=end_date.month - 6 if end_date.month > 6 else end_date.month + 6)

    categories = list(category_merchants.keys())
    category_weights = [0.20, 0.15, 0.15, 0.10, 0.15, 0.10, 0.10, 0.05]  # Groceries most common

    for _ in range(n_samples):
        category = np.random.choice(categories, p=category_weights)
        merchants = category_merchants[category]
        merchant, description = merchants[np.random.randint(len(merchants))]

        min_amt, max_amt = amount_ranges[category]
        amount = round(np.random.uniform(min_amt, max_amt), 2)

        # Add some outliers (10% chance)
        if np.random.random() < 0.10:
            amount = amount * np.random.uniform(2, 5)
            amount = round(amount, 2)

        # Random date
        days_back = np.random.randint(0, 180)
        date = (end_date - pd.Timedelta(days=days_back)).strftime("%Y-%m-%d")

        rows.append({
            "merchant": merchant,
            "description": description,
            "amount": amount,
            "direction": "DEBIT",
            "date": date,
            "category": category,
        })

    # Add some CREDIT transactions
    credit_rows = [
        {"merchant": "Employer", "description": "SALARY PAYMENT", "amount": 2500.00, "direction": "CREDIT", "date": (end_date - pd.Timedelta(days=30)).strftime("%Y-%m-%d"), "category": "Income"},
        {"merchant": "Employer", "description": "SALARY PAYMENT", "amount": 2500.00, "direction": "CREDIT", "date": (end_date - pd.Timedelta(days=60)).strftime("%Y-%m-%d"), "category": "Income"},
        {"merchant": "Transfer", "description": "FASTER PAYMENT", "amount": 100.00, "direction": "CREDIT", "date": (end_date - pd.Timedelta(days=15)).strftime("%Y-%m-%d"), "category": "Transfer"},
    ]
    rows.extend(credit_rows)

    df = pd.DataFrame(rows)
    logger.info(f"Generated {len(df)} samples across {df['category'].nunique()} categories")
    return df


def load_training_data(data_path: str | None) -> pd.DataFrame:
    """
    Load training data from file or generate demo data.

    Args:
        data_path: Path to CSV file (None for demo data)

    Returns:
        DataFrame with training data
    """
    if data_path and Path(data_path).exists():
        logger.info(f"Loading training data from: {data_path}")
        df = pd.read_csv(data_path)

        # Ensure required columns
        required = ["merchant", "description", "amount", "direction", "date", "category"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            logger.warning(f"Missing columns: {missing}. Will use available columns.")

        return df

    logger.info("No training data provided, generating demo data...")
    return generate_demo_data()


def train_all(data_path: str | None = None) -> dict:
    """
    Train all models and save artefacts.

    Args:
        data_path: Path to training data CSV

    Returns:
        Training metrics dict
    """
    logger.info("=" * 60)
    logger.info("FinSmart AI Model Training")
    logger.info("=" * 60)

    # Load data
    df = load_training_data(data_path)

    # Compute data hash
    data_bytes = df.to_csv(index=False).encode("utf-8")
    data_hash = compute_data_hash(data_bytes)
    logger.info(f"Data hash: {data_hash}")

    # Initialize artifact manager
    manager = ArtifactManager()
    version = manager.create_version()
    logger.info(f"Creating version: {version}")

    metrics = {
        "training_samples": len(df),
        "data_hash": data_hash,
    }

    # ==========================================================================
    # 1. Train Embedding Service
    # ==========================================================================
    logger.info("\n[1/4] Initializing embedding service...")

    embedding_service = EmbeddingService()
    if not embedding_service.initialize():
        logger.error("Failed to initialize embedding service")
        return {"error": "Embedding service initialization failed"}

    # Fit TF-IDF if using fallback
    if embedding_service._using_tfidf:
        texts = []
        if "merchant" in df.columns:
            texts.extend(df["merchant"].dropna().astype(str).tolist())
        if "description" in df.columns:
            texts.extend(df["description"].dropna().astype(str).tolist())
        embedding_service.fit_tfidf(texts)

    manager.save_artifact(
        "embedding_service",
        embedding_service.get_state(),
        version,
        {"embedding_dim": embedding_service.embedding_dim},
    )

    # ==========================================================================
    # 2. Build Merchant Index
    # ==========================================================================
    logger.info("\n[2/4] Building merchant index...")

    merchants = df["merchant"].dropna().astype(str).tolist() if "merchant" in df.columns else []
    canonical_merchants = build_canonical_merchants_from_data(merchants, min_count=2)

    merchant_service = MerchantService(embedding_service=embedding_service)
    merchant_service.build_index(canonical_merchants)

    manager.save_artifact(
        "merchant_service",
        merchant_service.get_state(),
        version,
        {"n_canonical_merchants": len(canonical_merchants)},
    )

    metrics["merchant"] = {
        "n_canonical_merchants": len(canonical_merchants),
    }

    # ==========================================================================
    # 3. Train Category Classifier
    # ==========================================================================
    logger.info("\n[3/4] Training category classifier...")

    category_service = CategoryService()

    if "category" in df.columns:
        df_train = df.dropna(subset=["category"])
        if len(df_train) >= 10:
            cat_metrics = category_service.train(df_train, category_col="category")
            metrics["category"] = cat_metrics

            manager.save_artifact(
                "category_service",
                category_service.get_state(),
                version,
                cat_metrics,
            )
        else:
            logger.warning("Not enough labeled samples for category training")
            metrics["category"] = {"error": "Not enough labeled samples"}
    else:
        logger.warning("No 'category' column in training data")
        metrics["category"] = {"error": "No category column"}

    # ==========================================================================
    # 4. Train Anomaly Model
    # ==========================================================================
    logger.info("\n[4/4] Training anomaly model...")

    anomaly_service = AnomalyService()

    df_debit = df[df.get("direction", "DEBIT") == "DEBIT"]
    if len(df_debit) >= 10:
        anom_metrics = anomaly_service.train(df_debit, contamination=0.05)
        metrics["anomaly"] = anom_metrics

        manager.save_artifact(
            "anomaly_service",
            anomaly_service.get_state(),
            version,
            anom_metrics,
        )
    else:
        logger.warning("Not enough DEBIT transactions for anomaly training")
        metrics["anomaly"] = {"error": "Not enough DEBIT transactions"}

    # ==========================================================================
    # Save Manifest
    # ==========================================================================
    logger.info("\nSaving manifest...")

    manager.save_manifest(
        version=version,
        data_hash=data_hash,
        metrics=metrics,
        extra={
            "categories": category_service.categories if category_service.is_trained else [],
            "canonical_merchants": canonical_merchants[:20],  # Sample
        },
    )

    # Cleanup old versions (keep last 5)
    removed = manager.cleanup_old_versions(keep=5)
    if removed > 0:
        logger.info(f"Removed {removed} old versions")

    logger.info("\n" + "=" * 60)
    logger.info(f"Training complete! Version: {version}")
    logger.info("=" * 60)

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train FinSmart AI models")
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to training data CSV. If not provided, generates demo data.",
    )

    args = parser.parse_args()

    metrics = train_all(args.data)

    # Print summary
    print("\n" + "=" * 60)
    print("Training Summary")
    print("=" * 60)
    print(json.dumps(metrics, indent=2, default=str))


if __name__ == "__main__":
    main()
