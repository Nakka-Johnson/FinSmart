package com.finsmart.web.dto.ai;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for anomaly scoring API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreAnomaliesRequest {

  /** Transaction IDs to score (fetches from DB) */
  private List<UUID> transactionIds;

  /** Raw items for scoring (alternative to transactionIds) */
  @Valid private List<Item> items;

  /** Transaction IDs to ignore (snoozed/confirmed) */
  private List<String> ignoreIds;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Item {
    private String id;
    private String merchant;
    private String category;
    private Double amount;
    private String direction; // "DEBIT" or "CREDIT"
    private String date; // ISO date YYYY-MM-DD
  }
}
