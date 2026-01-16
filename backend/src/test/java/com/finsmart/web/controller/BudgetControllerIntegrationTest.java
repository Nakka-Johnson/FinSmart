package com.finsmart.web.controller;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.finsmart.config.BaseIntegrationTest;
import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Budget;
import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.enums.AccountType;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.BudgetRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.web.dto.budget.BudgetRequest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class BudgetControllerIntegrationTest extends BaseIntegrationTest {

  @Autowired private BudgetRepository budgetRepository;

  @Autowired private TransactionRepository transactionRepository;

  private User testUser;
  private String authToken;
  private Category groceriesCategory;
  private Category transportCategory;
  private Account testAccount;

  @BeforeEach
  void setUp() {
    testUser = createTestUser("budget.test@example.com", "password123", "Budget Tester");
    authToken = createToken(testUser);
    groceriesCategory = createTestCategory("Groceries", "#FF5733");
    transportCategory = createTestCategory("Transport", "#3357FF");
    testAccount = createTestAccount(testUser, "Test Account", AccountType.CHECKING);
  }

  @Test
  void testCreateBudget() throws Exception {
    BudgetRequest request =
        new BudgetRequest(groceriesCategory.getId(), 1, 2026, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            post("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.category.id").value(groceriesCategory.getId().toString()))
        .andExpect(jsonPath("$.category.name").value("Groceries"))
        .andExpect(jsonPath("$.month").value(1))
        .andExpect(jsonPath("$.year").value(2026))
        .andExpect(jsonPath("$.limitAmount").value(500.00));
  }

  @Test
  void testCreateDuplicateBudget() throws Exception {
    // Create first budget
    BudgetRequest request =
        new BudgetRequest(groceriesCategory.getId(), 1, 2026, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            post("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    // Try to create duplicate - should fail
    mockMvc
        .perform(
            post("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isConflict());
  }

  @Test
  void testListBudgets() throws Exception {
    // Create budgets for different months
    createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));
    createBudget(transportCategory, 1, 2026, BigDecimal.valueOf(200.00));
    createBudget(groceriesCategory, 2, 2026, BigDecimal.valueOf(550.00));

    // List all budgets
    mockMvc
        .perform(get("/api/budgets").header("Authorization", bearerToken(authToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$", hasSize(3)));

    // List budgets for specific month
    mockMvc
        .perform(
            get("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[*].month", everyItem(is(1))))
        .andExpect(jsonPath("$[*].year", everyItem(is(2026))));
  }

  @Test
  void testUpdateBudget() throws Exception {
    Budget budget = createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));

    BudgetRequest updateRequest =
        new BudgetRequest(groceriesCategory.getId(), 1, 2026, BigDecimal.valueOf(600.00));

    mockMvc
        .perform(
            put("/api/budgets/" + budget.getId())
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(budget.getId().toString()))
        .andExpect(jsonPath("$.limitAmount").value(600.00));
  }

  @Test
  void testUpdateBudgetToDuplicate() throws Exception {
    Budget budget1 = createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));
    Budget budget2 = createBudget(transportCategory, 1, 2026, BigDecimal.valueOf(200.00));

    // Try to update budget2 to have same category as budget1
    BudgetRequest updateRequest =
        new BudgetRequest(groceriesCategory.getId(), 1, 2026, BigDecimal.valueOf(300.00));

    mockMvc
        .perform(
            put("/api/budgets/" + budget2.getId())
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isConflict());
  }

  @Test
  void testDeleteBudget() throws Exception {
    Budget budget = createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            delete("/api/budgets/" + budget.getId())
                .header("Authorization", bearerToken(authToken)))
        .andExpect(status().isNoContent());

    // Verify deleted
    mockMvc
        .perform(get("/api/budgets").header("Authorization", bearerToken(authToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  void testBudgetSummary() throws Exception {
    // Create budgets
    createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));
    createBudget(transportCategory, 1, 2026, BigDecimal.valueOf(200.00));

    // Create transactions in January 2026
    LocalDate jan15 = LocalDate.of(2026, 1, 15);
    Instant jan15Instant = jan15.atStartOfDay(ZoneOffset.UTC).toInstant();

    createTransaction(groceriesCategory, BigDecimal.valueOf(100.00), jan15Instant);
    createTransaction(groceriesCategory, BigDecimal.valueOf(50.00), jan15Instant);
    createTransaction(transportCategory, BigDecimal.valueOf(80.00), jan15Instant);

    mockMvc
        .perform(
            get("/api/budgets/summary")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[?(@.categoryName=='Groceries')].limitAmount").value(500.00))
        .andExpect(jsonPath("$[?(@.categoryName=='Groceries')].spentAmount").value(150.00))
        .andExpect(jsonPath("$[?(@.categoryName=='Groceries')].percentUsed").value(30.0))
        .andExpect(jsonPath("$[?(@.categoryName=='Transport')].spentAmount").value(80.00))
        .andExpect(jsonPath("$[?(@.categoryName=='Transport')].percentUsed").value(40.0));
  }

  @Test
  void testBudgetSummaryWithNoTransactions() throws Exception {
    createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            get("/api/budgets/summary")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].spentAmount").value(0.00))
        .andExpect(jsonPath("$[0].percentUsed").value(0.0));
  }

  @Test
  void testBudgetSummaryExcludesOtherMonths() throws Exception {
    createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));

    // Create transaction in December 2025 (should not count)
    LocalDate dec15 = LocalDate.of(2025, 12, 15);
    Instant dec15Instant = dec15.atStartOfDay(ZoneOffset.UTC).toInstant();
    createTransaction(groceriesCategory, BigDecimal.valueOf(100.00), dec15Instant);

    // Create transaction in January 2026 (should count)
    LocalDate jan15 = LocalDate.of(2026, 1, 15);
    Instant jan15Instant = jan15.atStartOfDay(ZoneOffset.UTC).toInstant();
    createTransaction(groceriesCategory, BigDecimal.valueOf(50.00), jan15Instant);

    mockMvc
        .perform(
            get("/api/budgets/summary")
                .header("Authorization", bearerToken(authToken))
                .param("month", "1")
                .param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].spentAmount").value(50.00))
        .andExpect(jsonPath("$[0].percentUsed").value(10.0));
  }

  @Test
  void testBudgetUserIsolation() throws Exception {
    // Create budget for test user
    Budget budget = createBudget(groceriesCategory, 1, 2026, BigDecimal.valueOf(500.00));

    // Create another user
    User otherUser = createTestUser("other@example.com", "password123", "Other User");
    String otherToken = createToken(otherUser);

    // Other user should not see test user's budgets
    mockMvc
        .perform(get("/api/budgets").header("Authorization", bearerToken(otherToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));

    // Other user should not be able to update test user's budget
    BudgetRequest updateRequest =
        new BudgetRequest(groceriesCategory.getId(), 1, 2026, BigDecimal.valueOf(600.00));

    mockMvc
        .perform(
            put("/api/budgets/" + budget.getId())
                .header("Authorization", bearerToken(otherToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isNotFound());

    // Other user should not be able to delete test user's budget
    mockMvc
        .perform(
            delete("/api/budgets/" + budget.getId())
                .header("Authorization", bearerToken(otherToken)))
        .andExpect(status().isNotFound());
  }

  @Test
  void testBudgetWithoutAuth() throws Exception {
    BudgetRequest request =
        new BudgetRequest(groceriesCategory.getId(), 1, 2026, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            post("/api/budgets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(get("/api/budgets")).andExpect(status().isUnauthorized());
  }

  private Budget createBudget(Category category, int month, int year, BigDecimal limitAmount) {
    Budget budget = new Budget();
    budget.setUser(testUser);
    budget.setCategory(category);
    budget.setMonth(month);
    budget.setYear(year);
    budget.setLimitAmount(limitAmount);
    return budgetRepository.save(budget);
  }

  private Transaction createTransaction(Category category, BigDecimal amount, Instant postedAt) {
    Transaction transaction =
        Transaction.builder()
            .account(testAccount)
            .postedAt(postedAt)
            .amount(amount)
            .direction(TransactionDirection.DEBIT)
            .description("Test transaction")
            .category(category)
            .build();
    return transactionRepository.save(transaction);
  }
}
