package com.finsmart.web.dto.ai;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for anomaly scoring API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreAnomaliesResponse {

  private List<AnomalyResult> results;
  private Thresholds thresholds;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AnomalyResult {
    private String id;
    private Double score;
    private String label; // "NORMAL", "SUSPICIOUS", "SEVERE"
    private List<String> reasons;
    private Double baseline;
    private Double residual;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Thresholds {
    private Double normalMax;
    private Double suspiciousMax;
  }
}
