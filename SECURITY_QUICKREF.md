# Production Security Quick Reference

## 🔒 Security Features at a Glance

### Rate Limiting
- **General API:** 100 requests/min per IP
- **Login Endpoint:** 10 requests/min per IP
- **Response:** 429 Too Many Requests (JSON)

### Security Headers
```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
```

### CORS
- **Origin:** `APP_FRONTEND_URL` (default: http://localhost:5173)
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Credentials:** Enabled

### Audit Logging
All requests logged to `audit_events` table:
- User email
- HTTP method & path
- Status code
- IP address
- User agent
- Timestamp

## 🚀 Quick Start

### Environment Variables

```env
# Required
APP_JWT_SECRET=your-secure-random-string-min-32-chars

# Optional (defaults shown)
APP_FRONTEND_URL=http://localhost:5173
APP_PORT=8081
```

### Running the Application

```powershell
# Development
cd backend
.\mvnw.cmd spring-boot:run -Pdev

# Production
java -jar target/finsmart-0.0.1-SNAPSHOT.jar
```

## 📊 Monitoring

### Actuator Endpoints

**Public:**
- GET http://localhost:8081/actuator/health
- GET http://localhost:8081/actuator/info

**Admin Only (ROLE_ADMIN required):**
- All other /actuator/** endpoints

### Check Audit Logs

```sql
-- Recent activity
SELECT * FROM audit_events 
ORDER BY created_at DESC 
LIMIT 20;

-- Failed requests
SELECT * FROM audit_events 
WHERE status >= 400 
ORDER BY created_at DESC;

-- User activity
SELECT * FROM audit_events 
WHERE user_email = 'user@example.com' 
ORDER BY created_at DESC;
```

## 🧪 Testing Security Features

### Test Rate Limiting

```powershell
# Test general limit (should fail at 101st request)
1..105 | ForEach-Object { 
    Write-Host "Request $_"
    try {
        Invoke-WebRequest http://localhost:8081/api/health -ErrorAction Stop
    } catch {
        Write-Host "Rate limited at request $_" -ForegroundColor Red
    }
}
```

### Test Security Headers

```powershell
$response = Invoke-WebRequest http://localhost:8081/api/health
$response.Headers | Format-Table
```

### Test CORS

```javascript
// From browser console on http://localhost:5173
fetch('http://localhost:8081/api/accounts', {
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN_HERE' 
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## ⚠️ Common Issues

### Rate Limited
```json
{
  "timestamp": "2025-11-06T14:00:00Z",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "path": "/api/auth/login"
}
```
**Solution:** Wait 1 minute or check if you're being rate limited incorrectly

### CORS Error
```
Access to fetch at 'http://localhost:8081/api/accounts' from origin 
'http://localhost:3000' has been blocked by CORS policy
```
**Solution:** Set `APP_FRONTEND_URL=http://localhost:3000`

### Audit Logs Not Appearing
**Check:**
1. Database connection is working
2. Flyway migration V5 ran successfully
3. No exceptions in application logs

## 📋 Security Checklist for Deployment

### Before Production
- [ ] Change `APP_JWT_SECRET` to strong random value (32+ characters)
- [ ] Set `APP_FRONTEND_URL` to production domain
- [ ] Enable HTTPS/TLS
- [ ] Review and adjust rate limits if needed
- [ ] Test all security features
- [ ] Configure log aggregation
- [ ] Set up database backups
- [ ] Test admin actuator endpoints

### Production Monitoring
- [ ] Monitor rate limit violations
- [ ] Review audit logs daily
- [ ] Check actuator health endpoint
- [ ] Monitor database growth (audit_events table)
- [ ] Set up alerts for 5xx errors
- [ ] Monitor authentication failures

## 🔧 Configuration Reference

### Rate Limits (Hardcoded)
To change limits, edit `RateLimitFilter.java`:

```java
// General endpoints
bucket = resolveBucket(key, 100, Duration.ofMinutes(1));

// Login endpoint
bucket = resolveBucket(key + ":login", 10, Duration.ofMinutes(1));
```

### Logbook Redaction (application.yml)
```yaml
logbook:
  exclude:
    - /actuator/**
  obfuscate:
    headers:
      - Authorization
      - X-Auth-Token
    json-body-fields:
      - password
      - token
```

### Request Size Limits (application.yml)
```yaml
server:
  tomcat:
    max-http-form-post-size: 2MB

spring:
  servlet:
    multipart:
      max-file-size: 2MB
      max-request-size: 5MB
```

## 🎯 Performance Tuning

### Rate Limiting Cache
In-memory `ConcurrentHashMap` - no configuration needed.

For distributed systems, consider Redis:
```java
// Future enhancement
@Autowired
private RedisTemplate<String, Bucket> redisTemplate;
```

### Audit Log Archiving
Archive old audit events to reduce database size:

```sql
-- Archive events older than 90 days
CREATE TABLE audit_events_archive AS 
SELECT * FROM audit_events 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM audit_events 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 📞 Support

For issues or questions:
1. Check application logs: `logs/finsmart.log`
2. Review audit events: `SELECT * FROM audit_events WHERE status >= 500`
3. Check actuator health: `GET /actuator/health`
4. Consult README.md for detailed documentation

---

**Last Updated:** 2025-11-06  
**Version:** 1.0.0  
**Security Status:** Production-Ready ✅
