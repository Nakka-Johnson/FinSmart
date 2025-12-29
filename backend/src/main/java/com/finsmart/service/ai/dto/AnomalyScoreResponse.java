package com.finsmart.service.ai.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for AI v1 /anomalies/score endpoint. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyScoreResponse {

  private List<Result> items;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Result {
    private String id;
    private Double score;
    private String label; // "NORMAL", "SUSPICIOUS", "SEVERE"
    private WhyInfo why;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WhyInfo {
    private Double baseline;
    private Double residual;
    private String notes;
  }
}
