"""
DEPRECATED: This file is kept for backwards compatibility only.
Please use the new structure: uvicorn app.main:app --reload --port 8001
"""

import warnings

warnings.warn(
    "main.py is deprecated. Use 'uvicorn app.main:app' instead.",
    DeprecationWarning,
    stacklevel=2,
)

# Import the new app for backwards compatibility
from app.main import app

__all__ = ["app"]
