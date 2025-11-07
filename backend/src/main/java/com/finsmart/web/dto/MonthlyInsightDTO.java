package com.finsmart.web.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyInsightDTO {
  private int month;
  private int year;
  private BigDecimal totalDebit;
  private BigDecimal totalCredit;
  private String biggestCategory;
  private List<TopCategoryDTO> topCategories;
  private List<AnomalyDTO> anomalies;
  private List<ForecastDTO> forecast;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TopCategoryDTO {
    private String category;
    private BigDecimal total;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AnomalyDTO {
    private String date;
    private BigDecimal amount;
    private String category;
    private double score;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ForecastDTO {
    private String category;
    private BigDecimal nextMonthForecast;
    private String method;
  }
}
