# Phase 3 Smoke Test

Comprehensive smoke test for FinSmart Phase 3 (Authentication + Core APIs).

## Prerequisites

- **PowerShell 7.0+** (pwsh)
- **Backend running** on `http://localhost:8080`
- **AI service running** on `http://127.0.0.1:8001`
- **PostgreSQL database** initialized with migrations

## How to Run

```powershell
# Set execution policy (first time only)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Run the smoke test
pwsh -File .\scripts\phase3_smoke.ps1
```

## What It Tests

### 1. **Health Checks**
- ✅ Backend API health endpoint (`/api/health`)
- ✅ AI service health endpoint (`/health`)

### 2. **Authentication Flow**
- ✅ User registration (`POST /api/auth/register`)
- ✅ User login (`POST /api/auth/login`)
- ✅ Token validation (`GET /api/auth/me`)
- ✅ JWT token acquisition and usage

### 3. **Categories API**
- ✅ List all categories (`GET /api/categories`)
- ✅ Create category if not exists (`POST /api/categories`)
- ✅ Retrieve category by name
- ✅ Duplicate handling (409 conflicts)

### 4. **Accounts API**
- ✅ Create account (`POST /api/accounts`)
- ✅ Account with balance tracking
- ✅ Duplicate account handling
- ✅ List accounts (`GET /api/accounts`)

### 5. **Transactions API**
- ✅ Create DEBIT transaction (`POST /api/transactions`)
- ✅ Create CREDIT transaction (`POST /api/transactions`)
- ✅ Balance updates on transaction creation
- ✅ Paginated transaction list (`GET /api/transactions?page=0&size=10`)
- ✅ Filter by account, sort by date
- ✅ Transaction with category association

### 6. **Budgets API**
- ✅ Create monthly budget (`POST /api/budgets`)
- ✅ Budget summary endpoint (`GET /api/budgets/summary?month=X&year=Y`)
- ✅ Spent amount calculation
- ✅ Percentage used calculation
- ✅ Duplicate budget handling

## Features

- **Idempotent**: Safe to run multiple times without side effects
- **Fail-fast**: Stops on first error with clear diagnostics
- **Colored output**: Green ✅ for success, Red ❌ for failures, Cyan for steps
- **Comprehensive error messages**: Shows endpoint, HTTP status, and response body
- **Final summary**: Reports on all created resources and their states

## Test User

The script uses a consistent test user:
- **Email**: `john@example.com`
- **Password**: `SuperSecret123!`
- **Full Name**: John Doe

This user is created on first run and reused on subsequent runs.

## Expected Output

```
═══════════════════════════════════════════════════════════
  FinSmart Phase 3 Smoke Test
═══════════════════════════════════════════════════════════

🔷 Step 1: Health Checks
✅ Backend health: OK
✅ AI service health: OK

🔷 Step 2: Authentication
✅ Login successful (token acquired)
✅ Token validation: OK (user=john@example.com)

🔷 Step 3: Categories
✅ Categories list: 1 found
✅ Groceries category: <uuid>

🔷 Step 4: Accounts
✅ Account ID: <uuid> (balance: £1154.80)

🔷 Step 5: Transactions
✅ Transaction 1 (DEBIT): £45.20 - Tesco
✅ Transaction 2 (CREDIT): £1200.00 - Salary

🔷 Step 6: Transactions List (Paginated)
✅ Transactions list: 2 items (page 1/1)

🔷 Step 7: Budgets + Summary
✅ Budget summary retrieved
  📊 Groceries: Spent £45.20 / £200.00 (22.6%)

═══════════════════════════════════════════════════════════
  ✅ Phase 3 Smoke Test: ALL PASSED
═══════════════════════════════════════════════════════════

🎉 All core APIs are operational!
```

## Troubleshooting

### Backend not running
```
❌ Backend is not running on http://localhost:8080
```
**Solution**: Start the backend with `mvnw spring-boot:run`

### AI service not running
```
❌ AI service is not running on http://127.0.0.1:8001
```
**Solution**: Start the AI service with `uvicorn app:app --host 127.0.0.1 --port 8001`

### Port already in use
If the backend fails to start because port 8080 or 8081 is already in use:
```powershell
# Find the process using the port
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess
# Kill it
Stop-Process -Id <PID> -Force
```

### Database connection issues
Ensure PostgreSQL is running and the `finsmartdb` database exists:
```sql
psql -U postgres -c "\l" | findstr finsmartdb
```

## Exit Codes

- **0**: All tests passed ✅
- **1**: One or more tests failed ❌

## Notes

- The script uses `Set-StrictMode -Version Latest` for robust error handling
- All HTTP errors include the endpoint, status code, and response body
- Transactions are posted with specific dates (2025-11-01, 2025-11-02) for consistency
- Budget summary uses the current month/year dynamically
