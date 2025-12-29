package com.finsmart.domain.entity;

import com.finsmart.domain.enums.AiFeedbackType;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.Type;

/**
 * Entity for storing AI feedback (user corrections and confirmations).
 *
 * <p>Stores user feedback to improve model training: - Category overrides: when user changes
 * AI-suggested category - Merchant confirmations: when user confirms/corrects merchant
 * normalization - Anomaly labels: when user confirms, snoozes, or ignores anomalies
 */
@Entity
@Table(name = "ai_feedback")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFeedback {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(
      name = "user_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_ai_feedback_user"))
  private User user;

  @NotNull
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private AiFeedbackType type;

  /**
   * JSONB payload with type-specific data.
   *
   * <p>For CATEGORY_OVERRIDE: { txnId, previousCategoryId, newCategoryId, aiConfidence, aiWhy }
   *
   * <p>For MERCHANT_CONFIRM: { rawMerchant, suggestedCanonical, chosenCanonical, score }
   *
   * <p>For ANOMALY_LABEL: { txnId, action, note, score, label }
   */
  @Type(JsonType.class)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> payload;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "transaction_id",
      foreignKey = @ForeignKey(name = "fk_ai_feedback_transaction"))
  private Transaction transaction;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
