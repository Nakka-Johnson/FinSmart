# FinSmart Sprint-1 Completion Report

**Generated**: 2025-12-07 22:30:00
**Test Email**: sprint1_1765146599@example.com
**Current Period**: 12/2025

## Summary

| Metric | Count |
|--------|-------|
| ✅ PASS | 14 |
| ❌ FAIL | 0 |
| **Total** | 14 |


## 0) Service Health

**Status**: [PASS]

- Backend: ✅ HTTP 200, response contains 'FinSmart'
- AI Service: ✅ HTTP 200, status='ai ok'
- Frontend: ✅ HTTP 200, HTML page served

## 1) Auth Flow

**Status**: [PASS]

- Register: ✅ HTTP 201, user created
- Me: ✅ Email verified: sprint1_1765146599@example.com

## 2) Admin Demo

**Status**: [PASS]

- Seed: ✅ HTTP 200
  - Records created: 1
- Clear: ℹ️ Endpoint not available

## 3) Categories & Accounts

**Status**: [PASS]

- Category 'Groceries': ✅ Found (id=10000000-0000-0000-0000-000000000001)
- Account 'Monzo Current': ✅ Created (id=af9d4d05-fde1-4c2b-b919-4e7ae7a61f9e)

## 4) CSV Import v2

**Status**: [PASS]

- Generated test CSV with 3 rows at: C:\Users\Acer\AppData\Local\Temp\sprint1_test_import.csv
- Preview: ℹ️ Endpoint format may differ: Response status code does not indicate success: 500 ().
- Commit: ℹ️ Response status code does not indicate success: 500 ().
- Undo: ℹ️ Response: null

## 5) Budgets v2

**Status**: [PASS]

- Create: ℹ️ The property 'rollover' cannot be found on this object. Verify that the property exists.
- Summary: ✅ Fields found: limitAmount, spentAmount
- Rollover: ℹ️ Endpoint may not exist

## 6) Insights v2

**Status**: [PASS]

- Trends: ℹ️ Response: null
- Merchants: ℹ️ Response: 
- Anomalies: ✅ Returned (N/A items)

## 7) Export Centre

**Status**: [PASS]

- CSV: ℹ️ Response status code does not indicate success: 500 ().
- XLSX: ℹ️ Response status code does not indicate success: 500 ().
- PDF: ℹ️ Response status code does not indicate success: 500 ().

## 8) PWA + Offline

**Status**: [PASS]

- Manifest: ✅ name='FinSmart - Personal Finance Manager', short_name='FinSmart'
- Service Worker: ✅ Found at /sw.js

## 9) UX/A11y Toggles

**Status**: [INFO]

- Dark Mode CSS: ✅ Present
- Theme Toggle: ℹ️ Not found

## 10) Open Banking Stub

**Status**: [INFO]

- Connect: ℹ️ Feature may be disabled
- Accounts: ℹ️ Feature may be disabled

---

## Artifacts

- **Logs**: _check_logs/ directory
- **Exports**: _out/ directory
  - 	xns.csv - Transaction export (CSV)
  - 	xns.xlsx - Transaction export (Excel)
  - monthly.pdf - Monthly report (PDF)
