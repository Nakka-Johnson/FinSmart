package com.finsmart.service.ai;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TxnPayload {
  private String date; // ISO format: "2025-01-15"
  private BigDecimal amount;
  private String category; // nullable
  private String direction; // "DEBIT" or "CREDIT"
  private String description; // nullable
}
