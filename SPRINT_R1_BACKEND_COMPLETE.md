# Sprint R1 Backend Glue - Implementation Complete

## Summary

Sprint R1 backend glue connects the Spring Boot backend to the AI v1 service (Python/FastAPI) and implements:

1. **AI Orchestration Endpoints** - REST controllers calling v1 AI endpoints
2. **Feedback Loop** - User corrections stored for model retraining
3. **UK Demo Data** - 12 months of realistic UK transactions
4. **User-scoped APIs** - All endpoints respect JWT auth and user isolation

## New Files Created

### AI Service Layer DTOs (`service/ai/dto/`)

| File | Purpose |
|------|---------|
| `MerchantNormaliseRequest.java` | Request for `/v1/merchants/normalise` |
| `MerchantNormaliseResponse.java` | Response with canonical names, scores, alternatives |
| `CategoryPredictRequest.java` | Request for `/v1/categories/predict` |
| `CategoryPredictResponse.java` | Response with predictions, confidence, top-k scores |
| `AnomalyScoreRequest.java` | Request for `/v1/anomalies/score` |
| `AnomalyScoreResponse.java` | Response with scores, thresholds, explanations |
| `AiHealthResponse.java` | AI service health check response |

### Web DTOs (`web/dto/ai/`)

| File | Purpose |
|------|---------|
| `NormaliseMerchantsRequest.java` | Web request for merchant normalization |
| `NormaliseMerchantsResponse.java` | Web response with normalized merchants |
| `PredictCategoriesRequest.java` | Web request (transaction IDs or raw items) |
| `PredictCategoriesResponse.java` | Web response with predictions |
| `ScoreAnomaliesRequest.java` | Web request for anomaly scoring |
| `ScoreAnomaliesResponse.java` | Web response with anomaly results |
| `TrainResponse.java` | Training trigger response |

### Feedback DTOs (`web/dto/feedback/`)

| File | Purpose |
|------|---------|
| `CategoryFeedbackRequest.java` | Category override submission |
| `MerchantFeedbackRequest.java` | Merchant confirmation submission |
| `AnomalyFeedbackRequest.java` | Anomaly label submission |
| `FeedbackResponse.java` | Feedback submission response |

### Controllers

| File | Purpose |
|------|---------|
| `AiController.java` | `/api/ai/*` endpoints |
| `FeedbackController.java` | `/api/feedback/*` endpoints |
| `AdminController.java` | Updated with UK demo endpoints |

### Domain Layer

| File | Purpose |
|------|---------|
| `AiFeedbackType.java` | Enum: CATEGORY_OVERRIDE, MERCHANT_CONFIRM, ANOMALY_LABEL |
| `AiFeedback.java` | Entity with JSONB payload for flexible feedback storage |
| `AiFeedbackRepository.java` | Repository with user-scoped queries |
| `V12__ai_feedback.sql` | Flyway migration for ai_feedback table |

### Services

| File | Purpose |
|------|---------|
| `UkDemoDataService.java` | UK-realistic 12-month demo data generator |
| `AiClientService.java` | Updated with v1 methods |

## API Endpoints

### AI Orchestration (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | AI service health check |
| POST | `/normalise-merchants` | Normalize merchant names |
| POST | `/predict-categories` | Predict transaction categories |
| POST | `/score-anomalies` | Score transactions for anomalies |
| POST | `/train` | Trigger model training (instructions) |

### Feedback Loop (`/api/feedback`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/category` | Submit category correction |
| POST | `/merchant` | Submit merchant confirmation |
| POST | `/anomaly` | Submit anomaly label |
| GET | `/stats` | Get user's feedback statistics |

### Demo Data (`/api/admin/demo`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/seed` | ADMIN | Global demo data seed |
| DELETE | `/clear` | ADMIN | Global demo data clear |
| POST | `/uk/seed` | Any user | Seed UK demo data for current user |
| POST | `/uk/clear` | Any user | Clear demo data for current user |

## UK Demo Data Features

### Merchants by Category

| Category | Merchants |
|----------|-----------|
| Groceries | Tesco, Sainsbury's, Asda, Lidl, Aldi, Morrisons, Co-op |
| Transport | Uber, Merseyrail, TfL, Shell, BP, Trainline |
| Dining | Pret, Greggs, Nando's, McDonald's, Costa, Starbucks, Deliveroo |
| Entertainment | Netflix, Spotify, Amazon Prime, Sky, Disney+ |
| Utilities | Octopus Energy, British Gas, Thames Water, Virgin Media, BT |
| Healthcare | Boots, NHS, Specsavers |
| Shopping | Amazon, John Lewis, Argos, ASOS |
| Bills | HMRC, Council Tax |

### Transaction Patterns

- **Monthly**: Salary (£3,250), Rent (£1,200), Council Tax (£156)
- **Weekly**: 4 grocery shops, commuting (weekdays)
- **Occasional**: Dining (2-3/month), shopping, healthcare
- **Subscriptions**: Netflix, Spotify, Prime with mid-year price creep
- **Anomalies**: 1-2 per user (large grocery shop, unexpected tax payment)

### Demo Marker

All demo transactions include `DEMO_DATA_MARKER` in notes field for safe cleanup.

## Database Changes

### V12 Migration

```sql
-- Enum for feedback types
CREATE TYPE ai_feedback_type AS ENUM (
    'CATEGORY_OVERRIDE',
    'MERCHANT_CONFIRM', 
    'ANOMALY_LABEL'
);

-- Feedback storage with JSONB payload
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    transaction_id UUID REFERENCES transactions(id),
    type ai_feedback_type NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    -- indexes for queries and GIN for JSONB
);
```

## Configuration

Existing `application.yml` already configured:

```yaml
app:
  ai:
    url: ${AI_URL:http://127.0.0.1:8001}
```

## Testing

After starting services:

```bash
# Health check
curl http://localhost:8081/api/ai/health

# Seed UK demo data (authenticated)
curl -X POST http://localhost:8081/api/admin/demo/uk/seed \
  -H "Authorization: Bearer $TOKEN"

# Get feedback stats
curl http://localhost:8081/api/feedback/stats \
  -H "Authorization: Bearer $TOKEN"
```

## Notes

- All endpoints require JWT authentication
- User-scoped operations use `AuthenticationHelper.getCurrentUserId()`
- AI service failures return 503 with retry guidance
- Demo data uses deterministic randomness (seeded by user ID)
- No external telemetry or tracking
