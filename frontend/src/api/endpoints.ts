import { http } from './http';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
  CategoryResponse,
  CategoryRequest,
  AccountResponse,
  AccountRequest,
  TransactionResponse,
  TransactionRequest,
  PageResponse,
  BudgetResponse,
  BudgetRequest,
  BudgetSummary,
  InsightRequest,
  InsightResponse,
  MonthlyInsight,
} from './types';

// ========== Auth ==========
export const authApi = {
  login: (data: LoginRequest) => http.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterRequest) => http.post<AuthResponse>('/api/auth/register', data),

  me: (token: string) => http.get<UserResponse>('/api/auth/me', token),
};

// ========== Categories ==========
export const categoryApi = {
  list: (token: string) => http.get<CategoryResponse[]>('/api/categories', token),

  create: (data: CategoryRequest, token: string) =>
    http.post<CategoryResponse>('/api/categories', data, token),

  delete: (id: string, token: string) => http.delete(`/api/categories/${id}`, token),
};

// ========== Accounts ==========
export const accountApi = {
  list: (token: string) => http.get<AccountResponse[]>('/api/accounts', token),

  create: (data: AccountRequest, token: string) =>
    http.post<AccountResponse>('/api/accounts', data, token),

  delete: (id: string, token: string) => http.delete(`/api/accounts/${id}`, token),
};

// ========== Transactions ==========
export const transactionApi = {
  list: (params: {
    token: string;
    page?: number;
    size?: number;
    accountId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { token, page = 0, size = 20, accountId, categoryId, startDate, endDate } = params;
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    return http.get<PageResponse<TransactionResponse>>(`/api/transactions?${query}`, token);
  },

  create: (data: TransactionRequest, token: string) =>
    http.post<TransactionResponse>('/api/transactions', data, token),

  update: (id: string, data: Partial<TransactionRequest>, token: string) =>
    http.put<TransactionResponse>(`/api/transactions/${id}`, data, token),

  delete: (id: string, token: string) => http.delete(`/api/transactions/${id}`, token),
};

// ========== Budgets ==========
export const budgetApi = {
  list: (month: number, year: number, token: string) => {
    const query = new URLSearchParams({ month: month.toString(), year: year.toString() });
    return http.get<BudgetResponse[]>(`/api/budgets?${query}`, token);
  },

  create: (data: BudgetRequest, token: string) =>
    http.post<BudgetResponse>('/api/budgets', data, token),

  update: (id: string, data: Partial<BudgetRequest>, token: string) =>
    http.put<BudgetResponse>(`/api/budgets/${id}`, data, token),

  delete: (id: string, token: string) => http.delete(`/api/budgets/${id}`, token),

  summary: (month: number, year: number, token: string) => {
    const query = new URLSearchParams({ month: month.toString(), year: year.toString() });
    return http.get<BudgetSummary[]>(`/api/budgets/summary?${query}`, token);
  },
};

// ========== Insights ==========
export const insightApi = {
  analyze: (data: InsightRequest, token?: string) =>
    http.post<InsightResponse>('/api/insights/analyze', data, token || null),

  monthly: (params: { month: number; year: number }, token: string) => {
    const query = new URLSearchParams({
      month: params.month.toString(),
      year: params.year.toString(),
    });
    return http.get<MonthlyInsight>(`/api/insights/monthly?${query}`, token);
  },
};

// ========== Reports ==========
export const reportApi = {
  pdf: async (params: { month: number; year: number }, token: string) => {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
    const query = new URLSearchParams({
      month: params.month.toString(),
      year: params.year.toString(),
    });

    const response = await fetch(`${apiBase}/api/reports/pdf?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch
      ? filenameMatch[1]
      : `FinSmart_Report_${params.year}-${params.month.toString().padStart(2, '0')}.pdf`;

    // Convert to blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
