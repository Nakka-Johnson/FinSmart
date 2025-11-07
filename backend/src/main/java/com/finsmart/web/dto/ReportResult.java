package com.finsmart.web.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResult {
  private String fileName;
  private String absolutePath;
  private long sizeBytes;
  private Instant generatedAt;
}
