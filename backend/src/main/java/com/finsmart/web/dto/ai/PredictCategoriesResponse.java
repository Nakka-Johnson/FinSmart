package com.finsmart.web.dto.ai;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for category prediction API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictCategoriesResponse {

  private List<Prediction> predictions;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Prediction {
    private String topCategory;
    private Double confidence;
    private List<CategoryScore> top3;
    private String explainWhy;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CategoryScore {
    private String category;
    private Double probability;
  }
}
