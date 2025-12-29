package com.finsmart.web.controller;

import com.finsmart.domain.entity.AiFeedback;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.enums.AiFeedbackType;
import com.finsmart.domain.repo.AiFeedbackRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.web.dto.feedback.*;
import com.finsmart.web.error.ErrorResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Feedback controller for storing user corrections to AI predictions.
 *
 * <p>Endpoints: - POST /api/feedback/category - Store category override - POST
 * /api/feedback/merchant - Store merchant confirmation - POST /api/feedback/anomaly - Store anomaly
 * label
 */
@Slf4j
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

  private final AiFeedbackRepository feedbackRepository;
  private final TransactionRepository transactionRepository;
  private final AuthenticationHelper authHelper;

  /** Submit category override feedback */
  @PostMapping("/category")
  public ResponseEntity<?> submitCategoryFeedback(
      @Valid @RequestBody CategoryFeedbackRequest request) {
    try {
      User user = authHelper.getCurrentUser();

      // Verify transaction ownership
      Transaction transaction = transactionRepository.findById(request.getTxnId()).orElse(null);

      if (transaction != null && !transaction.getAccount().getUser().getId().equals(user.getId())) {
        return forbidden("Transaction does not belong to current user");
      }

      // Build payload
      Map<String, Object> payload = new HashMap<>();
      payload.put("txnId", request.getTxnId().toString());
      if (request.getOldCategoryId() != null) {
        payload.put("previousCategoryId", request.getOldCategoryId().toString());
      }
      payload.put("newCategoryId", request.getNewCategoryId().toString());
      if (request.getAiConfidence() != null) {
        payload.put("aiConfidence", request.getAiConfidence());
      }
      if (request.getAiWhy() != null) {
        payload.put("aiWhy", request.getAiWhy());
      }

      AiFeedback feedback =
          AiFeedback.builder()
              .user(user)
              .type(AiFeedbackType.CATEGORY_OVERRIDE)
              .payload(payload)
              .transaction(transaction)
              .build();

      feedback = feedbackRepository.save(feedback);
      log.info("Stored category feedback: {} for user {}", feedback.getId(), user.getId());

      return ResponseEntity.status(HttpStatus.CREATED)
          .body(
              FeedbackResponse.builder()
                  .id(feedback.getId())
                  .type(feedback.getType().name())
                  .createdAt(feedback.getCreatedAt())
                  .payload(payload)
                  .message("Category feedback recorded")
                  .build());

    } catch (Exception e) {
      log.error("Failed to store category feedback", e);
      return serverError("Failed to store feedback: " + e.getMessage());
    }
  }

  /** Submit merchant confirmation feedback */
  @PostMapping("/merchant")
  public ResponseEntity<?> submitMerchantFeedback(
      @Valid @RequestBody MerchantFeedbackRequest request) {
    try {
      User user = authHelper.getCurrentUser();

      // Build payload
      Map<String, Object> payload = new HashMap<>();
      payload.put("rawMerchant", request.getRawMerchant());
      if (request.getSuggestedCanonical() != null) {
        payload.put("suggestedCanonical", request.getSuggestedCanonical());
      }
      payload.put("chosenCanonical", request.getChosenCanonical());
      if (request.getScore() != null) {
        payload.put("score", request.getScore());
      }

      AiFeedback feedback =
          AiFeedback.builder()
              .user(user)
              .type(AiFeedbackType.MERCHANT_CONFIRM)
              .payload(payload)
              .build();

      feedback = feedbackRepository.save(feedback);
      log.info("Stored merchant feedback: {} for user {}", feedback.getId(), user.getId());

      return ResponseEntity.status(HttpStatus.CREATED)
          .body(
              FeedbackResponse.builder()
                  .id(feedback.getId())
                  .type(feedback.getType().name())
                  .createdAt(feedback.getCreatedAt())
                  .payload(payload)
                  .message("Merchant feedback recorded")
                  .build());

    } catch (Exception e) {
      log.error("Failed to store merchant feedback", e);
      return serverError("Failed to store feedback: " + e.getMessage());
    }
  }

  /** Submit anomaly label feedback */
  @PostMapping("/anomaly")
  public ResponseEntity<?> submitAnomalyFeedback(
      @Valid @RequestBody AnomalyFeedbackRequest request) {
    try {
      User user = authHelper.getCurrentUser();

      // Verify transaction ownership
      Transaction transaction = transactionRepository.findById(request.getTxnId()).orElse(null);

      if (transaction != null && !transaction.getAccount().getUser().getId().equals(user.getId())) {
        return forbidden("Transaction does not belong to current user");
      }

      // Build payload
      Map<String, Object> payload = new HashMap<>();
      payload.put("txnId", request.getTxnId().toString());
      payload.put("action", request.getAction());
      if (request.getNote() != null) {
        payload.put("note", request.getNote());
      }
      if (request.getScore() != null) {
        payload.put("score", request.getScore());
      }
      if (request.getLabel() != null) {
        payload.put("label", request.getLabel());
      }

      AiFeedback feedback =
          AiFeedback.builder()
              .user(user)
              .type(AiFeedbackType.ANOMALY_LABEL)
              .payload(payload)
              .transaction(transaction)
              .build();

      feedback = feedbackRepository.save(feedback);
      log.info("Stored anomaly feedback: {} for user {}", feedback.getId(), user.getId());

      return ResponseEntity.status(HttpStatus.CREATED)
          .body(
              FeedbackResponse.builder()
                  .id(feedback.getId())
                  .type(feedback.getType().name())
                  .createdAt(feedback.getCreatedAt())
                  .payload(payload)
                  .message("Anomaly feedback recorded")
                  .build());

    } catch (Exception e) {
      log.error("Failed to store anomaly feedback", e);
      return serverError("Failed to store feedback: " + e.getMessage());
    }
  }

  /** Get feedback statistics for current user */
  @GetMapping("/stats")
  public ResponseEntity<?> getFeedbackStats() {
    UUID userId = authHelper.getCurrentUserId();

    Map<String, Object> stats = new HashMap<>();
    stats.put(
        "categoryOverrides",
        feedbackRepository.countByUserIdAndType(userId, AiFeedbackType.CATEGORY_OVERRIDE));
    stats.put(
        "merchantConfirms",
        feedbackRepository.countByUserIdAndType(userId, AiFeedbackType.MERCHANT_CONFIRM));
    stats.put(
        "anomalyLabels",
        feedbackRepository.countByUserIdAndType(userId, AiFeedbackType.ANOMALY_LABEL));

    return ResponseEntity.ok(stats);
  }

  private ResponseEntity<ErrorResponse> forbidden(String message) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(
            ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(403)
                .error("Forbidden")
                .message(message)
                .build());
  }

  private ResponseEntity<ErrorResponse> serverError(String message) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(500)
                .error("Internal Server Error")
                .message(message)
                .build());
  }
}
