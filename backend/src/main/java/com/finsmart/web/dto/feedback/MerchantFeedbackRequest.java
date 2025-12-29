package com.finsmart.web.dto.feedback;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for merchant feedback. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantFeedbackRequest {

  @NotBlank(message = "rawMerchant is required")
  private String rawMerchant;

  private String suggestedCanonical;

  @NotBlank(message = "chosenCanonical is required")
  private String chosenCanonical;

  private Double score;
}
