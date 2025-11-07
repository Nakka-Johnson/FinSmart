package com.finsmart.web.controller;

import com.finsmart.domain.entity.User;
import com.finsmart.service.InsightService;
import com.finsmart.service.ReportService;
import com.finsmart.web.dto.MonthlyInsightDTO;
import com.finsmart.web.dto.ReportResult;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.io.File;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

  private final InsightService insightService;
  private final ReportService reportService;
  private final AuthenticationHelper authenticationHelper;

  /**
   * Generate and download monthly PDF report.
   *
   * @param month Month (1-12)
   * @param year Year
   * @return PDF file stream
   */
  @GetMapping("/pdf")
  public ResponseEntity<Resource> generateMonthlyPdf(
      @RequestParam @Min(1) @Max(12) int month, @RequestParam @Min(2000) @Max(2100) int year) {

    UUID userId = authenticationHelper.getCurrentUserId();
    User user = authenticationHelper.getCurrentUser();
    log.info("Generating PDF report for user {} - {}/{}", userId, month, year);

    // Build insights
    MonthlyInsightDTO insights = insightService.buildMonthlyInsights(userId, month, year);

    // Check if user has data
    if (insights.getTotalDebit().compareTo(java.math.BigDecimal.ZERO) == 0
        && insights.getTotalCredit().compareTo(java.math.BigDecimal.ZERO) == 0) {
      return ResponseEntity.notFound().build();
    }

    try {
      // Generate PDF
      ReportResult result = reportService.generateMonthlyPdf(user, insights);

      // Return file as stream
      File pdfFile = new File(result.getAbsolutePath());
      Resource resource = new FileSystemResource(pdfFile);

      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_PDF)
          .header(
              HttpHeaders.CONTENT_DISPOSITION,
              "attachment; filename=\"" + result.getFileName() + "\"")
          .body(resource);

    } catch (IOException e) {
      log.error("Failed to generate PDF report", e);
      return ResponseEntity.internalServerError().build();
    }
  }
}
