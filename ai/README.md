# FinSmart AI Service

FastAPI-based microservice for financial insights, transaction categorization, merchant normalization, and anomaly detection.

## 🚀 Tech Stack

- **Python 3.11+** - Modern Python with type hints
- **FastAPI 0.115** - High-performance web framework
- **Uvicorn** - ASGI server with auto-reload
- **Pydantic 2.10** - Data validation and settings management
- **scikit-learn** - ML classification and anomaly detection
- **sentence-transformers** - Text embeddings (optional)
- **FAISS** - Vector similarity search (optional)

## 📁 Project Structure

```
ai/
├── app/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # FastAPI app factory + model loading
│   ├── api.py               # API routes (legacy + v1)
│   ├── models.py            # Pydantic models
│   ├── schemas.py           # v1 API schemas
│   ├── config.py            # Settings via environment variables
│   └── services/            # ML services
│       ├── __init__.py
│       ├── artifacts.py     # Model versioning & persistence
│       ├── embeddings.py    # Text embeddings (SBERT/TF-IDF)
│       ├── features.py      # Feature extraction for ML
│       ├── merchants.py     # Merchant normalization (FAISS)
│       ├── categoriser.py   # Category classification
│       ├── anomalies.py     # Anomaly detection
│       └── evaluate.py      # Evaluation metrics
├── scripts/
│   ├── train_all.py         # Train all models
│   ├── eval_all.py          # Evaluate and generate metrics
│   └── rebuild_merchants.py # Rebuild merchant index
├── models/                  # Trained model artefacts (git-ignored)
│   └── v<timestamp>/
│       ├── manifest.json
│       ├── embedding_service.joblib
│       ├── merchant_service.joblib
│       ├── category_service.joblib
│       └── anomaly_service.joblib
├── _out/                    # Evaluation outputs
│   ├── metrics.json
│   └── metrics_report.md
├── requirements.txt
└── README.md
```

## 🔧 Environment Variables

Create `.env` file (optional, defaults provided):

```bash
# Server configuration
HOST=0.0.0.0
PORT=8001

# Logging
LOG_LEVEL=INFO

# CORS origins (comma-separated if multiple)
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# API metadata
API_TITLE=FinSmart AI
API_VERSION=1.0.0

# Model directory (default: ai/models/)
# MODEL_DIR=./models
```

## 🏃 Quick Start

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Setup & Train

```powershell
# 1. Create virtual environment
python -m venv .venv

# 2. Activate virtual environment (Windows)
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Train models (generates demo data if no CSV provided)
python scripts/train_all.py

# 5. Start server
uvicorn app.main:app --reload --port 8001
```

### Verify Installation

```powershell
# Health check - should show models_loaded: true
curl http://localhost:8001/health
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ai ok",
  "version": "abc1234",
  "models_loaded": true,
  "model_version": "v20250116_123456"
}
```

---

## 🤖 v1 API - Machine Learning Endpoints

### Merchant Normalization

Normalize raw merchant strings to canonical names using sentence embeddings + FAISS similarity search.

```http
POST /v1/merchants/normalise
Content-Type: application/json
```

**Request:**
```json
{
  "raw_merchant": "TESCO STORES 1234",
  "top_k": 3,
  "threshold": 0.6
}
```

**Response:**
```json
{
  "canonical": "Tesco",
  "confidence": 0.95,
  "alternatives": [
    {"name": "Tesco Express", "confidence": 0.82},
    {"name": "Tesco Metro", "confidence": 0.78}
  ]
}
```

---

### Category Prediction

Classify transactions into categories using ML (Logistic Regression + calibration).

```http
POST /v1/categories/predict
Content-Type: application/json
```

**Request:**
```json
{
  "merchant": "Tesco",
  "description": "TESCO STORES 1234",
  "amount": 45.50,
  "direction": "DEBIT",
  "date": "2025-01-15"
}
```

**Response:**
```json
{
  "top_category": "Groceries",
  "confidence": 0.89,
  "top_3": [
    {"category": "Groceries", "probability": 0.89},
    {"category": "Shopping", "probability": 0.07},
    {"category": "Bills", "probability": 0.02}
  ],
  "explain_why": "High TF-IDF score for 'tesco', amount in typical grocery range (£10-150)"
}
```

---

### Anomaly Scoring

Score transactions for anomalies using Isolation Forest + per-category baselines.

```http
POST /v1/anomalies/score
Content-Type: application/json
```

**Request:**
```json
{
  "merchant": "Tesco",
  "category": "Groceries",
  "amount": 500.00,
  "direction": "DEBIT",
  "date": "2025-01-15"
}
```

**Response:**
```json
{
  "score": 0.78,
  "label": "SUSPICIOUS",
  "reasons": [
    "Amount £500.00 is 3.5x higher than category average £142.00",
    "Amount exceeds 95th percentile for Groceries"
  ],
  "thresholds": {
    "normal_max": 0.6,
    "suspicious_max": 0.8
  }
}
```

**Anomaly Labels:**
- `NORMAL`: score < 0.6
- `SUSPICIOUS`: 0.6 ≤ score < 0.8
- `SEVERE`: score ≥ 0.8

---

## Legacy Endpoints

### Analyze Transactions (Legacy)

```http
POST /analyze
Content-Type: application/json
```

**Request Body:**
```json
{
  "transactions": [
    {
      "date": "2025-01-01",
      "amount": 100.5,
      "category": "Food"
    },
    {
      "date": "2025-01-02",
      "amount": 50.0,
      "category": "Transport"
    }
  ]
}
```

**Response:**
```json
{
  "summary": "Total spent $150.50. Biggest category: Food"
}
```

## 🧪 Training & Evaluation

### Train All Models

```powershell
# Train with demo data (auto-generated)
python scripts/train_all.py

# Train with custom data
python scripts/train_all.py --data path/to/transactions.csv
```

**Training Data CSV Format:**
```csv
merchant,description,amount,direction,date,category
Tesco,TESCO STORES 1234,45.50,DEBIT,2025-01-15,Groceries
Amazon,AMAZON.CO.UK,29.99,DEBIT,2025-01-14,Shopping
```

### Evaluate Models

```powershell
# Evaluate with generated test data
python scripts/eval_all.py

# Evaluate with custom test data
python scripts/eval_all.py --data path/to/test.csv --output _out
```

**Outputs:**
- `_out/metrics.json` - Machine-readable metrics
- `_out/metrics_report.md` - Human-readable report

### Rebuild Merchant Index

```powershell
# Rebuild from new transaction data
python scripts/rebuild_merchants.py --data transactions.csv --min-count 3
```

---

## 🧪 Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8001/health

# Merchant normalization
curl -X POST http://localhost:8001/v1/merchants/normalise \
  -H "Content-Type: application/json" \
  -d '{"raw_merchant": "TESCO STORES 1234"}'

# Category prediction
curl -X POST http://localhost:8001/v1/categories/predict \
  -H "Content-Type: application/json" \
  -d '{"merchant": "Tesco", "amount": 45.50, "direction": "DEBIT"}'

# Anomaly scoring
curl -X POST http://localhost:8001/v1/anomalies/score \
  -H "Content-Type: application/json" \
  -d '{"merchant": "Tesco", "category": "Groceries", "amount": 500.00}'
```

### Manual Testing with PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8001/health"

# Merchant normalization
$body = @{ raw_merchant = "TESCO STORES 1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/v1/merchants/normalise" -Method POST -ContentType "application/json" -Body $body

# Category prediction
$body = @{ merchant = "Tesco"; amount = 45.50; direction = "DEBIT" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/v1/categories/predict" -Method POST -ContentType "application/json" -Body $body
```

## 📚 API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **OpenAPI JSON**: http://localhost:8001/openapi.json

## 🔍 ML Implementation Details

### Merchant Normalization
- **Embedding**: `all-MiniLM-L6-v2` (sentence-transformers) or TF-IDF fallback
- **Search**: FAISS IndexFlatIP or numpy cosine similarity fallback
- **Threshold**: 0.6 minimum confidence to return canonical match

### Category Classification
- **Model**: LogisticRegression + CalibratedClassifierCV
- **Features**: TF-IDF (merchant + description) + numeric (amount) + temporal (day of week, day of month)
- **Output**: Top-3 categories with calibrated probabilities + explanation

### Anomaly Detection
- **Model**: IsolationForest (contamination=0.05)
- **Features**: Amount, merchant frequency, category baselines
- **Scoring**: Combined IF score + residual from per-category mean
- **Thresholds**: NORMAL < 0.6, SUSPICIOUS < 0.8, SEVERE ≥ 0.8

### Model Versioning
- Artefacts saved to `models/vYYYYMMDD_HHMMSS/`
- Each version has `manifest.json` with data hash and metrics
- Auto-cleanup keeps last 5 versions

## 🛠️ Development Tips

### Minimal Installation (No GPU)

If sentence-transformers or FAISS fail to install:

```powershell
# Minimal install - uses TF-IDF + numpy fallbacks
pip install fastapi uvicorn pydantic pydantic-settings pandas numpy scikit-learn joblib
```

### Virtual Environment Issues

If activation fails:
```powershell
# Enable script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

```powershell
# Change port
uvicorn app.main:app --reload --port 8002
```

### Models Not Loading

```powershell
# Check if models exist
ls models/

# Re-train if needed
python scripts/train_all.py
```

## 🚀 Deployment

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
COPY scripts/ ./scripts/
COPY models/ ./models/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Production

```powershell
# Run with multiple workers (no --reload)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Use type hints for all functions
3. Validate all inputs with Pydantic
4. Add docstrings to public functions
5. Run `python scripts/eval_all.py` after model changes

## 📄 License

Private project - All rights reserved
