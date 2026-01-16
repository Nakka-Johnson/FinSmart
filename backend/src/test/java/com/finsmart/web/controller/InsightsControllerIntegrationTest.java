package com.finsmart.web.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.finsmart.config.BaseIntegrationTest;
import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.enums.AccountType;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class InsightsControllerIntegrationTest extends BaseIntegrationTest {

  @Autowired private TransactionRepository transactionRepository;

  private User testUser;
  private String authToken;
  private Account testAccount;
  private Category groceriesCategory;
  private Category transportCategory;

  @BeforeEach
  void setUp() {
    testUser = createTestUser("insights.test@example.com", "password123", "Insights Tester");
    authToken = createToken(testUser);
    testAccount = createTestAccount(testUser, "Test Account", AccountType.CHECKING);
    groceriesCategory = createTestCategory("Groceries", "#FF5733");
    transportCategory = createTestCategory("Transport", "#3357FF");
  }

  @Test
  void testGetMonthlyInsights() throws Exception {
    // Create transactions for January 2026
    LocalDate jan15 = LocalDate.of(2026, 1, 15);
    Instant jan15Instant = jan15.atStartOfDay(ZoneOffset.UTC).toInstant();

    createTransaction(
        groceriesCategory, BigDecimal.valueOf(100.00), jan15Instant, TransactionDirection.DEBIT);
    createTransaction(
        transportCategory, BigDecimal.valueOf(50.00), jan15Instant, TransactionDirection.DEBIT);
    createTransaction(null, BigDecimal.valueOf(200.00), jan15Instant, TransactionDirection.CREDIT);

    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.month").value(1))
        .andExpect(jsonPath("$.year").value(2026))
        .andExpect(jsonPath("$.totalCredit").value(200.00))
        .andExpect(jsonPath("$.totalDebit").value(150.00))
        .andExpect(jsonPath("$.topCategories").isArray());
  }

  @Test
  void testGetMonthlyInsightsWithNoTransactions() throws Exception {
    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.month").value(1))
        .andExpect(jsonPath("$.year").value(2026))
        .andExpect(jsonPath("$.totalCredit").value(0.00))
        .andExpect(jsonPath("$.totalDebit").value(0.00));
  }

  @Test
  void testGetMonthlyInsightsExcludesOtherMonths() throws Exception {
    // Create transactions in December 2025
    LocalDate dec15 = LocalDate.of(2025, 12, 15);
    Instant dec15Instant = dec15.atStartOfDay(ZoneOffset.UTC).toInstant();
    createTransaction(
        groceriesCategory, BigDecimal.valueOf(100.00), dec15Instant, TransactionDirection.DEBIT);

    // Create transactions in January 2026
    LocalDate jan15 = LocalDate.of(2026, 1, 15);
    Instant jan15Instant = jan15.atStartOfDay(ZoneOffset.UTC).toInstant();
    createTransaction(
        groceriesCategory, BigDecimal.valueOf(50.00), jan15Instant, TransactionDirection.DEBIT);

    // Request January 2026 insights
    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalDebit").value(50.00));
  }

  @Test
  void testGetMonthlyInsightsInvalidMonth() throws Exception {
    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "13")
                .param("year", "2026"))
        .andExpect(status().isBadRequest());

    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "0")
                .param("year", "2026"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testGetMonthlyInsightsInvalidYear() throws Exception {
    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "1999"))
        .andExpect(status().isBadRequest());

    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2101"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testGetMonthlyInsightsUserIsolation() throws Exception {
    // Create transaction for test user
    LocalDate jan15 = LocalDate.of(2026, 1, 15);
    Instant jan15Instant = jan15.atStartOfDay(ZoneOffset.UTC).toInstant();
    createTransaction(
        groceriesCategory, BigDecimal.valueOf(100.00), jan15Instant, TransactionDirection.DEBIT);

    // Create another user with their own transaction
    User otherUser = createTestUser("other@example.com", "password123", "Other User");
    String otherToken = createToken(otherUser);
    Account otherAccount = createTestAccount(otherUser, "Other Account", AccountType.CHECKING);

    Transaction otherTransaction =
        Transaction.builder()
            .account(otherAccount)
            .postedAt(jan15Instant)
            .amount(BigDecimal.valueOf(500.00))
            .direction(TransactionDirection.DEBIT)
            .description("Other user transaction")
            .category(groceriesCategory)
            .build();
    transactionRepository.save(otherTransaction);

    // Test user should only see their own transactions
    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalDebit").value(100.00));

    // Other user should only see their own transactions
    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(otherToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalDebit").value(500.00));
  }

  @Test
  void testGetMonthlyInsightsWithoutAuth() throws Exception {
    mockMvc
        .perform(get("/api/insights/monthly").param("month", "1").param("year", "2026"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void testGetMonthlyInsightsMissingParameters() throws Exception {
    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1"))
        .andExpect(status().isBadRequest());

    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("year", "2026"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testGetMonthlyInsightsWithMultipleCategories() throws Exception {
    LocalDate jan15 = LocalDate.of(2026, 1, 15);
    Instant jan15Instant = jan15.atStartOfDay(ZoneOffset.UTC).toInstant();

    // Create transactions across multiple categories
    createTransaction(
        groceriesCategory, BigDecimal.valueOf(100.00), jan15Instant, TransactionDirection.DEBIT);
    createTransaction(
        transportCategory, BigDecimal.valueOf(50.00), jan15Instant, TransactionDirection.DEBIT);
    createTransaction(
        groceriesCategory, BigDecimal.valueOf(75.00), jan15Instant, TransactionDirection.DEBIT);

    mockMvc
        .perform(
            get("/api/insights/monthly")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalDebit").value(225.00))
        .andExpect(jsonPath("$.topCategories").isArray());
  }

  private Transaction createTransaction(
      Category category, BigDecimal amount, Instant postedAt, TransactionDirection direction) {
    Transaction transaction =
        Transaction.builder()
            .account(testAccount)
            .postedAt(postedAt)
            .amount(amount)
            .direction(direction)
            .description("Test transaction")
            .category(category)
            .build();
    return transactionRepository.save(transaction);
  }
}
