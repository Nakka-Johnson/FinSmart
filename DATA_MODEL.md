# FinSmart Data Model

> **Generated:** 2025-12-29  
> **Database:** PostgreSQL 16  
> **Schema Manager:** Flyway

## ER Overview

```mermaid
erDiagram
    users ||--o{ accounts : owns
    users ||--o{ budgets : creates
    users ||--o{ envelope : creates
    users ||--o{ envelope_move : makes
    users ||--o{ rule : defines
    users ||--o{ import_batch : uploads
    users ||--o{ export_job : requests
    users ||--o{ anomaly_status : tracks
    users ||--o{ user_feature_flags : has

    accounts ||--o{ transactions : contains

    categories ||--o{ transactions : classifies
    categories ||--o{ budgets : targets
    categories ||--o{ rule : assigns

    import_batch ||--o{ import_row : contains
    
    transactions ||--o{ anomaly_status : flagged_in
    transactions ||--o{ rule_execution_log : matched_by
    
    rule ||--o{ rule_execution_log : executes

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        timestamp created_at
    }

    accounts {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar institution
        varchar type
        varchar currency
        numeric balance
        timestamp created_at
    }

    categories {
        uuid id PK
        varchar name UK
        varchar color
    }

    transactions {
        uuid id PK
        uuid account_id FK
        timestamp posted_at
        numeric amount
        varchar direction
        varchar description
        uuid category_id FK
        varchar merchant
        varchar notes
        char hash
        timestamp created_at
    }

    budgets {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        int month
        int year
        numeric limit_amount
        boolean rollover
        numeric carry_in
    }

    envelope {
        uuid id PK
        uuid user_id FK
        varchar name
        numeric limit_amount
        timestamp created_at
        timestamp updated_at
    }

    envelope_move {
        uuid id PK
        uuid user_id FK
        int month
        int year
        uuid from_envelope FK
        uuid to_envelope FK
        numeric amount
        timestamp created_at
        text notes
    }

    import_batch {
        uuid id PK
        uuid user_id FK
        timestamp created_at
        varchar source
        varchar filename
        int row_count
        varchar status
        text notes
    }

    import_row {
        uuid id PK
        uuid batch_id FK
        int row_no
        jsonb raw
        jsonb normalized
        text error
        uuid suggested_category FK
        uuid duplicate_of FK
    }

    rule {
        uuid id PK
        uuid user_id FK
        varchar pattern
        varchar field
        uuid category_id FK
        boolean active
        int priority
        timestamp created_at
        timestamp updated_at
        text notes
    }

    rule_execution_log {
        uuid id PK
        uuid rule_id FK
        uuid txn_id FK
        boolean matched
        boolean applied
        timestamp created_at
    }

    export_job {
        uuid id PK
        uuid user_id FK
        int month
        int year
        varchar type
        varchar status
        varchar file_path
        timestamp created_at
        timestamp updated_at
        text error_message
        bigint file_size_bytes
        jsonb parameters
    }

    anomaly_status {
        uuid id PK
        uuid user_id FK
        uuid txn_id FK
        varchar status
        text note
        timestamp created_at
        timestamp updated_at
    }

    audit_events {
        uuid id PK
        varchar user_email
        varchar method
        varchar path
        int status
        varchar ip
        varchar user_agent
        timestamp created_at
    }

    user_feature_flags {
        uuid user_id PK_FK
        varchar key PK
        boolean enabled
        timestamp created_at
        timestamp updated_at
        text notes
    }
```

---

## Tables

### users

| Column        | Type         | Nullable | Default           | Notes                |
|---------------|--------------|----------|-------------------|----------------------|
| id            | UUID         | NO       | gen_random_uuid() | PK                   |
| email         | VARCHAR(255) | NO       |                   | UK `uk_user_email`   |
| password_hash | VARCHAR(255) | NO       |                   | BCrypt hash          |
| full_name     | VARCHAR(255) | YES      |                   |                      |
| created_at    | TIMESTAMP    | NO       | CURRENT_TIMESTAMP |                      |

**Indexes:**
- `idx_users_email` on `email`

**Migration:** V1__init.sql (lines 5-15)

---

### accounts

| Column      | Type         | Nullable | Default           | Notes                     |
|-------------|--------------|----------|-------------------|---------------------------|
| id          | UUID         | NO       | gen_random_uuid() | PK                        |
| user_id     | UUID         | NO       |                   | FK → users(id) CASCADE    |
| name        | VARCHAR(255) | NO       |                   |                           |
| institution | VARCHAR(255) | YES      |                   |                           |
| type        | VARCHAR(20)  | NO       |                   | CHECK: CHECKING/SAVINGS/CREDIT |
| currency    | VARCHAR(3)   | NO       | 'GBP'             |                           |
| balance     | NUMERIC(12,2)| NO       | 0.00              | Added in V10              |
| created_at  | TIMESTAMP    | NO       | CURRENT_TIMESTAMP |                           |

**Indexes:**
- `idx_accounts_user_id` on `user_id`

**Migrations:**
- V1__init.sql (lines 23-37)
- V10__add_balance_to_accounts.sql (line 2)

---

### categories

| Column | Type         | Nullable | Default           | Notes               |
|--------|--------------|----------|-------------------|---------------------|
| id     | UUID         | NO       | gen_random_uuid() | PK                  |
| name   | VARCHAR(100) | NO       |                   | UK `uk_category_name` |
| color  | VARCHAR(7)   | NO       |                   | #RRGGBB format      |

**Indexes:**
- `idx_categories_name` on `name`

**Migration:** V1__init.sql (lines 17-21)

---

### transactions

| Column      | Type          | Nullable | Default           | Notes                          |
|-------------|---------------|----------|-------------------|--------------------------------|
| id          | UUID          | NO       | gen_random_uuid() | PK                             |
| account_id  | UUID          | NO       |                   | FK → accounts(id) CASCADE      |
| posted_at   | TIMESTAMP     | NO       |                   |                                |
| amount      | NUMERIC(12,2) | NO       |                   | CHECK >= 0                     |
| direction   | VARCHAR(20)   | NO       |                   | CHECK: DEBIT/CREDIT            |
| description | VARCHAR(512)  | YES      |                   |                                |
| category_id | UUID          | YES      |                   | FK → categories(id) SET NULL   |
| merchant    | VARCHAR(255)  | YES      |                   |                                |
| notes       | VARCHAR(512)  | YES      |                   |                                |
| hash        | CHAR(64)      | YES      |                   | SHA256 for dedup (V4)          |
| created_at  | TIMESTAMP     | NO       | CURRENT_TIMESTAMP |                                |

**Indexes:**
- `idx_transactions_account_id` on `account_id`
- `idx_transactions_posted_at` on `posted_at`
- `idx_transactions_category_id` on `category_id`
- `idx_transactions_hash` on `hash` WHERE hash IS NOT NULL

**Migrations:**
- V1__init.sql (lines 39-58)
- V4__imports_and_hashes.sql (line 34) – added hash column

---

### budgets

| Column       | Type          | Nullable | Default | Notes                              |
|--------------|---------------|----------|---------|------------------------------------|
| id           | UUID          | NO       |         | PK                                 |
| user_id      | UUID          | NO       |         | FK → users(id) CASCADE             |
| category_id  | UUID          | NO       |         | FK → categories(id) CASCADE        |
| month        | INTEGER       | NO       |         | CHECK 1-12                         |
| year         | INTEGER       | NO       |         | CHECK >= 2000                      |
| limit_amount | NUMERIC(12,2) | NO       |         | CHECK >= 0                         |
| rollover     | BOOLEAN       | NO       | false   | Added in V5                        |
| carry_in     | NUMERIC(14,2) | NO       | 0       | Added in V5                        |

**Unique Constraint:** `uk_budget_user_category_month_year` (user_id, category_id, month, year)

**Indexes:**
- `idx_budgets_user_id` on `user_id`
- `idx_budgets_month_year` on `(month, year)`

**Migrations:**
- V1__init.sql (lines 60-74)
- V5__budget_rollover_and_envelopes.sql (lines 4-5)

---

### envelope

| Column       | Type          | Nullable | Default           | Notes                |
|--------------|---------------|----------|-------------------|----------------------|
| id           | UUID          | NO       | gen_random_uuid() | PK                   |
| user_id      | UUID          | NO       |                   | FK → users(id) CASCADE |
| name         | VARCHAR(64)   | NO       |                   |                      |
| limit_amount | NUMERIC(14,2) | NO       | 0                 |                      |
| created_at   | TIMESTAMPTZ   | NO       | CURRENT_TIMESTAMP |                      |
| updated_at   | TIMESTAMPTZ   | NO       | CURRENT_TIMESTAMP |                      |

**Unique Constraint:** `uq_envelope_user_name` (user_id, name)

**Indexes:**
- `idx_envelope_user_id` on `user_id`

**Migration:** V5__budget_rollover_and_envelopes.sql (lines 10-21)

---

### envelope_move

| Column        | Type          | Nullable | Default           | Notes                          |
|---------------|---------------|----------|-------------------|--------------------------------|
| id            | UUID          | NO       | gen_random_uuid() | PK                             |
| user_id       | UUID          | NO       |                   | FK → users(id) CASCADE         |
| month         | INTEGER       | NO       |                   | CHECK 1-12                     |
| year          | INTEGER       | NO       |                   | CHECK 2000-2100                |
| from_envelope | UUID          | YES      |                   | FK → envelope(id) SET NULL     |
| to_envelope   | UUID          | YES      |                   | FK → envelope(id) SET NULL     |
| amount        | NUMERIC(14,2) | NO       |                   | CHECK > 0                      |
| created_at    | TIMESTAMPTZ   | NO       | CURRENT_TIMESTAMP |                                |
| notes         | TEXT          | YES      |                   |                                |

**Check Constraint:** `chk_envelope_move_different` (from ≠ to)

**Indexes:**
- `idx_envelope_move_user_id` on `user_id`
- `idx_envelope_move_period` on `(year, month)`
- `idx_envelope_move_from` on `from_envelope`
- `idx_envelope_move_to` on `to_envelope`

**Migration:** V5__budget_rollover_and_envelopes.sql (lines 25-43)

---

### import_batch

| Column     | Type         | Nullable | Default           | Notes                        |
|------------|--------------|----------|-------------------|------------------------------|
| id         | UUID         | NO       | gen_random_uuid() | PK                           |
| user_id    | UUID         | NO       |                   | FK → users(id) CASCADE       |
| created_at | TIMESTAMPTZ  | NO       | CURRENT_TIMESTAMP |                              |
| source     | VARCHAR(64)  | NO       |                   | e.g., 'CSV'                  |
| filename   | VARCHAR(255) | YES      |                   |                              |
| row_count  | INTEGER      | NO       | 0                 |                              |
| status     | VARCHAR(16)  | NO       |                   | CHECK: PREVIEW/COMMITTED/FAILED/UNDONE |
| notes      | TEXT         | YES      |                   |                              |

**Indexes:**
- `idx_import_batch_user_id` on `user_id`
- `idx_import_batch_created_at` on `created_at DESC`
- `idx_import_batch_status` on `status`

**Migration:** V4__imports_and_hashes.sql (lines 4-15)

---

### import_row

| Column             | Type    | Nullable | Default           | Notes                        |
|--------------------|---------|----------|-------------------|------------------------------|
| id                 | UUID    | NO       | gen_random_uuid() | PK                           |
| batch_id           | UUID    | NO       |                   | FK → import_batch(id) CASCADE |
| row_no             | INTEGER | NO       |                   |                              |
| raw                | JSONB   | NO       |                   | Original CSV row data        |
| normalized         | JSONB   | YES      |                   | Parsed/normalised data       |
| error              | TEXT    | YES      |                   | Validation error message     |
| suggested_category | UUID    | YES      |                   | FK → categories(id) SET NULL |
| duplicate_of       | UUID    | YES      |                   | FK → transactions(id) SET NULL |

**Unique Constraint:** `uq_batch_row` (batch_id, row_no)

**Indexes:**
- `idx_import_row_batch_id` on `batch_id`
- `idx_import_row_duplicate_of` on `duplicate_of` WHERE duplicate_of IS NOT NULL

**Migration:** V4__imports_and_hashes.sql (lines 17-31)

---

### rule

| Column      | Type         | Nullable | Default           | Notes                        |
|-------------|--------------|----------|-------------------|------------------------------|
| id          | UUID         | NO       | gen_random_uuid() | PK                           |
| user_id     | UUID         | NO       |                   | FK → users(id) CASCADE       |
| pattern     | VARCHAR(128) | NO       |                   | Regex/substring pattern      |
| field       | VARCHAR(32)  | NO       |                   | CHECK: merchant/description/both |
| category_id | UUID         | NO       |                   | FK → categories(id) CASCADE  |
| active      | BOOLEAN      | NO       | true              |                              |
| priority    | INTEGER      | NO       | 100               | Lower = higher priority      |
| created_at  | TIMESTAMPTZ  | NO       | CURRENT_TIMESTAMP |                              |
| updated_at  | TIMESTAMPTZ  | NO       | CURRENT_TIMESTAMP |                              |
| notes       | TEXT         | YES      |                   |                              |

**Indexes:**
- `idx_rule_user_id` on `user_id`
- `idx_rule_active_priority` on `(user_id, active, priority)` WHERE active = true
- `idx_rule_category_id` on `category_id`

**Migration:** V9__rules_engine.sql (lines 4-21)

---

### rule_execution_log

| Column     | Type        | Nullable | Default           | Notes                     |
|------------|-------------|----------|-------------------|---------------------------|
| id         | UUID        | NO       | gen_random_uuid() | PK                        |
| rule_id    | UUID        | NO       |                   | FK → rule(id) CASCADE     |
| txn_id     | UUID        | NO       |                   | FK → transactions(id) CASCADE |
| matched    | BOOLEAN     | NO       |                   | Did pattern match?        |
| applied    | BOOLEAN     | NO       |                   | Was category applied?     |
| created_at | TIMESTAMPTZ | NO       | CURRENT_TIMESTAMP |                           |

**Indexes:**
- `idx_rule_execution_log_rule_id` on `rule_id`
- `idx_rule_execution_log_txn_id` on `txn_id`
- `idx_rule_execution_log_created_at` on `created_at DESC`

**Migration:** V9__rules_engine.sql (lines 25-38)

---

### export_job

| Column          | Type         | Nullable | Default           | Notes                           |
|-----------------|--------------|----------|-------------------|---------------------------------|
| id              | UUID         | NO       | gen_random_uuid() | PK                              |
| user_id         | UUID         | NO       |                   | FK → users(id) CASCADE          |
| month           | INTEGER      | YES      |                   | CHECK 1-12                      |
| year            | INTEGER      | YES      |                   | CHECK 2000-2100                 |
| type            | VARCHAR(32)  | NO       |                   | CHECK: CSV/XLSX/PDF/JSON        |
| status          | VARCHAR(16)  | NO       |                   | CHECK: PENDING/PROCESSING/COMPLETED/FAILED |
| file_path       | VARCHAR(512) | YES      |                   | Relative path or S3 key         |
| created_at      | TIMESTAMPTZ  | NO       | CURRENT_TIMESTAMP |                                 |
| updated_at      | TIMESTAMPTZ  | NO       | CURRENT_TIMESTAMP |                                 |
| error_message   | TEXT         | YES      |                   |                                 |
| file_size_bytes | BIGINT       | YES      |                   |                                 |
| parameters      | JSONB        | YES      |                   | Additional export params        |

**Indexes:**
- `idx_export_job_user_id` on `user_id`
- `idx_export_job_created_at` on `created_at DESC`
- `idx_export_job_status` on `status`
- `idx_export_job_period` on `(year, month)` WHERE month IS NOT NULL

**Migration:** V8__export_jobs.sql (lines 4-24)

---

### anomaly_status

| Column     | Type        | Nullable | Default           | Notes                           |
|------------|-------------|----------|-------------------|---------------------------------|
| id         | UUID        | NO       | gen_random_uuid() | PK                              |
| user_id    | UUID        | NO       |                   | FK → users(id) CASCADE          |
| txn_id     | UUID        | NO       |                   | FK → transactions(id) CASCADE   |
| status     | VARCHAR(16) | NO       |                   | CHECK: PENDING/CONFIRMED/SNOOZED/IGNORED |
| note       | TEXT        | YES      |                   |                                 |
| created_at | TIMESTAMPTZ | NO       | CURRENT_TIMESTAMP |                                 |
| updated_at | TIMESTAMPTZ | NO       | CURRENT_TIMESTAMP |                                 |

**Unique Constraint:** `uq_anomaly_user_txn` (user_id, txn_id)

**Indexes:**
- `idx_anomaly_status_user_id` on `user_id`
- `idx_anomaly_status_txn_id` on `txn_id`
- `idx_anomaly_status_status` on `status`

**Migration:** V8__export_jobs.sql (lines 28-42)

---

### audit_events

| Column     | Type         | Nullable | Default           | Notes             |
|------------|--------------|----------|-------------------|-------------------|
| id         | UUID         | NO       | gen_random_uuid() | PK                |
| user_email | VARCHAR(255) | YES      |                   |                   |
| method     | VARCHAR(10)  | NO       |                   | HTTP method       |
| path       | VARCHAR(512) | NO       |                   | Request URI       |
| status     | INTEGER      | YES      |                   | HTTP status code  |
| ip         | VARCHAR(45)  | YES      |                   | Client IP         |
| user_agent | VARCHAR(512) | YES      |                   |                   |
| created_at | TIMESTAMP    | NO       | CURRENT_TIMESTAMP |                   |

**Indexes:**
- `idx_audit_events_user_email` on `user_email`
- `idx_audit_events_created_at` on `created_at DESC`

**Migration:** V11__create_audit_events.sql

> **Note:** V7 also creates `audit_event` (singular) with similar schema plus
> `duration_ms`, `request_id`, `error_message`. The entity uses `audit_events` (plural).

---

### user_feature_flags

| Column     | Type        | Nullable | Default           | Notes                |
|------------|-------------|----------|-------------------|----------------------|
| user_id    | UUID        | NO       |                   | PK, FK → users(id) CASCADE |
| key        | VARCHAR(64) | NO       |                   | PK (composite)       |
| enabled    | BOOLEAN     | NO       | false             |                      |
| created_at | TIMESTAMPTZ | NO       | CURRENT_TIMESTAMP |                      |
| updated_at | TIMESTAMPTZ | NO       | CURRENT_TIMESTAMP |                      |
| notes      | TEXT        | YES      |                   |                      |

**Primary Key:** (user_id, key)

**Indexes:**
- `idx_user_feature_flags_user_id` on `user_id`
- `idx_user_feature_flags_key` on `key`

**Migration:** V7__audit_observability.sql (lines 27-40)

---

## Materialised Views

### user_merchant_monthly

Aggregates merchant spending per user per month for insights.

```sql
SELECT 
    a.user_id,
    COALESCE(t.merchant, 'Unknown') AS merchant,
    TO_CHAR(t.posted_at, 'YYYY-MM') AS yyyy_mm,
    SUM(CASE WHEN t.direction = 'DEBIT' THEN t.amount ELSE 0 END) AS debit_total,
    COUNT(*) AS txn_count
FROM transactions t
JOIN accounts a ON t.account_id = a.id
WHERE t.merchant IS NOT NULL OR t.description IS NOT NULL
GROUP BY a.user_id, COALESCE(t.merchant, 'Unknown'), TO_CHAR(t.posted_at, 'YYYY-MM');
```

**Indexes:**
- `idx_user_merchant_monthly_pk` (unique) on `(user_id, merchant, yyyy_mm)`
- `idx_user_merchant_monthly_period` on `yyyy_mm`
- `idx_user_merchant_monthly_amount` on `debit_total DESC`

**Refresh:** Manual or scheduled (`REFRESH MATERIALIZED VIEW CONCURRENTLY`)

**Migration:** V6__merchant_materialized_view.sql

---

## Integrity Rules

### Unique Constraints

| Table             | Constraint Name                      | Columns                           |
|-------------------|--------------------------------------|-----------------------------------|
| users             | uk_user_email                        | email                             |
| categories        | uk_category_name                     | name                              |
| budgets           | uk_budget_user_category_month_year   | user_id, category_id, month, year |
| envelope          | uq_envelope_user_name                | user_id, name                     |
| import_row        | uq_batch_row                         | batch_id, row_no                  |
| anomaly_status    | uq_anomaly_user_txn                  | user_id, txn_id                   |

### Cascade Rules

| Parent Table  | Child Table       | On Delete |
|---------------|-------------------|-----------|
| users         | accounts          | CASCADE   |
| users         | budgets           | CASCADE   |
| users         | envelope          | CASCADE   |
| users         | envelope_move     | CASCADE   |
| users         | import_batch      | CASCADE   |
| users         | rule              | CASCADE   |
| users         | export_job        | CASCADE   |
| users         | anomaly_status    | CASCADE   |
| accounts      | transactions      | CASCADE   |
| categories    | transactions      | SET NULL  |
| categories    | budgets           | CASCADE   |
| categories    | rule              | CASCADE   |
| import_batch  | import_row        | CASCADE   |
| envelope      | envelope_move     | SET NULL  |
| transactions  | anomaly_status    | CASCADE   |
| rule          | rule_execution_log| CASCADE   |
| transactions  | rule_execution_log| CASCADE   |

---

## Flyway Migration Summary

| Version | File                              | Description                                |
|---------|-----------------------------------|--------------------------------------------|
| V1      | V1__init.sql                      | Core tables: users, accounts, categories, transactions, budgets |
| V2      | V2__seed.sql                      | Seed data (if any)                         |
| V3      | V3__indexes.sql                   | Additional indexes                         |
| V4      | V4__imports_and_hashes.sql        | Import batch/row tables, transaction hash  |
| V5      | V5__budget_rollover_and_envelopes.sql | Budget rollover, envelope tables       |
| V6      | V6__merchant_materialized_view.sql| Merchant monthly aggregation view          |
| V7      | V7__audit_observability.sql       | audit_event, user_feature_flags            |
| V8      | V8__export_jobs.sql               | export_job, anomaly_status                 |
| V9      | V9__rules_engine.sql              | rule, rule_execution_log                   |
| V10     | V10__add_balance_to_accounts.sql  | Add balance column to accounts             |
| V11     | V11__create_audit_events.sql      | Create audit_events table                  |

---

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [FRONTEND_MAP.md](./FRONTEND_MAP.md)
