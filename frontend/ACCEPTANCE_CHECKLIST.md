# FinSmart Frontend - Acceptance Checklist

## Prerequisites
- [ ] Backend running on http://localhost:8080
- [ ] AI service running on http://127.0.0.1:8001 (optional)
- [ ] PostgreSQL database initialized with schema
- [ ] Frontend dev server running: `npm run dev`

## 1. Authentication & Routing
- [ ] Navigate to http://localhost:5173
- [ ] Redirects to `/login` when not authenticated
- [ ] Login form validates email format
- [ ] Login form requires password
- [ ] Successful login shows toast: "Login successful!"
- [ ] After login, redirects to `/dashboard`
- [ ] Header shows user email
- [ ] Logout button clears auth and redirects to `/login`
- [ ] Direct navigation to protected routes redirects to `/login` when not authenticated

## 2. Dashboard Page
- [ ] **Health Checks**:
  - [ ] Backend status chip shows "UP" (green) when API is running
  - [ ] AI Service status chip shows "UP" (green) when AI is running
  - [ ] Shows "DOWN" (red) when services are stopped
  
- [ ] **30-Day Stats**:
  - [ ] "30-Day Spending" card displays total OUT transactions
  - [ ] "30-Day Income" card displays total IN transactions
  - [ ] "Net" card shows difference (Income - Spending)
  - [ ] All amounts formatted with currency symbol
  
- [ ] **Monthly Chart**:
  - [ ] Area chart renders with 6 months of data
  - [ ] X-axis shows month labels (YYYY-MM format)
  - [ ] Y-axis shows amount values
  - [ ] Tooltip shows formatted currency on hover
  - [ ] Shows "No data available" when no transactions exist
  
- [ ] **AI Insights**:
  - [ ] "Run Sample Insight" button disabled when AI service is DOWN
  - [ ] Button shows "Generating..." during analysis
  - [ ] Success toast appears after analysis
  - [ ] Summary displays in gray box below button
  - [ ] Error toast if AI service fails

## 3. Transactions Page
- [ ] **Filter Bar**:
  - [ ] Account dropdown populated from user accounts
  - [ ] Category dropdown populated from user categories
  - [ ] Direction dropdown: All/Income/Expense
  - [ ] Start date picker works
  - [ ] End date picker works
  - [ ] Filters reset page to 0
  
- [ ] **Transaction List**:
  - [ ] Table shows: Date, Amount, Direction, Category, Description
  - [ ] Amount formatted with currency symbol
  - [ ] Direction badge: green for IN, red for OUT
  - [ ] Shows "No transactions found" when empty
  - [ ] Loading spinner appears during fetch
  
- [ ] **Pagination**:
  - [ ] Shows "Page X of Y"
  - [ ] Previous button disabled on first page
  - [ ] Next button disabled on last page
  - [ ] Page changes update URL and fetch new data
  
- [ ] **Add Transaction**:
  - [ ] "Add Transaction" button opens modal
  - [ ] Modal has: Account, Category, Amount, Direction, Date, Description
  - [ ] All required fields validated
  - [ ] Amount accepts decimals (e.g., 12.50)
  - [ ] Cancel button closes modal
  - [ ] Submit creates transaction and refreshes list
  - [ ] Success toast: "Transaction added"
  
- [ ] **Edit Transaction**:
  - [ ] Edit button opens modal with pre-filled values
  - [ ] Changes save correctly
  - [ ] Success toast: "Transaction updated"
  
- [ ] **Delete Transaction**:
  - [ ] Delete button shows confirmation prompt
  - [ ] Cancel keeps transaction
  - [ ] Confirm deletes and refreshes list
  - [ ] Success toast: "Transaction deleted"

## 4. Budgets Page
- [ ] **Month/Year Selector**:
  - [ ] Month dropdown shows all 12 months
  - [ ] Year input accepts 4-digit years
  - [ ] Defaults to current month/year
  - [ ] Changing period fetches new budgets
  
- [ ] **Summary Grid**:
  - [ ] Each budget shows: Category name, Spent/Limit, Progress bar
  - [ ] Progress bar colors:
    - [ ] Blue when < 80%
    - [ ] Yellow when 80-99%
    - [ ] Red when ≥ 100%
  - [ ] Shows "Over budget by $X.XX" in red when exceeded
  - [ ] Grid responsive (wraps on smaller screens)
  
- [ ] **Manage Budgets**:
  - [ ] Table lists all budgets for selected period
  - [ ] Shows category name and amount
  - [ ] Edit button opens modal with values
  - [ ] Delete button shows confirmation
  
- [ ] **Add Budget**:
  - [ ] "Add Budget" button opens modal
  - [ ] Category dropdown filters EXPENSE categories only
  - [ ] Amount field accepts decimals
  - [ ] Period shows selected month/year (read-only display)
  - [ ] Submit creates budget and updates summary
  - [ ] Success toast: "Budget created"

## 5. Categories Page
- [ ] **Category List**:
  - [ ] Table shows: Name, Type, Created, Actions
  - [ ] Color badge next to name (green=INCOME, red=EXPENSE)
  - [ ] Type badge colored: green for INCOME, red for EXPENSE
  - [ ] Created date formatted properly
  
- [ ] **Add Category**:
  - [ ] "Add Category" button opens modal
  - [ ] Name field required
  - [ ] Type dropdown: Income/Expense
  - [ ] Submit creates category
  - [ ] Success toast: "Category created"
  
- [ ] **Duplicate Handling**:
  - [ ] Creating duplicate category name shows toast: "Category already exists"
  - [ ] Modal stays open to allow editing
  - [ ] Error is specific (not generic 409 error)
  
- [ ] **Delete Category**:
  - [ ] Delete button shows confirmation
  - [ ] Confirm deletes category
  - [ ] Success toast: "Category deleted"

## 6. UI/UX Components
- [ ] **Header**:
  - [ ] Shows "FinSmart • user@email.com"
  - [ ] Nav links: Dashboard, Transactions, Budgets, Categories
  - [ ] Active link highlighted with blue background
  - [ ] Logout button on right side
  
- [ ] **Toast Notifications**:
  - [ ] Success toasts: green background
  - [ ] Error toasts: red background
  - [ ] Auto-dismiss after 3 seconds
  - [ ] Slide-in animation from top
  - [ ] Click to dismiss early
  
- [ ] **Modals**:
  - [ ] Overlay darkens background
  - [ ] Click outside modal to close
  - [ ] Header with title and close button (×)
  - [ ] Body with form fields
  - [ ] Footer with Cancel and Submit buttons
  
- [ ] **Loader**:
  - [ ] Animated spinning circle
  - [ ] Centers in container
  - [ ] Shows during data fetches
  
- [ ] **Cards**:
  - [ ] White background with border
  - [ ] Optional title at top
  - [ ] Shadow on hover

## 7. Code Quality
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run format:check` - no issues
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] No 404 errors in network tab
- [ ] All API calls use proper auth headers

## 8. Responsive Design
- [ ] Dashboard stats grid stacks on mobile
- [ ] Filter bar wraps on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Modal fits on mobile screen
- [ ] Header logo and nav readable on mobile

## 9. Error Handling
- [ ] Network errors show toast messages
- [ ] 401 errors redirect to login
- [ ] 404 errors show appropriate message
- [ ] 409 conflicts handled gracefully (categories)
- [ ] Validation errors show below fields
- [ ] Loading states prevent duplicate submissions

## 10. Environment & Documentation
- [ ] `.env.development.sample` exists with both variables
- [ ] `README.md` updated with:
  - [ ] Project structure
  - [ ] Run commands
  - [ ] Route map
  - [ ] Environment variables
  - [ ] Feature descriptions
  - [ ] API integration examples

---

## Quick Test Flow

1. **Login** → john@example.com / SuperSecret123!
2. **Dashboard** → Verify health checks, stats, chart loads
3. **Run Insight** → Verify AI analysis works
4. **Transactions** → Add new transaction, edit, delete
5. **Budgets** → Add budget, verify progress bar colors
6. **Categories** → Add category, try duplicate (409), delete
7. **Logout** → Verify redirect to login
8. **Protected Route** → Try accessing /dashboard → should redirect to login

## Expected Final State
✅ All pages functional  
✅ All CRUD operations working  
✅ Toast notifications appearing  
✅ Loading states showing  
✅ Auth flow complete  
✅ No TypeScript errors  
✅ No lint errors  
✅ Clean browser console
