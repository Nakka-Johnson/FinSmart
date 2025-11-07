package com.finsmart.web.controller;

import com.finsmart.service.InsightService;
import com.finsmart.web.dto.MonthlyInsightDTO;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
@Slf4j
public class InsightsController {

  private final InsightService insightService;
  private final AuthenticationHelper authenticationHelper;

  /**
   * Get monthly insights for the current user.
   *
   * @param month Month (1-12)
   * @param year Year
   * @return MonthlyInsightDTO
   */
  @GetMapping("/monthly")
  public ResponseEntity<MonthlyInsightDTO> getMonthlyInsights(
      @RequestParam @Min(1) @Max(12) int month, @RequestParam @Min(2000) @Max(2100) int year) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("Fetching monthly insights for user {} - {}/{}", userId, month, year);

    MonthlyInsightDTO insights = insightService.buildMonthlyInsights(userId, month, year);
    return ResponseEntity.ok(insights);
  }
}
