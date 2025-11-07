# Production Deployment Checklist

## Pre-Deployment

### Infrastructure Setup
- [ ] Provision managed PostgreSQL database (RDS, Azure Database, Cloud SQL)
- [ ] Configure database security group/firewall rules
- [ ] Create database user and set strong password
- [ ] Run Flyway migrations on production database
- [ ] Configure database backups (automated snapshots)
- [ ] Set up DNS A record pointing to server public IP
- [ ] Provision server (minimum 2GB RAM, 2 CPU cores)
- [ ] Configure server firewall (allow ports 22, 80, 443)
- [ ] Install Docker and Docker Compose on server

### Security Configuration
- [ ] Generate strong JWT secret (32+ characters)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Generate strong database password
- [ ] Create `.env.production` from example template
- [ ] Update all `CHANGE_ME` values in `.env.production`
- [ ] Update `caddy/Caddyfile` with your domain
- [ ] Update `caddy/Caddyfile` with your email
- [ ] Verify CORS settings (`APP_FRONTEND_URL`)
- [ ] Review rate limiting configuration
- [ ] Enable SSL for database connection (`sslmode=require`)

### Application Configuration
- [ ] Set `DOMAIN` to your actual domain
- [ ] Set `APP_FRONTEND_URL` to `https://your-domain.com`
- [ ] Configure JVM memory settings (`JAVA_OPTS`)
- [ ] Set JWT expiration time (`APP_JWT_EXPIRES_MINUTES`)
- [ ] Verify AI service URL (default: `http://ai:8001`)

## Deployment Steps

### 1. Server Setup
```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/your-org/finsmart.git
cd finsmart

# Create production environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

### 2. Build Images
```bash
# Build all Docker images
docker compose -f docker-compose.prod.yml build

# Verify images
docker images | grep finsmart
```

### 3. Start Services
```bash
# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

### 4. Verify Deployment
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:80/api/health
curl http://localhost:8001/health

# Wait for TLS provisioning (can take 1-2 minutes)
# Monitor Caddy logs for certificate acquisition
docker compose -f docker-compose.prod.yml logs -f caddy
```

### 5. Test TLS
```bash
# Test HTTPS (after DNS propagation)
curl https://your-domain.com/api/health

# Check certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Post-Deployment Verification

### Functional Tests
- [ ] Visit `https://your-domain.com` in browser
- [ ] Register a new user via frontend
- [ ] Login with registered user
- [ ] Create an account
- [ ] Add a transaction
- [ ] View dashboard
- [ ] Check monthly insights
- [ ] Download PDF report
- [ ] Test all API endpoints

### Security Verification
- [ ] Verify HTTPS is working
- [ ] Check security headers
  ```bash
  curl -I https://your-domain.com
  ```
- [ ] Test rate limiting
  ```bash
  for i in {1..105}; do curl https://your-domain.com/api/health; done
  ```
- [ ] Verify CORS (try from different origin)
- [ ] Test authentication (expired token should fail)
- [ ] Check actuator endpoints are secured
- [ ] Verify audit logs are being written
  ```sql
  SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 10;
  ```

### Performance Verification
- [ ] Check service health
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```
- [ ] Monitor resource usage
  ```bash
  docker stats
  ```
- [ ] Check response times
  ```bash
  time curl https://your-domain.com/api/health
  ```
- [ ] Verify database connection pool
- [ ] Test under load (optional: use k6, JMeter, etc.)

## Monitoring Setup

### Application Monitoring
- [ ] Set up log aggregation (ELK, Splunk, CloudWatch)
- [ ] Configure error tracking (Sentry, Rollbar)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Create alerting rules (high error rate, service down)
- [ ] Set up performance monitoring (APM)

### Infrastructure Monitoring
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Set up database monitoring (connections, slow queries)
- [ ] Monitor Docker container health
- [ ] Track disk space usage
- [ ] Set up SSL certificate expiration alerts

### Business Metrics
- [ ] Track user registrations
- [ ] Monitor API usage
- [ ] Track transaction volumes
- [ ] Monitor PDF generation success rate
- [ ] Track AI service performance

## Backup & Recovery

### Database Backups
- [ ] Verify automated database backups are enabled
- [ ] Test backup restoration process
- [ ] Document backup retention policy
- [ ] Set up backup monitoring/alerting

### Application Backups
- [ ] Document Docker image versions
- [ ] Tag Docker images with version numbers
- [ ] Store configuration backups (`.env.production`, `Caddyfile`)
- [ ] Document rollback procedure

## Ongoing Maintenance

### Daily
- [ ] Check service health
- [ ] Review error logs
- [ ] Monitor resource usage

### Weekly
- [ ] Review audit logs for suspicious activity
- [ ] Check database size and performance
- [ ] Review application metrics

### Monthly
- [ ] Update dependencies (security patches)
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Review SSL certificate status
- [ ] Capacity planning review

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Disaster recovery drill
- [ ] Update documentation

## Troubleshooting Common Issues

### TLS Certificate Not Provisioning
```bash
# Check DNS
nslookup your-domain.com

# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy | grep -i certificate

# Verify ports 80 and 443 are accessible
curl -I http://your-domain.com
```

**Solutions:**
- Verify DNS A record points to correct IP
- Check firewall allows ports 80 and 443
- Wait 1-2 minutes for certificate acquisition
- Check email for Let's Encrypt errors

### Backend Can't Connect to Database
```bash
# Test database connection
docker compose -f docker-compose.prod.yml exec backend bash
# Then inside container:
psql "jdbc:postgresql://your-db:5432/finsmartdb" -U finsmart -c "SELECT 1"
```

**Solutions:**
- Verify `DB_URL` in `.env.production`
- Check database security group allows connection
- Verify database user credentials
- Check database is running

### High Memory Usage
```bash
# Check container memory
docker stats

# Check JVM heap
docker compose -f docker-compose.prod.yml exec backend jps -lvm
```

**Solutions:**
- Adjust `JAVA_OPTS` in `.env.production`
- Scale services horizontally
- Review application for memory leaks
- Upgrade server resources

### Services Keep Restarting
```bash
# Check why services are restarting
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100
```

**Solutions:**
- Check health check endpoints
- Review application logs for errors
- Verify all environment variables are set
- Check disk space availability

## Rollback Procedure

### If Deployment Fails
```bash
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Verify rollback
docker compose -f docker-compose.prod.yml ps
curl https://your-domain.com/api/health
```

### If Database Migration Fails
```bash
# Connect to database
psql -h your-db-host -U finsmart -d finsmartdb

# Check Flyway schema history
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;

# If needed, repair Flyway
docker compose -f docker-compose.prod.yml exec backend \
  ./mvnw flyway:repair
```

## Emergency Contacts

- **DevOps Lead:** name@example.com, +1-xxx-xxx-xxxx
- **Database Admin:** name@example.com, +1-xxx-xxx-xxxx
- **Security Team:** security@example.com
- **On-Call:** oncall@example.com

## Useful Commands

```bash
# Quick status check
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f [service-name]

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Execute command in container
docker compose -f docker-compose.prod.yml exec backend bash

# Check database
docker compose -f docker-compose.prod.yml exec backend \
  psql "$DB_URL" -c "SELECT version();"

# Update and redeploy
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Check resource usage
docker stats

# Clean up old images
docker image prune -a
```

---

**Last Updated:** 2025-11-06  
**Version:** 1.0.0  
**Deployment Status:** Ready for Production ✅
