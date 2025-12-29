package com.finsmart.web.dto.feedback;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for category feedback. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryFeedbackRequest {

  @NotNull(message = "txnId is required")
  private UUID txnId;

  private UUID oldCategoryId;

  @NotNull(message = "newCategoryId is required")
  private UUID newCategoryId;

  private Double aiConfidence;
  private String aiWhy;
}
