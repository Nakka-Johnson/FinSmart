package com.finsmart.service;

import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.repo.AccountRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.domain.repo.UserRepository;
import com.finsmart.service.ai.AiClientService;
import com.finsmart.service.ai.TxnPayload;
import com.finsmart.web.dto.MonthlyInsightDTO;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class InsightService {

  private final UserRepository userRepository;
  private final AccountRepository accountRepository;
  private final TransactionRepository transactionRepository;
  private final AiClientService aiClientService;

  /**
   * Build monthly insights for a given user.
   *
   * @param userId User ID
   * @param month Month (1-12)
   * @param year Year
   * @return MonthlyInsightDTO with summary, anomalies, and forecast
   */
  @Transactional(readOnly = true)
  public MonthlyInsightDTO buildMonthlyInsights(UUID userId, int month, int year) {
    // Verify user exists
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

    // Get all accounts for the user
    List<Account> accounts = accountRepository.findByUserId(userId);
    if (accounts.isEmpty()) {
      // Return empty insights if no accounts
      return MonthlyInsightDTO.builder()
          .month(month)
          .year(year)
          .totalDebit(BigDecimal.ZERO)
          .totalCredit(BigDecimal.ZERO)
          .biggestCategory(null)
          .topCategories(List.of())
          .anomalies(List.of())
          .forecast(List.of())
          .build();
    }

    // Build date range for the month
    YearMonth yearMonth = YearMonth.of(year, month);
    LocalDate startOfMonth = yearMonth.atDay(1);
    LocalDate endOfMonth = yearMonth.atEndOfMonth();
    Instant startInstant = startOfMonth.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant endInstant = endOfMonth.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

    // Fetch all transactions for the month across all user accounts
    Specification<Transaction> spec =
        (root, query, cb) -> {
          return cb.and(
              root.get("account").get("user").get("id").in(userId),
              cb.greaterThanOrEqualTo(root.get("postedAt"), startInstant),
              cb.lessThan(root.get("postedAt"), endInstant));
        };

    List<Transaction> transactions = transactionRepository.findAll(spec);

    if (transactions.isEmpty()) {
      // Return empty insights if no transactions
      return MonthlyInsightDTO.builder()
          .month(month)
          .year(year)
          .totalDebit(BigDecimal.ZERO)
          .totalCredit(BigDecimal.ZERO)
          .biggestCategory(null)
          .topCategories(List.of())
          .anomalies(List.of())
          .forecast(List.of())
          .build();
    }

    // Convert to TxnPayload for AI service
    List<TxnPayload> txnPayloads = convertToTxnPayloads(transactions);

    // Call AI services
    Map<String, Object> analysisResult = aiClientService.analyze(txnPayloads);
    List<Map<String, Object>> anomalyList = aiClientService.anomalies(txnPayloads);
    List<Map<String, Object>> forecastList = aiClientService.forecast(txnPayloads);

    // Build DTO
    return buildInsightDTO(month, year, analysisResult, anomalyList, forecastList);
  }

  /**
   * Convert Transaction entities to TxnPayload for AI service.
   *
   * @param transactions List of transactions
   * @return List of TxnPayload
   */
  private List<TxnPayload> convertToTxnPayloads(List<Transaction> transactions) {
    DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
    List<TxnPayload> payloads = new ArrayList<>();

    for (Transaction txn : transactions) {
      LocalDate date = txn.getPostedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String categoryName = txn.getCategory() != null ? txn.getCategory().getName() : null;

      payloads.add(
          TxnPayload.builder()
              .date(date.format(formatter))
              .amount(txn.getAmount())
              .category(categoryName)
              .direction(txn.getDirection().name())
              .description(txn.getDescription())
              .build());
    }

    return payloads;
  }

  /**
   * Build MonthlyInsightDTO from AI service responses.
   *
   * @param month Month
   * @param year Year
   * @param analysisResult Analysis result from AI
   * @param anomalyList Anomaly list from AI
   * @param forecastList Forecast list from AI
   * @return MonthlyInsightDTO
   */
  @SuppressWarnings("unchecked")
  private MonthlyInsightDTO buildInsightDTO(
      int month,
      int year,
      Map<String, Object> analysisResult,
      List<Map<String, Object>> anomalyList,
      List<Map<String, Object>> forecastList) {

    // Extract totals and top categories from analysis
    BigDecimal totalDebit = new BigDecimal(analysisResult.get("totalDebit").toString());
    BigDecimal totalCredit = new BigDecimal(analysisResult.get("totalCredit").toString());
    String biggestCategory = (String) analysisResult.get("biggestCategory");

    List<Map<String, Object>> topCategoriesRaw =
        (List<Map<String, Object>>) analysisResult.get("topCategories");
    List<MonthlyInsightDTO.TopCategoryDTO> topCategories = new ArrayList<>();
    if (topCategoriesRaw != null) {
      for (Map<String, Object> cat : topCategoriesRaw) {
        topCategories.add(
            MonthlyInsightDTO.TopCategoryDTO.builder()
                .category((String) cat.get("category"))
                .total(new BigDecimal(cat.get("total").toString()))
                .build());
      }
    }

    // Extract anomalies (filter only actual anomalies)
    List<MonthlyInsightDTO.AnomalyDTO> anomalies = new ArrayList<>();
    if (anomalyList != null) {
      for (Map<String, Object> anomaly : anomalyList) {
        Boolean isAnomaly = (Boolean) anomaly.get("isAnomaly");
        if (Boolean.TRUE.equals(isAnomaly)) {
          anomalies.add(
              MonthlyInsightDTO.AnomalyDTO.builder()
                  .date((String) anomaly.get("date"))
                  .amount(new BigDecimal(anomaly.get("amount").toString()))
                  .category((String) anomaly.get("category"))
                  .score(((Number) anomaly.get("score")).doubleValue())
                  .build());
        }
      }
    }

    // Extract forecasts
    List<MonthlyInsightDTO.ForecastDTO> forecasts = new ArrayList<>();
    if (forecastList != null) {
      for (Map<String, Object> forecast : forecastList) {
        forecasts.add(
            MonthlyInsightDTO.ForecastDTO.builder()
                .category((String) forecast.get("category"))
                .nextMonthForecast(new BigDecimal(forecast.get("nextMonthForecast").toString()))
                .method((String) forecast.get("method"))
                .build());
      }
    }

    return MonthlyInsightDTO.builder()
        .month(month)
        .year(year)
        .totalDebit(totalDebit)
        .totalCredit(totalCredit)
        .biggestCategory(biggestCategory)
        .topCategories(topCategories)
        .anomalies(anomalies)
        .forecast(forecasts)
        .build();
  }
}
