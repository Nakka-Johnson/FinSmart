"""
FastAPI application factory and configuration for Real AI v1.
"""

import logging
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings

# Global service instances (loaded at startup)
_services: dict[str, Any] = {}


def configure_logging() -> None:
    """Configure application logging."""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def get_git_version() -> str:
    """Get git commit hash for version info."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return "unknown"


def load_models() -> dict[str, Any]:
    """
    Load trained models at startup.

    Returns dict with service instances or None if not trained.
    """
    logger = logging.getLogger(__name__)

    from app.services.artifacts import ArtifactManager
    from app.services.embeddings import EmbeddingService
    from app.services.merchants import MerchantService
    from app.services.categoriser import CategoryService
    from app.services.anomalies import AnomalyService

    manager = ArtifactManager()
    version = manager.get_latest_version()

    services = {
        "manager": manager,
        "version": version,
        "embedding": None,
        "merchant": None,
        "category": None,
        "anomaly": None,
        "loaded": False,
    }

    if version is None:
        logger.warning("No trained models found. Run scripts/train_all.py first.")
        return services

    logger.info(f"Loading models from version: {version}")

    try:
        # Load embedding service
        emb_state, _ = manager.load_artifact("embedding_service", version)
        if emb_state:
            embedding_service = EmbeddingService.from_state(emb_state)
            if not embedding_service.is_initialized:
                embedding_service.initialize()
            services["embedding"] = embedding_service
            logger.info("Loaded embedding service")

        # Load merchant service
        merch_state, _ = manager.load_artifact("merchant_service", version)
        if merch_state and services["embedding"]:
            merchant_service = MerchantService(embedding_service=services["embedding"])
            merchant_service.load_state(merch_state)
            services["merchant"] = merchant_service
            logger.info(f"Loaded merchant service with {len(merchant_service.canonical_merchants)} merchants")

        # Load category service
        cat_state, _ = manager.load_artifact("category_service", version)
        if cat_state:
            category_service = CategoryService()
            category_service.load_state(cat_state)
            services["category"] = category_service
            logger.info(f"Loaded category service with {len(category_service.categories)} categories")

        # Load anomaly service
        anom_state, _ = manager.load_artifact("anomaly_service", version)
        if anom_state:
            anomaly_service = AnomalyService()
            anomaly_service.load_state(anom_state)
            services["anomaly"] = anomaly_service
            logger.info("Loaded anomaly service")

        services["loaded"] = True
        logger.info(f"All models loaded successfully from {version}")

    except Exception as e:
        logger.error(f"Error loading models: {e}", exc_info=True)

    return services


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    global _services

    # Startup
    configure_logging()
    logger = logging.getLogger(__name__)
    logger.info(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
    logger.info(f"CORS enabled for origins: {settings.CORS_ORIGINS}")

    # Load models
    _services = load_models()

    yield

    # Shutdown
    logger.info("Shutting down application")


def get_services() -> dict[str, Any]:
    """Get loaded service instances."""
    return _services


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        description="FinSmart AI Service - Transaction analysis, categorisation, and anomaly detection",
        lifespan=lifespan,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom validation error handler
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors with consistent JSON response."""
        errors = exc.errors()
        error_details = []
        for error in errors:
            loc = " -> ".join(str(l) for l in error["loc"])
            error_details.append(f"{loc}: {error['msg']}")

        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "errors": error_details,
            },
        )

    # Include API routes
    from app.api import router, router_v1
    app.include_router(router)
    app.include_router(router_v1, prefix="/v1")

    return app


# Application instance
app = create_app()
