package com.finsmart.web.controller;

import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.service.ai.AiClientService;
import com.finsmart.service.ai.AiClientService.AiServiceException;
import com.finsmart.service.ai.dto.*;
import com.finsmart.web.dto.ai.*;
import com.finsmart.web.error.ErrorResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AI orchestration controller exposing v1 ML endpoints.
 *
 * <p>Provides endpoints for: - Merchant normalization (FAISS + embeddings) - Category prediction
 * (ML classifier) - Anomaly scoring (Isolation Forest)
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

  private final AiClientService aiClientService;
  private final TransactionRepository transactionRepository;
  private final AuthenticationHelper authHelper;

  private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

  /** Check AI service health and model status */
  @GetMapping("/health")
  public ResponseEntity<?> health() {
    try {
      AiHealthResponse health = aiClientService.health();
      return ResponseEntity.ok(health);
    } catch (AiServiceException e) {
      log.warn("AI service unavailable: {}", e.getMessage());
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(
              ErrorResponse.builder()
                  .timestamp(Instant.now())
                  .status(503)
                  .error("Service Unavailable")
                  .message("AI service is not available: " + e.getMessage())
                  .build());
    }
  }

  /** Normalize merchant names using AI */
  @PostMapping("/normalise-merchants")
  public ResponseEntity<?> normaliseMerchants(
      @Valid @RequestBody NormaliseMerchantsRequest request) {
    try {
      // Build AI request
      MerchantNormaliseRequest aiRequest =
          MerchantNormaliseRequest.builder()
              .items(
                  request.getItems().stream()
                      .map(
                          item ->
                              MerchantNormaliseRequest.Item.builder()
                                  .raw(item.getRaw())
                                  .hintMerchant(item.getHintMerchant())
                                  .hintDescription(item.getHintDescription())
                                  .build())
                      .toList())
              .build();

      MerchantNormaliseResponse aiResponse = aiClientService.normaliseMerchants(aiRequest);

      // Map to API response
      NormaliseMerchantsResponse response =
          NormaliseMerchantsResponse.builder()
              .items(
                  aiResponse.getItems().stream()
                      .map(
                          item ->
                              NormaliseMerchantsResponse.Result.builder()
                                  .raw(item.getRaw())
                                  .canonical(item.getChosen())
                                  .score(item.getScore())
                                  .alternatives(
                                      item.getTop() != null
                                          ? item.getTop().stream()
                                              .map(
                                                  c ->
                                                      NormaliseMerchantsResponse.Alternative
                                                          .builder()
                                                          .name(c.getCanonical())
                                                          .score(c.getScore())
                                                          .build())
                                              .toList()
                                          : List.of())
                                  .why(item.getWhy() != null ? item.getWhy().getNotes() : null)
                                  .build())
                      .toList())
              .build();

      return ResponseEntity.ok(response);

    } catch (AiServiceException e) {
      log.error("AI merchant normalization failed", e);
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(
              ErrorResponse.builder()
                  .timestamp(Instant.now())
                  .status(503)
                  .error("Service Unavailable")
                  .message("AI service unavailable: " + e.getMessage())
                  .build());
    }
  }

  /** Predict categories for transactions using ML */
  @PostMapping("/predict-categories")
  public ResponseEntity<?> predictCategories(@Valid @RequestBody PredictCategoriesRequest request) {
    try {
      UUID userId = authHelper.getCurrentUserId();

      // Build AI request from transaction IDs or raw items
      List<CategoryPredictRequest.Item> aiItems;

      if (request.getTransactionIds() != null && !request.getTransactionIds().isEmpty()) {
        // Fetch transactions by IDs
        List<Transaction> transactions =
            transactionRepository.findAllById(request.getTransactionIds());

        // Verify ownership
        for (Transaction txn : transactions) {
          if (!txn.getAccount().getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(
                    ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(403)
                        .error("Forbidden")
                        .message("Transaction does not belong to current user")
                        .build());
          }
        }

        aiItems =
            transactions.stream()
                .map(
                    txn ->
                        CategoryPredictRequest.Item.builder()
                            .merchant(txn.getMerchant())
                            .description(txn.getDescription())
                            .amount(txn.getAmount().doubleValue())
                            .direction(txn.getDirection().name())
                            .date(formatDate(txn.getPostedAt()))
                            .build())
                .toList();
      } else if (request.getItems() != null && !request.getItems().isEmpty()) {
        // Use raw items directly
        aiItems =
            request.getItems().stream()
                .map(
                    item ->
                        CategoryPredictRequest.Item.builder()
                            .merchant(item.getMerchant())
                            .description(item.getDescription())
                            .amount(item.getAmount())
                            .direction(item.getDirection())
                            .date(item.getDate())
                            .build())
                .toList();
      } else {
        return ResponseEntity.badRequest()
            .body(
                ErrorResponse.builder()
                    .timestamp(Instant.now())
                    .status(400)
                    .error("Bad Request")
                    .message("Either transactionIds or items must be provided")
                    .build());
      }

      CategoryPredictRequest aiRequest = CategoryPredictRequest.builder().items(aiItems).build();

      CategoryPredictResponse aiResponse = aiClientService.predictCategories(aiRequest);

      // Map to API response
      PredictCategoriesResponse response =
          PredictCategoriesResponse.builder()
              .predictions(
                  aiResponse.getItems().stream()
                      .map(
                          item ->
                              PredictCategoriesResponse.Prediction.builder()
                                  .topCategory(item.getChosen())
                                  .confidence(item.getConfidence())
                                  .top3(
                                      item.getTop() != null
                                          ? item.getTop().stream()
                                              .map(
                                                  c ->
                                                      PredictCategoriesResponse.CategoryScore
                                                          .builder()
                                                          .category(c.getCategory())
                                                          .probability(c.getProb())
                                                          .build())
                                              .toList()
                                          : List.of())
                                  .explainWhy(
                                      item.getWhy() != null ? item.getWhy().getNotes() : null)
                                  .build())
                      .toList())
              .build();

      return ResponseEntity.ok(response);

    } catch (AiServiceException e) {
      log.error("AI category prediction failed", e);
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(
              ErrorResponse.builder()
                  .timestamp(Instant.now())
                  .status(503)
                  .error("Service Unavailable")
                  .message("AI service unavailable: " + e.getMessage())
                  .build());
    }
  }

  /** Score transactions for anomalies using ML */
  @PostMapping("/score-anomalies")
  public ResponseEntity<?> scoreAnomalies(@Valid @RequestBody ScoreAnomaliesRequest request) {
    try {
      UUID userId = authHelper.getCurrentUserId();

      // Build AI request from transaction IDs
      List<AnomalyScoreRequest.Item> aiItems;

      if (request.getTransactionIds() != null && !request.getTransactionIds().isEmpty()) {
        List<Transaction> transactions =
            transactionRepository.findAllById(request.getTransactionIds());

        // Verify ownership
        for (Transaction txn : transactions) {
          if (!txn.getAccount().getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(
                    ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(403)
                        .error("Forbidden")
                        .message("Transaction does not belong to current user")
                        .build());
          }
        }

        aiItems =
            transactions.stream()
                .map(
                    txn ->
                        AnomalyScoreRequest.Item.builder()
                            .id(txn.getId().toString())
                            .merchant(txn.getMerchant())
                            .category(
                                txn.getCategory() != null ? txn.getCategory().getName() : null)
                            .amount(txn.getAmount().doubleValue())
                            .direction(txn.getDirection().name())
                            .date(formatDate(txn.getPostedAt()))
                            .build())
                .toList();
      } else if (request.getItems() != null && !request.getItems().isEmpty()) {
        aiItems =
            request.getItems().stream()
                .map(
                    item ->
                        AnomalyScoreRequest.Item.builder()
                            .id(item.getId())
                            .merchant(item.getMerchant())
                            .category(item.getCategory())
                            .amount(item.getAmount())
                            .direction(item.getDirection())
                            .date(item.getDate())
                            .build())
                .toList();
      } else {
        return ResponseEntity.badRequest()
            .body(
                ErrorResponse.builder()
                    .timestamp(Instant.now())
                    .status(400)
                    .error("Bad Request")
                    .message("Either transactionIds or items must be provided")
                    .build());
      }

      AnomalyScoreRequest aiRequest =
          AnomalyScoreRequest.builder().items(aiItems).ignoreIds(request.getIgnoreIds()).build();

      AnomalyScoreResponse aiResponse = aiClientService.scoreAnomalies(aiRequest);

      // Map to API response
      ScoreAnomaliesResponse response =
          ScoreAnomaliesResponse.builder()
              .results(
                  aiResponse.getItems().stream()
                      .map(
                          item ->
                              ScoreAnomaliesResponse.AnomalyResult.builder()
                                  .id(item.getId())
                                  .score(item.getScore())
                                  .label(item.getLabel())
                                  .reasons(
                                      item.getWhy() != null
                                          ? List.of(item.getWhy().getNotes())
                                          : List.of())
                                  .baseline(
                                      item.getWhy() != null ? item.getWhy().getBaseline() : null)
                                  .residual(
                                      item.getWhy() != null ? item.getWhy().getResidual() : null)
                                  .build())
                      .toList())
              .thresholds(
                  ScoreAnomaliesResponse.Thresholds.builder()
                      .normalMax(0.6)
                      .suspiciousMax(0.8)
                      .build())
              .build();

      return ResponseEntity.ok(response);

    } catch (AiServiceException e) {
      log.error("AI anomaly scoring failed", e);
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(
              ErrorResponse.builder()
                  .timestamp(Instant.now())
                  .status(503)
                  .error("Service Unavailable")
                  .message("AI service unavailable: " + e.getMessage())
                  .build());
    }
  }

  /** Trigger model training (admin only) */
  @PostMapping("/train")
  public ResponseEntity<?> triggerTraining() {
    // For now, return instructions since AI service doesn't have a train endpoint
    return ResponseEntity.accepted()
        .body(
            TrainResponse.builder()
                .status("MANUAL_REQUIRED")
                .message("To train models, run: cd ai && python scripts/train_all.py")
                .instructions(
                    List.of(
                        "1. Activate virtual environment: .venv\\Scripts\\Activate.ps1",
                        "2. Run training: python scripts/train_all.py",
                        "3. Restart AI service to load new models"))
                .build());
  }

  private String formatDate(Instant instant) {
    if (instant == null) return null;
    return instant.atOffset(ZoneOffset.UTC).format(ISO_DATE);
  }
}
