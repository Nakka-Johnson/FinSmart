# FinSmart Frontend - Monthly Insights Enhancement

## Overview
Enhanced the FinSmart Dashboard to surface AI-powered monthly insights and enable PDF report downloads.

## Changes Made

### 1. **Type Definitions** (`frontend/src/api/types.ts`)
Added TypeScript interfaces for Monthly Insights feature:

- `TopCategory` - Category name and total spending
- `Anomaly` - Transaction anomalies with z-score detection
- `Forecast` - Category-based spending forecasts
- `MonthlyInsight` - Complete monthly insights DTO

### 2. **API Functions** (`frontend/src/api/endpoints.ts`)
Added new API client functions:

- `insightApi.monthly(params, token)` - Fetch monthly insights from `/api/insights/monthly`
  - Parameters: `{ month: number, year: number }`
  - Returns: `MonthlyInsight` object

- `reportApi.pdf(params, token)` - Download monthly PDF report from `/api/reports/pdf`
  - Parameters: `{ month: number, year: number }`
  - Downloads file with proper filename extraction from Content-Disposition header
  - Uses Blob API for browser-friendly download

### 3. **Formatting Utilities** (`frontend/src/utils/format.ts`)
Added GBP currency formatter:

- `currencyGBP(amount: number)` - Formats amounts in British Pounds (£)
  - Uses `en-GB` locale with GBP currency symbol
  - Fixed 2 decimal places

### 4. **Dashboard Enhancement** (`frontend/src/pages/Dashboard.tsx`)
Added comprehensive "Monthly Insights" panel with:

#### State Management
- `selectedMonth` - Current month selection (1-12)
- `selectedYear` - Current year selection (±2 years from now)
- `monthlyInsight` - Loaded insights data
- `monthlyLoading` - Loading state for insights fetch
- `pdfDownloading` - Loading state for PDF download

#### UI Components
- **Month/Year Selectors**: Dropdown menus for date selection (defaults to current month/year)
- **Action Buttons**:
  - "Refresh Insights" - Reload insights for selected month/year
  - "Download Monthly Report (PDF)" - Trigger PDF download

#### Data Display
- **Summary Section**: Shows Total Debit (red), Total Credit (green), Biggest Category
- **Top 5 Categories Table**: Lists highest spending categories with totals
- **Anomalies Table**: Displays unusual transactions with:
  - Date, Category, Amount, Z-Score
  - Row highlighting for anomalies with z-score > 2.5 (red background)
- **Forecast Table**: Shows predicted next-month spending by category with forecasting method

#### Features
- Auto-loads insights on mount and when month/year changes
- Responsive design with flex layout
- Loading states with disabled buttons during operations
- Toast notifications for errors
- Empty states for no data scenarios

## Integration Points

### Backend Endpoints Used
1. `GET /api/insights/monthly?month={month}&year={year}`
   - Returns: `MonthlyInsightDTO` with totals, categories, anomalies, forecasts

2. `GET /api/reports/pdf?month={month}&year={year}`
   - Returns: PDF file (application/pdf)
   - Filename: `FinSmart_Monthly_Report_{month}_{year}.pdf`

### Authentication
All API calls use JWT token from `useAuthStore()` hook with `Authorization: Bearer {token}` header.

### Error Handling
- Network errors caught and displayed via toast notifications
- Loading states prevent duplicate requests
- Graceful degradation for missing data

## Testing Checklist

- [ ] Navigate to Dashboard after login
- [ ] Verify Monthly Insights panel renders
- [ ] Select different months/years
- [ ] Click "Refresh Insights" - verify data loads
- [ ] Verify summary displays correct totals
- [ ] Verify Top Categories table shows up to 5 entries
- [ ] Verify Anomalies table highlights high z-scores
- [ ] Verify Forecast table displays predictions
- [ ] Click "Download Monthly Report (PDF)" - verify file downloads
- [ ] Verify PDF filename format is correct
- [ ] Test with month that has no data - verify empty state
- [ ] Test error scenarios (backend down) - verify toast errors
- [ ] Verify loading states work correctly

## Dependencies
- React 19.1.1
- TypeScript 5.9.3
- Recharts 2.15.0 (for charts)
- Existing FinSmart API infrastructure

## File Summary
**Modified Files:**
- `frontend/src/api/types.ts` (+40 lines)
- `frontend/src/api/endpoints.ts` (+50 lines)
- `frontend/src/utils/format.ts` (+8 lines)
- `frontend/src/pages/Dashboard.tsx` (+230 lines)

**Total Lines Added:** ~328 lines
**Compilation Status:** ✅ No errors, no warnings
**Type Safety:** ✅ Full TypeScript coverage

## Next Steps
1. Start backend: `cd backend && mvn spring-boot:run` (port 8081)
2. Start AI service: `cd ai && uvicorn main:app --reload` (port 8001)
3. Start frontend: `cd frontend && npm run dev` (port 5173)
4. Test complete flow: Login → Dashboard → Select month → View insights → Download PDF

## Notes
- Month selector uses full month names (January, February, etc.)
- Year selector shows current year ±2 years (5-year range)
- PDF download extracts filename from server's Content-Disposition header
- All currency formatting uses GBP (£) for consistency
- Z-scores above 2.5 highlighted to indicate significant anomalies
- Forecast method displays (SMA3 or lastValue) for transparency
