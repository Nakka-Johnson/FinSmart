package com.finsmart.service.ai.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for AI v1 /anomalies/score endpoint. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyScoreRequest {

  private List<Item> items;
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
