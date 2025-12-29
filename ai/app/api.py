"""API routes for FinSmart AI service - Legacy and v1 endpoints."""

import logging

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.models import (
    AnalyzeRequest,
    AnomalyRequest,
    MerchantInsightRequest,
    SummaryResponse,
    CategorizeResponse,
    AnomalyResponse,
    ForecastResponse,
    MerchantInsightResponse,
    HealthResponse,
)
from app.schemas import (
    MerchantNormaliseRequest,
    MerchantNormaliseResponse,
    MerchantNormaliseResult,
    MerchantCandidate,
    MerchantWhyInfo,
    CategoryPredictRequest,
    CategoryPredictResponse,
    CategoryPredictResult,
    CategoryProb,
    CategoryWhyInfo,
    AnomalyScoreRequest,
    AnomalyScoreResponse,
    AnomalyScoreResult,
    AnomalyWhyInfo,
    AnomalyLabel,
)
from app import service

logger = logging.getLogger(__name__)

# Legacy router (backward compatibility)
router = APIRouter()

# New v1 router with ML-based endpoints
router_v1 = APIRouter(tags=["v1"])


# =============================================================================
# Health Endpoint (shared)
# =============================================================================


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    """
    Health check endpoint.

    Returns model version info if available.
    """
    from app.main import get_services, get_git_version

    services = get_services()
    version = services.get("version")
    loaded = services.get("loaded", False)

    return HealthResponse(
        status="ai ok",
        version=get_git_version(),
        models_loaded=loaded,
        model_version=version,
    )


# =============================================================================
# Legacy Endpoints (backward compatibility)
# =============================================================================


@router.post("/analyze", response_model=SummaryResponse, tags=["legacy"])
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


@router.post("/categorize", response_model=CategorizeResponse, tags=["legacy"])
def categorize(req: AnalyzeRequest) -> CategorizeResponse:
    """
    Categorize transactions using weighted keyword matching with TF-IDF-like scoring.

    Returns detailed predictions with:
    - guessCategory: Best category above threshold
    - score: Normalized confidence score (0-1)
    - reason: Detailed explanation with matched tokens, keywords, and scores

    Args:
        req: Request containing list of transactions

    Returns:
        List of category predictions with scores and detailed reasons (aligned by index)
    """
    guesses = service.categorize(req.transactions)
    return CategorizeResponse(predictions=guesses)


@router.post("/anomalies", response_model=AnomalyResponse, tags=["legacy"])
def anomalies(req: AnomalyRequest) -> AnomalyResponse:
    """
    Detect anomalies in transactions using z-score analysis.

    Supports optional ignore list for snoozing/confirming anomalies.

    Args:
        req: Request containing list of transactions and optional ignoreIds

    Returns:
        List of anomaly detection results (aligned by index)
    """
    results = service.anomalies(req.transactions, req.ignoreIds)
    return AnomalyResponse(anomalies=results)


@router.post("/forecast", response_model=ForecastResponse, tags=["legacy"])
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


@router.post("/merchant-insights", response_model=MerchantInsightResponse, tags=["legacy"])
def merchant_insights(req: MerchantInsightRequest) -> MerchantInsightResponse:
    """
    Aggregate spending by merchant with monthly breakdown.

    Normalizes merchant names (case-folding, suffix removal) and provides
    monthly totals for the last N months.

    Args:
        req: Request containing transactions and monthsBack parameter

    Returns:
        List of merchant insights sorted by total spending (descending)
    """
    insights = service.merchant_insights(req.transactions, req.monthsBack)
    return MerchantInsightResponse(merchants=insights)


# =============================================================================
# V1 Endpoints (ML-based)
# =============================================================================


def _check_model_loaded(service_name: str) -> None:
    """Raise 503 if model not loaded."""
    from app.main import get_services

    services = get_services()
    if not services.get(service_name):
        raise HTTPException(
            status_code=503,
            detail=f"Model not trained. Run 'python scripts/train_all.py' first. "
            f"Missing: {service_name} service.",
        )


@router_v1.post(
    "/merchants/normalise",
    response_model=MerchantNormaliseResponse,
    summary="Normalise merchant names",
)
def v1_merchants_normalise(req: MerchantNormaliseRequest) -> MerchantNormaliseResponse:
    """
    Normalise merchant names using embedding similarity search.

    Uses sentence embeddings + FAISS for fast nearest neighbor matching
    against a trained canonical merchant dictionary.

    Args:
        req: Request with raw merchant strings and optional hints

    Returns:
        Normalised canonical names with confidence scores and candidates
    """
    _check_model_loaded("merchant")

    from app.main import get_services

    merchant_service = get_services()["merchant"]
    results = []

    for item in req.items:
        result = merchant_service.normalise(
            raw=item.raw,
            hint_merchant=item.hintMerchant,
            hint_description=item.hintDescription,
        )

        results.append(
            MerchantNormaliseResult(
                canonical=result["canonical"],
                score=result["score"],
                candidates=[
                    MerchantCandidate(canonical=c["canonical"], score=c["score"])
                    for c in result.get("candidates", [])
                ],
                why=MerchantWhyInfo(
                    matchedTokens=result.get("why", {}).get("matchedTokens", []),
                    notes=result.get("why", {}).get("notes", ""),
                ),
            )
        )

    return MerchantNormaliseResponse(items=results)


@router_v1.post(
    "/categories/predict",
    response_model=CategoryPredictResponse,
    summary="Predict transaction categories",
)
def v1_categories_predict(req: CategoryPredictRequest) -> CategoryPredictResponse:
    """
    Predict transaction categories using ML classifier.

    Uses Logistic Regression with calibrated probabilities trained on
    TF-IDF text features + numeric/temporal features.

    Args:
        req: Request with transaction details and returnTopK

    Returns:
        Top-K category predictions with confidence and explanations
    """
    _check_model_loaded("category")

    from app.main import get_services

    category_service = get_services()["category"]

    # Convert to DataFrame
    df = pd.DataFrame([
        {
            "merchant": item.merchant,
            "description": item.description,
            "amount": item.amount,
            "direction": item.direction.value,
            "date": item.date,
        }
        for item in req.items
    ])

    predictions = category_service.predict(df, top_k=req.returnTopK)
    results = []

    for pred in predictions:
        results.append(
            CategoryPredictResult(
                top=[
                    CategoryProb(category=p["category"], prob=p["prob"])
                    for p in pred["top"]
                ],
                chosen=pred["chosen"],
                confidence=pred["confidence"],
                why=CategoryWhyInfo(
                    topTokens=pred.get("why", {}).get("topTokens", []),
                    topFeatures=pred.get("why", {}).get("topFeatures", []),
                    notes=pred.get("why", {}).get("notes", ""),
                ),
            )
        )

    return CategoryPredictResponse(items=results)


@router_v1.post(
    "/anomalies/score",
    response_model=AnomalyScoreResponse,
    summary="Score transactions for anomalies",
)
def v1_anomalies_score(req: AnomalyScoreRequest) -> AnomalyScoreResponse:
    """
    Score transactions for anomalies using Isolation Forest.

    Uses Isolation Forest model trained on historical transaction patterns
    with per-category and per-merchant baselines.

    Args:
        req: Request with transaction details and ignoreIds

    Returns:
        Anomaly scores with labels and explanations
    """
    _check_model_loaded("anomaly")

    from app.main import get_services

    anomaly_service = get_services()["anomaly"]

    # Convert to DataFrame
    df = pd.DataFrame([
        {
            "id": item.id,
            "merchant": item.merchant,
            "category": item.category,
            "amount": item.amount,
            "direction": item.direction.value,
            "date": item.date,
        }
        for item in req.items
    ])

    scores = anomaly_service.score(df, ignore_ids=req.ignoreIds)
    results = []

    for score_result in scores:
        results.append(
            AnomalyScoreResult(
                id=score_result["id"],
                score=score_result["score"],
                label=AnomalyLabel(score_result["label"]),
                why=AnomalyWhyInfo(
                    baseline=score_result.get("why", {}).get("baseline", 0.0),
                    residual=score_result.get("why", {}).get("residual", 0.0),
                    notes=score_result.get("why", {}).get("notes", ""),
                ),
            )
        )

    return AnomalyScoreResponse(items=results)
