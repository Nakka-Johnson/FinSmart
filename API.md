# FinSmart API Reference

> **Generated:** 2025-12-29  
> **Base URL:** `http://localhost:8081` (local) or `https://{domain}/api` (prod)

## Overview

All endpoints except authentication require a valid JWT token in the
`Authorization: Bearer {token}` header. Responses use JSON format.

---

## Authentication

### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**Errors:**
- `409 Conflict` – Email already registered

**DTO:** `RegisterRequest` → `AuthResponse`

---

### POST /api/auth/login

Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**Errors:**
- `401 Unauthorized` – Invalid credentials

**DTO:** `LoginRequest` → `AuthResponse`

---

### GET /api/auth/me

Get current authenticated user info.

**Response (200 OK):**
```json
{
  "token": null,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**DTO:** `AuthResponse`

---

## Categories

### GET /api/categories

List all categories.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Groceries",
    "color": "#22c55e"
  }
]
```

**DTO:** `CategoryResponse[]`

---

### POST /api/categories

Create a new category.

**Request:**
```json
{
  "name": "Transport",
  "color": "#3b82f6"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Transport",
  "color": "#3b82f6"
}
```

**DTO:** `CategoryRequest` → `CategoryResponse`

---

## Accounts

### GET /api/accounts

List user's accounts.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Main Checking",
    "institution": "HSBC",
    "type": "CHECKING",
    "currency": "GBP",
    "balance": 1500.00,
    "createdAt": "2025-01-01T10:00:00Z"
  }
]
```

**DTO:** `AccountResponse[]`

---

### POST /api/accounts

Create a new account.

**Request:**
```json
{
  "name": "Savings",
  "institution": "Monzo",
  "type": "SAVINGS",
  "currency": "GBP"
}
```

**Response (201 Created):** `AccountResponse`

**DTO:** `AccountRequest` → `AccountResponse`

---

### DELETE /api/accounts/{id}

Delete an account and all its transactions.

**Response:** `204 No Content`

---

## Transactions

### GET /api/transactions

List transactions with filtering and pagination.

**Query Parameters:**

| Param       | Type    | Description                          |
|-------------|---------|--------------------------------------|
| `accountId` | UUID    | Filter by account                    |
| `categoryId`| UUID    | Filter by category                   |
| `dateFrom`  | ISO8601 | Start date (inclusive)               |
| `dateTo`    | ISO8601 | End date (inclusive)                 |
| `direction` | String  | `DEBIT` or `CREDIT`                  |
| `minAmount` | Decimal | Minimum amount                       |
| `maxAmount` | Decimal | Maximum amount                       |
| `q`         | String  | Search in description/merchant       |
| `page`      | Int     | Page number (0-indexed, default: 0)  |
| `size`      | Int     | Page size (default: 20)              |
| `sort`      | String  | Sort field (default: `postedAt`)     |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "postedAt": "2025-12-15T14:30:00Z",
      "amount": 45.99,
      "direction": "DEBIT",
      "description": "TESCO STORES",
      "categoryId": "uuid",
      "categoryName": "Groceries",
      "merchant": "Tesco",
      "notes": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

**DTO:** `PageResponse<TransactionResponse>`

---

### POST /api/transactions

Create a new transaction.

**Request:**
```json
{
  "accountId": "uuid",
  "postedAt": "2025-12-15T14:30:00Z",
  "amount": 45.99,
  "direction": "DEBIT",
  "description": "TESCO STORES",
  "categoryId": "uuid",
  "merchant": "Tesco",
  "notes": "Weekly shop"
}
```

**Response (201 Created):** `TransactionResponse`

**DTO:** `TransactionRequest` → `TransactionResponse`

---

### PUT /api/transactions/{id}

Update a transaction.

**Request:** Same as POST  
**Response (200 OK):** `TransactionResponse`

---

### DELETE /api/transactions/{id}

Delete a transaction.

**Response:** `204 No Content`

---

### POST /api/transactions/bulk

Bulk delete or recategorise transactions.

**Request:**
```json
{
  "action": "DELETE",
  "ids": ["uuid1", "uuid2"]
}
```

Or for recategorise:
```json
{
  "action": "RECATEGORISE",
  "ids": ["uuid1", "uuid2"],
  "categoryId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "affectedCount": 2,
  "message": "Deleted 2 transaction(s)"
}
```

**DTO:** `BulkActionRequest` → `BulkActionResponse`

---

## CSV Import v2

### POST /api/transactions/import

Upload and preview/commit CSV import.

**Request:** `multipart/form-data`

| Field         | Type    | Description                            |
|---------------|---------|----------------------------------------|
| `file`        | File    | CSV file                               |
| `accountId`   | UUID    | Target account                         |
| `preview`     | Boolean | If true, return preview without commit |
| `headerMapping` | Map   | Optional column mapping overrides      |

**Response (200 OK – Preview):**
```json
{
  "batch": {
    "id": "uuid",
    "status": "PREVIEW",
    "filename": "transactions.csv",
    "rowCount": 50,
    "validRows": 45,
    "duplicateRows": 3,
    "errorRows": 2,
    "createdAt": "2025-12-29T10:00:00Z"
  },
  "rows": [
    {
      "id": "uuid",
      "rowNo": 1,
      "rawData": {"Date": "2025-12-01", "Amount": "45.99"},
      "normalizedData": {...},
      "error": null,
      "duplicateOfId": null,
      "suggestedCategoryId": "uuid"
    }
  ],
  "summary": {
    "totalRows": 50,
    "validRows": 45,
    "duplicateRows": 3,
    "errorRows": 2,
    "status": "PREVIEW"
  }
}
```

**DTO:** `ImportPreviewResponse`

---

### POST /api/transactions/import/{batchId}/commit

Commit a previewed import batch.

**Query Parameters:**
- `accountId` (UUID) – Target account

**Response (200 OK):** `ImportBatchResponse`

---

### POST /api/transactions/import/{batchId}/undo

Undo a committed import (delete all transactions from batch).

**Query Parameters:**
- `accountId` (UUID)

**Response (200 OK):** `ImportBatchResponse` (status: UNDONE)

---

### GET /api/transactions/import

List import batches.

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 20)

**Response (200 OK):** `Page<ImportBatchResponse>`

---

### GET /api/transactions/import/{batchId}

Get batch details with rows.

**Response (200 OK):** `ImportBatchDetailsResponse`

---

## Budgets

### GET /api/budgets

List budgets for a period.

**Query Parameters:**
- `month` (1-12)
- `year` (2000+)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "categoryId": "uuid",
    "categoryName": "Groceries",
    "month": 12,
    "year": 2025,
    "limitAmount": 500.00,
    "rollover": false,
    "carryIn": 0.00
  }
]
```

**DTO:** `BudgetResponse[]`

---

### POST /api/budgets

Create a budget.

**Request:**
```json
{
  "categoryId": "uuid",
  "month": 12,
  "year": 2025,
  "limitAmount": 500.00
}
```

**Response (201 Created):** `BudgetResponse`

**DTO:** `BudgetRequest` → `BudgetResponse`

---

### PUT /api/budgets/{id}

Update a budget.

**Request:** Same as POST  
**Response (200 OK):** `BudgetResponse`

---

### DELETE /api/budgets/{id}

Delete a budget.

**Response:** `204 No Content`

---

### GET /api/budgets/summary

Get budget vs actual spending summary.

**Query Parameters:**
- `month` (required)
- `year` (required)

**Response (200 OK):**
```json
[
  {
    "categoryId": "uuid",
    "categoryName": "Groceries",
    "budgetAmount": 500.00,
    "spentAmount": 320.50,
    "remaining": 179.50,
    "percentUsed": 64.1
  }
]
```

**DTO:** `BudgetSummaryResponse[]`

---

## Insights

### GET /api/insights/monthly

Get monthly spending insights.

**Query Parameters:**
- `month` (1-12, required)
- `year` (2000-2100, required)

**Response (200 OK):**
```json
{
  "month": 12,
  "year": 2025,
  "totalDebit": 2500.00,
  "totalCredit": 3500.00,
  "biggestCategory": "Rent",
  "topCategories": [
    {"category": "Rent", "total": 1200.00},
    {"category": "Groceries", "total": 450.00}
  ],
  "anomalies": [...],
  "forecast": [...]
}
```

**DTO:** `MonthlyInsightDTO`

---

### GET /api/insights/merchants

Get merchant spending insights.

**Query Parameters:**
- `monthsBack` (1-24, default: 3)

**Response (200 OK):**
```json
[
  {
    "merchant": "tesco",
    "monthlyTotals": [
      {"month": "2025-10", "total": 150.00},
      {"month": "2025-11", "total": 180.00}
    ],
    "totalSpending": 480.00
  }
]
```

**DTO:** `MerchantInsightDTO[]`

---

### GET /api/insights/anomalies

Get detected spending anomalies.

**Query Parameters:**
- `ignoreIds` (optional, array of transaction IDs to exclude)

**Response (200 OK):**
```json
[
  {
    "transactionId": "uuid",
    "date": "2025-12-15",
    "amount": 500.00,
    "category": "Shopping",
    "description": "AMAZON",
    "score": 2.5,
    "isAnomaly": true,
    "status": null
  }
]
```

**DTO:** `AnomalyDTO[]`

---

### POST /api/insights/anomalies/{transactionId}/snooze

Snooze an anomaly alert.

**Response:** `200 OK` (empty body)

---

### POST /api/insights/anomalies/{transactionId}/confirm

Confirm an anomaly as suspicious.

**Response:** `200 OK`

---

### POST /api/insights/anomalies/{transactionId}/ignore

Permanently ignore an anomaly.

**Response:** `200 OK`

---

## Reports

### GET /api/reports/pdf

Generate and download monthly PDF report.

**Query Parameters:**
- `month` (1-12, required)
- `year` (2000-2100, required)

**Response:** `application/pdf` binary stream

**Headers:**
- `Content-Disposition: attachment; filename="FinSmart_Report_2025-12.pdf"`

---

## Rules (Categorisation)

### GET /api/rules

List user's categorisation rules.

**Query Parameters:**
- `activeOnly` (boolean, default: false)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "pattern": "tesco",
    "field": "merchant",
    "categoryId": "uuid",
    "categoryName": "Groceries",
    "active": true,
    "priority": 100,
    "notes": "Auto-categorise Tesco transactions"
  }
]
```

**DTO:** `RuleResponse[]`

---

### GET /api/rules/{ruleId}

Get a specific rule.

**Response (200 OK):** `RuleResponse`

---

### POST /api/rules

Create a categorisation rule.

**Request:**
```json
{
  "pattern": "uber",
  "field": "merchant",
  "categoryId": "uuid",
  "priority": 50,
  "notes": "Uber rides"
}
```

**Response (201 Created):** `RuleResponse`

**DTO:** `RuleRequest` → `RuleResponse`

---

### PUT /api/rules/{ruleId}

Update a rule.

**Request:**
```json
{
  "pattern": "uber|bolt",
  "field": "both",
  "categoryId": "uuid",
  "priority": 50,
  "active": true,
  "notes": "Ride-sharing apps"
}
```

**Response (200 OK):** `RuleResponse`

**DTO:** `RuleUpdateRequest` → `RuleResponse`

---

### DELETE /api/rules/{ruleId}

Delete a rule.

**Response:** `204 No Content`

---

### GET /api/rules/statistics

Get rule execution statistics.

**Response (200 OK):**
```json
{
  "totalRules": 5,
  "activeRules": 4,
  "matchesLastMonth": 150
}
```

---

## Admin (Demo Data)

> **Note:** Requires `ADMIN` role (PreAuthorize)

### POST /api/admin/demo/seed

Seed demo data for testing.

**Response (200 OK):**
```json
{
  "message": "Demo data seeded successfully",
  "usersCreated": 1,
  "accountsCreated": 2,
  "categoriesCreated": 8,
  "transactionsCreated": 100,
  "budgetsCreated": 5,
  "rulesCreated": 3
}
```

---

### DELETE /api/admin/demo/clear

Clear all demo data.

**Response (200 OK):**
```json
{
  "message": "Demo data cleared successfully",
  "usersDeleted": 1,
  "accountsDeleted": 2,
  "categoriesDeleted": 8,
  "transactionsDeleted": 100,
  "budgetsDeleted": 5,
  "rulesDeleted": 3
}
```

---

## Health

### GET /api/health

Backend health check.

**Response (200 OK):**
```json
{
  "status": "UP"
}
```

### GET /actuator/health

Spring Actuator health endpoint.

**Response (200 OK):**
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "diskSpace": {"status": "UP"}
  }
}
```

---

## Error Responses

All errors follow a standard envelope:

```json
{
  "timestamp": "2025-12-29T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/transactions"
}
```

### Common HTTP Status Codes

| Code | Meaning               | Typical Cause                       |
|------|-----------------------|-------------------------------------|
| 200  | OK                    | Successful GET/PUT                  |
| 201  | Created               | Successful POST                     |
| 204  | No Content            | Successful DELETE                   |
| 400  | Bad Request           | Validation failure                  |
| 401  | Unauthorized          | Missing/invalid JWT                 |
| 403  | Forbidden             | Insufficient permissions            |
| 404  | Not Found             | Resource doesn't exist              |
| 409  | Conflict              | Duplicate resource (e.g., email)    |
| 429  | Too Many Requests     | Rate limit exceeded                 |
| 500  | Internal Server Error | Unhandled exception                 |

---

## OpenAPI Note

No OpenAPI/Swagger spec file was found in the repository. The above documentation
was generated by scanning Spring controllers and their annotations:

- `@RestController`, `@RequestMapping`
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
- `@RequestParam`, `@PathVariable`, `@RequestBody`

---

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [FRONTEND_MAP.md](./FRONTEND_MAP.md)
