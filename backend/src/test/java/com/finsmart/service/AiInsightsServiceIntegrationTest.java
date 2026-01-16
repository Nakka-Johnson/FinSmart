package com.finsmart.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AiInsightsServiceIntegrationTest {

  @Mock private RestTemplate restTemplate;

  private AiInsightsService aiInsightsService;

  @BeforeEach
  void setUp() {
    aiInsightsService = new AiInsightsService(restTemplate);
  }

  @Test
  void testGetSummarySuccess() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("transactions", "test data");

    Map<String, Object> responseBody = new HashMap<>();
    responseBody.put("summary", "AI generated summary");

    ResponseEntity<Map> mockResponse = ResponseEntity.ok(responseBody);
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenReturn(mockResponse);

    String summary = aiInsightsService.getSummary(payload);

    assertEquals("AI generated summary", summary);
    verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Map.class));
  }

  @Test
  void testGetSummaryWithNullPayload() {
    assertThrows(IllegalArgumentException.class, () -> aiInsightsService.getSummary(null));
  }

  @Test
  void testGetSummaryWhenAiServiceUnavailable() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("transactions", "test data");

    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenThrow(new RestClientException("Connection refused"));

    ResponseStatusException exception =
        assertThrows(ResponseStatusException.class, () -> aiInsightsService.getSummary(payload));

    assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatusCode());
    assertTrue(exception.getReason().contains("AI service unavailable"));
  }

  @Test
  void testGetSummaryWithNullResponse() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("transactions", "test data");

    ResponseEntity<Map> mockResponse = ResponseEntity.ok(null);
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenReturn(mockResponse);

    ResponseStatusException exception =
        assertThrows(ResponseStatusException.class, () -> aiInsightsService.getSummary(payload));

    assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatusCode());
  }

  @Test
  void testGetSummaryWithMissingSummaryField() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("transactions", "test data");

    Map<String, Object> responseBody = new HashMap<>();
    responseBody.put("other_field", "some value");

    ResponseEntity<Map> mockResponse = ResponseEntity.ok(responseBody);
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenReturn(mockResponse);

    String summary = aiInsightsService.getSummary(payload);

    assertEquals("No summary available", summary);
  }

  @Test
  void testGetSummaryWithEmptyResponse() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("transactions", "test data");

    Map<String, Object> responseBody = new HashMap<>();

    ResponseEntity<Map> mockResponse = ResponseEntity.ok(responseBody);
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenReturn(mockResponse);

    String summary = aiInsightsService.getSummary(payload);

    assertEquals("No summary available", summary);
  }

  @Test
  void testGetSummaryWith5xxError() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("transactions", "test data");

    ResponseEntity<Map> mockResponse =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenReturn(mockResponse);

    ResponseStatusException exception =
        assertThrows(ResponseStatusException.class, () -> aiInsightsService.getSummary(payload));

    assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatusCode());
  }

  @Test
  void testGetSummaryWithComplexPayload() {
    Map<String, Object> payload = new HashMap<>();
    Map<String, Object> nestedData = new HashMap<>();
    nestedData.put("amount", 100.00);
    nestedData.put("category", "Groceries");
    payload.put("transaction", nestedData);
    payload.put("userId", "test-user-123");

    Map<String, Object> responseBody = new HashMap<>();
    responseBody.put("summary", "Complex AI analysis");
    responseBody.put("confidence", 0.95);

    ResponseEntity<Map> mockResponse = ResponseEntity.ok(responseBody);
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenReturn(mockResponse);

    String summary = aiInsightsService.getSummary(payload);

    assertEquals("Complex AI analysis", summary);
  }

  @Test
  void testGetSummaryMultipleCalls() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("transactions", "test data");

    Map<String, Object> responseBody1 = new HashMap<>();
    responseBody1.put("summary", "First summary");

    Map<String, Object> responseBody2 = new HashMap<>();
    responseBody2.put("summary", "Second summary");

    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
        .thenReturn(ResponseEntity.ok(responseBody1))
        .thenReturn(ResponseEntity.ok(responseBody2));

    String summary1 = aiInsightsService.getSummary(payload);
    String summary2 = aiInsightsService.getSummary(payload);

    assertEquals("First summary", summary1);
    assertEquals("Second summary", summary2);
    verify(restTemplate, times(2)).postForEntity(anyString(), any(HttpEntity.class), eq(Map.class));
  }
}
