"""
Pydantic schemas for Real AI v1 API endpoints.
"""

from datetime import date
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# =============================================================================
# Enums
# =============================================================================


class Direction(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class AnomalyLabel(str, Enum):
    NORMAL = "NORMAL"
    SUSPICIOUS = "SUSPICIOUS"
    SEVERE = "SEVERE"


# =============================================================================
# Health
# =============================================================================


class HealthResponse(BaseModel):
    status: str = "ai ok"
    version: str = "unknown"
    models_loaded: bool = False
    model_version: str | None = None


# =============================================================================
# Merchant Normalisation
# =============================================================================


class MerchantNormaliseItem(BaseModel):
    raw: str = Field(..., description="Raw merchant string to normalise")
    hintMerchant: str | None = Field(None, description="Optional merchant hint")
    hintDescription: str | None = Field(None, description="Optional description hint")


class MerchantNormaliseRequest(BaseModel):
    items: list[MerchantNormaliseItem] = Field(..., min_length=1)


class MerchantCandidate(BaseModel):
    canonical: str
    score: float = Field(..., ge=0.0, le=1.0)


class MerchantWhyInfo(BaseModel):
    matchedTokens: list[str] = Field(default_factory=list)
    notes: str = ""


class MerchantNormaliseResult(BaseModel):
    canonical: str
    score: float = Field(..., ge=0.0, le=1.0)
    candidates: list[MerchantCandidate] = Field(default_factory=list)
    why: MerchantWhyInfo = Field(default_factory=MerchantWhyInfo)


class MerchantNormaliseResponse(BaseModel):
    items: list[MerchantNormaliseResult]


# =============================================================================
# Category Prediction
# =============================================================================


class CategoryPredictItem(BaseModel):
    merchant: str | None = None
    description: str | None = None
    amount: float = Field(..., ge=0.0)
    direction: Direction = Direction.DEBIT
    date: str | None = Field(None, description="ISO date YYYY-MM-DD")


class CategoryPredictRequest(BaseModel):
    items: list[CategoryPredictItem] = Field(..., min_length=1)
    returnTopK: int = Field(3, ge=1, le=10)


class CategoryProb(BaseModel):
    category: str
    prob: float = Field(..., ge=0.0, le=1.0)


class CategoryWhyInfo(BaseModel):
    topTokens: list[str] = Field(default_factory=list)
    topFeatures: list[str] = Field(default_factory=list)
    notes: str = ""


class CategoryPredictResult(BaseModel):
    top: list[CategoryProb] = Field(default_factory=list)
    chosen: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    why: CategoryWhyInfo = Field(default_factory=CategoryWhyInfo)


class CategoryPredictResponse(BaseModel):
    items: list[CategoryPredictResult]


# =============================================================================
# Anomaly Scoring
# =============================================================================


class AnomalyScoreItem(BaseModel):
    id: str
    merchant: str | None = None
    category: str | None = None
    amount: float = Field(..., ge=0.0)
    direction: Direction = Direction.DEBIT
    date: str | None = Field(None, description="ISO date YYYY-MM-DD")


class AnomalyScoreRequest(BaseModel):
    items: list[AnomalyScoreItem] = Field(..., min_length=1)
    ignoreIds: list[str] = Field(default_factory=list)


class AnomalyWhyInfo(BaseModel):
    baseline: float = 0.0
    residual: float = 0.0
    notes: str = ""


class AnomalyScoreResult(BaseModel):
    id: str
    score: float = Field(..., ge=0.0, le=1.0)
    label: AnomalyLabel = AnomalyLabel.NORMAL
    why: AnomalyWhyInfo = Field(default_factory=AnomalyWhyInfo)


class AnomalyScoreResponse(BaseModel):
    items: list[AnomalyScoreResult]


# =============================================================================
# Legacy Schemas (backward compatibility)
# =============================================================================


class Txn(BaseModel):
    """Legacy transaction model for backward compatibility."""

    id: str | None = None
    date: str
    amount: float = Field(..., ge=0)
    category: str | None = None
    direction: Direction
    description: str | None = None
    merchant: str | None = None


class AnalyzeRequest(BaseModel):
    transactions: list[Txn] = Field(..., min_length=1)


class TopCategory(BaseModel):
    category: str
    total: float


class SummaryResponse(BaseModel):
    totalDebit: float
    totalCredit: float
    biggestCategory: str | None
    topCategories: list[TopCategory]


class CategoryReason(BaseModel):
    tokens: list[str]
    matchedKeywords: list[str]
    scores: dict[str, float]
    details: str


class CategoryGuess(BaseModel):
    guessCategory: str
    score: float
    reason: CategoryReason


class CategorizeResponse(BaseModel):
    predictions: list[CategoryGuess]


class AnomalyRequest(BaseModel):
    transactions: list[Txn]
    ignoreIds: list[str] | None = None


class AnomalyItem(BaseModel):
    date: str
    amount: float
    category: str | None
    score: float
    isAnomaly: bool


class AnomalyResponse(BaseModel):
    anomalies: list[AnomalyItem]


class ForecastItem(BaseModel):
    category: str
    nextMonthForecast: float
    method: str


class ForecastResponse(BaseModel):
    forecasts: list[ForecastItem]


class MerchantMonthly(BaseModel):
    month: str
    total: float


class MerchantInsight(BaseModel):
    merchant: str
    monthlyTotals: list[MerchantMonthly]
    totalSpending: float


class MerchantInsightRequest(BaseModel):
    transactions: list[Txn]
    monthsBack: int = Field(3, ge=1, le=12)


class MerchantInsightResponse(BaseModel):
    merchants: list[MerchantInsight]
