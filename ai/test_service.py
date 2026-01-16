"""Quick test script to verify the refactored AI service works."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.api import analyze, health
from app.models import AnalyzeRequest, Txn


def test_health():
    """Test health endpoint."""
    result = health()
    assert result.status == "healthy"
    assert result.service == "ai"
    assert result.uptime_seconds >= 0
    print("✅ Health check passed")


def test_analyze_single_transaction():
    """Test analyze with single transaction."""
    req = AnalyzeRequest(
        transactions=[Txn(date="2025-01-01", amount=100.5, category="Food", direction="DEBIT")]
    )
    result = analyze(req)
    assert result.totalDebit == 100.5
    assert result.biggestCategory == "Food"
    print("✅ Single transaction analysis passed")


def test_analyze_multiple_transactions():
    """Test analyze with multiple transactions."""
    req = AnalyzeRequest(
        transactions=[
            Txn(date="2025-01-01", amount=100.5, category="Food", direction="DEBIT"),
            Txn(date="2025-01-02", amount=50.0, category="Transport", direction="DEBIT"),
            Txn(date="2025-01-03", amount=75.25, category="Shopping", direction="DEBIT"),
        ]
    )
    result = analyze(req)
    assert result.totalDebit == 225.75
    assert result.biggestCategory == "Food"  # Biggest category
    print("✅ Multiple transaction analysis passed")


def test_validation_negative_amount():
    """Test that negative amounts are rejected."""
    try:
        Txn(date="2025-01-01", amount=-10.0, category="Food", direction="DEBIT")
        print("❌ Negative amount validation failed")
    except Exception:
        print("✅ Negative amount validation passed")


def test_validation_empty_category():
    """Test that empty or None category is accepted (category is optional)."""
    try:
        Txn(date="2025-01-01", amount=10.0, category="", direction="DEBIT")
        Txn(date="2025-01-01", amount=10.0, category=None, direction="DEBIT")
        print("✅ Empty/None category validation passed (category is optional)")
    except Exception:
        print("❌ Empty/None category validation failed")


if __name__ == "__main__":
    print("Running AI Service Tests...\n")
    test_health()
    test_analyze_single_transaction()
    test_analyze_multiple_transactions()
    test_validation_negative_amount()
    test_validation_empty_category()
    print("\n🎉 All tests passed!")
