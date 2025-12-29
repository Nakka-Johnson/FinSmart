package com.finsmart.web.dto.ai;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for category prediction API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictCategoriesRequest {

  /** Transaction IDs to predict categories for (fetches from DB) */
  private List<UUID> transactionIds;

  /** Raw items for prediction (alternative to transactionIds) */
  @Valid private List<Item> items;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Item {
    private String merchant;
    private String description;
    private Double amount;
    private String direction; // "DEBIT" or "CREDIT"
    private String date; // ISO date YYYY-MM-DD
  }
}
