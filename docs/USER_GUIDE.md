# User Guide

Complete guide to using FinSmart - your personal finance management platform with AI-powered insights.

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Authentication](#user-authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Transactions](#managing-transactions)
5. [Budget Management](#budget-management)
6. [Category Management](#category-management)
7. [AI Insights & Reports](#ai-insights--reports)
8. [CSV Import Guide](#csv-import-guide)
9. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### System Requirements

**For Users (Browser Access):**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection
- JavaScript enabled

**For Self-Hosting:**
- See [README.md](../README.md) for deployment prerequisites

### Accessing FinSmart

1. Navigate to your FinSmart URL (e.g., `http://localhost:5173` for development)
2. You'll be presented with the login screen
3. If you don't have an account, click "Register" to create one

---

## User Authentication

### Creating an Account

1. Click **"Register"** on the login page
2. Fill in the registration form:
   - **Email**: Your email address (must be unique)
   - **Password**: Secure password (minimum 8 characters)
   - **Full Name**: Your display name (optional)
3. Click **"Register"**
4. Upon successful registration, you'll be automatically logged in

**Password Requirements:**
- Minimum 8 characters
- Use a strong, unique password
- Password is securely hashed and never stored in plain text

### Logging In

1. Enter your **email** and **password**
2. Click **"Login"**
3. You'll be redirected to the Dashboard

**Session Management:**
- Sessions last 60 minutes by default
- Your session is stored in browser session storage
- You'll be automatically logged out when your session expires
- Closing the browser tab will end your session

### Logging Out

Click the **"Logout"** button in the top navigation bar.

---

## Dashboard Overview

The Dashboard is your home screen and provides a quick overview of your financial status.

### Health Status Indicators

Located at the top of the dashboard:

- **Backend: UP/DOWN** - Status of the API server
- **AI Service: UP/DOWN** - Status of the AI insights service

**Status Colors:**
- 🟢 Green (UP): Service is operational
- 🔴 Red (DOWN): Service is unavailable
- 🟡 Yellow (CHECKING): Status check in progress

### 30-Day Statistics

Three key metrics for the last 30 days:

1. **30-Day Spending**: Total amount spent (outgoing transactions)
2. **30-Day Income**: Total amount earned (incoming transactions)
3. **Net**: Difference between income and spending

**Color Coding:**
- Red text: Expenses
- Green text: Income
- Blue/Black text: Net balance

### Monthly Spending Trend Chart

Visual representation of your spending over the last 6 months:

- **X-axis**: Month (YYYY-MM format)
- **Y-axis**: Total spending amount
- **Hover**: See exact amount for each month
- Blue area chart shows spending trends

### AI Insights Section

#### Sample Insight Demo

Click **"Run Sample Insight"** to see a demo of AI-powered analysis:
- Analyzes sample transaction data
- Shows AI-generated summary
- Requires AI service to be UP

#### Monthly Insights

1. **Select Month & Year**:
   - Use dropdown menus to choose the period
   - Default: Current month and year

2. **View Insights**:
   - Click **"Refresh Insights"** to load data
   - System analyzes your actual transaction data

3. **Insights Displayed**:
   
   **Summary Section:**
   - Total Debit (spending)
   - Total Credit (income)
   - Biggest spending category
   
   **Top 5 Categories:**
   - Table showing highest spending categories
   - Sorted by total amount
   
   **Detected Anomalies:**
   - Unusual transactions based on your patterns
   - Z-Score indicates how unusual (higher = more unusual)
   - Highlighted in red if Z-Score > 2.5
   - Helps identify potential fraud or one-time expenses
   
   **Next Month Forecast:**
   - Predicted spending by category
   - Based on historical patterns
   - Uses moving average method

4. **Download PDF Report**:
   - Click **"Download Monthly Report (PDF)"**
   - Generates a formatted PDF with all insights
   - Opens browser download dialog

---

## Managing Transactions

Transactions are the core of FinSmart - they represent money moving in or out of your accounts.

### Viewing Transactions

Navigate to **"Transactions"** in the main menu.

#### Transaction List

- Shows 20 transactions per page
- Default sort: Newest first (by posted date)
- Each transaction shows:
  - Date
  - Description
  - Amount (with direction badge)
  - Category
  - Account
  - Merchant (if provided)

**Direction Badges:**
- 🟢 **IN** (Green): Money coming in (income, deposit, refund)
- 🔴 **OUT** (Red): Money going out (expense, payment)

#### Pagination

- **Previous** / **Next** buttons at bottom
- Shows current page and total pages
- "No transactions found" message if list is empty

### Filtering Transactions

Use the filter section to narrow down results:

1. **Account**: Filter by specific account
2. **Category**: Filter by category
3. **Direction**: 
   - All (default)
   - IN (income only)
   - OUT (expenses only)
4. **Start Date**: Show transactions from this date onward
5. **End Date**: Show transactions up to this date

**Tips:**
- Combine filters for precise searches
- Clear filters by selecting "All Accounts" / "All Categories"
- Date filters are inclusive

### Creating a Transaction

1. Click **"Add Transaction"** button
2. Fill in the form:
   - **Account** ⚠️ Required: Choose which account
   - **Category**: Assign a category (optional but recommended)
   - **Amount** ⚠️ Required: Enter positive number
   - **Direction** ⚠️ Required: IN or OUT
   - **Date**: When the transaction occurred (defaults to today)
   - **Description**: What the transaction was for
   - **Merchant**: Where the transaction occurred
   - **Notes**: Additional details (for your reference only)

3. Click **"Save"**

**Validation:**
- Amount must be 0 or positive
- Date must be valid
- All required fields must be filled

**Tips:**
- Use consistent merchant names for better insights
- Categorize transactions for accurate budget tracking
- Add notes for unusual transactions

### Editing a Transaction

1. Click the **"Edit"** button next to any transaction
2. Modify the fields in the form
3. Click **"Save"** to update

**Note:** Transaction ID and created timestamp cannot be changed.

### Deleting a Transaction

1. Click the **"Delete"** button next to any transaction
2. Confirm the deletion (if prompted)
3. Transaction is permanently removed

⚠️ **Warning**: Deletions cannot be undone. Make sure before deleting.

---

## Budget Management

Budgets help you track spending limits for different categories each month.

### Viewing Budgets

Navigate to **"Budgets"** in the main menu.

#### Budget List

Shows all budgets for the selected month/year:
- Category name
- Limit amount (your budget goal)
- Spent amount (actual spending)
- Percentage (spent/limit)
- Progress bar with color coding

**Color Coding:**
- 🔵 Blue: < 80% of budget (on track)
- 🟡 Yellow: 80-99% of budget (approaching limit)
- 🔴 Red: ≥ 100% (over budget)

#### Month/Year Selection

Use dropdowns at the top to:
- View budgets for different months
- Plan future budgets
- Review past budget performance

### Creating a Budget

1. Click **"Create Budget"** button
2. Fill in the form:
   - **Category** ⚠️ Required: Choose category to budget
   - **Month** ⚠️ Required: 1-12 (January-December)
   - **Year** ⚠️ Required: Must be 2000 or later
   - **Limit Amount** ⚠️ Required: Your spending limit

3. Click **"Create"**

**Validation:**
- Each category can only have one budget per month/year
- Limit amount must be 0 or positive
- System will show error if budget already exists

**Tips:**
- Start with realistic budgets based on past spending
- Review and adjust budgets monthly
- Use budget summary to identify problem areas

### Editing a Budget

1. Click **"Edit"** button next to budget
2. Modify the limit amount (or other fields)
3. Click **"Save"**

**Note:** To change the category or period, delete and create a new budget.

### Deleting a Budget

1. Click **"Delete"** button next to budget
2. Budget is removed
3. Historical spending data is not affected

---

## Category Management

Categories help organize transactions by type (e.g., Groceries, Rent, Salary).

### Viewing Categories

Navigate to **"Categories"** in the main menu.

#### Category List

Shows all available categories:
- Category name
- Color badge (visual identifier)

**Default Categories** (pre-seeded):
- Groceries
- Transportation
- Utilities
- Entertainment
- Healthcare
- Dining Out
- Shopping
- Housing
- Salary
- Investment Income
- Miscellaneous

### Creating a Category

1. Click **"Add Category"** button
2. Fill in the form:
   - **Name** ⚠️ Required: Unique category name (1-100 characters)
   - **Color** ⚠️ Required: Hex color code (e.g., #FF5733)

3. Click **"Create"**

**Validation:**
- Name must be unique across all categories
- Color must be valid hex format: #RRGGBB
- System will show error if category name exists

**Color Suggestions:**
- Expenses: Red/Orange tones (#FF5733, #FF8C00)
- Income: Green tones (#4CAF50, #8BC34A)
- Neutral: Blue/Grey tones (#2196F3, #607D8B)

**Tips:**
- Use descriptive category names
- Choose distinct colors for easy visual identification
- Group similar expenses under one category

### Deleting a Category

1. Click **"Delete"** button next to category
2. Category is removed

**Important:**
- Transactions assigned to this category will have `null` category after deletion
- Budgets using this category will be deleted (CASCADE)
- Cannot be undone

---

## AI Insights & Reports

FinSmart uses artificial intelligence to analyze your spending patterns and provide actionable insights.

### Monthly Insights

**Location:** Dashboard → Monthly Insights section

#### What Are Insights?

AI-powered analysis that includes:

1. **Spending Summary**: Total debit/credit for the month
2. **Top Categories**: Your highest spending categories
3. **Anomaly Detection**: Unusual transactions that deviate from your patterns
4. **Spending Forecast**: Predicted spending for next month

#### How to Use Insights

1. Select month and year
2. Click "Refresh Insights"
3. Review the generated insights:
   
   **Top Categories Table:**
   - Shows where most of your money goes
   - Use this to set or adjust budgets
   
   **Anomalies Table:**
   - Z-Score indicates unusualness (0-3+)
   - High scores (>2.5) warrant review
   - May indicate one-time expenses or errors
   
   **Forecast Table:**
   - Predictions based on historical data
   - Helps with future budget planning
   - Method shown (e.g., "moving_average")

#### Understanding Anomalies

**Z-Score Interpretation:**
- **0-1**: Normal transaction
- **1-2**: Slightly unusual
- **2-2.5**: Unusual, worth noting
- **2.5+**: Highly unusual, review recommended

**Common Anomaly Causes:**
- One-time purchases (appliances, furniture)
- Annual payments (insurance, subscriptions)
- Travel expenses
- Medical emergencies
- Duplicate transactions (error)

### PDF Reports

**Location:** Dashboard → Download Monthly Report button

#### Generating a Report

1. Select month and year
2. Ensure you have transaction data for that month
3. Click **"Download Monthly Report (PDF)"**
4. PDF will download automatically

#### Report Contents

- **Header**: FinSmart logo and report period
- **User Information**: Your name and email
- **Summary Statistics**: Total debit, credit, net
- **Top Categories Chart**: Visual breakdown
- **Anomalies List**: Flagged transactions
- **Forecast Table**: Next month predictions

#### Use Cases

- Personal financial review
- Tax preparation documentation
- Expense reimbursement
- Financial planning sessions
- Record keeping

**Tips:**
- Generate reports monthly for consistent tracking
- Save PDFs for yearly financial reviews
- Share reports with financial advisors (if needed)

---

## CSV Import Guide

### Overview

⚠️ **Important Note**: CSV import UI is not yet implemented in the frontend. This section documents the expected CSV format for future implementation or for advanced users who want to import data via API.

CSV (Comma-Separated Values) import allows you to bulk-import transactions from other financial tools, bank statements, or spreadsheets.

### CSV Format Specification

FinSmart accepts CSV files with the following structure:

⚠️ **Important**: Use `DEBIT` for expenses and `CREDIT` for income. These match the backend API values. The frontend UI displays these as "OUT" and "IN" for simplicity.

#### Required Columns

| Column | Format | Description | Example |
|--------|--------|-------------|---------|
| `date` | YYYY-MM-DD | Transaction date | `2025-01-15` |
| `amount` | Decimal | Transaction amount (positive) | `45.50` |
| `direction` | DEBIT/CREDIT | Money direction (DEBIT=expense, CREDIT=income) | `DEBIT` |
| `description` | Text | Transaction description | `Grocery shopping` |
| `account_name` | Text | Account name (must exist) | `Main Checking` |

**Note on Direction Values**: Use `DEBIT` for expenses and `CREDIT` for income in CSV files. This matches the backend API. The frontend UI may display these as "OUT" and "IN" for simplicity.

**Note on Direction Values**: Use `DEBIT` for expenses and `CREDIT` for income in CSV files. This matches the backend API. The frontend UI may display these as "OUT" and "IN" for simplicity.

#### Optional Columns

| Column | Format | Description | Example |
|--------|--------|-------------|---------|
| `category_name` | Text | Category name (must exist) | `Groceries` |
| `merchant` | Text | Merchant name | `Tesco` |
| `notes` | Text | Additional notes | `Weekly shopping` |

### Example CSV File

```csv
date,amount,direction,description,account_name,category_name,merchant,notes
2025-01-15,45.50,DEBIT,Grocery shopping,Main Checking,Groceries,Tesco,Weekly shopping
2025-01-16,75.00,DEBIT,Gas station,Main Checking,Transportation,Shell,Filled up tank
2025-01-17,3000.00,CREDIT,Monthly salary,Main Checking,Salary,Employer,January payment
2025-01-18,12.99,DEBIT,Coffee,Credit Card,Dining Out,Starbucks,
2025-01-20,150.00,DEBIT,Electric bill,Main Checking,Utilities,British Gas,Monthly payment
```

### CSV Format Rules

1. **Header Row**: Must be present with exact column names (case-sensitive)
2. **Encoding**: UTF-8 (recommended) or ASCII
3. **Delimiter**: Comma (`,`)
4. **Quotes**: Use double quotes (`"`) for fields containing commas
5. **Date Format**: ISO 8601 format (YYYY-MM-DD)
6. **Amount Format**: 
   - Decimal number with up to 2 decimal places
   - Use period (`.`) as decimal separator
   - No currency symbols or commas
6. **Direction Format**: 
   - Use `DEBIT` for expenses (money going out)
   - Use `CREDIT` for income (money coming in)
   - Exactly `DEBIT` or `CREDIT` (case-sensitive)
8. **Empty Fields**: Optional fields can be empty but must have column

### Preparing Your CSV File

#### From Excel or Google Sheets

1. Organize data with correct column headers
2. Format dates as YYYY-MM-DD (use formula: `=TEXT(A2,"YYYY-MM-DD")`)
3. Format amounts as numbers (remove currency formatting)
4. Save as/Export to CSV format:
   - Excel: File → Save As → CSV (Comma delimited)
   - Google Sheets: File → Download → Comma-separated values

#### From Bank Export

Many banks provide CSV exports. You may need to:

1. **Map columns**: Rename bank columns to match FinSmart format
2. **Convert dates**: Transform bank date format to YYYY-MM-DD
3. **Convert amounts**: Remove currency symbols, format as decimal
4. **Add direction**: Add `direction` column based on debit/credit
5. **Add account_name**: Add column with your account name

**Example Mapping:**

| Bank Column | FinSmart Column | Transformation |
|-------------|-----------------|----------------|
| Transaction Date | date | Reformat to YYYY-MM-DD |
| Description | description | Direct copy |
| Debit | amount + direction | Amount → amount, "DR" → DEBIT |
| Credit | amount + direction | Amount → amount, "CR" → CREDIT |
| Balance | (ignore) | Not needed |

### Importing CSV Files

Since the CSV import UI is not yet implemented, you have two options:

#### Using API Endpoint (Advanced Users)

If you're comfortable with command-line tools:

```bash
# Create a transaction via API for each CSV row
curl -X POST http://localhost:8081/api/transactions \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-uuid-here",
    "postedAt": "2025-01-15T00:00:00Z",
    "amount": 45.50,
    "direction": "DEBIT",
    "description": "Grocery shopping",
    "categoryId": "category-uuid-here",
    "merchant": "Tesco",
    "notes": "Weekly shopping"
  }'
```

#### Manual Import Alternative

For smaller datasets, manually create transactions:
1. Navigate to Transactions page
2. Click "Add Transaction" for each CSV row
3. Copy data from CSV to form fields

### CSV Import Best Practices

1. **Validate Data First**:
   - Check dates are in correct format
   - Verify amounts are positive numbers
   - Ensure accounts and categories exist in system

2. **Create Accounts & Categories First**:
   - Add all necessary accounts before import
   - Create all categories referenced in CSV

3. **Backup Before Import**:
   - Export existing transactions (if possible)
   - Test with small CSV file first (5-10 rows)

4. **Handle Duplicates**:
   - FinSmart doesn't auto-detect duplicates
   - Check for existing transactions before import
   - Use date + amount + description to identify duplicates

5. **Split Large Files**:
   - Import in batches of 100-500 transactions
   - Easier to troubleshoot errors
   - Reduces memory usage

### CSV Import Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid date format | Date not in YYYY-MM-DD | Reformat dates in Excel: `=TEXT(A2,"YYYY-MM-DD")` |
| Account not found | account_name doesn't exist | Create account first or fix name spelling |
| Category not found | category_name doesn't exist | Create category first or remove category column |
| Invalid direction | Not "DEBIT" or "CREDIT" | Change to exactly `DEBIT` or `CREDIT` (case-sensitive) |
| Invalid amount | Negative or non-numeric | Ensure positive number with max 2 decimals |
| Missing required field | Empty date, amount, etc. | Fill in all required columns |

---

## Tips & Best Practices

### Getting Started Right

1. **Create Your Accounts First**:
   - Add all bank accounts, credit cards, savings
   - Use consistent naming (e.g., "Chase Checking" not "checking")

2. **Set Up Categories**:
   - Review default categories
   - Add any custom categories you need
   - Use distinct colors for easy identification

3. **Start with Current Month**:
   - Begin tracking from today forward
   - Optionally import last 1-3 months of history
   - Don't try to import years of data at once

### Transaction Management

1. **Regular Entry**:
   - Enter transactions weekly (or more frequently)
   - Don't let backlog build up
   - Review bank statements to catch missed items

2. **Categorization**:
   - Categorize every transaction
   - Use consistent categories
   - Review uncategorized transactions monthly

3. **Add Details**:
   - Use merchant field for better tracking
   - Add notes for unusual transactions
   - Include reference numbers for important transactions

### Budget Management

1. **Start Conservative**:
   - Set realistic budgets based on past spending
   - Easier to loosen than tighten budgets
   - Adjust monthly based on actual spending

2. **Monitor Progress**:
   - Check budget summary weekly
   - Look for yellow/red progress bars
   - Adjust spending if approaching limit

3. **Budget Categories**:
   - Focus on variable expenses (groceries, dining)
   - Don't budget fixed expenses (rent) - track separately
   - Budget "fun money" to avoid burnout

### Using Insights Effectively

1. **Monthly Review Routine**:
   - Generate insights on the 1st of each month
   - Review anomalies and investigate unusual transactions
   - Compare actual vs. forecast from previous month

2. **Forecast Planning**:
   - Use forecasts to plan next month's budget
   - Adjust for known upcoming expenses
   - Save forecasts in PDF reports for tracking

3. **Anomaly Investigation**:
   - High Z-scores (>2.5) warrant investigation
   - Check for duplicate entries
   - Verify large one-time purchases
   - Update categories if needed

### Data Quality

1. **Consistent Naming**:
   - Use same merchant names (e.g., always "Shell" not "Shell Gas")
   - Standardize account names
   - Use title case for descriptions

2. **Accurate Dates**:
   - Use transaction post date (not authorization date)
   - Be consistent with timing
   - Align with bank statement dates

3. **Regular Audits**:
   - Monthly: Review all transactions for accuracy
   - Quarterly: Reconcile with bank statements
   - Yearly: Archive/export data for records

### Security & Privacy

1. **Strong Passwords**:
   - Use unique password for FinSmart
   - Minimum 12 characters recommended
   - Consider using password manager

2. **Session Management**:
   - Log out when using shared computers
   - Session expires after 60 minutes of inactivity
   - Don't share your account credentials

3. **Data Privacy**:
   - Your data is stored securely in PostgreSQL
   - Passwords are hashed with BCrypt
   - Audit logs track all data changes

### Performance Tips

1. **Large Transaction Lists**:
   - Use filters to narrow results
   - Pagination loads faster than full lists
   - Search by date range for older transactions

2. **PDF Reports**:
   - Generate reports only when needed
   - Reports are created on-demand (not cached)
   - Large datasets may take 5-10 seconds

3. **Browser Performance**:
   - Clear browser cache occasionally
   - Modern browsers work best
   - Disable unnecessary browser extensions

### Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search (if available) |
| `Esc` | Close modals/forms |
| `Enter` | Submit active form |

---

## Mobile Usage

FinSmart is optimized for desktop browsers. Mobile support is limited but functional:

- **Recommended**: Use landscape orientation on tablets
- **Touch**: All buttons are touch-friendly
- **Forms**: Use native mobile keyboards for input
- **Charts**: May have limited interactivity on small screens

---

## Getting Help

1. **Check Documentation**:
   - [Troubleshooting Guide](./TROUBLESHOOTING.md)
   - [API Reference](./API_REFERENCE.md)
   - [Architecture](./ARCHITECTURE.md)

2. **System Health**:
   - Check Dashboard health indicators
   - Verify backend and AI service are UP

3. **Browser Console**:
   - Open browser developer tools (F12)
   - Check console for error messages
   - Share error messages when reporting issues

---

## Next Steps

- **Set Up Accounts**: Navigate to Dashboard and create your financial accounts
- **Add Transactions**: Start tracking your spending
- **Create Budgets**: Set spending limits for categories
- **Review Insights**: Generate AI-powered insights monthly

**Happy budgeting! 💰**
