"""Quick manual test for AI service endpoints."""

import requests
import json

BASE_URL = "http://localhost:8001"

# Sample test data
test_transactions = [
    {
        "date": "2024-11-15",
        "amount": 150.50,
        "direction": "DEBIT",
        "category": "Groceries",
        "description": "Whole Foods Market"
    },
    {
        "date": "2024-11-16",
        "amount": 45.00,
        "direction": "DEBIT",
        "category": "Transport",
        "description": "Shell Gas Station"
    },
    {
        "date": "2024-11-17",
        "amount": 1200.00,
        "direction": "DEBIT",
        "category": "Rent",
        "description": "Monthly Rent Payment"
    },
    {
        "date": "2024-12-15",
        "amount": 165.25,
        "direction": "DEBIT",
        "category": "Groceries",
        "description": "Trader Joes"
    },
    {
        "date": "2024-12-16",
        "amount": 50.00,
        "direction": "DEBIT",
        "category": "Transport",
        "description": "Uber ride"
    },
    {
        "date": "2024-12-17",
        "amount": 1200.00,
        "direction": "DEBIT",
        "category": "Rent",
        "description": "Rent"
    },
    {
        "date": "2025-01-15",
        "amount": 180.00,
        "direction": "DEBIT",
        "category": "Groceries",
        "description": "Safeway"
    },
    {
        "date": "2025-01-16",
        "amount": 55.00,
        "direction": "DEBIT",
        "category": "Transport",
        "description": "Gas"
    },
    {
        "date": "2025-01-17",
        "amount": 1200.00,
        "direction": "DEBIT",
        "category": "Rent",
        "description": "Landlord"
    },
    {
        "date": "2025-01-18",
        "amount": 3000.00,
        "direction": "CREDIT",
        "category": None,
        "description": "Salary deposit"
    },
    {
        "date": "2025-01-19",
        "amount": 800.00,
        "direction": "DEBIT",
        "category": "Groceries",
        "description": "Large grocery run"  # Should be anomaly
    }
]


def test_health():
    """Test health endpoint."""
    print("\n=== Testing /health ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_analyze():
    """Test analyze endpoint."""
    print("\n=== Testing /analyze ===")
    payload = {"transactions": test_transactions}
    response = requests.post(f"{BASE_URL}/analyze", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_categorize():
    """Test categorize endpoint."""
    print("\n=== Testing /categorize ===")
    # Test with transactions missing categories
    test_txns = [
        {"date": "2025-01-15", "amount": 50.00, "direction": "DEBIT", "category": None, "description": "Whole Foods groceries"},
        {"date": "2025-01-16", "amount": 45.00, "direction": "DEBIT", "category": None, "description": "Shell gas station"},
        {"date": "2025-01-17", "amount": 20.00, "direction": "DEBIT", "category": None, "description": "Uber ride"},
        {"date": "2025-01-18", "amount": 100.00, "direction": "DEBIT", "category": None, "description": "Random store"}
    ]
    payload = {"transactions": test_txns}
    response = requests.post(f"{BASE_URL}/categorize", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_anomalies():
    """Test anomalies endpoint."""
    print("\n=== Testing /anomalies ===")
    payload = {"transactions": test_transactions}
    response = requests.post(f"{BASE_URL}/anomalies", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    # Highlight anomalies
    if response.status_code == 200:
        anomalies = [a for a in result["anomalies"] if a["isAnomaly"]]
        print(f"\n>>> Found {len(anomalies)} anomalies:")
        for a in anomalies:
            print(f"  - {a['date']}: ${a['amount']:.2f} in {a['category']} (z-score: {a['score']})")
    
    return response.status_code == 200


def test_forecast():
    """Test forecast endpoint."""
    print("\n=== Testing /forecast ===")
    payload = {"transactions": test_transactions}
    response = requests.post(f"{BASE_URL}/forecast", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


if __name__ == "__main__":
    print("Starting AI service tests...")
    print(f"Target URL: {BASE_URL}")
    print("\nMake sure the service is running:")
    print("  cd ai")
    print("  uvicorn app.main:app --reload --port 8001")
    
    try:
        results = {
            "health": test_health(),
            "analyze": test_analyze(),
            "categorize": test_categorize(),
            "anomalies": test_anomalies(),
            "forecast": test_forecast()
        }
        
        print("\n\n=== Test Summary ===")
        for endpoint, passed in results.items():
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"{endpoint:15} {status}")
        
        all_passed = all(results.values())
        print(f"\nOverall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to service")
        print("Make sure the service is running on port 8001")
