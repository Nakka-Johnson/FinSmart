import { http } from './http';

/* AI Orchestration Types */
export interface NormalisedMerchant {
  transactionId: number;
  originalDescription: string;
  normalisedMerchant: string;
  confidence: number;
}

export interface CategoryPrediction {
  transactionId: number;
  category: string;
  confidence: number;
  reasoning?: string;
}

export interface AnomalyScore {
  transactionId: number;
  score: number;
  isAnomaly: boolean;
  reason?: string;
}

export interface CashFlowForecast {
  date: string;
  predictedBalance: number;
  lowerBound: number;
  upperBound: number;
}

export interface SpendingInsight {
  category: string;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  narrative: string;
}

export interface AIHealthResponse {
  status: string;
  version: string;
  model: string;
  capabilities: string[];
}

export interface CashRunwayData {
  currentBalance: number;
  runway: CashFlowForecast[];
  daysUntilLow: number;
  lowThreshold: number;
}

export interface NarrativeInsight {
  summary: string;
  highlights: string[];
  topCategory: string;
  topCategorySpend: number;
  trend: 'up' | 'down' | 'stable';
}

export interface FeedbackPayload {
  transactionId: number;
  feedbackType: 'category' | 'merchant' | 'anomaly';
  originalValue: string;
  correctedValue: string;
  comment?: string;
}

/* AI API Functions */

/** Normalise merchant names for given transaction IDs */
export async function normaliseMerchants(transactionIds: number[]): Promise<NormalisedMerchant[]> {
  const response = await http.post<{ results: NormalisedMerchant[] }>(
    '/api/ai/normalise-merchants',
    { transactionIds }
  );
  return response.results;
}

/** Predict categories for given transaction IDs */
export async function predictCategories(transactionIds: number[]): Promise<CategoryPrediction[]> {
  const response = await http.post<{ predictions: CategoryPrediction[] }>(
    '/api/ai/predict-categories',
    { transactionIds }
  );
  return response.predictions;
}

/** Score transactions for anomalies */
export async function scoreAnomalies(transactionIds: number[]): Promise<AnomalyScore[]> {
  const response = await http.post<{ scores: AnomalyScore[] }>(
    '/api/ai/score-anomalies',
    { transactionIds }
  );
  return response.scores;
}

/** Get cash flow forecast */
export async function getCashFlowForecast(days: number = 30): Promise<CashFlowForecast[]> {
  const response = await http.get<{ forecast: CashFlowForecast[] }>(
    `/api/ai/cash-forecast?days=${days}`
  );
  return response.forecast;
}

/** Get spending insights */
export async function getSpendingInsights(period: 'week' | 'month' | 'quarter' = 'month'): Promise<SpendingInsight[]> {
  const response = await http.get<{ insights: SpendingInsight[] }>(
    `/api/ai/spending-insights?period=${period}`
  );
  return response.insights;
}

/** Health check for AI service */
export async function getAIHealth(): Promise<AIHealthResponse> {
  return http.get<AIHealthResponse>('/api/ai/health');
}

/** Get cash runway prediction */
export async function getCashRunway(token?: string): Promise<CashRunwayData> {
  return http.get<CashRunwayData>('/api/ai/cash-runway', token);
}

/** Get narrative insights summary */
export async function getNarrativeInsight(token?: string): Promise<NarrativeInsight> {
  return http.get<NarrativeInsight>('/api/ai/narrative', token);
}

/** Get recent anomalies for inbox */
export async function getRecentAnomalies(limit: number = 5, token?: string): Promise<AnomalyScore[]> {
  const response = await http.get<{ anomalies: AnomalyScore[] }>(
    `/api/ai/anomalies/recent?limit=${limit}`,
    token
  );
  return response.anomalies;
}

/** Submit user feedback for AI improvement */
export async function submitFeedback(feedback: FeedbackPayload): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/api/feedback', feedback);
}

/** Submit category feedback */
export async function submitCategoryFeedback(
  transactionId: number,
  originalCategory: string,
  correctedCategory: string,
  comment?: string
): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/api/feedback/category', {
    transactionId,
    originalValue: originalCategory,
    correctedValue: correctedCategory,
    comment,
  });
}

/** Submit merchant feedback */
export async function submitMerchantFeedback(
  transactionId: number,
  originalMerchant: string,
  correctedMerchant: string,
  comment?: string
): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/api/feedback/merchant', {
    transactionId,
    originalValue: originalMerchant,
    correctedValue: correctedMerchant,
    comment,
  });
}

/** Submit anomaly feedback (mark as reviewed/not anomaly) */
export async function submitAnomalyFeedback(
  transactionId: number,
  isAnomaly: boolean,
  comment?: string
): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/api/feedback/anomaly', {
    transactionId,
    originalValue: 'flagged',
    correctedValue: isAnomaly ? 'confirmed' : 'dismissed',
    comment,
  });
}

/** Get explanation for a specific prediction */
export async function getExplanation(
  transactionId: number,
  type: 'category' | 'anomaly'
): Promise<{ explanation: string; factors: string[] }> {
  return http.get<{ explanation: string; factors: string[] }>(
    `/api/ai/explain/${type}/${transactionId}`
  );
}
