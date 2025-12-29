# FinSmart Frontend Map

> **Generated:** 2025-12-29  
> **Framework:** React 18 + TypeScript + Vite 6

## Route Map

| Path           | Component         | Auth | Description                        |
|----------------|-------------------|------|------------------------------------|
| `/`            | Dashboard         | ✅   | Main dashboard with stats          |
| `/dashboard`   | Dashboard         | ✅   | Alias for `/`                      |
| `/login`       | Login             | ❌   | User login form                    |
| `/register`    | Register          | ❌   | User registration form             |
| `/transactions`| Transactions      | ✅   | Transaction list with filters      |
| `/budgets`     | Budgets           | ✅   | Budget management                  |
| `/categories`  | Categories        | ✅   | Category list and creation         |
| `/insights`    | InsightsPage      | ✅   | Merchant insights + anomalies      |
| `/import`      | CSVImportPage     | ✅   | CSV import wizard (v2)             |
| `/onboarding`  | OnboardingPage    | ✅   | New user onboarding wizard         |
| `*`            | (redirect)        | —    | Redirect to `/`                    |

### Route Structure

```
src/App.tsx
├── /login          → Login (no Shell)
├── /register       → Register (no Shell)
├── /               → Shell > Guard > Dashboard
├── /dashboard      → Shell > Guard > Dashboard
├── /transactions   → Shell > Guard > Transactions
├── /budgets        → Shell > Guard > Budgets
├── /categories     → Shell > Guard > Categories
├── /insights       → Shell > Guard > InsightsPage
├── /import         → Shell > Guard > CSVImportPage
├── /onboarding     → Guard > OnboardingPage (no Shell)
└── *               → Navigate to /
```

---

## State Management

### Auth Store (`src/store/auth.ts`)

Uses Zustand for state management.

| Property/Method   | Type                                  | Description                     |
|-------------------|---------------------------------------|---------------------------------|
| `token`           | `string \| null`                      | JWT token                       |
| `user`            | `UserResponse \| null`                | Current user info               |
| `setAuth`         | `(token, user, remember?) => void`    | Set auth state + persist        |
| `clearAuth`       | `() => void`                          | Clear auth state + storage      |
| `isAuthenticated` | `() => boolean`                       | Check if logged in              |
| `fetchUser`       | `() => Promise<void>`                 | Refresh user from `/api/auth/me`|

### Token Storage

- **Remember me checked:** `localStorage` (persists across sessions)
- **Remember me unchecked:** `sessionStorage` (cleared on tab close)

### Toast Store (`src/store/toast.ts`)

| Method      | Signature                              | Description         |
|-------------|----------------------------------------|---------------------|
| `showToast` | `(message: string, type: string) => void` | Display toast notification |

---

## Guards

### Guard Component (`src/components/Guard.tsx`)

Wraps protected routes. Redirects to `/login` if not authenticated.

```tsx
<Guard>
  <ProtectedComponent />
</Guard>
```

### ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)

Alternative route-level protection (if used).

---

## Error/Loading/Empty States

### Loader (`src/components/Loader.tsx`)

Spinner component for loading states.

### EmptyState (`src/components/EmptyState.tsx`)

Displayed when lists are empty. Typically includes:
- Illustration or icon
- Message text
- Optional action button

### Error Handling

- API errors caught in components
- Toast notifications via `useToastStore`
- 401 responses trigger global handler (clear auth, redirect to login)

The 401 handler is set up in `App.tsx`:

```tsx
set401Handler(() => {
  clearAuth();
  showToast('Session expired. Please log in again.', 'error');
  navigate('/login', { replace: true });
});
```

---

## API Client

### HTTP Client (`src/api/http.ts`)

Base fetch wrapper with:
- Base URL from `VITE_API_BASE` (default: `http://localhost:8081`)
- JSON content type
- Bearer token injection
- Response error handling

### Endpoints (`src/api/endpoints.ts`)

| Namespace        | Function           | Method | Endpoint                          |
|------------------|--------------------|--------|-----------------------------------|
| **authApi**      | `login`            | POST   | `/api/auth/login`                 |
|                  | `register`         | POST   | `/api/auth/register`              |
|                  | `me`               | GET    | `/api/auth/me`                    |
| **categoryApi**  | `list`             | GET    | `/api/categories`                 |
|                  | `create`           | POST   | `/api/categories`                 |
|                  | `delete`           | DELETE | `/api/categories/{id}`            |
| **accountApi**   | `list`             | GET    | `/api/accounts`                   |
|                  | `create`           | POST   | `/api/accounts`                   |
|                  | `delete`           | DELETE | `/api/accounts/{id}`              |
| **transactionApi** | `list`           | GET    | `/api/transactions`               |
|                  | `create`           | POST   | `/api/transactions`               |
|                  | `update`           | PUT    | `/api/transactions/{id}`          |
|                  | `delete`           | DELETE | `/api/transactions/{id}`          |
|                  | `importCsv`        | POST   | `/api/transactions/import`        |
|                  | `bulkAction`       | POST   | `/api/transactions/bulk`          |
| **budgetApi**    | `list`             | GET    | `/api/budgets`                    |
|                  | `create`           | POST   | `/api/budgets`                    |
|                  | `update`           | PUT    | `/api/budgets/{id}`               |
|                  | `delete`           | DELETE | `/api/budgets/{id}`               |
|                  | `summary`          | GET    | `/api/budgets/summary`            |
| **insightApi**   | `analyze`          | POST   | `/api/insights/analyze`           |
|                  | `monthly`          | GET    | `/api/insights/monthly`           |
| **reportApi**    | `pdf`              | GET    | `/api/reports/pdf`                |

---

## UI Components

### Layout

| Component | Path                          | Description                      |
|-----------|-------------------------------|----------------------------------|
| Shell     | `src/components/Shell.tsx`    | Main layout with header + sidebar|
| Header    | `src/components/Header.tsx`   | Top navigation bar               |

### Common

| Component  | Path                           | Description                     |
|------------|--------------------------------|---------------------------------|
| Card       | `src/components/Card.tsx`      | Container card component        |
| Modal      | `src/components/Modal.tsx`     | Dialog/modal overlay            |
| Loader     | `src/components/Loader.tsx`    | Loading spinner                 |
| EmptyState | `src/components/EmptyState.tsx`| Empty list placeholder          |
| Toast      | `src/components/Toast.tsx`     | Toast notification              |

### Feature Components

| Component    | Path                               | Description                    |
|--------------|------------------------------------|--------------------------------|
| FeatureGate  | `src/components/FeatureGate.tsx`   | Feature flag wrapper           |
| Guard        | `src/components/Guard.tsx`         | Auth guard wrapper             |
| ProtectedRoute | `src/components/ProtectedRoute.tsx` | Route-level auth guard      |

### Page-Specific

| Page           | Notable UI Elements                              |
|----------------|--------------------------------------------------|
| Dashboard      | AreaChart (recharts), health status indicators   |
| Transactions   | Paginated table, filter dropdowns, bulk actions  |
| Budgets        | Progress bars, month/year selector, modal forms  |
| Categories     | Color picker, list with delete                   |
| InsightsPage   | Tabs (merchants/anomalies), BarChart, LineChart  |
| CSVImportPage  | File upload, header mapper, preview table        |
| OnboardingPage | Multi-step wizard, demo data toggle              |

---

## CSV Import Mapper (v2)

Located in `src/pages/CSVImportPage.tsx` (917 lines)

### Steps

1. **Upload** – Select CSV file and target account
2. **Map Headers** – Match CSV columns to transaction fields
3. **Preview** – Review parsed rows with:
   - AI category suggestions
   - Duplicate detection
   - Row selection checkboxes
4. **Importing** – Progress indicator
5. **Complete** – Success summary

### Key Features

- Auto-detection of common CSV formats
- Category suggestions with confidence scores
- Duplicate highlighting (hash-based)
- Selective row import

---

## PWA Artefacts

### manifest.webmanifest (`public/manifest.webmanifest`)

```json
{
  "name": "FinSmart - Personal Finance Manager",
  "short_name": "FinSmart",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512" }
  ],
  "shortcuts": [
    { "name": "Dashboard", "url": "/dashboard" },
    { "name": "Transactions", "url": "/transactions" },
    { "name": "Budgets", "url": "/budgets" }
  ]
}
```

### Service Worker

**Status:** Not found in codebase (PWA manifest exists but no SW implementation)

The `VITE_FEATURE_PWA` flag exists but service worker is not yet implemented.

---

## Feature Flags (Client)

Read from `VITE_FEATURE_*` environment variables via `src/config/features.ts`.

| Flag             | Env Variable                    | Used By                    |
|------------------|---------------------------------|----------------------------|
| `demo`           | `VITE_FEATURE_DEMO`             | OnboardingPage             |
| `csvImportV2`    | `VITE_FEATURE_CSV_IMPORT_V2`    | CSVImportPage              |
| `budgetRollover` | `VITE_FEATURE_BUDGET_ROLLOVER`  | Budgets                    |
| `envelope`       | `VITE_FEATURE_ENVELOPE`         | (planned)                  |
| `insightsV2`     | `VITE_FEATURE_INSIGHTS_V2`      | InsightsPage               |
| `pwa`            | `VITE_FEATURE_PWA`              | (planned)                  |
| `exportCentre`   | `VITE_FEATURE_EXPORT_CENTRE`    | (planned)                  |
| `openBanking`    | `VITE_FEATURE_OB_OB_READONLY`   | (planned)                  |

### FeatureGate Usage

```tsx
<FeatureGate feature="insightsV2">
  <InsightsContent />
</FeatureGate>
```

---

## Dark Mode

**Status:** Unknown (not found in code)

No dark mode toggle or CSS variables found. The feature flag config mentions it
but implementation not present.

---

## Keyboard Shortcuts

**Status:** Unknown (not found in code)

No keyboard shortcut handlers found in the codebase.

---

## Charts Library

Uses **Recharts** for data visualisation:

| Chart Type    | Used In        | Data                        |
|---------------|----------------|-----------------------------|
| AreaChart     | Dashboard      | Monthly spending trend      |
| BarChart      | InsightsPage   | Merchant totals             |
| LineChart     | InsightsPage   | Monthly merchant trends     |

---

## File Structure

```
frontend/src/
├── api/
│   ├── endpoints.ts      # API function exports
│   ├── http.ts           # Fetch wrapper
│   └── types.ts          # TypeScript interfaces
├── components/
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   ├── FeatureGate.tsx
│   ├── Guard.tsx
│   ├── Header.tsx
│   ├── Loader.tsx
│   ├── Modal.tsx
│   ├── ProtectedRoute.tsx
│   ├── Shell.tsx
│   └── Toast.tsx
├── config/
│   └── features.ts       # Feature flags
├── hooks/
│   ├── useFeature.ts     # Feature flag hook
│   └── useToast.ts       # Toast hook
├── pages/
│   ├── Budgets.tsx
│   ├── Categories.tsx
│   ├── CSVImportPage.tsx
│   ├── Dashboard.tsx
│   ├── InsightsPage.tsx
│   ├── Login.tsx
│   ├── OnboardingPage.tsx
│   ├── Register.tsx
│   └── Transactions.tsx
├── store/
│   └── auth.ts           # Zustand auth store
├── styles/               # CSS files
├── utils/
│   └── format.ts         # Formatters (currency, date)
├── App.tsx               # Root component + routes
├── main.tsx              # Entry point
└── vite-env.d.ts         # Vite types
```

---

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [AI_SPEC.md](./AI_SPEC.md)
