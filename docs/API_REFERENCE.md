# API Reference

Complete reference documentation for the FinSmart REST API.

## Base URL

```
Development: http://localhost:8081
Production: https://your-domain.com
```

## Authentication

FinSmart uses JWT (JSON Web Token) Bearer authentication.

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
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

### Using the Token

Include the token in the `Authorization` header for all authenticated requests:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Expiration

- Default expiration: 60 minutes
- Configurable via `APP_JWT_EXPIRES_MINUTES` environment variable
- No automatic refresh - client must re-login when token expires

---

## OpenAPI/Swagger Specification

### API Metadata

```yaml
openapi: 3.0.3
info:
  title: FinSmart API
  description: Personal finance management platform with AI-powered insights
  version: 1.0.0
  contact:
    name: FinSmart Development Team
servers:
  - url: http://localhost:8081
    description: Development server
  - url: https://your-domain.com
    description: Production server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    Error:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        status:
          type: integer
        error:
          type: string
        message:
          type: string
        path:
          type: string
    
    Transaction:
      type: object
      required:
        - accountId
        - postedAt
        - amount
        - direction
      properties:
        id:
          type: string
          format: uuid
        accountId:
          type: string
          format: uuid
        postedAt:
          type: string
          format: date-time
        amount:
          type: number
          format: decimal
          minimum: 0
        direction:
          type: string
          enum: [DEBIT, CREDIT]
          description: DEBIT for expenses, CREDIT for income
        description:
          type: string
          maxLength: 512
        categoryId:
          type: string
          format: uuid
        categoryName:
          type: string
        merchant:
          type: string
          maxLength: 255
        notes:
          type: string
          maxLength: 512
        createdAt:
          type: string
          format: date-time
    
    Budget:
      type: object
      required:
        - categoryId
        - month
        - year
        - limitAmount
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        categoryId:
          type: string
          format: uuid
        categoryName:
          type: string
        month:
          type: integer
          minimum: 1
          maximum: 12
        year:
          type: integer
          minimum: 2000
        limitAmount:
          type: number
          format: decimal
          minimum: 0
    
    Category:
      type: object
      required:
        - name
        - color
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          maxLength: 100
        color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
    
    Account:
      type: object
      required:
        - name
        - type
        - currency
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        name:
          type: string
          maxLength: 255
        institution:
          type: string
          maxLength: 255
        type:
          type: string
          enum: [CHECKING, SAVINGS, CREDIT]
        currency:
          type: string
          pattern: '^[A-Z]{3}$'
        balance:
          type: number
          format: decimal
        createdAt:
          type: string
          format: date-time
    
    PageResponse:
      type: object
      properties:
        content:
          type: array
          items: {}
        page:
          type: integer
        size:
          type: integer
        totalElements:
          type: integer
        totalPages:
          type: integer
```

---

## API Endpoints

### 1. Authentication & User Management

#### 1.1 Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, unique in system
- `password`: Minimum 8 characters
- `fullName`: Optional

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**Error Response (409 Conflict):**
```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Email already registered",
  "path": "/api/auth/register"
}
```

#### 1.2 Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
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

**Error Response (401 Unauthorized):**
```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials",
  "path": "/api/auth/login"
}
```

#### 1.3 Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "token": null,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

---

### 2. Categories

#### 2.1 List All Categories

```http
GET /api/categories
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "c1e8400-e29b-41d4-a716-446655440001",
    "name": "Groceries",
    "color": "#4CAF50"
  },
  {
    "id": "c2e8400-e29b-41d4-a716-446655440002",
    "name": "Transportation",
    "color": "#2196F3"
  }
]
```

#### 2.2 Create Category

```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Entertainment",
  "color": "#FF9800"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters, unique
- `color`: Required, valid hex color format (#RRGGBB)

**Response (201 Created):**
```json
{
  "id": "c3e8400-e29b-41d4-a716-446655440003",
  "name": "Entertainment",
  "color": "#FF9800"
}
```

**Error Response (409 Conflict):**
```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Category with this name already exists",
  "path": "/api/categories"
}
```

---

### 3. Accounts

#### 3.1 List User Accounts

```http
GET /api/accounts
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "a1e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Checking",
    "institution": "Chase Bank",
    "type": "CHECKING",
    "currency": "GBP",
    "balance": 1500.75,
    "createdAt": "2025-01-01T10:00:00Z"
  },
  {
    "id": "a2e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Savings Account",
    "institution": "Barclays",
    "type": "SAVINGS",
    "currency": "GBP",
    "balance": 5000.00,
    "createdAt": "2025-01-01T10:00:00Z"
  }
]
```

#### 3.2 Create Account

```http
POST /api/accounts
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Credit Card",
  "institution": "American Express",
  "type": "CREDIT",
  "currency": "GBP"
}
```

**Validation Rules:**
- `name`: Required, 1-255 characters
- `institution`: Optional, max 255 characters
- `type`: Required, one of: `CHECKING`, `SAVINGS`, `CREDIT`
- `currency`: Required, 3-letter ISO code (default: GBP)

**Response (201 Created):**
```json
{
  "id": "a3e8400-e29b-41d4-a716-446655440003",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Credit Card",
  "institution": "American Express",
  "type": "CREDIT",
  "currency": "GBP",
  "balance": 0.00,
  "createdAt": "2025-01-16T10:30:00Z"
}
```

#### 3.3 Delete Account

```http
DELETE /api/accounts/{accountId}
Authorization: Bearer <token>
```

**Response (204 No Content)**

**Error Response (404 Not Found):**
```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Account not found",
  "path": "/api/accounts/a3e8400-e29b-41d4-a716-446655440003"
}
```

---

### 4. Transactions

#### 4.1 List Transactions (Paginated)

```http
GET /api/transactions?page=0&size=20&sort=postedAt,desc
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (0-indexed, default: 0)
- `size`: Items per page (default: 20, max: 100)
- `sort`: Sort field and direction (default: `postedAt,desc`)
- `accountId`: Filter by account UUID (optional)
- `categoryId`: Filter by category UUID (optional)
- `direction`: Filter by direction: `DEBIT`, `CREDIT` (optional)
- `dateFrom`: Filter from date (ISO format, optional)
- `dateTo`: Filter to date (ISO format, optional)
- `minAmount`: Minimum amount filter (optional)
- `maxAmount`: Maximum amount filter (optional)
- `q`: Search query for description/merchant (optional)

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "t1e8400-e29b-41d4-a716-446655440001",
      "accountId": "a1e8400-e29b-41d4-a716-446655440001",
      "postedAt": "2025-01-15T14:30:00Z",
      "amount": 45.50,
      "direction": "DEBIT",
      "description": "Grocery shopping",
      "categoryId": "c1e8400-e29b-41d4-a716-446655440001",
      "categoryName": "Groceries",
      "merchant": "Tesco",
      "notes": "Weekly shopping",
      "createdAt": "2025-01-15T14:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

#### 4.2 Create Transaction

```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accountId": "a1e8400-e29b-41d4-a716-446655440001",
  "postedAt": "2025-01-16T10:00:00Z",
  "amount": 75.00,
  "direction": "DEBIT",
  "description": "Gas station",
  "categoryId": "c2e8400-e29b-41d4-a716-446655440002",
  "merchant": "Shell",
  "notes": "Filled up tank"
}
```

**Validation Rules:**
- `accountId`: Required, valid UUID, must belong to user
- `postedAt`: Required, ISO 8601 datetime
- `amount`: Required, >= 0, max 2 decimal places
- `direction`: Required, one of: `DEBIT` (money out/expense), `CREDIT` (money in/income)
- `description`: Optional, max 512 characters
- `categoryId`: Optional, valid UUID
- `merchant`: Optional, max 255 characters
- `notes`: Optional, max 512 characters

**Note on Direction Values**: The API uses `DEBIT` (for expenses/money out) and `CREDIT` (for income/money in). The frontend may display these as "OUT" and "IN" for user convenience.

**Response (201 Created):**
```json
{
  "id": "t2e8400-e29b-41d4-a716-446655440002",
  "accountId": "a1e8400-e29b-41d4-a716-446655440001",
  "postedAt": "2025-01-16T10:00:00Z",
  "amount": 75.00,
  "direction": "DEBIT",
  "description": "Gas station",
  "categoryId": "c2e8400-e29b-41d4-a716-446655440002",
  "categoryName": "Transportation",
  "merchant": "Shell",
  "notes": "Filled up tank",
  "createdAt": "2025-01-16T10:30:00Z"
}
```

#### 4.3 Update Transaction

```http
PUT /api/transactions/{transactionId}
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (same as create)

**Response (200 OK):** (same as create)

#### 4.4 Delete Transaction

```http
DELETE /api/transactions/{transactionId}
Authorization: Bearer <token>
```

**Response (204 No Content)**

---

### 5. Budgets

#### 5.1 List Budgets

```http
GET /api/budgets?month=1&year=2025
Authorization: Bearer <token>
```

**Query Parameters:**
- `month`: Filter by month (1-12, optional)
- `year`: Filter by year (2000+, optional)

**Response (200 OK):**
```json
[
  {
    "id": "b1e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryId": "c1e8400-e29b-41d4-a716-446655440001",
    "categoryName": "Groceries",
    "month": 1,
    "year": 2025,
    "limitAmount": 500.00
  }
]
```

#### 5.2 Create Budget

```http
POST /api/budgets
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "categoryId": "c1e8400-e29b-41d4-a716-446655440001",
  "month": 1,
  "year": 2025,
  "limitAmount": 500.00
}
```

**Validation Rules:**
- `categoryId`: Required, valid UUID
- `month`: Required, 1-12
- `year`: Required, >= 2000
- `limitAmount`: Required, >= 0, max 2 decimal places
- Unique constraint: One budget per user/category/month/year combination

**Response (201 Created):**
```json
{
  "id": "b1e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "categoryId": "c1e8400-e29b-41d4-a716-446655440001",
  "categoryName": "Groceries",
  "month": 1,
  "year": 2025,
  "limitAmount": 500.00
}
```

#### 5.3 Update Budget

```http
PUT /api/budgets/{budgetId}
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (same as create)

**Response (200 OK):** (same as create)

#### 5.4 Delete Budget

```http
DELETE /api/budgets/{budgetId}
Authorization: Bearer <token>
```

**Response (204 No Content)**

#### 5.5 Get Budget Summary

```http
GET /api/budgets/summary?month=1&year=2025
Authorization: Bearer <token>
```

**Query Parameters:**
- `month`: Required, 1-12
- `year`: Required, >= 2000

**Response (200 OK):**
```json
[
  {
    "categoryId": "c1e8400-e29b-41d4-a716-446655440001",
    "categoryName": "Groceries",
    "limitAmount": 500.00,
    "spentAmount": 425.50,
    "percentage": 85.1
  },
  {
    "categoryId": "c2e8400-e29b-41d4-a716-446655440002",
    "categoryName": "Transportation",
    "limitAmount": 200.00,
    "spentAmount": 150.00,
    "percentage": 75.0
  }
]
```

---

### 6. Insights (AI-Powered)

#### 6.1 Get Monthly Insights

```http
GET /api/insights/monthly?month=1&year=2025
Authorization: Bearer <token>
```

**Query Parameters:**
- `month`: Required, 1-12
- `year`: Required, 2000-2100

**Response (200 OK):**
```json
{
  "totalDebit": 1250.75,
  "totalCredit": 3000.00,
  "biggestCategory": "Groceries",
  "topCategories": [
    {
      "category": "Groceries",
      "total": 425.50
    },
    {
      "category": "Transportation",
      "total": 150.00
    }
  ],
  "anomalies": [
    {
      "date": "2025-01-15",
      "category": "Entertainment",
      "amount": 250.00,
      "score": 2.8
    }
  ],
  "forecast": [
    {
      "category": "Groceries",
      "nextMonthForecast": 440.00,
      "method": "moving_average"
    }
  ]
}
```

**Fields:**
- `totalDebit`: Total outgoing transactions for the month
- `totalCredit`: Total incoming transactions for the month
- `biggestCategory`: Category with highest spending
- `topCategories`: Top 5 categories by spending
- `anomalies`: Unusual transactions (Z-score > 2.0)
- `forecast`: Predicted spending for next month by category

---

### 7. Reports

#### 7.1 Generate Monthly PDF Report

```http
GET /api/reports/pdf?month=1&year=2025
Authorization: Bearer <token>
```

**Query Parameters:**
- `month`: Required, 1-12
- `year`: Required, 2000-2100

**Response (200 OK):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="finsmart_report_2025_01.pdf"`
- Binary PDF data

**Error Response (404 Not Found):**
Returns 404 if user has no transaction data for the specified month.

---

### 8. Health Check

#### 8.1 Backend Health

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "UP",
  "timestamp": "2025-01-16T10:30:00Z"
}
```

**Note:** This endpoint does NOT require authentication.

---

## Error Responses

### Standard Error Format

All error responses follow this structure:

```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/transactions"
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded, no response body |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but not authorized for resource |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

### Validation Errors

For validation failures (400/422), the response may include field-level details:

```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/transactions",
  "errors": {
    "amount": "must be greater than or equal to 0",
    "direction": "must be one of: DEBIT, CREDIT"
  }
}
```

---

## Rate Limiting

FinSmart implements rate limiting to prevent abuse:

- **Default limit**: 100 requests per minute per IP address
- **Authenticated users**: 500 requests per minute per user
- **Header**: `X-RateLimit-Remaining` shows remaining requests

**Response (429 Too Many Requests):**
```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "path": "/api/transactions"
}
```

---

## Security Features

### 1. JWT Authentication
- Tokens expire after 60 minutes (configurable)
- Tokens are signed with HMAC-SHA256
- Token validation on every protected endpoint

### 2. Password Security
- Passwords are hashed using BCrypt with 10 rounds
- Minimum password length: 8 characters
- Never transmitted in responses

### 3. CORS Protection
- Configurable allowed origins via `APP_FRONTEND_URL`
- Credentials allowed for authenticated requests
- Pre-flight request caching

### 4. SQL Injection Prevention
- All queries use JPA/Hibernate with parameterized statements
- Input validation on all endpoints

### 5. Audit Logging
- All CRUD operations are logged to `audit_events` table
- Includes: user ID, action, resource type, timestamp

---

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (0-indexed, default: 0)
- `size`: Items per page (default: 20, max: 100)
- `sort`: Sort field and direction (e.g., `postedAt,desc`)

**Example:**
```http
GET /api/transactions?page=1&size=50&sort=amount,desc
```

**Response includes pagination metadata:**
```json
{
  "content": [...],
  "page": 1,
  "size": 50,
  "totalElements": 150,
  "totalPages": 3
}
```

---

## Testing the API

### Using curl

```bash
# Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# List transactions (with token)
curl -X GET http://localhost:8081/api/transactions \
  -H "Authorization: Bearer <your-token>"
```

### Using Postman

1. Import the OpenAPI spec from this document
2. Set base URL to `http://localhost:8081`
3. Add Bearer token to Authorization tab
4. Test endpoints with provided examples

### Using HTTPie

```bash
# Login
http POST :8081/api/auth/login email=test@example.com password=password123

# List transactions
http GET :8081/api/transactions "Authorization: Bearer <token>"
```

---

## AI Service Integration

The backend integrates with a FastAPI AI service for insights:

**AI Service URL**: `http://127.0.0.1:8001` (configurable via `AI_URL`)

**Backend → AI Flow:**
1. Backend calls `/api/insights/monthly`
2. Backend fetches user transactions from database
3. Backend calls AI service at `http://127.0.0.1:8001/analyze`
4. AI service returns analysis (categories, anomalies, forecasts)
5. Backend formats and returns to client

**Direct AI Endpoints** (for advanced users):

```http
POST http://127.0.0.1:8001/analyze
Content-Type: application/json

{
  "transactions": [
    {"date": "2025-01-01", "amount": 100.5, "category": "Food"}
  ]
}
```

See [AI Service Documentation](../ai/README.md) for details.

---

## Database Schema

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete database schema documentation.

---

## Environment Variables Reference

### Backend (Spring Boot)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_URL` | Yes | - | PostgreSQL JDBC URL |
| `DB_USER` | Yes | - | Database username |
| `DB_PASSWORD` | Yes | - | Database password |
| `APP_JWT_SECRET` | Yes | - | JWT signing key (min 32 chars) |
| `APP_JWT_ISSUER` | No | `finsmart` | JWT issuer claim |
| `APP_JWT_EXPIRES_MINUTES` | No | `60` | Token expiration time |
| `APP_FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin |
| `AI_URL` | No | `http://127.0.0.1:8001` | AI service URL |
| `APP_PORT` | No | `8081` | Server port |

### Example .env file:

```bash
DB_URL=jdbc:postgresql://127.0.0.1:5432/finsmartdb
DB_USER=finsmart
DB_PASSWORD=your-secure-password
APP_JWT_SECRET=your-32-char-random-string-here-min
AI_URL=http://127.0.0.1:8001
APP_FRONTEND_URL=http://localhost:5173
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-16 | Initial API documentation |

---

## Support

For issues or questions:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [USER_GUIDE.md](./USER_GUIDE.md)
- See [ARCHITECTURE.md](./ARCHITECTURE.md)
