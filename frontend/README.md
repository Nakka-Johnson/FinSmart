# FinSmart Frontend

Modern React TypeScript frontend for the FinSmart personal finance management application.

## 🚀 Tech Stack

- **React 19** - UI library
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 7** - Build tool and dev server
- **React Router 7** - Client-side routing
- **Zustand** - Lightweight state management
- **ESLint + Prettier** - Code quality and formatting

## 📁 Project Structure

```
src/
├── api/              # API client and endpoints
│   ├── http.ts       # HTTP client with auth injection
│   ├── endpoints.ts  # Typed API functions
│   └── types.ts      # API type definitions
├── components/       # Reusable components
│   ├── Shell.tsx     # App layout wrapper with header
│   ├── Guard.tsx     # Protected route component
│   ├── Header.tsx    # Navigation header with logout
│   ├── Toast.tsx     # Toast notification component
│   ├── Card.tsx      # Card container component
│   └── Loader.tsx    # Loading spinner component
├── pages/            # Route pages
│   ├── Login.tsx     # User login
│   ├── Dashboard.tsx # Health checks & insights
│   ├── Transactions.tsx # Transaction CRUD
│   ├── Budgets.tsx   # Budget management
│   └── Categories.tsx # Category management
├── hooks/            # Custom React hooks
│   └── useToast.ts   # Toast notification hook
├── store/            # Zustand state management
│   └── auth.ts       # Auth token & user state
├── styles/           # Styles
│   └── app.css       # Global application styles
├── utils/            # Utility functions
│   └── format.ts     # Currency & date formatting
├── App.tsx           # Root component with routing
└── main.tsx          # Entry point
```

## 🔧 Environment Variables

Create `.env.development` (or copy from `.env.development.sample`):

```bash
# Backend API URL (default: http://localhost:8080)
VITE_API_BASE=http://localhost:8080

# AI Service URL (default: http://127.0.0.1:8001)
VITE_AI_URL=http://127.0.0.1:8001
```

**Important:** All environment variables must be prefixed with `VITE_` to be exposed to the client.

## 🏃 How to Run

### Prerequisites

- Node.js 18+ and npm 9+
- Backend API running on port 8080 (or configured `VITE_API_BASE`)
- AI service running on port 8001 (optional, for insights feature)

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run linter
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🗺️ Route Map

| Route           | Component      | Description                        | Auth Required |
| --------------- | -------------- | ---------------------------------- | ------------- |
| `/login`        | Login          | User login page                    | No            |
| `/dashboard`    | Dashboard      | System health, stats & AI insights | Yes           |
| `/transactions` | Transactions   | Transaction list with filters & CRUD | Yes         |
| `/budgets`      | Budgets        | Budget management with progress bars | Yes         |
| `/categories`   | Categories     | Category CRUD with duplicate handling | Yes        |

All authenticated routes are wrapped with `Guard` component inside `Shell` layout. Unauthenticated users are redirected to `/login`.

## 🔐 Authentication Flow

1. **Login**: User submits credentials via `/api/auth/login`
2. **Token Storage**: JWT token stored in `sessionStorage` via Zustand auth store
3. **User Fetch**: After login, app fetches user details via `/api/auth/me`
4. **Auto-Injection**: HTTP client (`api/http.ts`) automatically injects `Authorization: Bearer <token>` header
5. **Route Protection**: `Guard` component checks auth state and redirects to `/login` if not authenticated
6. **User Display**: Header displays user email from auth store
7. **Logout**: Clears auth state and redirects to `/login`

## 🎨 Code Style

### ESLint Configuration

- TypeScript recommended rules
- React hooks rules (exhaustive deps)
- React Refresh plugin
- Import/order enforcement (minimal)
- Unused vars warning (with `_` prefix ignore)
- Console statements warning (except `warn`/`error`)

### Prettier Configuration

```json
{
  "printWidth": 100,
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "arrowParens": "avoid"
}
```

### Format Commands

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format

# Fix linting issues
npm run lint:fix
```

## 🔌 API Integration

All API calls go through the typed client in `src/api/`:

```typescript
// Example: Create a transaction
import { transactionApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';

const { token } = useAuthStore();
const transaction = await transactionApi.create(
  {
    accountId: 'uuid',
    categoryId: 'uuid',
    amount: 100.5,
    direction: 'OUT',
    description: 'Coffee shop',
    transactionDate: '2025-01-15',
  },
  token
);
```

### Available API Modules

- `authApi` - login, register, me
- `categoryApi` - list, create, delete
- `accountApi` - list, create, delete
- `transactionApi` - list (paginated), create, update, delete
- `budgetApi` - list, create, update, delete, summary
- `insightApi` - analyze (AI-powered)

## 🧪 Error Handling

The HTTP client throws `HttpError` instances with:

- `status` - HTTP status code (0 for network errors)
- `message` - Error message from backend or default
- `details` - Optional field-level validation errors

```typescript
import { HttpError } from '@/api/http';

try {
  await authApi.login({ email, password });
} catch (error) {
  if (error instanceof HttpError) {
    console.error(`HTTP ${error.status}: ${error.message}`);
    if (error.details) {
      // Field-level errors: { email: "Invalid format", ... }
    }
  }
}
```

## 📝 TypeScript Path Aliases

The project uses `@/` alias for `src/`:

```typescript
import { useAuthStore } from '@/store/authStore';
import { Toast } from '@/components/Toast';
```

Configured in:

- `tsconfig.app.json` - TypeScript paths
- `vite.config.ts` - Vite resolver

## 🎯 Features

### Dashboard

- **System Health**: Backend API and AI service status checks with UP/DOWN indicators
- **30-Day Stats**: Total spending, income, and net balance for last 30 days
- **Monthly Chart**: Area chart showing spending trends over 6 months (powered by Recharts)
- **AI Insights**: Run sample insight analysis on demo transactions

### Transactions

- **Paginated List**: 20 transactions per page with previous/next navigation
- **Advanced Filters**: Filter by account, category, direction (IN/OUT), date range
- **CRUD Operations**: Create, edit, and delete transactions via modal forms
- **Client Validation**: Required fields and proper date/amount formatting
- **Color Coding**: Badge indicators for income (green) vs expense (red)

### Budgets

- **Month/Year Selector**: Browse budgets for any month
- **Budget Summary**: Visual progress bars showing spent vs limit
- **Color Indicators**: 
  - Blue: < 80% of budget
  - Yellow: 80-99% of budget  
  - Red: ≥ 100% (over budget)
- **CRUD Operations**: Create, edit, and delete monthly budgets

### Categories

- **Type Management**: Separate INCOME and EXPENSE categories
- **Color Badges**: Visual type indicators
- **Duplicate Handling**: Special toast message for 409 conflicts: "Category already exists"
- **Simple CRUD**: Add and delete categories

### Components

- **Shell**: Layout wrapper with Header and Outlet for child routes
- **Guard**: Protected route wrapper that checks authentication
- **Card**: Reusable container with optional title
- **Loader**: Animated spinner with three sizes (small, medium, large)
- **Toast**: Auto-dismissing notifications for success/error messages

## 🛠️ Troubleshooting

### Port 5173 already in use

```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 3000
```

### API connection refused

- Ensure backend is running on `VITE_API_BASE` URL
- Check `.env.development` file exists and has correct URL
- Restart dev server after changing env vars

### Module resolution errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### ESLint exhaustive-deps warnings

- Add missing dependencies to `useEffect` arrays
- Or use `// eslint-disable-next-line react-hooks/exhaustive-deps` if intentional

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Output: dist/ folder
# Serves index.html with bundled JS/CSS

# Preview production build locally
npm run preview

# Deploy dist/ to static hosting (Netlify, Vercel, etc.)
```

### Environment Variables for Production

Set environment variables in your hosting provider:

- `VITE_API_BASE` - Production backend URL (e.g., `https://api.finsmart.com`)
- `VITE_AI_URL` - Production AI service URL

## 🤝 Contributing

1. Follow the existing code structure and naming conventions
2. Run `npm run lint` and `npm run format` before committing
3. Ensure all TypeScript errors are resolved
4. Test all routes and API integrations manually
5. Keep components small and focused (prefer composition)

## 📄 License

Private project - All rights reserved
