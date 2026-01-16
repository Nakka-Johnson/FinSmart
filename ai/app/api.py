"""API routes for FinSmart AI service."""

import time
from fastapi import APIRouter
from app.models import (
    AnalyzeRequest,
    SummaryResponse,
    CategorizeResponse,
    AnomalyResponse,
    ForecastResponse,
    HealthResponse,
)
from app import service

router = APIRouter()

# Track service start time for uptime calculation
_start_time = time.time()


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    """
    Health check endpoint with service status details.
    
    Returns service status, uptime, and timestamp for monitoring.
    """
    uptime_seconds = int(time.time() - _start_time)
    return HealthResponse(
        status="healthy",
        service="ai",
        uptime_seconds=uptime_seconds
    )


@router.post("/analyze", response_model=SummaryResponse, tags=["insights"])
def analyze(req: AnalyzeRequest) -> SummaryResponse:
    """
    Analyze transactions and generate spending summary.

    Args:
        req: Request containing list of transactions

    Returns:
        Summary with total debit/credit, biggest category, top 5 categories
    """
    result = service.summarize(req.transactions)
    return SummaryResponse(**result)


@router.post("/categorize", response_model=CategorizeResponse, tags=["insights"])
def categorize(req: AnalyzeRequest) -> CategorizeResponse:
    """
    Guess categories for transactions using keyword matching.

    Args:
        req: Request containing list of transactions

    Returns:
        List of category guesses with reasons (aligned by index)
    """
    guesses = service.categorize(req.transactions)
    return CategorizeResponse(categories=guesses)


@router.post("/anomalies", response_model=AnomalyResponse, tags=["insights"])
def anomalies(req: AnalyzeRequest) -> AnomalyResponse:
    """
    Detect anomalies in transactions using z-score analysis.

    Args:
        req: Request containing list of transactions

    Returns:
        List of anomaly detection results (aligned by index)
    """
    results = service.anomalies(req.transactions)
    return AnomalyResponse(anomalies=results)


@router.post("/forecast", response_model=ForecastResponse, tags=["insights"])
def forecast(req: AnalyzeRequest) -> ForecastResponse:
    """
    Forecast next month spending by category using simple methods.

    Args:
        req: Request containing list of transactions

    Returns:
        List of forecasts per category with method used
    """
    forecasts = service.forecast(req.transactions)
    return ForecastResponse(forecasts=forecasts)
