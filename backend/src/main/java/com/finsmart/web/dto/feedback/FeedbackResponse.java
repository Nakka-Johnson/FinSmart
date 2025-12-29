package com.finsmart.web.dto.feedback;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for feedback operations. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {
  private UUID id;
  private String type;
  private Instant createdAt;
  private Map<String, Object> payload;
  private String message;
}
