// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  email: string;
}

export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  token?: string | null;
}

// Category types
export interface CategoryResponse {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

// Account types
export interface AccountResponse {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  balance: number;
  currency: string;
  createdAt: string;
}

export interface AccountRequest {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  initialBalance?: number;
  currency?: string;
}

// Transaction types
export interface TransactionResponse {
  id: string;
  accountId: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  direction: 'IN' | 'OUT';
  description?: string;
  transactionDate: string;
  createdAt: string;
  // AI enhancement fields
  normalizedMerchant?: string;
  merchantConfidence?: number;
  predictedCategoryId?: string;
  categoryConfidence?: number;
  anomalyScore?: number;
}

export interface TransactionRequest {
  accountId: string;
  categoryId: string;
  amount: number;
  direction: 'IN' | 'OUT';
  description?: string;
  transactionDate: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// CSV Import types
export interface ImportPreviewRow {
  rowNumber: number;
  postedAt: string;
  amount: number;
  direction: string;
  description: string | null;
  merchant: string | null;
  originalCategory: string | null;
  suggestedCategory: string | null;
  categorizationReason: string | null;
}

export interface ImportPreviewError {
  rowNumber: number;
  message: string;
}

export interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ImportPreviewRow[];
  errors: ImportPreviewError[];
}

export interface ImportSuccessResponse {
  insertedCount: number;
}

export interface BulkActionResponse {
  affectedCount: number;
  message: string;
}

// Budget types
export interface BudgetResponse {
  id: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
}

export interface BudgetRequest {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export interface BudgetSummary {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
  percentUsed: number;
}

// Insights types
export interface InsightRequest {
  transactions: Array<{
    date: string;
    amount: number;
    category: string;
  }>;
}

export interface InsightResponse {
  summary: string;
}

// Monthly Insights types
export interface TopCategory {
  category: string;
  total: number;
}

export interface Anomaly {
  date: string;
  amount: number;
  category?: string;
  score: number;
}

export interface Forecast {
  category: string;
  nextMonthForecast: number;
  method: string;
}

export interface MonthlyInsight {
  month: number;
  year: number;
  totalDebit: number;
  totalCredit: number;
  biggestCategory?: string;
  topCategories: TopCategory[];
  anomalies: Anomaly[];
  forecast: Forecast[];
}
