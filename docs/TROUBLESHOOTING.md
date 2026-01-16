# Troubleshooting Guide

Solutions to common issues when setting up and using FinSmart.

## Table of Contents

1. [Installation & Setup Issues](#installation--setup-issues)
2. [Database Connection Problems](#database-connection-problems)
3. [Backend API Issues](#backend-api-issues)
4. [Frontend Issues](#frontend-issues)
5. [AI Service Issues](#ai-service-issues)
6. [Authentication & Authorization](#authentication--authorization)
7. [Transaction & Data Issues](#transaction--data-issues)
8. [Performance Issues](#performance-issues)
9. [Build & Deployment Issues](#build--deployment-issues)
10. [Docker Issues](#docker-issues)

---

## Installation & Setup Issues

### Java Version Mismatch

**Symptom:** Backend won't start, error mentions Java version

**Solution:**
```powershell
# Check Java version
java -version

# Should show Java 17 or later
# If not, install Java 17+ from:
# - OpenJDK (Eclipse Temurin): https://adoptium.net/
# - Oracle: https://www.oracle.com/java/technologies/downloads/
```

**Alternative:** Use Maven wrapper (automatically uses correct Java version)
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Node.js Version Issues

**Symptom:** Frontend build fails with version errors

**Solution:**
```powershell
# Check Node.js version
node -v

# Should show v18.0.0 or later
# If not, install from: https://nodejs.org/

# Check npm version
npm -v

# Should show v9.0.0 or later
```

**Quick Fix:**
```powershell
# Update npm
npm install -g npm@latest
```

### Python Version Issues

**Symptom:** AI service won't start, syntax errors

**Solution:**
```powershell
# Check Python version
python --version

# Should show Python 3.11 or later
# If not, install from: https://www.python.org/downloads/

# Create virtual environment with specific version
python3.11 -m venv .venv
```

### Port Already in Use

**Symptom:** Error: "Port 8081 (or 5173, 8001) already in use"

**Solution:**

**Windows PowerShell:**
```powershell
# Find process using port 8081
netstat -ano | findstr :8081

# Kill process (use PID from previous command)
taskkill /PID <PID> /F

# Or use different port
# Backend: Edit application.properties or set APP_PORT=8082
# Frontend: npm run dev -- --port 3000
# AI: uvicorn app.main:app --port 8002
```

**Unix/Linux/macOS:**
```bash
# Find and kill process
lsof -ti:8081 | xargs kill -9

# Or use different port
export APP_PORT=8082
./mvnw spring-boot:run
```

### Missing Dependencies

**Symptom:** Import errors, module not found

**Solution:**

**Backend:**
```powershell
cd backend
.\mvnw.cmd clean install
```

**Frontend:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

**AI Service:**
```powershell
cd ai
.\.venv\Scripts\Activate.ps1
pip install --upgrade -r requirements.txt
```

---

## Database Connection Problems

### Cannot Connect to PostgreSQL

**Symptom:** Backend error: "Connection refused" or "Unknown database"

**Solution:**

1. **Verify PostgreSQL is running:**
   ```powershell
   # Windows: Check services
   Get-Service postgresql*
   
   # Or check if port 5432 is listening
   netstat -an | findstr :5432
   ```

2. **Create database if missing:**
   ```sql
   -- Connect to PostgreSQL
   psql -U postgres
   
   -- Create database
   CREATE DATABASE finsmartdb;
   
   -- Create user
   CREATE USER finsmart WITH PASSWORD 'your-password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE finsmartdb TO finsmart;
   ```

3. **Check environment variables:**
   ```powershell
   # Verify .env file exists
   Get-Content .env
   
   # Should contain:
   # DB_URL=jdbc:postgresql://127.0.0.1:5432/finsmartdb
   # DB_USER=finsmart
   # DB_PASSWORD=your-password
   ```

### Flyway Migration Errors

**Symptom:** "Flyway migration failed" or "Schema validation failed"

**Solution:**

**Option 1: Reset database (⚠️ destroys all data):**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Drop and recreate database
DROP DATABASE finsmartdb;
CREATE DATABASE finsmartdb;
GRANT ALL PRIVILEGES ON DATABASE finsmartdb TO finsmart;
```

**Option 2: Check migration status:**
```powershell
cd backend

# View Flyway status
.\mvnw.cmd flyway:info

# Repair Flyway schema history (if corrupted)
.\mvnw.cmd flyway:repair

# Force re-run migrations
.\mvnw.cmd flyway:clean flyway:migrate
```

**Option 3: Manual migration:**
```sql
-- Connect to database
psql -U finsmart -d finsmartdb

-- Check current schema version
SELECT * FROM flyway_schema_history;

-- Manually run missing migration
\i src/main/resources/db/migration/V1__init.sql
```

### Permission Denied

**Symptom:** "Permission denied for database" or "role does not exist"

**Solution:**
```sql
-- Connect as superuser
psql -U postgres

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE finsmartdb TO finsmart;

-- If role doesn't exist
CREATE USER finsmart WITH PASSWORD 'your-password';
ALTER USER finsmart WITH SUPERUSER;
```

### Connection Pool Exhausted

**Symptom:** "Unable to obtain JDBC connection" after some time

**Solution:**

Edit `backend/src/main/resources/application.properties`:
```properties
# Increase connection pool size
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

# Reduce connection timeout
spring.datasource.hikari.connection-timeout=30000
```

---

## Backend API Issues

### Backend Won't Start

**Symptom:** Backend crashes on startup

**Diagnosis:**
```powershell
cd backend

# Check for errors
.\mvnw.cmd spring-boot:run

# Look for:
# - Port conflicts
# - Database connection errors
# - Missing environment variables
# - Java version issues
```

**Common Fixes:**

1. **Check logs:**
   ```powershell
   # Look in backend/logs/ directory
   Get-Content logs/spring.log
   ```

2. **Verify environment:**
   ```powershell
   # Ensure .env file exists in root
   Test-Path ../.env
   
   # Check JWT secret is set
   Get-Content ../.env | Select-String JWT_SECRET
   ```

3. **Clear Maven cache:**
   ```powershell
   .\mvnw.cmd clean
   rm -rf target/
   .\mvnw.cmd install
   ```

### 401 Unauthorized on Protected Endpoints

**Symptom:** API returns 401 even with valid token

**Diagnosis:**
```powershell
# Test authentication
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use returned token
curl -X GET http://localhost:8081/api/accounts \
  -H "Authorization: Bearer <token>"
```

**Solution:**

1. **Check token expiry:**
   - Tokens expire after 60 minutes by default
   - Login again to get new token

2. **Verify JWT secret:**
   ```env
   # In .env file
   APP_JWT_SECRET=must-be-at-least-32-characters-long-string
   ```

3. **Check token format:**
   - Must be: `Bearer <token>` (note the space)
   - Token should not have extra quotes or spaces

### 500 Internal Server Error

**Symptom:** API returns 500 for some requests

**Diagnosis:**
```powershell
# Check backend logs
cd backend
Get-Content logs/spring.log | Select-String "ERROR"
```

**Common Causes:**

1. **Database constraint violation:**
   - Duplicate entries (email, category name)
   - Foreign key violations
   - Check validation logic

2. **Null pointer exceptions:**
   - Missing required fields
   - Relationships not properly loaded
   - Check entity mappings

3. **External service failure:**
   - AI service down
   - Network timeout
   - Check health endpoints

**Solution:**
```powershell
# View full stack trace
.\mvnw.cmd spring-boot:run

# Enable debug logging
# Edit application.properties:
# logging.level.com.finsmart=DEBUG
```

### CORS Errors

**Symptom:** Browser console shows "CORS policy blocked"

**Solution:**

Edit `.env` file:
```env
# Allow your frontend URL
APP_FRONTEND_URL=http://localhost:5173

# For production
APP_FRONTEND_URL=https://your-domain.com
```

Restart backend after changing CORS settings.

---

## Frontend Issues

### Frontend Won't Start

**Symptom:** `npm run dev` fails

**Solution:**
```powershell
cd frontend

# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install

# Try running again
npm run dev
```

### Blank Page / White Screen

**Symptom:** Browser shows blank page, no errors

**Diagnosis:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

**Solution:**

1. **Check API connection:**
   ```javascript
   // In browser console
   fetch('http://localhost:8081/api/health')
     .then(r => r.json())
     .then(console.log)
   ```

2. **Verify environment variables:**
   ```powershell
   # Create .env.development if missing
   cp .env.development.sample .env.development
   
   # Edit with correct URLs
   notepad .env.development
   ```

3. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E

### API Connection Refused

**Symptom:** Network errors, "Failed to fetch"

**Solution:**

1. **Verify backend is running:**
   ```powershell
   # Test backend health
   curl http://localhost:8081/api/health
   ```

2. **Check frontend environment:**
   ```bash
   # In frontend/.env.development
   VITE_API_BASE=http://localhost:8081
   ```

3. **Restart dev server:**
   ```powershell
   # Stop with Ctrl+C
   npm run dev
   ```

### Token Not Being Sent

**Symptom:** All API calls return 401 after login

**Diagnosis:**
```javascript
// In browser console, check auth store
localStorage.getItem('auth-storage')
sessionStorage.getItem('auth-storage')
```

**Solution:**

1. **Clear storage and re-login:**
   ```javascript
   // In browser console
   sessionStorage.clear()
   localStorage.clear()
   // Then login again
   ```

2. **Check network requests:**
   - Open DevTools → Network tab
   - Click on any API request
   - Check Headers → Request Headers
   - Should see: `Authorization: Bearer <token>`

### Build Errors

**Symptom:** `npm run build` fails

**Solution:**

1. **TypeScript errors:**
   ```powershell
   # Check for type errors
   npm run tsc --noEmit
   
   # Fix errors or temporarily disable
   # Edit tsconfig.json: "strict": false
   ```

2. **ESLint errors:**
   ```powershell
   # Check linting
   npm run lint
   
   # Auto-fix if possible
   npm run lint:fix
   ```

3. **Dependency issues:**
   ```powershell
   # Update dependencies
   npm update
   
   # Or reinstall
   Remove-Item -Recurse -Force node_modules, package-lock.json
   npm install
   ```

---

## AI Service Issues

### AI Service Won't Start

**Symptom:** `uvicorn app.main:app` fails

**Solution:**

1. **Check Python version:**
   ```powershell
   python --version  # Must be 3.11+
   ```

2. **Activate virtual environment:**
   ```powershell
   cd ai
   .\.venv\Scripts\Activate.ps1
   
   # If activation fails
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Check for port conflicts:**
   ```powershell
   netstat -ano | findstr :8001
   # Kill process or use different port
   uvicorn app.main:app --port 8002
   ```

### AI Service Returns 500 Errors

**Symptom:** Insights fail with server error

**Diagnosis:**
```powershell
# Check AI service logs
# Look at terminal where uvicorn is running
# Error will be printed to stdout
```

**Solution:**

1. **Verify request format:**
   ```bash
   curl -X POST http://localhost:8001/analyze \
     -H "Content-Type: application/json" \
     -d '{
       "transactions": [
         {"date": "2025-01-01", "amount": 100, "category": "Food"}
       ]
     }'
   ```

2. **Check validation errors:**
   - Amount must be >= 0
   - Date must be string
   - Category must be non-empty
   - Transactions must be array with ≥1 item

### AI Service Health Check Fails

**Symptom:** Dashboard shows "AI Service: DOWN"

**Solution:**

1. **Verify service is running:**
   ```powershell
   curl http://127.0.0.1:8001/health
   
   # Should return: {"status": "ai ok"}
   ```

2. **Check CORS settings:**
   ```python
   # In ai/app/config.py
   CORS_ORIGINS=["http://localhost:5173"]
   ```

3. **Restart service:**
   ```powershell
   # Stop with Ctrl+C
   cd ai
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload --port 8001
   ```

---

## Authentication & Authorization

### Can't Login

**Symptom:** Login fails with "Invalid credentials"

**Solution:**

1. **Verify credentials:**
   - Check email spelling
   - Check password (case-sensitive)
   - Ensure account exists (try registering)

2. **Check database:**
   ```sql
   -- Connect to database
   psql -U finsmart -d finsmartdb
   
   -- Check user exists
   SELECT email, full_name FROM users WHERE email = 'your@email.com';
   ```

3. **Reset password (if needed):**
   ```sql
   -- Generate new hash using BCrypt with 10 rounds
   -- Use online tool: https://bcrypt-generator.com/
   UPDATE users 
   SET password_hash = '$2a$10$...' 
   WHERE email = 'your@email.com';
   ```

### Can't Register New User

**Symptom:** Registration fails with "Email already registered"

**Solution:**

1. **Check if email exists:**
   ```sql
   SELECT * FROM users WHERE email = 'your@email.com';
   ```

2. **Use different email** or **delete old account:**
   ```sql
   DELETE FROM users WHERE email = 'your@email.com';
   ```

### Token Expired

**Symptom:** "Invalid or expired token" after some time

**Solution:**

Tokens expire after 60 minutes. You must login again:
1. Click "Logout"
2. Click "Login"
3. Enter credentials

**To extend token lifetime:**
```env
# In .env file
APP_JWT_EXPIRES_MINUTES=120  # 2 hours
```

### Unauthorized After Login

**Symptom:** Login succeeds but all requests return 401

**Solution:**

1. **Check browser storage:**
   ```javascript
   // In browser console
   console.log(sessionStorage.getItem('auth-storage'))
   ```

2. **Check HTTP client:**
   - Verify token is injected into headers
   - Check `src/api/http.ts` for auth logic

3. **Re-login:**
   - Logout completely
   - Clear browser cache
   - Login again

---

## Transaction & Data Issues

### Transactions Not Showing

**Symptom:** Empty transaction list

**Solution:**

1. **Check database:**
   ```sql
   SELECT COUNT(*) FROM transactions WHERE account_id IN (
     SELECT id FROM accounts WHERE user_id = '<your-user-id>'
   );
   ```

2. **Check filters:**
   - Clear all filters
   - Check date range includes transactions
   - Verify account/category selection

3. **Check pagination:**
   - Go to page 0 (first page)
   - Increase page size

### Budget Not Updating

**Symptom:** Budget shows 0% spent even with transactions

**Solution:**

1. **Verify transactions are categorized:**
   ```sql
   SELECT COUNT(*) 
   FROM transactions t
   JOIN accounts a ON t.account_id = a.id
   WHERE a.user_id = '<user-id>'
   AND t.category_id IS NOT NULL;
   ```

2. **Check budget month/year:**
   - Ensure budget month matches transaction dates
   - Budget calculates for exact month

3. **Verify category match:**
   - Budget category must match transaction category
   - Check for typos in category names

### Duplicate Transactions

**Symptom:** Same transaction appears multiple times

**Solution:**

1. **Manually delete duplicates:**
   - Go to Transactions page
   - Click "Delete" on duplicate entries

2. **Query database:**
   ```sql
   -- Find potential duplicates
   SELECT posted_at, amount, description, COUNT(*)
   FROM transactions
   GROUP BY posted_at, amount, description
   HAVING COUNT(*) > 1;
   ```

3. **Prevent future duplicates:**
   - Check CSV import for duplicates before importing
   - Use unique transaction IDs if available

---

## Performance Issues

### Slow Page Loads

**Symptom:** Pages take several seconds to load

**Solution:**

1. **Check backend performance:**
   ```powershell
   # Enable performance logging
   # In application.properties:
   # logging.level.org.hibernate.SQL=DEBUG
   # logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
   ```

2. **Optimize database:**
   ```sql
   -- Analyze tables
   ANALYZE transactions;
   ANALYZE accounts;
   ANALYZE budgets;
   
   -- Vacuum to reclaim space
   VACUUM FULL;
   ```

3. **Clear browser cache:**
   - Hard refresh: Ctrl+F5
   - Clear cache: Ctrl+Shift+Delete

### PDF Report Takes Too Long

**Symptom:** PDF generation times out

**Solution:**

1. **Reduce data size:**
   - Generate report for single month (not year)
   - Limit transaction count

2. **Increase timeout:**
   ```properties
   # In application.properties
   spring.mvc.async.request-timeout=60000  # 60 seconds
   ```

3. **Check AI service:**
   - Ensure AI service is running
   - AI service must respond quickly for insights

### High Memory Usage

**Symptom:** Backend crashes with OutOfMemoryError

**Solution:**

1. **Increase JVM heap:**
   ```bash
   # Set JAVA_OPTS environment variable
   export JAVA_OPTS="-Xms512m -Xmx2048m"
   ./mvnw spring-boot:run
   ```

2. **Optimize queries:**
   - Use pagination for large lists
   - Add database indexes
   - Limit date ranges in queries

---

## Build & Deployment Issues

### Maven Build Fails

**Symptom:** `mvnw clean install` fails

**Solution:**

1. **Check Java version:**
   ```powershell
   java -version  # Must be 17+
   ```

2. **Clear Maven cache:**
   ```powershell
   rm -rf ~/.m2/repository
   .\mvnw.cmd clean install
   ```

3. **Skip tests if needed:**
   ```powershell
   .\mvnw.cmd clean install -DskipTests
   ```

4. **Check for syntax errors:**
   - Review error message for file and line number
   - Fix Java compilation errors

### Frontend Build Fails

**Symptom:** `npm run build` fails

**Solution:**

1. **Fix TypeScript errors:**
   ```powershell
   npm run lint
   # Fix all reported errors
   ```

2. **Update dependencies:**
   ```powershell
   npm update
   ```

3. **Check for missing files:**
   - Verify all imports point to existing files
   - Check for typos in file paths

### Production Deployment Issues

**Symptom:** App works locally but not in production

**Solution:**

1. **Check environment variables:**
   ```bash
   # In .env.production
   DB_URL=jdbc:postgresql://production-db:5432/finsmartdb?sslmode=require
   APP_JWT_SECRET=<secure-secret-32-chars>
   APP_FRONTEND_URL=https://your-domain.com
   ```

2. **Verify database connectivity:**
   ```bash
   # Test from production server
   psql $DB_URL -c "SELECT 1"
   ```

3. **Check firewall rules:**
   - Port 80 and 443 open for web traffic
   - Database port accessible from application server
   - AI service accessible from backend

4. **Review logs:**
   ```bash
   # Docker logs
   docker compose -f docker-compose.prod.yml logs -f
   
   # Specific service
   docker compose -f docker-compose.prod.yml logs backend
   ```

---

## Docker Issues

### Docker Container Won't Start

**Symptom:** `docker compose up` fails

**Solution:**

1. **Check Docker daemon:**
   ```powershell
   docker --version
   docker ps
   ```

2. **View logs:**
   ```powershell
   docker compose logs
   docker compose logs backend
   ```

3. **Rebuild images:**
   ```powershell
   docker compose down
   docker compose build --no-cache
   docker compose up
   ```

### Container Exits Immediately

**Symptom:** Container starts then stops

**Solution:**

1. **Check environment variables:**
   ```powershell
   # View container env
   docker compose config
   ```

2. **Verify Dockerfile:**
   - Check ENTRYPOINT and CMD
   - Ensure base image is correct

3. **Run interactively:**
   ```powershell
   docker compose run backend /bin/bash
   # Manually run application to see errors
   ```

### Cannot Connect Between Containers

**Symptom:** Backend can't reach database or AI service

**Solution:**

1. **Use service names as hostnames:**
   ```yaml
   # In docker-compose.yml
   services:
     backend:
       environment:
         - DB_URL=jdbc:postgresql://db:5432/finsmartdb
         - AI_URL=http://ai:8001
   ```

2. **Check network:**
   ```powershell
   docker network ls
   docker network inspect finsmart_default
   ```

3. **Verify containers are on same network:**
   ```powershell
   docker compose ps
   # All should be in same network
   ```

### Volume Permission Issues

**Symptom:** "Permission denied" in container

**Solution:**

1. **Check volume mounts:**
   ```yaml
   # In docker-compose.yml
   volumes:
     - ./data:/app/data
   ```

2. **Fix permissions:**
   ```bash
   # Linux/macOS
   sudo chown -R 1000:1000 ./data
   
   # Or run container as root
   user: root
   ```

---

## Getting More Help

### Collecting Debug Information

When reporting issues, include:

1. **Version information:**
   ```powershell
   # Backend
   cd backend
   .\mvnw.cmd --version
   java -version
   
   # Frontend
   cd frontend
   node -v
   npm -v
   
   # AI
   cd ai
   python --version
   pip list
   ```

2. **Error messages:**
   - Full stack trace from logs
   - Browser console errors (F12)
   - Network errors from DevTools

3. **Environment:**
   - Operating system
   - Docker version (if using Docker)
   - Database version

4. **Steps to reproduce:**
   - What were you trying to do?
   - What happened instead?
   - Can you reproduce it consistently?

### Log Locations

- **Backend**: `backend/logs/spring.log`
- **Frontend**: Browser DevTools Console (F12)
- **AI Service**: Terminal stdout where uvicorn is running
- **Database**: PostgreSQL logs (location varies by OS)
- **Docker**: `docker compose logs`

### Useful Commands

```powershell
# Check all services
curl http://localhost:8081/api/health  # Backend
curl http://localhost:8001/health      # AI
curl http://localhost:5173            # Frontend

# Database connection test
psql -U finsmart -d finsmartdb -c "SELECT 1"

# View running processes
netstat -ano | findstr "8081 5173 8001"

# Docker status
docker compose ps
docker compose logs --tail=100
```

---

## Still Having Issues?

1. Check [GitHub Issues](https://github.com/Nakka-Johnson/finsmart/issues) for similar problems
2. Review [Architecture Documentation](./ARCHITECTURE.md) for system design
3. Consult [API Reference](./API_REFERENCE.md) for endpoint details
4. Read [User Guide](./USER_GUIDE.md) for feature walkthroughs

**Remember:** Most issues are related to environment setup, database connectivity, or missing configuration. Double-check your `.env` files and service status first!
