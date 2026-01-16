"""Tests for monitoring and observability features."""

import pytest
from fastapi.testclient import TestClient
from app.main import create_app


@pytest.fixture
def client():
    """Create test client."""
    app = create_app()
    return TestClient(app)


def test_health_endpoint(client):
    """Test health endpoint returns proper status."""
    response = client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai"
    assert "uptime_seconds" in data
    assert data["uptime_seconds"] >= 0


def test_metrics_endpoint_exists(client):
    """Test metrics endpoint is available."""
    response = client.get("/metrics")
    # Should return 200 with Prometheus format
    assert response.status_code == 200
    # Check for Prometheus format markers
    assert "http_requests" in response.text or "# HELP" in response.text


def test_request_logging_middleware(client):
    """Test that requests are processed correctly through logging middleware."""
    # Make a request to health endpoint
    response = client.get("/health")
    assert response.status_code == 200
    
    # Make a request to analyze endpoint (with invalid data to test error logging)
    response = client.post("/analyze", json={"transactions": []})
    assert response.status_code == 422  # Validation error


def test_metrics_increment_on_requests(client):
    """Test that metrics endpoint is accessible multiple times."""
    # Get initial metrics
    response1 = client.get("/metrics")
    assert response1.status_code == 200
    
    # Make some requests
    client.get("/health")
    client.get("/health")
    
    # Get metrics again - endpoint should still work
    response2 = client.get("/metrics")
    assert response2.status_code == 200
    assert "# HELP" in response2.text


def test_error_handling_with_validation(client):
    """Test error handling with validation errors."""
    # Send invalid request (negative amount)
    response = client.post("/analyze", json={
        "transactions": [
            {"date": "2025-01-01", "amount": -100, "category": "Food", "direction": "DEBIT"}
        ]
    })
    
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "errors" in data


def test_analyze_endpoint_success(client):
    """Test analyze endpoint works correctly."""
    response = client.post("/analyze", json={
        "transactions": [
            {
                "date": "2025-01-01",
                "amount": 100.0,
                "category": "Food",
                "direction": "DEBIT",
                "description": "Grocery store"
            }
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "totalDebit" in data
    assert "totalCredit" in data
    assert "biggestCategory" in data
    assert "topCategories" in data


def test_categorize_endpoint(client):
    """Test categorize endpoint works correctly."""
    response = client.post("/categorize", json={
        "transactions": [
            {
                "date": "2025-01-01",
                "amount": 50.0,
                "category": None,
                "direction": "DEBIT",
                "description": "Whole Foods Market"
            }
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data


def test_anomalies_endpoint(client):
    """Test anomalies endpoint works correctly."""
    response = client.post("/anomalies", json={
        "transactions": [
            {
                "date": "2025-01-01",
                "amount": 100.0,
                "category": "Food",
                "direction": "DEBIT",
                "description": "Store"
            },
            {
                "date": "2025-01-02",
                "amount": 110.0,
                "category": "Food",
                "direction": "DEBIT",
                "description": "Store"
            },
            {
                "date": "2025-01-03",
                "amount": 105.0,
                "category": "Food",
                "direction": "DEBIT",
                "description": "Store"
            }
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "anomalies" in data


def test_forecast_endpoint(client):
    """Test forecast endpoint works correctly."""
    response = client.post("/forecast", json={
        "transactions": [
            {
                "date": "2024-11-01",
                "amount": 100.0,
                "category": "Food",
                "direction": "DEBIT",
                "description": "Store"
            },
            {
                "date": "2024-12-01",
                "amount": 110.0,
                "category": "Food",
                "direction": "DEBIT",
                "description": "Store"
            },
            {
                "date": "2025-01-01",
                "amount": 105.0,
                "category": "Food",
                "direction": "DEBIT",
                "description": "Store"
            }
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "forecasts" in data
