package com.finsmart.web.dto.ai;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for merchant normalization API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormaliseMerchantsResponse {

  private List<Result> items;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Result {
    private String raw;
    private String canonical;
    private Double score;
    private List<Alternative> alternatives;
    private String why;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Alternative {
    private String name;
    private Double score;
  }
}
