# FinSmart

Personal finance management platform with AI-powered insights.

## Project Layout

```
finsmart/
├── backend/          # Spring Boot 3 REST API (Java 21, Maven)
├── frontend/         # Vite + React + TypeScript UI
├── ai/               # FastAPI ML service (Python 3.11+)
├── infra/            # Infrastructure as code
├── scripts/          # Automation scripts
└── docs/             # Documentation
```

## Prerequisites

- **Java**: 21+
- **Maven**: 3.9+
- **Node.js**: 18+ (LTS)
- **Python**: 3.11+
- **PostgreSQL**: 15+
- **Docker Desktop**: Latest (optional)

See `.tool-versions.txt` for verified versions.

## Quick Start (4 Terminals)

### Terminal 1: PostgreSQL
```powershell
# Start PostgreSQL (if not already running as service)
# Ensure database 'finsmartdb' exists with user 'finsmart'
```

### Terminal 2: AI Service
```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Terminal 3: Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
# Runs on http://localhost:8081
```

### Terminal 4: Frontend
```powershell
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Automation Scripts

Located in `scripts/` directory:

### format_all.ps1
Formats all code (Java, TypeScript, Python):
```powershell
.\scripts\format_all.ps1
```

### test_all.ps1
Runs all unit tests across services:
```powershell
.\scripts\test_all.ps1
```

### phase3_smoke.ps1
Smoke tests for Phase 3 APIs (Insights, Reports):
```powershell
.\scripts\phase3_smoke.ps1
```

See [scripts/README.md](scripts/README.md) for more details.

## Environment & Secrets

### ⚠️ Never Commit Secrets

All `.env` files with real credentials are gitignored. Use template files:

- ✅ `.env.example` - Root environment template
- ✅ `.env.production.example` - Production deployment template
- ✅ `frontend/.env.development.sample` - Frontend development template
- ✅ `ai/.env.sample` - AI service template

### Setup Local Environment

```powershell
# Copy templates
cp .env.example .env
cp frontend/.env.development.sample frontend/.env.development

# Edit with your local values
notepad .env
notepad frontend\.env.development
```

### Generate Strong Secrets

```powershell
# PowerShell: Generate 32-character random string for JWT
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use OpenSSL (Git Bash on Windows)
openssl rand -base64 32
```

## Development Conventions

### Branch Naming
- `feature/short-description` - New features
- `fix/issue-description` - Bug fixes
- `chore/task-name` - Maintenance tasks
- `docs/update-name` - Documentation updates

### Commit Style
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add user authentication
fix: resolve null pointer in transaction service
chore: update dependencies
docs: improve README quick start
```

### Code Formatting

**Format all code:**
```powershell
.\scripts\format_all.ps1
```

**Backend only (Spotless):**
```powershell
cd backend
.\mvnw.cmd spotless:apply
```

**Frontend only (Prettier + ESLint):**
```powershell
cd frontend
npm run format
npm run lint
```

### Testing

**Run all tests:**
```powershell
.\scripts\test_all.ps1
```

**Backend tests:**
```powershell
cd backend
.\mvnw.cmd test
```

**Smoke test (Phase 3 APIs):**
```powershell
.\scripts\phase3_smoke.ps1
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Backend
APP_JWT_SECRET=your-secret-key-here
DB_URL=jdbc:postgresql://127.0.0.1:5432/finsmartdb
DB_USER=finsmart
DB_PASSWORD=your-password

# Services
AI_URL=http://127.0.0.1:8001
FRONTEND_URL=http://localhost:5173
```

## Architecture

- **Backend**: RESTful API with JWT authentication, JPA/Hibernate ORM
- **Frontend**: SPA with React Router, TanStack Query, Zustand
- **AI**: FastAPI service for ML predictions and insights
- **Database**: PostgreSQL with Flyway migrations

## API Documentation

Backend API runs on port 8081:
- Health: `GET /api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Categories: `GET /api/categories`, `POST /api/categories`
- Accounts: `GET /api/accounts`, `POST /api/accounts`
- Transactions: `GET /api/transactions`, `POST /api/transactions`
- Budgets: `GET /api/budgets`, `GET /api/budgets/summary`
- Insights: `GET /api/insights/monthly?month=11&year=2025`
- Reports: `GET /api/reports/pdf?month=11&year=2025`

## Production Deployment

### Overview

Production deployment uses Docker containers with:
- **Backend**: Spring Boot 3 (Java 21) in JRE container
- **Frontend**: Static React build served by Nginx
- **AI**: FastAPI service with Uvicorn
- **Reverse Proxy**: Caddy 2 for automatic HTTPS and routing

### Prerequisites

- Docker & Docker Compose
- Domain name (for automatic TLS)
- Managed PostgreSQL database (RDS, Azure Database, etc.)
- Minimum 2GB RAM, 2 CPU cores

### Quick Deploy

1. **Configure environment variables:**
   ```powershell
   # Copy example file
   cp .env.production.example .env.production
   
   # Edit with your values (database, JWT secret, domain)
   notepad .env.production
   ```

2. **Update Caddyfile with your domain:**
   ```powershell
   # Edit caddy/Caddyfile
   # Replace 'your-domain.com' with your actual domain
   # Replace 'your-email@example.com' with your email
   ```

3. **Build Docker images:**
   ```powershell
   docker compose -f docker-compose.prod.yml build
   ```

4. **Run services:**
   ```powershell
   docker compose -f docker-compose.prod.yml up -d
   ```

5. **Check status:**
   ```powershell
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs -f
   ```

### Environment Variables (.env.production)

**Required:**
```env
# Database (use managed service like RDS)
DB_URL=jdbc:postgresql://your-rds.region.rds.amazonaws.com:5432/finsmartdb?sslmode=require
DB_USER=finsmart
DB_PASSWORD=strong-password-here

# JWT Security (generate with: openssl rand -base64 32)
APP_JWT_SECRET=your-32-char-random-string

# Domain & CORS
APP_FRONTEND_URL=https://your-domain.com
DOMAIN=your-domain.com

# Email for Let's Encrypt notifications
CADDY_EMAIL=your-email@example.com
```

**Optional:**
```env
# JVM tuning
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC

# JWT expiration
APP_JWT_EXPIRES_MINUTES=60

# Spring profile
SPRING_PROFILES_ACTIVE=prod
```

### TLS/HTTPS Configuration

#### Automatic TLS (Let's Encrypt)

Caddy automatically provisions TLS certificates when:
1. Your domain DNS points to the server's public IP
2. Ports 80 and 443 are accessible from the internet
3. The domain is specified in `Caddyfile`

**First deployment:**
```powershell
# Caddy will automatically:
# 1. Request certificates from Let's Encrypt
# 2. Verify domain ownership via HTTP challenge
# 3. Install and auto-renew certificates
```

#### Development/Staging (HTTP Only)

For testing without a domain, edit `caddy/Caddyfile`:
```caddyfile
# Comment out the HTTPS block, uncomment HTTP-only:
:80 {
  encode gzip zstd
  
  handle_path /api/* {
    reverse_proxy backend:8080
  }
  
  handle {
    reverse_proxy frontend:80
  }
}
```

Then restart:
```powershell
docker compose -f docker-compose.prod.yml restart caddy
```

### Service Architecture

```
Internet
    ↓
[Caddy :80/:443]  ← TLS termination, routing
    ↓
    ├─→ [Frontend :80]     ← Nginx serving React SPA
    │
    ├─→ [Backend :8080]    ← Spring Boot API (/api/*)
    │       ↓
    │   [AI :8001]         ← FastAPI service
    │
    └─→ [PostgreSQL]       ← Managed database (external)
```

### Health Checks

All services have health check endpoints:
```powershell
# Via Caddy (public)
curl https://your-domain.com/api/health

# Direct container checks
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:8080/api/health
docker compose -f docker-compose.prod.yml exec frontend wget -qO- http://localhost:80/health
docker compose -f docker-compose.prod.yml exec ai curl http://localhost:8001/health
```

### Logs

```powershell
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f caddy

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Updates & Rollback

**Update to new version:**
```powershell
# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.prod.yml build

# Restart services (zero-downtime with health checks)
docker compose -f docker-compose.prod.yml up -d
```

**Rollback:**
```powershell
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Scaling

**Scale AI service horizontally:**
```powershell
docker compose -f docker-compose.prod.yml up -d --scale ai=3
```

**Scale backend (requires external load balancer):**
```yaml
# In docker-compose.prod.yml, remove container_name
# Then scale:
docker compose -f docker-compose.prod.yml up -d --scale backend=2
```

### Backup & Restore

**Database backup (if using containerized PostgreSQL):**
```powershell
# Backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U finsmart finsmartdb > backup.sql

# Restore
docker compose -f docker-compose.prod.yml exec -T db psql -U finsmart finsmartdb < backup.sql
```

**For managed databases:** Use provider's backup tools (RDS snapshots, Azure backup, etc.)

### Monitoring

**Resource usage:**
```powershell
docker stats
```

**Container status:**
```powershell
docker compose -f docker-compose.prod.yml ps
```

**Caddy admin API (if enabled):**
```powershell
curl http://localhost:2019/config/
```

### Troubleshooting

**TLS certificate issues:**
```powershell
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy | grep -i certificate

# Verify DNS
nslookup your-domain.com

# Test certificate
curl -vI https://your-domain.com
```

**Backend not connecting to database:**
```powershell
# Test database connection from backend container
docker compose -f docker-compose.prod.yml exec backend \
  psql "${DB_URL}" -c "SELECT 1"
```

**Frontend not loading:**
```powershell
# Check nginx logs
docker compose -f docker-compose.prod.yml logs frontend

# Verify build
docker compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html
```

### Security Checklist

- [ ] Change all default passwords in `.env.production`
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Enable SSL for database connection (`sslmode=require`)
- [ ] Configure firewall (allow only ports 80, 443)
- [ ] Set up database backups
- [ ] Enable audit logging (already configured)
- [ ] Configure rate limiting (already configured)
- [ ] Review CORS settings (`APP_FRONTEND_URL`)
- [ ] Set up monitoring/alerting
- [ ] Enable Docker security scanning
- [ ] Regular dependency updates

### Production Checklist

- [ ] Domain DNS configured (A record to server IP)
- [ ] Managed PostgreSQL database provisioned
- [ ] `.env.production` configured with real values
- [ ] Email configured in Caddyfile for Let's Encrypt
- [ ] Health checks passing for all services
- [ ] TLS certificates provisioned successfully
- [ ] Database migrations applied
- [ ] Seed data loaded (if needed)
- [ ] Audit logs being written
- [ ] Backup strategy configured
- [ ] Monitoring dashboards set up

### Cost Optimization

- Use managed database (auto-scaling, backups included)
- Set appropriate JVM heap sizes (`JAVA_OPTS`)
- Enable gzip/zstd compression (configured in Caddy)
- Use CDN for static assets (optional)
- Scale services based on actual load
- Schedule database maintenance windows
- Use spot/preemptible instances for non-critical services

### Further Reading

- [Backend Documentation](backend/README.md) - API details and security
- [Frontend Documentation](frontend/README.md) - UI components and state
- [AI Service Documentation](ai/README.md) - ML endpoints
- [Security Implementation](SECURITY_IMPLEMENTATION.md) - Security features
- [Security Quick Reference](SECURITY_QUICKREF.md) - Security cheat sheet

## License

Proprietary - All rights reserved
