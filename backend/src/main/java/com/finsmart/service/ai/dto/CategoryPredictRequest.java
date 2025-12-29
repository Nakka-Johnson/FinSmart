package com.finsmart.service.ai.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for AI v1 /categories/predict endpoint. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryPredictRequest {

  private List<Item> items;

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
