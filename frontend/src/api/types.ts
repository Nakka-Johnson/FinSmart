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
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
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
