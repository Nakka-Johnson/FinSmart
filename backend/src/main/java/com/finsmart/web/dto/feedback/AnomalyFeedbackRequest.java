package com.finsmart.web.dto.feedback;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for anomaly feedback. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyFeedbackRequest {

  @NotNull(message = "txnId is required")
  private UUID txnId;

  @NotNull(message = "action is required")
  @Pattern(regexp = "CONFIRM|SNOOZE|IGNORE", message = "action must be CONFIRM, SNOOZE, or IGNORE")
  private String action;

  private String note;

  /** Original anomaly score from AI */
  private Double score;

  /** Original anomaly label from AI */
  private String label;
}
