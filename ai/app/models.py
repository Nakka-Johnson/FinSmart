"""Pydantic models for request/response validation."""

from typing import Literal
from pydantic import BaseModel, Field


class Txn(BaseModel):
    """Transaction model for analysis."""

    id: str | None = Field(None, description="Transaction ID (optional, for ignore lists)")
    date: str = Field(..., description="ISO date string (e.g., 2025-01-15)")
    amount: float = Field(..., ge=0, description="Transaction amount (must be >= 0)")
    category: str | None = Field(None, description="Transaction category (optional)")
    direction: Literal["DEBIT", "CREDIT"] = Field(..., description="Transaction direction")
    description: str | None = Field(None, description="Transaction description (optional)")
    merchant: str | None = Field(None, description="Merchant name (optional)")


class AnalyzeRequest(BaseModel):
    """Request model for POST /analyze endpoint."""

    transactions: list[Txn] = Field(..., min_length=1, description="List of transactions to analyze")


class AnomalyRequest(BaseModel):
    """Request model for POST /anomalies endpoint."""

    transactions: list[Txn] = Field(..., min_length=1, description="List of transactions to analyze")
    ignoreIds: list[str] | None = Field(None, description="Transaction IDs to ignore (snooze/confirm)")


class MerchantInsightRequest(BaseModel):
    """Request model for merchant insights aggregation."""

    transactions: list[Txn] = Field(..., min_length=1, description="List of transactions to aggregate")
    monthsBack: int = Field(3, ge=1, le=12, description="Number of months to look back (1-12)")


class MerchantMonthly(BaseModel):
    """Monthly spending for a merchant."""

    month: str = Field(..., description="Month in YYYY-MM format")
    total: float = Field(..., description="Total spending for that month")


class MerchantInsight(BaseModel):
    """Aggregated merchant spending insights."""

    merchant: str = Field(..., description="Normalized merchant name")
    monthlyTotals: list[MerchantMonthly] = Field(..., description="Monthly spending breakdown")
    totalSpending: float = Field(..., description="Total spending across all months")


class MerchantInsightResponse(BaseModel):
    """Response model for merchant insights."""

    merchants: list[MerchantInsight] = Field(..., description="Merchant insights aggregated by month")


class CategoryReason(BaseModel):
    """Detailed reason for category guess."""

    tokens: list[str] = Field(..., description="Matched tokens from transaction")
    matchedKeywords: list[str] = Field(..., description="Keywords that matched")
    scores: dict[str, float] = Field(..., description="Score per category")
    details: str = Field(..., description="Human-readable explanation")


class CategoryGuess(BaseModel):
    """Category guess with score and detailed reason."""

    guessCategory: str = Field(..., description="Guessed category name")
    score: float = Field(..., description="Confidence score for the guess")
    reason: CategoryReason = Field(..., description="Detailed explanation with tokens and scores")


class CategorizeResponse(BaseModel):
    """Response model for POST /categorize endpoint."""

    predictions: list[CategoryGuess] = Field(..., description="Category predictions aligned by transaction index")


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

    status: str = Field(..., description="Service health status")
    version: str = Field("unknown", description="Git version or artefact version")
    models_loaded: bool = Field(False, description="Whether ML models are loaded")
    model_version: str | None = Field(None, description="Loaded model version")

