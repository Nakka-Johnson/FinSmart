package com.finsmart.web.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for merchant normalization API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormaliseMerchantsRequest {

  @NotEmpty(message = "items must not be empty")
  @Valid
  private List<Item> items;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Item {
    @NotEmpty(message = "raw merchant string is required")
    private String raw;

    private String hintMerchant;
    private String hintDescription;
  }
}
