# FinSmart Backend

Spring Boot 3 REST API for personal finance management.

## Tech Stack

- **Java:** 17
- **Framework:** Spring Boot 3.4.0
- **Database:** PostgreSQL 15+ with Flyway migrations
- **Security:** JWT Bearer token authentication
- **ORM:** JPA/Hibernate
- **Validation:** Jakarta Bean Validation
- **Mapping:** MapStruct 1.6.3
- **Build:** Maven 3.9+

## Quick Start

### Prerequisites

- Java 17+
- Maven 3.9+ (or use included `mvnw` wrapper)
- PostgreSQL 15+ running on localhost:5432
- Database `finsmartdb` created with user `finsmart`

### Development Mode

```powershell
# Clone and navigate to backend
cd backend

# Run with dev profile (skips tests)
.\mvnw.cmd spring-boot:run -Pdev

# Or run tests first
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run
```

Application starts on port **8081** by default.

### Environment Variables

Configure via environment or `.env` file in project root:

```env
# Database
DB_URL=jdbc:postgresql://127.0.0.1:5432/finsmartdb?sslmode=disable
DB_USER=finsmart
DB_PASSWORD=your-secure-password

# JWT Security
APP_JWT_SECRET=change-this-to-a-secure-random-string-min-32-chars
APP_JWT_ISSUER=finsmart
APP_JWT_EXPIRES_MINUTES=60

# External Services
AI_URL=http://127.0.0.1:8001

# Server
APP_PORT=8081
```

**⚠️ Never commit secrets!** Use `.env.example` as template.

## Architecture

### Package Structure

```
com.finsmart
├── config/             # Application configuration
│   ├── CorsConfig
│   ├── DataSourceDiagnosticsConfig
│   ├── MapStructConfig
│   └── RestTemplateConfig
├── security/           # Security & JWT
│   ├── SecurityConfig
│   ├── JwtAuthFilter
│   ├── JwtUtil
│   └── UserDetailsServiceImpl
├── domain/
│   ├── entity/         # JPA entities
│   ├── enums/          # Business enums
│   └── repo/           # Spring Data repositories
├── service/            # Business logic
├── web/
│   ├── controller/     # REST controllers
│   ├── dto/            # Request/Response DTOs
│   ├── mapper/         # MapStruct mappers
│   └── error/          # Exception handlers
└── FinsmartApplication # Main entry point
```

### Database Migrations

Flyway manages schema versions in `src/main/resources/db/migration/`:

- **V1__init.sql** - Initial schema (users, categories, accounts, transactions, budgets)
- **V2__seed.sql** - Seed data
- **V4__add_balance_to_accounts.sql** - Account balance tracking

Migrations run automatically on startup.

## Authentication Flow

### 1. Register New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "email": "user@example.com"
}
```

### 3. Access Protected Endpoints

Include JWT token in Authorization header:

```http
GET /api/accounts
Authorization: Bearer eyJhbGc...
```

### 4. Get Current User

```http
GET /api/auth/me
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

## Core API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Protected Endpoints (require JWT)

#### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `GET /api/categories/{id}` - Get category by ID

#### Accounts
- `GET /api/accounts` - List user's accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/{id}` - Get account by ID
- `DELETE /api/accounts/{id}` - Delete account

#### Transactions
- `GET /api/transactions?page=0&size=10` - List transactions (paginated)
  - Query params: `accountId`, `categoryId`, `direction`, `minAmount`, `maxAmount`, `startDate`, `endDate`, `page`, `size`, `sort`
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/{id}` - Get transaction by ID
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

#### Budgets
- `GET /api/budgets` - List user's budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/{id}` - Get budget by ID
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget
- `GET /api/budgets/summary?year=2025&month=11` - Get budget summary with spending

## Monthly Insights & Reports

The backend integrates with the AI service to provide rich spending insights and generates PDF reports.

### Endpoints

#### Get Monthly Insights

```http
GET /api/insights/monthly?month=11&year=2025
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "month": 11,
  "year": 2025,
  "totalDebit": 2500.00,
  "totalCredit": 5000.00,
  "biggestCategory": "Groceries",
  "topCategories": [
    {
      "category": "Groceries",
      "total": 800.00
    },
    {
      "category": "Transport",
      "total": 450.00
    }
  ],
  "anomalies": [
    {
      "date": "2025-11-15",
      "amount": 1500.00,
      "category": "Entertainment",
      "score": 2.5
    }
  ],
  "forecast": [
    {
      "category": "Groceries",
      "nextMonthForecast": 820.00,
      "method": "SMA3"
    }
  ]
}
```

#### Download Monthly PDF Report

```http
GET /api/reports/pdf?month=11&year=2025
Authorization: Bearer eyJhbGc...
```

**Response (200):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="FinSmart_Report_John_Doe_2025-11.pdf"`
- PDF file stream

**Response (404):** No data for the specified month

### Insights Features

- **Summary**: Total debit/credit, biggest spending category, top 5 categories
- **Anomaly Detection**: Z-score based anomaly detection (|z| >= 2)
- **Forecast**: Next month spending predictions using 3-month moving average
- **PDF Export**: Professionally formatted A4 PDF report with all insights

### AI Service Integration

The backend calls the AI service at `http://127.0.0.1:8001` (configurable via `AI_URL` env var):
- `POST /analyze` - Spending summary
- `POST /anomalies` - Anomaly detection
- `POST /forecast` - Spending forecast

### Scheduled Jobs

**Monthly Summary Job**: Runs at 02:00 on the 1st of each month
- Computes previous month insights for all users
- Logs summary totals and biggest category per user
- Cron: `0 0 2 1 * *`

### Sample Curl Commands

**Get insights:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8081/api/insights/monthly?month=11&year=2025"
```

**Download PDF:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8081/api/reports/pdf?month=11&year=2025" \
  --output report.pdf
```

## Error Response Format

All API errors follow this consistent format:

```json
{
  "timestamp": "2025-11-05T10:30:00Z",
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid request parameters",
  "path": "/api/accounts",
  "details": {
    "name": "must not be blank",
    "accountType": "must not be null"
  }
}
```

### HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors, malformed JSON)
- **401** - Unauthorized (missing/invalid JWT)
- **403** - Forbidden (access denied)
- **404** - Not Found (entity doesn't exist)
- **409** - Conflict (duplicate resource)
- **500** - Internal Server Error
- **502** - Bad Gateway (external service error)

## Code Formatting

This project uses **Spotless** with Google Java Format.

### Format Code

```powershell
# Format all Java files
.\mvnw.cmd spotless:apply

# Check formatting without applying
.\mvnw.cmd spotless:check
```

Formatting runs automatically during Maven `validate` phase.

### IDE Setup

**IntelliJ IDEA:**
1. Install "google-java-format" plugin
2. Enable: Settings → Other Settings → google-java-format Settings → Enable
3. Set code style to "GOOGLE" in Settings → Editor → Code Style → Java

**VS Code:**
1. Install "Language Support for Java" extension
2. Configure formatter in settings.json:
```json
{
  "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml"
}
```

## Testing

```powershell
# Run all tests
.\mvnw.cmd test

# Run with coverage
.\mvnw.cmd verify

# Skip tests
.\mvnw.cmd install -DskipTests
```

### Test Structure

- **Unit tests:** `src/test/java/.../service/` - Service layer logic
- **Integration tests:** `src/test/java/.../controller/` - Full API flow with Testcontainers

## Production Security

The backend implements comprehensive security hardening for production deployment:

### Security Headers

All responses include the following security headers:
- **Content-Security-Policy:** `default-src 'self'` - Prevents XSS attacks
- **X-Content-Type-Options:** `nosniff` - Prevents MIME-sniffing attacks
- **X-Frame-Options:** `DENY` - Prevents clickjacking
- **X-XSS-Protection:** `1; mode=block` - Browser XSS protection
- **Referrer-Policy:** `no-referrer` - Prevents referrer leakage

### CORS Configuration

CORS is configured to allow requests from the frontend only:
- **Allowed Origin:** Configurable via `APP_FRONTEND_URL` (default: `http://localhost:5173`)
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** All headers permitted
- **Credentials:** Supported for cookie-based sessions
- **Max Age:** 3600 seconds

### Rate Limiting

Protects against abuse and DDoS attacks using Bucket4j:
- **General Endpoints:** 100 requests per minute per IP address
- **Login Endpoint:** 10 requests per minute per IP address (stricter to prevent brute force)
- **IP Detection:** X-Forwarded-For header aware for proxy environments
- **Response:** Returns `429 Too Many Requests` with JSON error body when limit exceeded

### Audit Logging

All API requests are logged to the database for compliance and security monitoring:
- **Logged Data:** User email, HTTP method, path, status code, IP address, user agent, timestamp
- **Async Processing:** Non-blocking operation using CompletableFuture
- **Storage:** PostgreSQL `audit_events` table with indexed queries
- **Privacy:** Authorization headers are redacted

### Input Validation

Comprehensive validation on all endpoints:
- **Bean Validation:** Jakarta Bean Validation annotations on DTOs
- **Field-Level Errors:** Detailed validation error responses with field names
- **JSON Error Format:** Consistent error response structure
- **Status Codes:** Proper HTTP status codes for all error types

### Request Size Limits

Protection against memory exhaustion attacks:
- **Form POST:** 2MB maximum
- **Multipart File Upload:** 2MB per file, 5MB total request
- **Timeout:** RestTemplate with 2s connect timeout, 5s read timeout

### Actuator Security

Spring Boot Actuator endpoints are secured and minimally exposed:
- **Public Endpoints:** `/actuator/health`, `/actuator/info`
- **Admin Endpoints:** All other actuator endpoints require `ROLE_ADMIN`
- **Health Details:** Shown only to authenticated users
- **Info Properties:** App name and version from Maven POM

### HTTP Request/Response Logging

Logbook integration for detailed HTTP logging:
- **Scope:** All requests except `/actuator/**`
- **Redaction:** Authorization, X-Auth-Token headers redacted
- **Body Redaction:** Password and token fields in JSON bodies
- **Format:** Structured JSON logging for easy parsing

### Environment Variables

Additional security-related environment variables:

```env
# Frontend CORS Configuration
APP_FRONTEND_URL=http://localhost:5173

# JWT Security (Required for production)
APP_JWT_SECRET=your-secure-random-string-min-32-chars
APP_JWT_ISSUER=finsmart
APP_JWT_EXPIRES_MINUTES=60
```

### Database Migration

**V5__create_audit_events.sql** adds the audit logging table:
- UUID primary key
- Indexed user_email and created_at columns for efficient queries
- Stores all API request metadata

### Security Best Practices

1. **JWT Secret:** Always use a strong, random secret (32+ characters) in production
2. **Database Credentials:** Use strong passwords and restrict database access
3. **HTTPS:** Always deploy behind HTTPS in production (Logbook supports HTTPS)
4. **Environment Variables:** Never commit secrets to version control
5. **Rate Limits:** Adjust limits based on your traffic patterns
6. **Audit Logs:** Regularly review audit logs for suspicious activity
7. **Updates:** Keep dependencies updated for security patches

## Production Deployment

```powershell
# Build JAR
.\mvnw.cmd clean package

# Run JAR
java -jar target/finsmart-0.0.1-SNAPSHOT.jar

# With custom port
java -jar -Dserver.port=8082 target/finsmart-0.0.1-SNAPSHOT.jar
```

## Troubleshooting

### Port Already in Use

```powershell
# Find process on port 8081
Get-NetTCPConnection -LocalPort 8081 | Select-Object OwningProcess

# Kill process
Stop-Process -Id <PID> -Force
```

### Database Connection Failed

1. Verify PostgreSQL is running
2. Check database exists: `psql -U postgres -c "\l"`
3. Create if missing: `CREATE DATABASE finsmartdb;`
4. Verify credentials in `application.yml` or environment variables

### Flyway Migration Errors

```powershell
# Repair Flyway schema history
.\mvnw.cmd flyway:repair

# Check migration status
.\mvnw.cmd flyway:info
```

## Contributing

1. Format code before commit: `.\mvnw.cmd spotless:apply`
2. Run tests: `.\mvnw.cmd test`
3. Follow conventional commit style
4. Keep PRs focused on single feature/fix

## License

Proprietary - All rights reserved
