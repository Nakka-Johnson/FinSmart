package com.finsmart.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for AI service health check. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiHealthResponse {
  private String status;
  private String version;
  private Boolean modelsLoaded;
  private String modelVersion;
}
