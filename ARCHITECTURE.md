# FinSmart Architecture

> **Generated:** 2025-12-29  
> **Status:** Sprint-1 In Progress

## Executive Summary

FinSmart is a personal finance management application designed to help users track
transactions, manage budgets, and gain insights into spending patterns. The system
follows a three-tier architecture with a React SPA frontend, Spring Boot REST backend,
and a Python-based AI microservice for analytics.

The platform supports CSV transaction imports with duplicate detection, AI-powered
category suggestions, anomaly detection in spending, budget management with rollover
capability, and PDF report generation. The application is designed for local
development with Docker Compose and future production deployment behind Caddy as a
reverse proxy with automatic TLS.

---

## Views

### Component Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (React SPA)"]
        UI[Vite/React App<br>Port 5173]
        PWA[PWA Manifest]
    end

    subgraph Backend["Backend (Spring Boot)"]
        API[REST API<br>Port 8081]
        SEC[Security<br>JWT + BCrypt]
        FLY[Flyway<br>Migrations]
        PDF[PDF Generator<br>OpenHTMLToPDF]
        SCHED[Scheduler<br>Spring Task]
    end

    subgraph AI["AI Service (FastAPI)"]
        AIS[AI Endpoints<br>Port 8001]
        CAT[Categoriser<br>TF-IDF Keywords]
        ANO[Anomaly Detector<br>Z-Score]
        FOR[Forecaster<br>SMA3]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL<br>Port 5433)]
        MV[Materialized View<br>user_merchant_monthly]
    end

    UI -->|REST/JSON| API
    API -->|HTTP| AIS
    API -->|JDBC| PG
    FLY -->|DDL| PG
    AIS --> CAT
    AIS --> ANO
    AIS --> FOR
    PG --> MV

    classDef frontend fill:#61dafb,stroke:#333
    classDef backend fill:#6db33f,stroke:#333
    classDef ai fill:#306998,stroke:#333
    classDef data fill:#336791,stroke:#333

    class UI,PWA frontend
    class API,SEC,FLY,PDF,SCHED backend
    class AIS,CAT,ANO,FOR ai
    class PG,MV data
```

### Deployment View

#### Local Development (3 Processes)

```
┌─────────────────────────────────────────────────────────────────┐
│  Local Machine                                                  │
│                                                                 │
│  ┌────────────┐   ┌─────────────────┐   ┌─────────────────┐     │
│  │ Frontend   │   │ Backend         │   │ AI Service      │     │
│  │ Vite Dev   │   │ Spring Boot     │   │ FastAPI/Uvicorn │     │
│  │ :5173      │   │ :8081           │   │ :8001           │     │
│  └─────┬──────┘   └────────┬────────┘   └────────┬────────┘     │
│        │                   │                      │             │
│        │                   │   HTTP               │             │
│        │                   ├──────────────────────┘             │
│        │                   │                                    │
│        │                   ▼                                    │
│        │           ┌─────────────────┐                          │
│        │           │ PostgreSQL      │                          │
│        │           │ (Docker) :5433  │                          │
│        │           └─────────────────┘                          │
│        │                                                        │
└────────┼────────────────────────────────────────────────────────┘
         │
         ▼
    Browser :5173
```

| Service   | Port | Tech Stack                | Env File           |
|-----------|------|---------------------------|--------------------|
| Frontend  | 5173 | Vite 6, React 18, TS      | `.env.local`       |
| Backend   | 8081 | Spring Boot 3.4, Java 17  | `application.yml`  |
| AI        | 8001 | FastAPI, Python 3.12      | inline / `.env`    |
| Database  | 5433 | PostgreSQL 16             | docker-compose.yml |

#### Production (Future – Docker Compose)

```mermaid
graph TB
    subgraph Internet
        USER[User Browser]
    end

    subgraph Docker["Docker Host"]
        subgraph Caddy["Caddy :80/:443"]
            TLS[Auto TLS<br>Let's Encrypt]
        end
        
        FE[Frontend<br>nginx :80]
        BE[Backend<br>:8080]
        AI[AI Service<br>:8001]
        
        DB[(PostgreSQL<br>or RDS)]
    end

    USER -->|HTTPS| TLS
    TLS -->|/api/*| BE
    TLS -->|/ai/*| AI
    TLS -->|/*| FE
    BE -->|HTTP| AI
    BE -->|JDBC| DB

    classDef caddy fill:#1abc9c,stroke:#333
    class TLS caddy
```

| Service  | Image                     | Internal Port | Volume                |
|----------|---------------------------|---------------|------------------------|
| caddy    | caddy:2.8-alpine          | 80, 443       | caddy-data, caddy-config |
| frontend | finsmart/frontend:latest  | 80            | —                      |
| backend  | finsmart/backend:latest   | 8080          | —                      |
| ai       | finsmart/ai:latest        | 8001          | —                      |
| db       | postgres:16 (or RDS)      | 5432          | postgres-data          |

---

### Request Flow Diagrams

#### Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Enter email/password
    FE->>BE: POST /api/auth/login
    BE->>DB: Find user by email
    DB-->>BE: User record
    BE->>BE: BCrypt.verify(password)
    BE->>BE: JwtUtil.createToken()
    BE-->>FE: 200 { token, userId, email, fullName }
    FE->>FE: Store token (localStorage/sessionStorage)
    FE-->>U: Redirect to Dashboard
```

#### CSV Import v2 (Preview → Commit)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant AI as AI Service
    participant DB as PostgreSQL

    U->>FE: Select CSV file + account
    FE->>BE: POST /api/transactions/import?preview=true
    BE->>BE: Parse CSV, detect headers
    BE->>DB: Check for duplicates (hash)
    BE->>AI: POST /categorize (batch)
    AI-->>BE: Category suggestions + scores
    BE->>DB: Create ImportBatch (PREVIEW)
    BE->>DB: Create ImportRow records
    BE-->>FE: ImportPreviewResponse { batch, rows, summary }
    FE-->>U: Show preview table

    U->>FE: Click "Commit Import"
    FE->>BE: POST /api/transactions/import/{batchId}/commit
    BE->>DB: Create Transaction records
    BE->>DB: Update batch status → COMMITTED
    BE-->>FE: ImportBatchResponse
    FE-->>U: Success toast, redirect

    Note over U,DB: Undo available via POST /{batchId}/undo
```

#### Monthly Insights

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant AI as AI Service
    participant DB as PostgreSQL

    U->>FE: Navigate to Insights page
    FE->>BE: GET /api/insights/monthly?month=12&year=2025
    BE->>DB: Query transactions for period
    BE->>AI: POST /analyze (transactions)
    AI-->>BE: { totalDebit, totalCredit, topCategories }
    BE->>AI: POST /forecast (transactions)
    AI-->>BE: { forecasts by category }
    BE-->>FE: MonthlyInsightDTO
    FE-->>U: Render charts + summary
```

#### PDF Export

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Click "Download PDF"
    FE->>BE: GET /api/reports/pdf?month=12&year=2025
    BE->>DB: Query transactions/budgets
    BE->>BE: Build MonthlyInsightDTO
    BE->>BE: Render Thymeleaf template
    BE->>BE: OpenHTMLToPDF → byte[]
    BE-->>FE: application/pdf stream
    FE-->>U: Browser download dialog
```

---

## Feature Flags

Feature flags are configured via environment variables and read by both frontend
and backend.

### Frontend (VITE_FEATURE_*)

| Flag                       | Default | Purpose                           |
|----------------------------|---------|-----------------------------------|
| `VITE_FEATURE_DEMO`        | false   | Enable demo/onboarding wizard     |
| `VITE_FEATURE_CSV_IMPORT_V2` | false | Enhanced CSV import UI            |
| `VITE_FEATURE_BUDGET_ROLLOVER` | false | Budget rollover functionality   |
| `VITE_FEATURE_ENVELOPE`    | false   | Envelope budgeting view           |
| `VITE_FEATURE_INSIGHTS_V2` | false   | Merchant insights + anomaly inbox |
| `VITE_FEATURE_PWA`         | false   | PWA installation prompt           |
| `VITE_FEATURE_EXPORT_CENTRE` | false | Export centre UI                  |
| `VITE_FEATURE_OB_OB_READONLY` | false | Open Banking stub (read-only)   |

### Backend

| Property                   | Default | Purpose                           |
|----------------------------|---------|-----------------------------------|
| `APP_FEATURE_DEMO_DATA`    | false   | Enable `/api/admin/demo/*`        |
| (via user_feature_flags)   | —       | Per-user flag overrides in DB     |

---

## Security

### Authentication & Authorisation

| Aspect           | Implementation                                      |
|------------------|-----------------------------------------------------|
| Password Storage | BCrypt (Spring Security default)                    |
| Session          | Stateless (JWT in `Authorization: Bearer` header)   |
| JWT Library      | io.jsonwebtoken:jjwt (HMAC-SHA256)                  |
| Token Expiry     | Configurable (`APP_JWT_EXPIRES_MINUTES`, default 60)|
| Token Claims     | `sub` = email, `userId` = UUID, `iss`, `iat`, `exp` |

### CORS

Configured in `SecurityConfig.java`:
- Allowed origins: `localhost:5173`, `localhost:5174`, `localhost:5175`, `localhost:3000`
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials: true

### Security Headers

| Header                  | Value                                |
|-------------------------|--------------------------------------|
| X-Frame-Options         | DENY                                 |
| X-Content-Type-Options  | nosniff                              |
| X-XSS-Protection        | 1; mode=block                        |
| Referrer-Policy         | no-referrer                          |
| Content-Security-Policy | default-src 'self'                   |

### Rate Limiting

Implemented via `RateLimitFilter` using Bucket4j:
- Login endpoint: 10 requests/minute per IP
- General API: 100 requests/minute per IP
- Response: HTTP 429 with JSON error body

### Audit Logging

`AuditLoggingFilter` logs all HTTP requests to `audit_events` table:
- user_email, method, path, status, IP, user-agent, timestamp
- Async persistence to avoid request latency

---

## Non-Functional Aspects

### Validation

- Jakarta Validation annotations on DTOs and entities
- `@Valid` on controller method parameters
- Custom validators where needed (e.g., month 1-12)

### Pagination

Default pagination via Spring Data:
- Default page size: 20
- Default sort: `postedAt` (transactions)
- Response wrapper: `PageResponse<T>` with content, page, size, totalElements, totalPages

### Logging

- Backend: SLF4J + Logback, structured via Zalando Logbook
- AI: Python `logging` module
- Logbook excludes `/actuator/**` and obfuscates `Authorization`, `password`, `token`

### Error Envelope

Standard error response format:

```json
{
  "timestamp": "2025-12-29T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for field 'email'",
  "path": "/api/auth/register"
}
```

---

## Assumptions & Risks

### Assumptions

1. PostgreSQL 16+ is available (local Docker or managed)
2. Java 17+ and Node 18+ installed for local development
3. Python 3.12+ for AI service
4. Users access via modern browsers (ES2020+ support)

### Risks

| Risk                              | Impact | Mitigation                        |
|-----------------------------------|--------|-----------------------------------|
| AI service unavailable            | Medium | Fallback to "Uncategorized"       |
| JWT secret leaked                 | High   | Rotate secret, invalidate tokens  |
| Rate limit bypass via IP spoofing | Low    | Add fingerprinting in prod        |
| Large CSV imports timeout         | Medium | Chunked processing (future)       |
| No backup strategy defined        | High   | Implement pg_dump schedule        |

---

## Related Documents

- [API.md](./API.md) – REST endpoint reference
- [DATA_MODEL.md](./DATA_MODEL.md) – Database schema and migrations
- [FRONTEND_MAP.md](./FRONTEND_MAP.md) – UI routes and components
- [AI_SPEC.md](./AI_SPEC.md) – AI service specification
- [DEPLOY_PLAN.md](./DEPLOY_PLAN.md) – Deployment guide
- [SPRINT1_STATUS.md](./SPRINT1_STATUS.md) – Sprint-1 checklist
