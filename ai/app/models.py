"""Pydantic models for request/response validation."""

from typing import Literal
from pydantic import BaseModel, Field


class Txn(BaseModel):
    """Transaction model for analysis."""

    date: str = Field(..., description="ISO date string (e.g., 2025-01-15)")
    amount: float = Field(..., ge=0, description="Transaction amount (must be >= 0)")
    category: str | None = Field(None, description="Transaction category (optional)")
    direction: Literal["DEBIT", "CREDIT"] = Field(..., description="Transaction direction")
    description: str | None = Field(None, description="Transaction description (optional)")


class AnalyzeRequest(BaseModel):
    """Request model for POST /analyze endpoint."""

    transactions: list[Txn] = Field(..., min_length=1, description="List of transactions to analyze")


class CategoryGuess(BaseModel):
    """Category guess with reason."""

    guessCategory: str = Field(..., description="Guessed category name")
    reason: str = Field(..., description="Reason for the guess")


class CategorizeResponse(BaseModel):
    """Response model for POST /categorize endpoint."""

    categories: list[CategoryGuess] = Field(..., description="Category guesses aligned by transaction index")


class ForecastItem(BaseModel):
    """Forecast for a single category."""

    category: str = Field(..., description="Category name")
    nextMonthForecast: float = Field(..., description="Predicted spending for next month")
    method: str = Field(..., description="Forecasting method used (SMA3, lastValue, etc.)")


class ForecastResponse(BaseModel):
    """Response model for POST /forecast endpoint."""

    forecasts: list[ForecastItem] = Field(..., description="Forecasts by category")


class AnomalyItem(BaseModel):
    """Anomaly detection result for a transaction."""

    date: str = Field(..., description="Transaction date")
    amount: float = Field(..., description="Transaction amount")
    category: str | None = Field(None, description="Transaction category")
    score: float = Field(..., description="Anomaly score (z-score)")
    isAnomaly: bool = Field(..., description="Whether this is flagged as anomaly")


class AnomalyResponse(BaseModel):
    """Response model for POST /anomalies endpoint."""

    anomalies: list[AnomalyItem] = Field(..., description="Anomaly detection results")


class TopCategory(BaseModel):
    """Top category by spending."""

    category: str = Field(..., description="Category name")
    total: float = Field(..., description="Total spending in category")


class SummaryResponse(BaseModel):
    """Response model for POST /analyze endpoint."""

    totalDebit: float = Field(..., description="Total debit amount")
    totalCredit: float = Field(..., description="Total credit amount")
    biggestCategory: str | None = Field(None, description="Category with highest debit spending")
    topCategories: list[TopCategory] = Field(..., description="Top 5 categories by debit spending")


class HealthResponse(BaseModel):
    """Response model for GET /health endpoint."""

    status: str = Field(..., description="Service health status (healthy/unhealthy)")
    service: str = Field(..., description="Service name")
    uptime_seconds: int = Field(..., description="Service uptime in seconds")

