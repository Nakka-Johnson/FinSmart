# FinSmart AI Service Specification

> **Generated:** 2025-12-29  
> **Framework:** FastAPI + Python 3.12  
> **Port:** 8001

## Overview

The AI service provides transaction analysis, category suggestions, anomaly
detection, and spending forecasts. It runs as an independent HTTP microservice
consumed by the Spring Boot backend.

---

## Endpoints

### GET /health

Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "ai ok"
}
```

**Model:** `HealthResponse`

---

### POST /analyze

Analyse transactions and generate spending summary.

**Request:**
```json
{
  "transactions": [
    {
      "id": "optional-id",
      "date": "2025-12-15",
      "amount": 45.99,
      "category": "Groceries",
      "direction": "DEBIT",
      "description": "TESCO STORES",
      "merchant": "Tesco"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "totalDebit": 2500.00,
  "totalCredit": 3500.00,
  "biggestCategory": "Rent",
  "topCategories": [
    { "category": "Rent", "total": 1200.00 },
    { "category": "Groceries", "total": 450.00 },
    { "category": "Transport", "total": 200.00 },
    { "category": "Utilities", "total": 150.00 },
    { "category": "Dining", "total": 100.00 }
  ]
}
```

**Models:** `AnalyzeRequest` → `SummaryResponse`

---

### POST /categorize

Categorise transactions using weighted keyword matching with TF-IDF-like scoring.

**Request:**
```json
{
  "transactions": [
    {
      "date": "2025-12-15",
      "amount": 45.99,
      "direction": "DEBIT",
      "description": "TESCO SUPERSTORE",
      "merchant": "Tesco"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "predictions": [
    {
      "guessCategory": "Groceries",
      "score": 0.667,
      "reason": {
        "tokens": ["tesco", "superstore"],
        "matchedKeywords": ["tesco", "supermarket"],
        "scores": {
          "Groceries": 5.5,
          "Shopping": 1.2
        },
        "details": "Matched 2 keyword(s) with score 5.50"
      }
    }
  ]
}
```

**Models:** `AnalyzeRequest` → `CategorizeResponse`

---

### POST /anomalies

Detect anomalies in transactions using z-score analysis.

**Request:**
```json
{
  "transactions": [
    {
      "id": "txn-uuid-1",
      "date": "2025-12-15",
      "amount": 500.00,
      "category": "Shopping",
      "direction": "DEBIT",
      "description": "AMAZON MARKETPLACE"
    }
  ],
  "ignoreIds": ["txn-uuid-2", "txn-uuid-3"]
}
```

**Response (200 OK):**
```json
{
  "anomalies": [
    {
      "date": "2025-12-15",
      "amount": 500.00,
      "category": "Shopping",
      "score": 2.5,
      "isAnomaly": true
    }
  ]
}
```

**Models:** `AnomalyRequest` → `AnomalyResponse`

---

### POST /forecast

Forecast next month spending by category.

**Request:**
```json
{
  "transactions": [
    {
      "date": "2025-10-15",
      "amount": 150.00,
      "category": "Groceries",
      "direction": "DEBIT"
    },
    {
      "date": "2025-11-15",
      "amount": 180.00,
      "category": "Groceries",
      "direction": "DEBIT"
    },
    {
      "date": "2025-12-15",
      "amount": 200.00,
      "category": "Groceries",
      "direction": "DEBIT"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "forecasts": [
    {
      "category": "Groceries",
      "nextMonthForecast": 176.67,
      "method": "SMA3"
    }
  ]
}
```

**Models:** `AnalyzeRequest` → `ForecastResponse`

---

### POST /merchant-insights

Aggregate spending by merchant with monthly breakdown.

**Request:**
```json
{
  "transactions": [
    {
      "date": "2025-10-15",
      "amount": 50.00,
      "direction": "DEBIT",
      "merchant": "Tesco Ltd"
    },
    {
      "date": "2025-11-20",
      "amount": 75.00,
      "direction": "DEBIT",
      "merchant": "TESCO"
    }
  ],
  "monthsBack": 3
}
```

**Response (200 OK):**
```json
{
  "merchants": [
    {
      "merchant": "tesco",
      "monthlyTotals": [
        { "month": "2025-10", "total": 50.00 },
        { "month": "2025-11", "total": 75.00 }
      ],
      "totalSpending": 125.00
    }
  ]
}
```

**Models:** `MerchantInsightRequest` → `MerchantInsightResponse`

---

## Logic & Algorithms

### Categorisation (TF-IDF-like Keyword Matching)

**Location:** `app/service.py` → `categorize()`

#### Keyword Dictionary

Categories and their weighted keywords:

| Category      | Keywords (weight)                                          |
|---------------|------------------------------------------------------------|
| Groceries     | grocery (3.0), supermarket (3.0), tesco/asda/aldi/etc (2.5), food (2.0), market (1.5) |
| Transport     | uber/lyft/bolt (3.0), taxi (2.5), transit/metro/tfl (2.5), gas/fuel (2.0), parking (2.0) |
| Rent          | rent (3.0), lease/landlord (2.5), lettings (2.5)           |
| Utilities     | electric/water/gas bill (2.5), octopus/british gas/edf (2.5), internet/phone (2.0) |
| Entertainment | netflix/spotify (3.0), prime (2.5), movie/game (1.5-2.0)   |
| Dining        | restaurant (2.5), starbucks/mcdonald (2.5), cafe/coffee (2.0), takeaway (2.0) |
| Health        | pharmacy/hospital/doctor (2.5), medical/clinic (2.0-2.5), dentist (2.5) |
| Shopping      | amazon/ebay/walmart/target (2.5), clothing (2.0), store/shop (1.5) |

#### Algorithm

1. **Tokenise** description + merchant (lowercase, 2+ char words)
2. For each category:
   - Check if keyword appears in search text (word boundary match)
   - Calculate score: `weight × (1 + log(term_frequency + 1))`
   - Track matched keywords
3. Select category with highest score
4. If score ≥ **0.5** threshold, return category
5. Normalise score to 0-1 range (divide by 15)
6. Return with detailed reason including tokens, matched keywords, all scores

#### Output

```python
CategoryGuess(
    guessCategory="Groceries",
    score=0.667,  # Normalised
    reason=CategoryReason(
        tokens=["tesco", "superstore"],
        matchedKeywords=["tesco", "supermarket"],
        scores={"Groceries": 5.5, "Shopping": 1.2},
        details="Matched 2 keyword(s) with score 5.50"
    )
)
```

---

### Anomaly Detection (Z-Score)

**Location:** `app/service.py` → `anomalies()`

#### Algorithm

1. Filter to DEBIT transactions only
2. Group by category
3. For each transaction:
   - Skip if ID in `ignoreIds` (snoozed/confirmed)
   - Need ≥3 transactions in category for meaningful stats
   - Calculate z-score: `(amount - mean) / stdev`
   - Flag as anomaly if `|z-score| ≥ 2.0`

#### Z-Score Interpretation

| Z-Score | Meaning                              |
|---------|--------------------------------------|
| < -2    | Unusually low (far below average)    |
| -2 to 2 | Normal range                         |
| > 2     | Unusually high (potential anomaly)   |

---

### Forecasting (Simple Moving Average)

**Location:** `app/service.py` → `forecast()`

#### Methods

| Method    | Condition           | Formula                            |
|-----------|---------------------|------------------------------------|
| SMA3      | ≥3 months data      | Average of last 3 months           |
| lastValue | <3 months data      | Use most recent month's total      |

#### Algorithm

1. Group DEBIT transactions by category and month (`YYYY-MM`)
2. For each category:
   - Sort months chronologically
   - If ≥3 months: `predicted = mean(last_3_months)`
   - Else: `predicted = last_month_value`
3. Return forecast per category with method used

---

### Merchant Normalisation

**Location:** `app/service.py` → `normalize_merchant_name()`

#### Steps

1. Convert to lowercase
2. Remove business suffixes: `ltd`, `inc`, `llc`, `plc`, `limited`, `corp`, `co`
3. Remove special characters (keep alphanumeric + spaces)
4. Collapse multiple spaces
5. Return "Unknown" if empty

#### Examples

| Input                 | Output        |
|-----------------------|---------------|
| "Tesco Stores Ltd"    | "tesco stores"|
| "AMAZON.CO.UK"        | "amazoncouk"  |
| "Uber BV"             | "uber bv"     |
| null                  | "Unknown"     |

---

## Data Models

### Input Models

```python
class Txn(BaseModel):
    id: str | None = None          # Optional, for ignore lists
    date: str                      # ISO date (YYYY-MM-DD)
    amount: float                  # Must be >= 0
    category: str | None = None
    direction: Literal["DEBIT", "CREDIT"]
    description: str | None = None
    merchant: str | None = None

class AnalyzeRequest(BaseModel):
    transactions: list[Txn]        # min_length=1

class AnomalyRequest(BaseModel):
    transactions: list[Txn]
    ignoreIds: list[str] | None = None

class MerchantInsightRequest(BaseModel):
    transactions: list[Txn]
    monthsBack: int = 3            # 1-12
```

### Output Models

```python
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

class AnomalyItem(BaseModel):
    date: str
    amount: float
    category: str | None
    score: float                   # z-score
    isAnomaly: bool

class AnomalyResponse(BaseModel):
    anomalies: list[AnomalyItem]

class ForecastItem(BaseModel):
    category: str
    nextMonthForecast: float
    method: str                    # "SMA3" or "lastValue"

class ForecastResponse(BaseModel):
    forecasts: list[ForecastItem]

class MerchantMonthly(BaseModel):
    month: str                     # YYYY-MM
    total: float

class MerchantInsight(BaseModel):
    merchant: str
    monthlyTotals: list[MerchantMonthly]
    totalSpending: float

class MerchantInsightResponse(BaseModel):
    merchants: list[MerchantInsight]
```

---

## Limitations

| Area              | Limitation                                        |
|-------------------|---------------------------------------------------|
| Categorisation    | Keyword dictionary is static; no learning         |
| Categorisation    | Limited to 8 predefined categories                |
| Categorisation    | No handling of multiple languages                 |
| Anomaly Detection | Requires ≥3 transactions per category             |
| Anomaly Detection | Fixed z-score threshold (2.0)                     |
| Forecasting       | Only SMA3 or last value; no seasonality           |
| Forecasting       | No confidence intervals                           |
| General           | No persistent state; stateless service            |
| General           | No caching of results                             |

---

## Future Improvements

1. **Machine Learning Categorisation**
   - Train on user feedback (confirmed categories)
   - Use embedding-based similarity (sentence transformers)
   - Support custom user categories

2. **Improved Anomaly Detection**
   - Adaptive thresholds per user/category
   - Time-series based detection (seasonal patterns)
   - Isolation Forest for multivariate anomalies

3. **Better Forecasting**
   - Prophet or exponential smoothing
   - Seasonal adjustment
   - Confidence intervals

4. **Merchant Intelligence**
   - External merchant database lookup
   - Logo/brand recognition
   - Category hints from merchant

5. **Performance**
   - Redis caching for repeated queries
   - Batch processing optimisation
   - Async database queries (if needed)

---

## Configuration

| Variable      | Default               | Description                |
|---------------|-----------------------|----------------------------|
| `HOST`        | `0.0.0.0`             | Bind address               |
| `PORT`        | `8001`                | HTTP port                  |
| `LOG_LEVEL`   | `INFO`                | Logging verbosity          |
| `RELOAD`      | `false`               | Hot reload (dev only)      |

---

## Running Locally

```bash
cd ai
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [FRONTEND_MAP.md](./FRONTEND_MAP.md)
