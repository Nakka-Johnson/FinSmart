package com.finsmart.service;

import com.finsmart.domain.entity.User;
import com.finsmart.web.dto.MonthlyInsightDTO;
import com.finsmart.web.dto.ReportResult;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.format.TextStyle;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportService {

  private final TemplateEngine templateEngine;

  @Value("${app.reports.exportDir}")
  private String exportDir;

  /**
   * Generate PDF report for monthly insights.
   *
   * @param user User
   * @param insights Monthly insights
   * @return ReportResult with file details
   * @throws IOException if file operations fail
   */
  public ReportResult generateMonthlyPdf(User user, MonthlyInsightDTO insights) throws IOException {
    // Ensure export directory exists
    Path exportPath = Paths.get(exportDir);
    if (!Files.exists(exportPath)) {
      Files.createDirectories(exportPath);
    }

    // Generate filename
    String monthName =
        java.time.Month.of(insights.getMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    String sanitizedFullName =
        user.getFullName() != null ? user.getFullName().replaceAll("[^a-zA-Z0-9]", "_") : "User";
    String fileName =
        String.format(
            "FinSmart_Report_%s_%d-%02d.pdf",
            sanitizedFullName, insights.getYear(), insights.getMonth());

    File pdfFile = new File(exportPath.toFile(), fileName);

    // Build Thymeleaf context
    Context context = new Context();
    context.setVariable("user", user);
    context.setVariable("monthName", monthName);
    context.setVariable("year", insights.getYear());
    context.setVariable("totalDebit", insights.getTotalDebit());
    context.setVariable("totalCredit", insights.getTotalCredit());
    context.setVariable("biggestCategory", insights.getBiggestCategory());
    context.setVariable("topCategories", insights.getTopCategories());
    context.setVariable("anomalies", insights.getAnomalies());
    context.setVariable("forecast", insights.getForecast());
    context.setVariable("generatedAt", Instant.now());

    // Render HTML from template
    String html = templateEngine.process("report-monthly", context);

    // Convert HTML to PDF
    try (OutputStream os = new FileOutputStream(pdfFile)) {
      PdfRendererBuilder builder = new PdfRendererBuilder();
      builder.useFastMode();
      builder.withHtmlContent(html, null);
      builder.toStream(os);
      builder.run();
    }

    log.info("Generated PDF report: {}", pdfFile.getAbsolutePath());

    return ReportResult.builder()
        .fileName(fileName)
        .absolutePath(pdfFile.getAbsolutePath())
        .sizeBytes(pdfFile.length())
        .generatedAt(Instant.now())
        .build();
  }
}
