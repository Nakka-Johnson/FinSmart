# AI Service Dashboard Queries

This document contains Prometheus queries and dashboard configurations for monitoring the FinSmart AI service.

## Prometheus Queries

### Request Rate

**Total Requests per Second**
```promql
rate(http_requests_total{service="ai"}[5m])
```

**Requests per Endpoint**
```promql
rate(http_requests_total{service="ai"}[5m]) by (handler)
```

### Response Time

**Average Response Time**
```promql
rate(http_request_duration_seconds_sum{service="ai"}[5m]) 
/ 
rate(http_request_duration_seconds_count{service="ai"}[5m])
```

**95th Percentile Response Time**
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket{service="ai"}[5m])
)
```

**99th Percentile Response Time**
```promql
histogram_quantile(0.99, 
  rate(http_request_duration_seconds_bucket{service="ai"}[5m])
)
```

### Error Rate

**Error Rate (4xx and 5xx)**
```promql
rate(http_requests_total{service="ai", status=~"4..|5.."}[5m])
```

**Error Percentage**
```promql
100 * (
  rate(http_requests_total{service="ai", status=~"4..|5.."}[5m])
  /
  rate(http_requests_total{service="ai"}[5m])
)
```

**5xx Errors Only**
```promql
rate(http_requests_total{service="ai", status=~"5.."}[5m])
```

### In-Progress Requests

**Current In-Progress Requests**
```promql
http_requests_inprogress{service="ai"}
```

### Service Availability

**Uptime (from health checks)**
```promql
up{job="ai-service"}
```

**Health Check Success Rate**
```promql
rate(http_requests_total{service="ai", handler="/health", status="200"}[5m])
```

## Grafana Dashboard Panels

### Panel 1: Request Rate
- **Type**: Graph
- **Query**: `rate(http_requests_total{service="ai"}[5m])`
- **Legend**: `{{handler}}`
- **Y-Axis**: Requests/sec

### Panel 2: Response Time
- **Type**: Graph
- **Queries**:
  - Average: `rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])`
  - P95: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
  - P99: `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))`
- **Y-Axis**: Seconds

### Panel 3: Error Rate
- **Type**: Graph
- **Query**: `100 * (rate(http_requests_total{status=~"4..|5.."}[5m]) / rate(http_requests_total[5m]))`
- **Y-Axis**: Percentage

### Panel 4: Status Code Distribution
- **Type**: Bar gauge
- **Query**: `sum(rate(http_requests_total{service="ai"}[5m])) by (status)`
- **Thresholds**: 
  - Green: 200-299
  - Yellow: 400-499
  - Red: 500-599

### Panel 5: Endpoint Performance
- **Type**: Table
- **Query**: 
  ```promql
  sum(rate(http_requests_total{service="ai"}[5m])) by (handler)
  ```
- **Columns**: Endpoint, Requests/sec

### Panel 6: Active Connections
- **Type**: Stat
- **Query**: `http_requests_inprogress{service="ai"}`
- **Display**: Current value

## Alert Rules

### High Error Rate
```yaml
- alert: HighErrorRate
  expr: |
    100 * (
      rate(http_requests_total{service="ai", status=~"5.."}[5m])
      /
      rate(http_requests_total{service="ai"}[5m])
    ) > 5
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High error rate on AI service"
    description: "Error rate is {{ $value }}% (threshold: 5%)"
```

### Slow Response Time
```yaml
- alert: SlowResponseTime
  expr: |
    histogram_quantile(0.95,
      rate(http_request_duration_seconds_bucket{service="ai"}[5m])
    ) > 1.0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Slow response time on AI service"
    description: "95th percentile response time is {{ $value }}s (threshold: 1s)"
```

### Service Down
```yaml
- alert: ServiceDown
  expr: up{job="ai-service"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "AI service is down"
    description: "AI service has been down for more than 1 minute"
```

### High Traffic
```yaml
- alert: HighTraffic
  expr: rate(http_requests_total{service="ai"}[5m]) > 100
  for: 10m
  labels:
    severity: info
  annotations:
    summary: "High traffic on AI service"
    description: "Request rate is {{ $value }} req/s (threshold: 100 req/s)"
```

## Custom Metrics

The AI service automatically tracks the following metrics:

- `http_requests_total` - Total HTTP requests by method, handler, and status
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_inprogress` - Current number of in-progress requests
- `http_request_size_bytes` - Request size histogram
- `http_response_size_bytes` - Response size histogram

## Kubernetes/Docker Labels

When deploying, ensure the following labels are set:

```yaml
labels:
  app: finsmart-ai
  service: ai
  environment: production
```

These labels help filter metrics in multi-service deployments.

## Integration with Existing Infrastructure

### Prometheus Scrape Config

Add this to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'ai-service'
    scrape_interval: 15s
    static_configs:
      - targets: ['ai-service:8001']
    metrics_path: '/metrics'
```

### Grafana Data Source

1. Add Prometheus as a data source in Grafana
2. Import the dashboard using the queries above
3. Set up alert channels (email, Slack, PagerDuty)

## Sentry Integration

Sentry automatically tracks:
- Unhandled exceptions
- Request performance
- Error traces with full context
- User impact metrics

View errors at your Sentry dashboard: `https://sentry.io/organizations/your-org/issues/`
