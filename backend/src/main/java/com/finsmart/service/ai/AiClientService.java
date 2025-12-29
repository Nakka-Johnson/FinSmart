package com.finsmart.service.ai;

import com.finsmart.service.ai.dto.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class AiClientService {

  private final RestTemplate restTemplate;
  private final String aiBaseUrl;

  public AiClientService(RestTemplate restTemplate, @Value("${app.ai.url}") String aiBaseUrl) {
    this.restTemplate = restTemplate;
    this.aiBaseUrl = aiBaseUrl;
  }

  // ==========================================================================
  // AI v1 Endpoints (Real ML)
  // ==========================================================================

  /**
   * Check AI service health and model status.
   *
   * @return Health response with model status
   */
  public AiHealthResponse health() {
    try {
      String url = aiBaseUrl + "/health";
      ResponseEntity<AiHealthResponse> response =
          restTemplate.getForEntity(url, AiHealthResponse.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return response.getBody();
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI health endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /**
   * Call AI v1 /merchants/normalise endpoint for merchant normalization.
   *
   * @param request Merchant normalization request
   * @return Normalized merchants with scores and alternatives
   */
  public MerchantNormaliseResponse normaliseMerchants(MerchantNormaliseRequest request) {
    try {
      String url = aiBaseUrl + "/v1/merchants/normalise";
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<MerchantNormaliseRequest> httpRequest = new HttpEntity<>(request, headers);

      ResponseEntity<MerchantNormaliseResponse> response =
          restTemplate.postForEntity(url, httpRequest, MerchantNormaliseResponse.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return response.getBody();
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI v1 merchants/normalise endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /**
   * Call AI v1 /categories/predict endpoint for ML-based categorization.
   *
   * @param request Category prediction request
   * @return Top-3 category predictions with confidence and explanations
   */
  public CategoryPredictResponse predictCategories(CategoryPredictRequest request) {
    try {
      String url = aiBaseUrl + "/v1/categories/predict";
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<CategoryPredictRequest> httpRequest = new HttpEntity<>(request, headers);

      ResponseEntity<CategoryPredictResponse> response =
          restTemplate.postForEntity(url, httpRequest, CategoryPredictResponse.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return response.getBody();
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI v1 categories/predict endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /**
   * Call AI v1 /anomalies/score endpoint for anomaly detection.
   *
   * @param request Anomaly score request
   * @return Anomaly scores with labels and explanations
   */
  public AnomalyScoreResponse scoreAnomalies(AnomalyScoreRequest request) {
    try {
      String url = aiBaseUrl + "/v1/anomalies/score";
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<AnomalyScoreRequest> httpRequest = new HttpEntity<>(request, headers);

      ResponseEntity<AnomalyScoreResponse> response =
          restTemplate.postForEntity(url, httpRequest, AnomalyScoreResponse.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return response.getBody();
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI v1 anomalies/score endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  // ==========================================================================
  // Legacy Endpoints (Backward Compatibility)
  // ==========================================================================

  /**
   * Call AI /analyze endpoint to get spending summary.
   *
   * @param txns List of transaction payloads
   * @return Map with keys: totalDebit, totalCredit, biggestCategory, topCategories
   */
  @SuppressWarnings("unchecked")
  public Map<String, Object> analyze(List<TxnPayload> txns) {
    try {
      String url = aiBaseUrl + "/analyze";
      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("transactions", txns);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

      ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return response.getBody();
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI analyze endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /**
   * Call AI /categorize endpoint to get category predictions. Falls back to rule-based
   * categorization if AI service is unavailable.
   *
   * <p>Sprint-1 Enhancement: Returns enhanced predictions with scores and detailed reasons.
   *
   * @param txns List of transaction payloads
   * @return List of maps with keys: guessCategory, score, reason (with tokens, matchedKeywords,
   *     scores, details)
   */
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> categorize(List<TxnPayload> txns) {
    try {
      String url = aiBaseUrl + "/categorize";
      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("transactions", txns);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

      ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        // Sprint-1: Enhanced response format with predictions array
        Object predictions = response.getBody().get("predictions");
        if (predictions instanceof List) {
          return (List<Map<String, Object>>) predictions;
        }
        log.warn("Unexpected response format from AI service, falling back to rule-based");
        return categorizeByRules(txns);
      } else {
        log.warn("AI service returned non-2xx status, falling back to rule-based categorization");
        return categorizeByRules(txns);
      }
    } catch (RestClientException e) {
      log.warn(
          "AI service unavailable, falling back to rule-based categorization: {}", e.getMessage());
      return categorizeByRules(txns);
    }
  }

  /**
   * Rule-based categorization using keyword heuristics. Used as fallback when AI service is
   * unavailable.
   *
   * <p>Sprint-1 Enhancement: Returns enhanced format matching AI service response.
   *
   * @param txns List of transaction payloads
   * @return List of maps with keys: guessCategory, score, reason (simplified structure for
   *     fallback)
   */
  private List<Map<String, Object>> categorizeByRules(List<TxnPayload> txns) {
    return txns.stream()
        .map(
            txn -> {
              String searchText =
                  (txn.getDescription() != null ? txn.getDescription() : "")
                      + " "
                      + (txn.getMerchant() != null ? txn.getMerchant() : "");
              searchText = searchText.toLowerCase();

              String category;
              String reason;
              double score = 0.0;

              // Check most specific patterns first
              if (searchText.matches(".*\\b(netflix|spotify|prime|itunes)\\b.*")) {
                category = "Entertainment";
                reason = "Matched entertainment service keyword";
                score = 0.75;
              } else if (searchText.matches(".*\\b(tesco|asda|aldi|sainsbury|morrisons)\\b.*")) {
                category = "Groceries";
                reason = "Matched grocery store keyword";
                score = 0.75;
              } else if (searchText.matches(".*\\b(uber|bolt|merseyrail|tfl|stagecoach)\\b.*")) {
                category = "Transport";
                reason = "Matched transport keyword";
                score = 0.75;
              } else if (searchText.matches(
                  ".*\\b(octopus|british gas|edf|eon|ovo|united utilities)\\b.*")) {
                category = "Utilities";
                reason = "Matched utility provider keyword";
                score = 0.75;
              } else if (searchText.matches(".*\\b(rent|lettings|landlord)\\b.*")) {
                category = "Rent";
                reason = "Matched rent/housing keyword";
                score = 0.75;
              } else {
                category = "Uncategorized";
                reason = "No rule matched";
                score = 0.0;
              }

              // Sprint-1: Enhanced response format
              Map<String, Object> reasonDetails = new HashMap<>();
              reasonDetails.put("tokens", new String[] {});
              reasonDetails.put("matchedKeywords", new String[] {});
              reasonDetails.put("scores", new HashMap<String, Double>());
              reasonDetails.put("details", reason);

              Map<String, Object> result = new HashMap<>();
              result.put("guessCategory", category);
              result.put("score", score);
              result.put("reason", reasonDetails);
              return result;
            })
        .toList();
  }

  /**
   * Call AI /anomalies endpoint to detect unusual transactions.
   *
   * @param txns List of transaction payloads
   * @return List of maps with keys: date, amount, category, score, isAnomaly
   */
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> anomalies(List<TxnPayload> txns) {
    return anomalies(txns, null);
  }

  /**
   * Call AI /anomalies endpoint to detect unusual transactions with ignore list support.
   *
   * <p>Sprint-1 Enhancement: Supports ignoring specific transaction IDs (snooze/confirm).
   *
   * @param txns List of transaction payloads
   * @param ignoreIds List of transaction IDs to ignore (optional)
   * @return List of maps with keys: date, amount, category, score, isAnomaly
   */
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> anomalies(List<TxnPayload> txns, List<String> ignoreIds) {
    try {
      String url = aiBaseUrl + "/anomalies";
      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("transactions", txns);
      if (ignoreIds != null && !ignoreIds.isEmpty()) {
        requestBody.put("ignoreIds", ignoreIds);
      }

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

      ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return (List<Map<String, Object>>) response.getBody().get("anomalies");
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI anomalies endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /**
   * Call AI /merchant-insights endpoint to aggregate spending by merchant.
   *
   * <p>Sprint-1 Enhancement: Provides merchant normalization and monthly aggregation.
   *
   * @param txns List of transaction payloads
   * @param monthsBack Number of months to look back (default: 3)
   * @return List of maps with keys: merchant, monthlyTotals, totalSpending
   */
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> merchantInsights(List<TxnPayload> txns, int monthsBack) {
    try {
      String url = aiBaseUrl + "/merchant-insights";
      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("transactions", txns);
      requestBody.put("monthsBack", monthsBack);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

      ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return (List<Map<String, Object>>) response.getBody().get("merchants");
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI merchant-insights endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /**
   * Call AI /forecast endpoint to predict next month spending.
   *
   * @param txns List of transaction payloads
   * @return List of maps with keys: category, nextMonthForecast, method
   */
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> forecast(List<TxnPayload> txns) {
    try {
      String url = aiBaseUrl + "/forecast";
      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("transactions", txns);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

      ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return (List<Map<String, Object>>) response.getBody().get("forecasts");
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI forecast endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /** Custom exception for AI service errors */
  public static class AiServiceException extends RuntimeException {
    public AiServiceException(String message) {
      super(message);
    }

    public AiServiceException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
