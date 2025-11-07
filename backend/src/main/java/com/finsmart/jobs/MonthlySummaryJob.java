package com.finsmart.jobs;

import com.finsmart.domain.entity.User;
import com.finsmart.domain.repo.UserRepository;
import com.finsmart.service.InsightService;
import com.finsmart.web.dto.MonthlyInsightDTO;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MonthlySummaryJob {

  private final UserRepository userRepository;
  private final InsightService insightService;

  /**
   * Run monthly summary job on the 1st of each month at 02:00. Compute last month's insights for
   * all users and log totals.
   */
  @Scheduled(cron = "0 0 2 1 * *")
  public void runMonthlySummary() {
    log.info("Starting monthly summary job");

    LocalDate now = LocalDate.now();
    LocalDate lastMonth = now.minusMonths(1);
    int month = lastMonth.getMonthValue();
    int year = lastMonth.getYear();

    List<User> users = userRepository.findAll();
    log.info("Processing monthly summary for {} users - {}/{}", users.size(), month, year);

    int successCount = 0;
    int errorCount = 0;

    for (User user : users) {
      try {
        MonthlyInsightDTO insights = insightService.buildMonthlyInsights(user.getId(), month, year);

        log.info(
            "User {} ({}) - Month {}/{}: Total Debit={}, Total Credit={}, Biggest Category={}",
            user.getEmail(),
            user.getId(),
            month,
            year,
            insights.getTotalDebit(),
            insights.getTotalCredit(),
            insights.getBiggestCategory() != null ? insights.getBiggestCategory() : "N/A");

        successCount++;
      } catch (Exception e) {
        log.error("Failed to process monthly summary for user {}", user.getId(), e);
        errorCount++;
      }
    }

    log.info("Monthly summary job completed - Success: {}, Errors: {}", successCount, errorCount);
  }
}
