package com.finsmart.service.ai.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for AI v1 /merchants/normalise endpoint. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantNormaliseResponse {

  private List<Result> items;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Result {
    private String raw;
    private List<Candidate> top;
    private String chosen;
    private Double score;
    private WhyInfo why;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Candidate {
    private String canonical;
    private Double score;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WhyInfo {
    private List<String> topTokens;
    private List<String> alternatives;
    private String notes;
  }
}
