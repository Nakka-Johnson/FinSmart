# Architecture Documentation

Comprehensive architecture documentation for the FinSmart personal finance management platform.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [Security Architecture](#security-architecture)
7. [API Integration](#api-integration)
8. [Deployment Architecture](#deployment-architecture)
9. [Technology Stack](#technology-stack)

---

## System Overview

FinSmart is a three-tier personal finance management application consisting of:

1. **Frontend**: React TypeScript SPA (Single Page Application)
2. **Backend**: Spring Boot REST API
3. **AI Service**: FastAPI microservice for ML-powered insights
4. **Database**: PostgreSQL relational database

### Key Features

- User authentication with JWT tokens
- Multi-account transaction tracking
- Budget management with progress tracking
- AI-powered spending insights and anomaly detection
- PDF report generation
- Category-based expense tracking

---

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet / User                         │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTPS
                                 ↓
                    ┌────────────────────────┐
                    │   Reverse Proxy        │
                    │   (Caddy / Nginx)      │
                    │   - TLS Termination    │
                    │   - Load Balancing     │
                    │   - Static Assets      │
                    └────────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ↓              ↓              ↓
     ┌────────────┐  ┌──────────────┐  ┌────────────┐
     │  Frontend  │  │   Backend    │  │ AI Service │
     │  (React)   │  │ (Spring Boot)│  │ (FastAPI)  │
     │  Port 80   │  │  Port 8080   │  │ Port 8001  │
     └────────────┘  └──────┬───────┘  └─────┬──────┘
                            │                 │
                            │    ┌────────────┘
                            │    │
                            ↓    ↓
                    ┌────────────────────┐
                    │    PostgreSQL      │
                    │    Database        │
                    │    Port 5432       │
                    └────────────────────┘
```

### Component Interaction Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  Browser │         │ Frontend │         │ Backend  │         │ Database │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │  1. Load SPA       │                    │                    │
     ├───────────────────→│                    │                    │
     │                    │                    │                    │
     │  2. Login Request  │                    │                    │
     ├───────────────────→│  3. POST /login    │                    │
     │                    ├───────────────────→│  4. Verify User    │
     │                    │                    ├───────────────────→│
     │                    │                    │  5. User Data      │
     │                    │  6. JWT Token      │←───────────────────┤
     │  7. Token + User   │←───────────────────┤                    │
     │←───────────────────┤                    │                    │
     │                    │                    │                    │
     │  8. Get Transactions                    │                    │
     ├───────────────────→│  9. GET /transactions                   │
     │    (with JWT)      │    Authorization: Bearer <token>        │
     │                    ├───────────────────→│ 10. Validate JWT   │
     │                    │                    │                    │
     │                    │                    │ 11. Query Data     │
     │                    │                    ├───────────────────→│
     │                    │                    │ 12. Results        │
     │                    │ 13. JSON Response  │←───────────────────┤
     │ 14. Display Data   │←───────────────────┤                    │
     │←───────────────────┤                    │                    │
```

### AI Service Integration Flow

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Frontend │       │ Backend  │       │    AI    │       │ Database │
└────┬─────┘       └────┬─────┘       │  Service │       └────┬─────┘
     │                  │              └────┬─────┘            │
     │                  │                   │                  │
     │  1. Get Insights │                   │                  │
     ├─────────────────→│                   │                  │
     │                  │                   │                  │
     │                  │  2. Fetch User    │                  │
     │                  │     Transactions  │                  │
     │                  ├──────────────────────────────────────→│
     │                  │  3. Transaction   │                  │
     │                  │     Data          │                  │
     │                  │←──────────────────────────────────────┤
     │                  │                   │                  │
     │                  │  4. POST /analyze │                  │
     │                  │     (transactions)│                  │
     │                  ├──────────────────→│                  │
     │                  │                   │  5. ML Analysis  │
     │                  │                   │  - Categorize    │
     │                  │                   │  - Detect Anomaly│
     │                  │                   │  - Forecast      │
     │                  │  6. Insights JSON │                  │
     │                  │←──────────────────┤                  │
     │  7. Formatted    │                   │                  │
     │     Insights     │                   │                  │
     │←─────────────────┤                   │                  │
```

### Request/Response Flow

```
HTTP Request Flow:
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                           │
├─────────────────────────────────────────────────────────────────┤
│ Method: GET / POST / PUT / DELETE                               │
│ URL: /api/transactions                                          │
│ Headers:                                                        │
│   - Authorization: Bearer <JWT>                                 │
│   - Content-Type: application/json                              │
│ Body: { JSON payload }                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Processing                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. CORS Filter       → Verify origin                            │
│ 2. JWT Filter        → Validate token, extract user             │
│ 3. Security Filter   → Check authorization                      │
│ 4. Controller        → Route to handler method                  │
│ 5. Validation        → Validate request body (Jakarta Bean)     │
│ 6. Service Layer     → Business logic                           │
│ 7. Repository        → Database query (JPA/Hibernate)           │
│ 8. Mapper            → Entity to DTO (MapStruct)                │
│ 9. Response          → JSON serialization                       │
│ 10. Audit Log        → Log action to audit_events               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Response                            │
├─────────────────────────────────────────────────────────────────┤
│ Status: 200 OK / 201 Created / 400 Bad Request / etc.          │
│ Headers:                                                        │
│   - Content-Type: application/json                              │
│   - X-RateLimit-Remaining: 499                                  │
│ Body: { JSON payload }                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │   Components   │  │     Pages      │  │     Hooks      │   │
│  │                │  │                │  │                │   │
│  │  - Header      │  │  - Dashboard   │  │  - useToast    │   │
│  │  - Card        │  │  - Login       │  │  - useAuth     │   │
│  │  - Loader      │  │  - Transactions│  │                │   │
│  │  - Toast       │  │  - Budgets     │  │                │   │
│  │  - Guard       │  │  - Categories  │  │                │   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
│           │                   │                   │            │
│           └───────────────────┼───────────────────┘            │
│                               ↓                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                       State Management                    │ │
│  │                         (Zustand)                         │ │
│  │  - authStore: { token, user, login(), logout() }         │ │
│  │  - Session storage persistence                           │ │
│  └────────────────────────────┬─────────────────────────────┘ │
│                               ↓                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                       API Client                          │ │
│  │  - http.ts: Base HTTP client with auth injection         │ │
│  │  - endpoints.ts: Typed API functions                     │ │
│  │  - types.ts: TypeScript interfaces                       │ │
│  └────────────────────────────┬─────────────────────────────┘ │
│                               ↓                                │
│                          Backend API                           │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture (Spring Boot)

```
┌─────────────────────────────────────────────────────────────────┐
│                       Spring Boot Application                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Web Layer                              │  │
│  │                                                           │  │
│  │  Controllers (REST Endpoints):                           │  │
│  │  - AuthController: /api/auth/*                           │  │
│  │  - TransactionController: /api/transactions              │  │
│  │  - BudgetController: /api/budgets                        │  │
│  │  - CategoryController: /api/categories                   │  │
│  │  - AccountController: /api/accounts                      │  │
│  │  - InsightsController: /api/insights                     │  │
│  │  - ReportController: /api/reports                        │  │
│  │                                                           │  │
│  │  DTOs (Request/Response):                                │  │
│  │  - *Request: Validation with Jakarta Bean Validation     │  │
│  │  - *Response: Clean API response models                  │  │
│  │                                                           │  │
│  │  Mappers (MapStruct):                                    │  │
│  │  - Entity ↔ DTO conversion                               │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Security Layer                          │  │
│  │                                                           │  │
│  │  - JwtAuthFilter: Extract & validate JWT token           │  │
│  │  - SecurityConfig: Configure security rules               │  │
│  │  - UserDetailsServiceImpl: Load user for auth            │  │
│  │  - JwtUtil: Token creation & validation                  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Service Layer                          │  │
│  │                                                           │  │
│  │  Business Logic:                                         │  │
│  │  - TransactionService: CRUD + filtering + pagination     │  │
│  │  - BudgetService: Budget CRUD + summary calculation      │  │
│  │  - CategoryService: Category management                  │  │
│  │  - AccountService: Account management + balance          │  │
│  │  - InsightService: AI integration + data aggregation     │  │
│  │  - ReportService: PDF generation                         │  │
│  │  - AuditService: Audit logging                           │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Persistence Layer                        │  │
│  │                                                           │  │
│  │  Repositories (Spring Data JPA):                         │  │
│  │  - UserRepository                                        │  │
│  │  - TransactionRepository (+ custom queries)              │  │
│  │  - BudgetRepository                                      │  │
│  │  - CategoryRepository                                    │  │
│  │  - AccountRepository                                     │  │
│  │  - AuditEventRepository                                  │  │
│  │                                                           │  │
│  │  Entities (JPA/Hibernate):                               │  │
│  │  - User, Transaction, Budget, Category, Account          │  │
│  │  - Relationships: @ManyToOne, @OneToMany                 │  │
│  │  - Constraints: @NotNull, @Unique, CHECK                 │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ↓                                     │
│                      PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────────┘
```

### AI Service Architecture (FastAPI)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │  - GET  /health    : Health check                        │  │
│  │  - POST /analyze   : Transaction analysis                │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Request Validation                       │  │
│  │  - Pydantic models with validation rules                 │  │
│  │  - Type checking, range validation                       │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Analysis Engine                          │  │
│  │                                                           │  │
│  │  Functions:                                              │  │
│  │  - Category Aggregation: Sum by category                │  │
│  │  - Anomaly Detection: Z-score calculation               │  │
│  │  - Forecasting: Moving average prediction               │  │
│  │  - Statistics: Total, average, max, min                 │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Response Formatting                      │  │
│  │  - JSON serialization                                    │  │
│  │  - Error handling                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Transaction Creation Flow

```
1. User fills form in frontend
2. Frontend validates input (client-side)
3. Frontend sends POST /api/transactions with JWT
4. Backend JWT filter validates token
5. Backend validates request body (Jakarta Bean Validation)
6. Backend checks account belongs to user
7. Backend creates Transaction entity
8. Backend updates account balance (if applicable)
9. Backend saves to database
10. Backend logs to audit_events table
11. Backend maps entity to DTO
12. Backend returns 201 Created with transaction JSON
13. Frontend updates UI with new transaction
```

### Budget Summary Calculation Flow

```
1. User selects month/year in frontend
2. Frontend sends GET /api/budgets/summary?month=1&year=2025
3. Backend validates month/year parameters
4. Backend queries budgets for user + month/year
5. For each budget:
   a. Query transactions for category + month/year + user
   b. Filter by direction=OUT (expenses only)
   c. Sum transaction amounts
   d. Calculate percentage: (spent / limit) * 100
6. Backend returns array of BudgetSummaryResponse
7. Frontend renders progress bars with color coding
```

### Insight Generation Flow

```
1. User clicks "Refresh Insights" in dashboard
2. Frontend sends GET /api/insights/monthly?month=1&year=2025
3. Backend validates parameters
4. Backend queries all transactions for user + month/year
5. Backend calls InsightService.buildMonthlyInsights()
6. InsightService aggregates data:
   - Total debit/credit
   - Top categories (GROUP BY category, ORDER BY SUM DESC)
   - Biggest category
7. InsightService calls AI service:
   - POST http://ai:8001/analyze with transaction list
8. AI service performs:
   - Anomaly detection (Z-score > 2.0)
   - Next month forecast (moving average)
9. AI service returns JSON with anomalies + forecasts
10. Backend combines database aggregations + AI results
11. Backend returns MonthlyInsightDTO
12. Frontend displays insights in tables/charts
```

---

## Database Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ PK  id (UUID)       │
│ UQ  email           │
│     password_hash   │
│     full_name       │
│     created_at      │
└──────────┬──────────┘
           │
           │ 1:N
           │
    ┌──────┴──────┬──────────────┬────────────────────┐
    │             │              │                    │
    ↓             ↓              ↓                    ↓
┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────────────────┐
│ accounts │  │ budgets │  │ (audit)  │  │ (user owns their   │
└──────────┘  └─────────┘  │ (events) │  │  data via accounts)│
                           └──────────┘  └────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│     categories      │         │      accounts       │
├─────────────────────┤         ├─────────────────────┤
│ PK  id (UUID)       │    ┌───→│ PK  id (UUID)       │
│ UQ  name            │    │    │ FK  user_id         │←──┐
│     color           │    │    │     name            │   │
└──────────┬──────────┘    │    │     institution     │   │
           │               │    │     type            │   │ 1:N
           │ N:1           │    │     currency        │   │
           │               │    │     balance         │   │
           │               │    │     created_at      │   │
           │               │    └──────────┬──────────┘   │
           │               │               │              │
           │               │               │ 1:N          │
           │               │               │              │
           └───────┐       │               ↓              │
                   │       │    ┌─────────────────────┐  │
                   │       │    │    transactions     │  │
                   │       │    ├─────────────────────┤  │
                   │       └────┤ PK  id (UUID)       │  │
                   │            │ FK  account_id      │──┘
                   └────────────┤ FK  category_id     │
                                │     posted_at       │
                                │     amount          │
                                │     direction       │
                                │     description     │
                                │     merchant        │
                                │     notes           │
                                │     created_at      │
                                └─────────────────────┘

┌─────────────────────┐
│      budgets        │
├─────────────────────┤
│ PK  id (UUID)       │
│ FK  user_id         │──→ users
│ FK  category_id     │──→ categories
│     month           │
│     year            │
│     limit_amount    │
│ UQ  (user_id,       │
│      category_id,   │
│      month, year)   │
└─────────────────────┘

┌─────────────────────┐
│   audit_events      │
├─────────────────────┤
│ PK  id (UUID)       │
│ FK  user_id         │──→ users
│     action          │
│     resource_type   │
│     resource_id     │
│     timestamp       │
│     details         │
└─────────────────────┘
```

### Table Definitions

#### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| full_name | VARCHAR(255) | NULL | User's display name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Account creation time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

---

#### categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique category identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| color | VARCHAR(7) | NOT NULL | Hex color code (#RRGGBB) |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `name`

**Seed Data:** Pre-populated with 11 default categories (Groceries, Transportation, etc.)

---

#### accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique account identifier |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Account owner |
| name | VARCHAR(255) | NOT NULL | Account name |
| institution | VARCHAR(255) | NULL | Bank/institution name |
| type | VARCHAR(20) | NOT NULL, CHECK (CHECKING, SAVINGS, CREDIT) | Account type |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'GBP' | ISO currency code |
| balance | NUMERIC(12,2) | DEFAULT 0.00 | Current account balance |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Account creation time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`

**Cascade:** ON DELETE CASCADE (deleting user deletes their accounts)

---

#### transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique transaction identifier |
| account_id | UUID | FOREIGN KEY → accounts(id), NOT NULL | Related account |
| posted_at | TIMESTAMP | NOT NULL | Transaction post date |
| amount | NUMERIC(12,2) | NOT NULL, CHECK >= 0 | Transaction amount (positive) |
| direction | VARCHAR(20) | NOT NULL, CHECK (direction IN ('DEBIT', 'CREDIT')) | Money direction: DEBIT=expense, CREDIT=income (API displays as OUT/IN) |
| description | VARCHAR(512) | NULL | Transaction description |
| category_id | UUID | FOREIGN KEY → categories(id), NULL | Transaction category |
| merchant | VARCHAR(255) | NULL | Merchant name |
| notes | VARCHAR(512) | NULL | User notes |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `account_id`
- INDEX on `posted_at`
- INDEX on `category_id`

**Cascade:** 
- ON DELETE CASCADE for `account_id` (deleting account deletes transactions)
- ON DELETE SET NULL for `category_id` (deleting category sets to null)

---

#### budgets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique budget identifier |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Budget owner |
| category_id | UUID | FOREIGN KEY → categories(id), NOT NULL | Budget category |
| month | INTEGER | NOT NULL, CHECK 1-12 | Budget month |
| year | INTEGER | NOT NULL, CHECK >= 2000 | Budget year |
| limit_amount | NUMERIC(12,2) | NOT NULL, CHECK >= 0 | Budget limit |

**Unique Constraint:** (user_id, category_id, month, year)

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `(month, year)`

**Cascade:** ON DELETE CASCADE for both foreign keys

---

#### audit_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique event identifier |
| user_id | UUID | FOREIGN KEY → users(id), NULL | User who performed action |
| action | VARCHAR(50) | NOT NULL | Action type (CREATE, UPDATE, DELETE) |
| resource_type | VARCHAR(50) | NOT NULL | Resource type (TRANSACTION, BUDGET, etc.) |
| resource_id | UUID | NULL | ID of affected resource |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW | Event timestamp |
| details | TEXT | NULL | Additional event details (JSON) |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `timestamp`

**Purpose:** Audit logging for security and compliance

---

### Database Constraints Summary

**Primary Keys:** All tables use UUID as primary key
**Foreign Keys:** Enforce referential integrity
**Check Constraints:**
- `transactions.amount >= 0`
- `transactions.direction IN ('DEBIT', 'CREDIT')`
- `accounts.type IN ('CHECKING', 'SAVINGS', 'CREDIT')`
- `budgets.month BETWEEN 1 AND 12`
- `budgets.year >= 2000`
- `budgets.limit_amount >= 0`

**Unique Constraints:**
- `users.email`
- `categories.name`
- `budgets.(user_id, category_id, month, year)`

---

## Security Architecture

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Authentication Flow                          │
└──────────────────────────────────────────────────────────────────┘

1. User Registration
   ┌───────────┐
   │ Frontend  │  POST /api/auth/register
   │           ├────────────────────────────────────┐
   └───────────┘  { email, password, fullName }     │
                                                     ↓
                                          ┌──────────────────┐
                                          │    Backend       │
                                          │  1. Validate     │
                                          │  2. Hash pwd     │
                                          │     (BCrypt)     │
                                          │  3. Save user    │
                                          │  4. Generate JWT │
                                          └─────────┬────────┘
                                                    │
   ┌───────────┐  201 Created                      │
   │ Frontend  │  { token, userId, email }         │
   │           │←──────────────────────────────────┘
   └───────────┘

2. User Login
   ┌───────────┐
   │ Frontend  │  POST /api/auth/login
   │           ├────────────────────────────────────┐
   └───────────┘  { email, password }               │
                                                     ↓
                                          ┌──────────────────┐
                                          │    Backend       │
                                          │  1. Find user    │
                                          │  2. Compare pwd  │
                                          │     (BCrypt)     │
                                          │  3. Generate JWT │
                                          └─────────┬────────┘
                                                    │
   ┌───────────┐  200 OK                           │
   │ Frontend  │  { token, userId, email }         │
   │  (store   │←──────────────────────────────────┘
   │   token)  │
   └───────────┘

3. Authenticated Request
   ┌───────────┐
   │ Frontend  │  GET /api/transactions
   │           ├──────────────────────────────────────┐
   └───────────┘  Authorization: Bearer <JWT>         │
                                                       ↓
                                            ┌────────────────────┐
                                            │   Backend          │
                                            │  1. JWT Filter     │
                                            │  2. Extract token  │
                                            │  3. Verify sig     │
                                            │  4. Check expiry   │
                                            │  5. Load user      │
                                            │  6. Set context    │
                                            │  7. Process req    │
                                            └─────────┬──────────┘
                                                      │
   ┌───────────┐  200 OK                             │
   │ Frontend  │  { transactions: [...] }            │
   │           │←────────────────────────────────────┘
   └───────────┘
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "iss": "finsmart",
    "iat": 1705401600,
    "exp": 1705405200
  },
  "signature": "HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret)"
}
```

**Claims:**
- `sub`: Subject (user ID)
- `email`: User email
- `iss`: Issuer (finsmart)
- `iat`: Issued at (Unix timestamp)
- `exp`: Expiration (Unix timestamp)

### Security Features

1. **Password Security**
   - BCrypt hashing with 10 rounds
   - Salted hashes (unique per user)
   - Never stored or transmitted in plain text

2. **JWT Security**
   - HMAC-SHA256 signing algorithm
   - Secret key (min 32 characters)
   - Token expiration (default 60 minutes)
   - No auto-refresh (must re-login)

3. **CORS Protection**
   - Configurable allowed origins
   - Credentials allowed for auth requests
   - Pre-flight caching

4. **SQL Injection Prevention**
   - JPA/Hibernate with parameterized queries
   - Input validation on all endpoints
   - No raw SQL queries

5. **Authorization**
   - All data scoped to user
   - Ownership verification on every request
   - Foreign key constraints enforce data isolation

6. **Audit Logging**
   - All CUD operations logged
   - Includes: user, action, resource, timestamp
   - Immutable audit trail

7. **Rate Limiting**
   - 100 requests/minute per IP (anonymous)
   - 500 requests/minute per user (authenticated)
   - Prevents brute force attacks

8. **HTTPS/TLS**
   - Caddy auto-provisions Let's Encrypt certificates
   - TLS 1.2+ only
   - Automatic renewal

---

## API Integration

### Backend → AI Service

**Endpoint:** `POST http://ai:8001/analyze`

**Request:**
```json
{
  "transactions": [
    {
      "date": "2025-01-15",
      "amount": 45.50,
      "category": "Groceries"
    }
  ]
}
```

**Response:**
```json
{
  "summary": "Total spent $45.50. Biggest category: Groceries"
}
```

**Error Handling:**
- Timeout after 30 seconds
- Falls back to basic aggregation if AI service unavailable
- Logs errors but doesn't fail request

### Frontend → Backend

**Base URL:** `http://localhost:8081` (dev) or `https://your-domain.com` (prod)

**Authentication:**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Error Handling:**
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new HttpError(response.status, message);
  }
  return await response.json();
} catch (error) {
  // Handle network errors, parse errors, etc.
}
```

---

## Deployment Architecture

### Development (Local)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Frontend    │  │   Backend    │  │  AI Service  │
│  Vite Dev    │  │  Spring Boot │  │   FastAPI    │
│  :5173       │  │  :8081       │  │   :8001      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                    ┌────┴────┐
                    │   Local │
                    │   Postgres │
                    │   :5432  │
                    └─────────┘
```

### Production (Docker)

```
                    ┌─────────────────┐
                    │  Caddy (Reverse │
                    │     Proxy)      │
                    │  :80 / :443     │
                    │  - TLS          │
                    │  - Routing      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
         │ Frontend │  │ Backend  │  │    AI    │
         │  Nginx   │  │  Spring  │  │  FastAPI │
         │  :80     │  │  :8080   │  │  :8001   │
         └──────────┘  └────┬─────┘  └──────────┘
                            │
                       ┌────▼────┐
                       │  Managed │
                       │  Postgres │
                       │   (RDS)   │
                       └──────────┘
```

**Key Differences:**
- Frontend served as static files by Nginx
- Backend runs in JRE container (not full JDK)
- Database externalized to managed service
- Reverse proxy handles TLS and routing

---

## Technology Stack

### Frontend
- **React 19**: UI library
- **TypeScript 5.9**: Type-safe JavaScript
- **Vite 7**: Build tool & dev server
- **React Router 7**: Client-side routing
- **Zustand**: State management
- **Recharts**: Charting library
- **Tailwind CSS**: Utility-first CSS (minimal use)

### Backend
- **Java 17**: Programming language
- **Spring Boot 3.4**: Application framework
- **Spring Security**: Authentication & authorization
- **Spring Data JPA**: ORM abstraction
- **Hibernate**: JPA implementation
- **MapStruct 1.6**: Object mapping
- **Flyway**: Database migrations
- **Maven 3.9**: Build tool
- **iText 7**: PDF generation

### AI Service
- **Python 3.11**: Programming language
- **FastAPI 0.115**: Web framework
- **Uvicorn**: ASGI server
- **Pydantic 2.10**: Data validation
- **NumPy/Pandas**: Data processing (if added)

### Database
- **PostgreSQL 15**: Relational database
- **pg_stat_statements**: Query performance monitoring
- **Indexes**: B-tree indexes on frequently queried columns

### Deployment
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Caddy 2**: Reverse proxy & TLS
- **Nginx**: Static file serving (frontend)
- **Let's Encrypt**: Free TLS certificates

### Development Tools
- **Git**: Version control
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Spotless**: Java code formatting
- **Black**: Python code formatting

---

## Performance Considerations

### Database Optimization
- Indexes on foreign keys and frequently queried columns
- Connection pooling (HikariCP)
- Query pagination for large result sets
- Lazy loading for entity relationships

### API Performance
- Response compression (gzip/zstd via Caddy)
- Caching headers for static assets
- Pagination for list endpoints (default 20 items)
- Efficient SQL queries (avoid N+1 problems)

### Frontend Performance
- Code splitting (Vite automatic)
- Lazy loading for routes
- Memoization for expensive computations
- Debouncing for search/filter inputs

### Scalability
- Stateless backend (horizontal scaling possible)
- Session storage in client (JWT tokens)
- External database (can scale independently)
- AI service can be scaled with multiple replicas

---

## Monitoring & Observability

### Application Logs
- Backend: SLF4J with Logback
- AI Service: Python logging to stdout
- Frontend: Browser console

### Database Monitoring
- pg_stat_statements for query performance
- Connection pool metrics (HikariCP)
- Slow query logging

### Health Checks
- `/api/health` - Backend health
- `/health` - AI service health
- `/health` - Frontend (Nginx) health

### Metrics (Future Enhancement)
- Spring Boot Actuator endpoints
- Prometheus metrics export
- Grafana dashboards

---

## Future Architecture Enhancements

1. **Caching Layer**
   - Redis for session storage
   - Cache frequently accessed data (categories, user profile)

2. **Message Queue**
   - RabbitMQ/Kafka for async processing
   - Batch transaction imports
   - Report generation

3. **CDN**
   - CloudFront/Cloudflare for static assets
   - Reduced latency for global users

4. **API Gateway**
   - Kong/AWS API Gateway
   - Centralized auth, rate limiting, logging

5. **Advanced ML**
   - More sophisticated forecasting models
   - Personalized recommendations
   - Fraud detection

6. **Multi-tenancy**
   - Organization/family accounts
   - Shared budgets
   - Role-based access control

---

## References

- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [AI Service README](../ai/README.md)
- [API Reference](./API_REFERENCE.md)
- [User Guide](./USER_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
