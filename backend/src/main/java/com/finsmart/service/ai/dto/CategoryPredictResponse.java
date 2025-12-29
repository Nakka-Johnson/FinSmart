package com.finsmart.service.ai.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for AI v1 /categories/predict endpoint. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryPredictResponse {

  private List<Result> items;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Result {
    private List<TopCategory> top;
    private String chosen;
    private Double confidence;
    private WhyInfo why;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TopCategory {
    private String category;
    private Double prob;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WhyInfo {
    private List<String> topTokens;
    private List<String> topFeatures;
    private String notes;
  }
}
