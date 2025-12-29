package com.finsmart.service.ai.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for AI v1 /merchants/normalise endpoint. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantNormaliseRequest {

  private List<Item> items;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Item {
    private String raw;
    private String hintMerchant;
    private String hintDescription;
  }
}
