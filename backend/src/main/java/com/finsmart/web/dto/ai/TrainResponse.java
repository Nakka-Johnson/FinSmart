package com.finsmart.web.dto.ai;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for training trigger API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainResponse {
  private String status;
  private String message;
  private List<String> instructions;
}
