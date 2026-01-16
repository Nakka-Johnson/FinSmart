package com.finsmart.web.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.finsmart.config.BaseIntegrationTest;
import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.enums.AccountType;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.web.dto.budget.BudgetRequest;
import com.finsmart.web.dto.transaction.TransactionRequest;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/**
 * API contract tests to verify request validation, response formats, and error handling consistency
 * across all endpoints.
 */
class ApiContractIntegrationTest extends BaseIntegrationTest {

  private User testUser;
  private String authToken;
  private Account testAccount;
  private Category testCategory;

  @BeforeEach
  void setUp() {
    testUser = createTestUser("contract.test@example.com", "password123", "Contract Tester");
    authToken = createToken(testUser);
    testAccount = createTestAccount(testUser, "Test Account", AccountType.CHECKING);
    testCategory = createTestCategory("Test Category", "#FF5733");
  }

  @Test
  void testTransactionRequestValidation() throws Exception {
    // Test null accountId
    TransactionRequest nullAccount =
        new TransactionRequest(
            null,
            Instant.now(),
            BigDecimal.valueOf(100.00),
            TransactionDirection.DEBIT,
            "Test",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullAccount)))
        .andExpect(status().isBadRequest());

    // Test null postedAt
    TransactionRequest nullDate =
        new TransactionRequest(
            testAccount.getId(),
            null,
            BigDecimal.valueOf(100.00),
            TransactionDirection.DEBIT,
            "Test",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullDate)))
        .andExpect(status().isBadRequest());

    // Test null amount
    TransactionRequest nullAmount =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            null,
            TransactionDirection.DEBIT,
            "Test",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullAmount)))
        .andExpect(status().isBadRequest());

    // Test null direction
    TransactionRequest nullDirection =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(100.00),
            null,
            "Test",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullDirection)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testBudgetRequestValidation() throws Exception {
    // Test null categoryId
    BudgetRequest nullCategory = new BudgetRequest(null, 1, 2026, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            post("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullCategory)))
        .andExpect(status().isBadRequest());

    // Test null month
    BudgetRequest nullMonth =
        new BudgetRequest(testCategory.getId(), null, 2026, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            post("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullMonth)))
        .andExpect(status().isBadRequest());

    // Test null year
    BudgetRequest nullYear =
        new BudgetRequest(testCategory.getId(), 1, null, BigDecimal.valueOf(500.00));

    mockMvc
        .perform(
            post("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullYear)))
        .andExpect(status().isBadRequest());

    // Test null limitAmount
    BudgetRequest nullLimit = new BudgetRequest(testCategory.getId(), 1, 2026, null);

    mockMvc
        .perform(
            post("/api/budgets")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullLimit)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testResponseFormatConsistency() throws Exception {
    // Test successful creation returns correct structure
    TransactionRequest validRequest =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(100.00),
            TransactionDirection.DEBIT,
            "Test transaction",
            testCategory.getId(),
            "Test Store",
            "Test notes");

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.accountId").exists())
        .andExpect(jsonPath("$.postedAt").exists())
        .andExpect(jsonPath("$.amount").isNumber())
        .andExpect(jsonPath("$.direction").isString())
        .andExpect(jsonPath("$.description").isString())
        .andExpect(jsonPath("$.category").exists())
        .andExpect(jsonPath("$.category.id").exists())
        .andExpect(jsonPath("$.category.name").exists())
        .andExpect(jsonPath("$.merchant").exists())
        .andExpect(jsonPath("$.notes").exists())
        .andExpect(jsonPath("$.createdAt").exists());
  }

  @Test
  void testPaginationResponseFormat() throws Exception {
    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("page", "0")
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.number").isNumber())
        .andExpect(jsonPath("$.size").isNumber())
        .andExpect(jsonPath("$.totalElements").isNumber())
        .andExpect(jsonPath("$.totalPages").isNumber());
  }

  @Test
  void testErrorResponseFormat() throws Exception {
    // Test 401 error format
    mockMvc.perform(get("/api/transactions")).andExpect(status().isUnauthorized());

    // Test 400 error format
    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("invalid json"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testContentTypeValidation() throws Exception {
    TransactionRequest request =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(100.00),
            TransactionDirection.DEBIT,
            "Test",
            null,
            null,
            null);

    // Test with correct Content-Type
    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());
  }

  @Test
  void testMalformedJsonHandling() throws Exception {
    String malformedJson = "{invalid json";

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(malformedJson))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testBoundaryValues() throws Exception {
    // Test very large amount
    TransactionRequest largeAmount =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            new BigDecimal("9999999999.99"),
            TransactionDirection.DEBIT,
            "Large amount",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(largeAmount)))
        .andExpect(status().isCreated());

    // Test zero amount (should be allowed based on @DecimalMin(value = "0.00", inclusive = true))
    TransactionRequest zeroAmount =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.ZERO,
            TransactionDirection.DEBIT,
            "Zero amount",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(zeroAmount)))
        .andExpect(status().isCreated());
  }
}
