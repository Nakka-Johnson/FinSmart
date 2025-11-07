# FinSmart ERD

```mermaid
erDiagram
  User ||--o{ Account : "has"
  Account ||--o{ Transaction : "has"
  User ||--o{ Budget : "sets"
  Category ||--o{ Transaction : "tags"
  Category ||--o{ Budget : "targets"

  User {
    UUID id PK
    string email UNIQUE
    string passwordHash
    string fullName
    Instant createdAt
  }

  Account {
    UUID id PK
    UUID user_id FK
    string name
    string institution
    string type  "CHECKING|SAVINGS|CREDIT"
    string currency "default GBP"
    Instant createdAt
  }

  Category {
    UUID id PK
    string name UNIQUE
    string color "#RRGGBB"
  }

  Transaction {
    UUID id PK
    UUID account_id FK
    Instant postedAt
    decimal amount ">= 0"
    string direction "DEBIT|CREDIT"
    string description
    UUID category_id FK (nullable)
    string merchant
    string notes
    Instant createdAt
  }

  Budget {
    UUID id PK
    UUID user_id FK
    UUID category_id FK
    int month "1..12"
    int year  ">=2000"
    decimal limitAmount ">=0"
    UNIQUE (user_id, category_id, month, year)
  }
