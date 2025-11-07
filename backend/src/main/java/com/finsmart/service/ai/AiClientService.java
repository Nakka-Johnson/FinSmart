package com.finsmart.service.ai;

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
   * Call AI /categorize endpoint to get category predictions.
   *
   * @param txns List of transaction payloads
   * @return List of maps with keys: guessCategory, reason
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
        return (List<Map<String, Object>>) response.getBody().get("predictions");
      } else {
        throw new AiServiceException(
            "AI service returned non-2xx status: " + response.getStatusCode());
      }
    } catch (RestClientException e) {
      log.error("Failed to call AI categorize endpoint", e);
      throw new AiServiceException("AI service unavailable", e);
    }
  }

  /**
   * Call AI /anomalies endpoint to detect unusual transactions.
   *
   * @param txns List of transaction payloads
   * @return List of maps with keys: date, amount, category, score, isAnomaly
   */
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> anomalies(List<TxnPayload> txns) {
    try {
      String url = aiBaseUrl + "/anomalies";
      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("transactions", txns);

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
