# FinSmart AI Service

FastAPI-based microservice for generating financial insights and transaction analysis.

## 🚀 Tech Stack

- **Python 3.11+** - Modern Python with type hints
- **FastAPI 0.115** - High-performance web framework
- **Uvicorn** - ASGI server with auto-reload
- **Pydantic 2.10** - Data validation and settings management

## 📁 Project Structure

```
ai/
├── app/
│   ├── __init__.py       # Package initialization
│   ├── main.py           # FastAPI app factory
│   ├── api.py            # API routes (health, analyze)
│   ├── models.py         # Pydantic models
│   └── config.py         # Settings via environment variables
├── requirements.txt      # Python dependencies
└── README.md            # This file
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
API_VERSION=0.1.0
```

## 🏃 How to Run

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Setup

```powershell
# 1. Create virtual environment
python -m venv .venv

# 2. Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Windows CMD:
# .\.venv\Scripts\activate.bat

# Unix/macOS:
# source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

### Development

```powershell
# Start dev server with auto-reload
uvicorn app.main:app --reload --port 8001

# Or specify host and port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Or with environment variables
$env:PORT = "8002"; $env:LOG_LEVEL = "DEBUG"; uvicorn app.main:app --reload
```

### Production

```powershell
# Run with production settings (multiple workers)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ai ok"
}
```

### Analyze Transactions

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

**Validation Rules:**
- `transactions`: Must contain at least 1 transaction
- `date`: Required string (ISO format recommended)
- `amount`: Must be >= 0
- `category`: Required non-empty string

**Error Response (422):**
```json
{
  "detail": "Validation error",
  "errors": [
    "body -> transactions -> 0 -> amount: Input should be greater than or equal to 0"
  ]
}
```

## 🧪 Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8001/health

# Analyze transactions
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {"date": "2025-01-01", "amount": 100.5, "category": "Food"},
      {"date": "2025-01-02", "amount": 50.0, "category": "Transport"}
    ]
  }'
```

### Manual Testing with PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8001/health"

# Analyze transactions
$body = @{
  transactions = @(
    @{ date = "2025-01-01"; amount = 100.5; category = "Food" },
    @{ date = "2025-01-02"; amount = 50.0; category = "Transport" }
  )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8001/analyze" -Method POST -ContentType "application/json" -Body $body
```

## 📚 API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **OpenAPI JSON**: http://localhost:8001/openapi.json

## 🔍 Project Details

### App Structure

- **app/main.py**: Application factory with CORS, logging, and error handling
- **app/api.py**: API route definitions with response models
- **app/models.py**: Pydantic models for request/response validation
- **app/config.py**: Settings management via environment variables

### CORS Configuration

By default, CORS is enabled for:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative frontend port)

Customize via `CORS_ORIGINS` environment variable.

### Logging

Logs are written to stdout with format:
```
2025-01-15 10:30:45 - app.main - INFO - Starting FinSmart AI v0.1.0
```

Control verbosity with `LOG_LEVEL` env var (DEBUG, INFO, WARNING, ERROR).

## 🛠️ Development Tips

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

### Dependency Updates

```powershell
# Update all dependencies
pip install --upgrade -r requirements.txt

# Freeze current versions
pip freeze > requirements.txt
```

### Hot Reload

The `--reload` flag watches for file changes and auto-restarts the server.
Remove it in production for better performance.

## 🚀 Deployment

### Docker (Future)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Cloud Deployment

- **Azure App Service**: Deploy as Python web app
- **AWS Lambda**: Use Mangum adapter
- **Google Cloud Run**: Containerize and deploy

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Use type hints for all functions
3. Validate all inputs with Pydantic
4. Add docstrings to public functions
5. Keep models in `models.py`, routes in `api.py`

## 📄 License

Private project - All rights reserved
