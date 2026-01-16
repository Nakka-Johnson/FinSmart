# FinSmart AI Service

FastAPI-based microservice for generating financial insights and transaction analysis with production-ready monitoring and observability.

## 🚀 Tech Stack

- **Python 3.11+** - Modern Python with type hints
- **FastAPI 0.115** - High-performance web framework
- **Uvicorn** - ASGI server with auto-reload
- **Pydantic 2.10** - Data validation and settings management
- **Prometheus** - Metrics and monitoring
- **Sentry** - Error tracking and performance monitoring

## 📁 Project Structure

```
ai/
├── app/
│   ├── __init__.py       # Package initialization
│   ├── main.py           # FastAPI app factory
│   ├── api.py            # API routes (health, analyze, metrics)
│   ├── models.py         # Pydantic models
│   ├── config.py         # Settings via environment variables
│   ├── service.py        # Core business logic
│   └── middleware.py     # Request/response logging middleware
├── requirements.txt      # Python dependencies
├── MONITORING_QUERIES.md # Prometheus queries and dashboard configs
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
API_VERSION=1.0.0

# Monitoring configuration
ENABLE_METRICS=true
ENABLE_SENTRY=false
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
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
  "status": "healthy",
  "service": "ai",
  "uptime_seconds": 3600
}
```

### Metrics (Prometheus)

```http
GET /metrics
```

Returns Prometheus-formatted metrics including:
- Request rate by endpoint
- Response time histograms
- Error rates
- In-progress requests

**Example Response:**
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",handler="/health",status="200"} 150
http_requests_total{method="POST",handler="/analyze",status="200"} 42

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 120
http_request_duration_seconds_bucket{le="0.5"} 180
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
      "category": "Food",
      "direction": "DEBIT",
      "description": "Grocery store"
    }
  ]
}
```

**Response:**
```json
{
  "totalDebit": 100.5,
  "totalCredit": 0.0,
  "biggestCategory": "Food",
  "topCategories": [
    {
      "category": "Food",
      "total": 100.5
    }
  ]
}
```

**Validation Rules:**
- `transactions`: Must contain at least 1 transaction
- `date`: Required string (ISO format recommended)
- `amount`: Must be >= 0
- `category`: Optional string
- `direction`: Required, either "DEBIT" or "CREDIT"
- `description`: Optional string

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

The service includes comprehensive request/response logging middleware that logs:
- Request method, path, and client information
- Request duration in milliseconds
- Response status codes
- Error details with stack traces

Logs are written to stdout with format:
```
2025-01-15 10:30:45 - app.main - INFO - Starting FinSmart AI v1.0.0
2025-01-15 10:30:50 - app.middleware - INFO - Request started: GET /health
2025-01-15 10:30:50 - app.middleware - INFO - Request completed: GET /health - 200
```

Control verbosity with `LOG_LEVEL` env var (DEBUG, INFO, WARNING, ERROR).

## 📊 Monitoring and Observability

### Prometheus Metrics

The service exposes Prometheus metrics at `/metrics` endpoint including:

- **Request rate**: Requests per second by endpoint
- **Response time**: Histogram with percentiles (p50, p95, p99)
- **Error rate**: 4xx and 5xx errors by endpoint
- **In-progress requests**: Current concurrent requests

**Enable/disable metrics:**
```bash
ENABLE_METRICS=true  # Default: true
```

### Sentry Error Tracking

Sentry integration provides:
- Automatic error capture with full stack traces
- Performance monitoring and tracing
- Request context (headers, body, user info)
- Release tracking and source maps

**Configure Sentry:**
```bash
ENABLE_SENTRY=true
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=1.0  # 1.0 = 100% of traces
```

**Testing Sentry:**
```python
# Trigger a test error
raise Exception("Test Sentry integration")
```

### Request Logging

All requests are automatically logged with:
- HTTP method and path
- Client IP address
- User agent
- Request duration
- Response status code
- Error details (if any)

Logs are structured for easy parsing by log aggregation tools (ELK, Splunk, DataDog).

### Dashboard Setup

See [MONITORING_QUERIES.md](./MONITORING_QUERIES.md) for:
- Prometheus queries for common metrics
- Grafana dashboard configurations
- Alert rules for production monitoring
- Integration with existing infrastructure

**Key Metrics to Monitor:**
1. **Request Rate**: Track traffic patterns and load
2. **Error Rate**: Monitor service health (should be <1%)
3. **Response Time**: p95 should be <500ms, p99 <1s
4. **Availability**: Uptime should be >99.9%

### Health Checks

The `/health` endpoint provides:
- Service status (`healthy` or `unhealthy`)
- Service identifier (`ai`)
- Uptime in seconds

Use for:
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Monitoring system checks

**Example Kubernetes probe:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 30
```

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
