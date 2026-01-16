package com.finsmart.web.controller;

import static org.hamcrest.Matchers.*;
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
import com.finsmart.web.dto.transaction.TransactionRequest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class TransactionControllerIntegrationTest extends BaseIntegrationTest {

  @Autowired private TransactionRepository transactionRepository;

  private User testUser;
  private String authToken;
  private Account testAccount;
  private Category testCategory;

  @BeforeEach
  void setUp() {
    testUser = createTestUser("transaction.test@example.com", "password123", "Transaction Tester");
    authToken = createToken(testUser);
    testAccount = createTestAccount(testUser, "Test Checking", AccountType.CHECKING);
    testCategory = createTestCategory("Groceries", "#FF5733");
  }

  @Test
  void testCreateTransaction() throws Exception {
    TransactionRequest request =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(50.00),
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
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.amount").value(50.00))
        .andExpect(jsonPath("$.direction").value("DEBIT"))
        .andExpect(jsonPath("$.description").value("Test transaction"))
        .andExpect(jsonPath("$.merchant").value("Test Store"))
        .andExpect(jsonPath("$.notes").value("Test notes"))
        .andExpect(jsonPath("$.category.id").value(testCategory.getId().toString()))
        .andExpect(jsonPath("$.category.name").value("Groceries"));
  }

  @Test
  void testCreateTransactionWithoutCategory() throws Exception {
    TransactionRequest request =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(25.00),
            TransactionDirection.CREDIT,
            "Salary",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.amount").value(25.00))
        .andExpect(jsonPath("$.direction").value("CREDIT"))
        .andExpect(jsonPath("$.category").isEmpty());
  }

  @Test
  void testCreateTransactionWithInvalidData() throws Exception {
    // Negative amount
    TransactionRequest invalidRequest =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(-50.00),
            TransactionDirection.DEBIT,
            "Invalid",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testListTransactions() throws Exception {
    // Create multiple transactions
    createTransaction(testAccount, BigDecimal.valueOf(100.00), TransactionDirection.DEBIT);
    createTransaction(testAccount, BigDecimal.valueOf(200.00), TransactionDirection.CREDIT);
    createTransaction(testAccount, BigDecimal.valueOf(50.00), TransactionDirection.DEBIT);

    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("size", "10")
                .param("page", "0"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.content", hasSize(3)))
        .andExpect(jsonPath("$.totalElements").value(3))
        .andExpect(jsonPath("$.totalPages").value(1));
  }

  @Test
  void testListTransactionsWithFilters() throws Exception {
    // Create transactions with different properties
    createTransaction(testAccount, BigDecimal.valueOf(100.00), TransactionDirection.DEBIT);
    createTransaction(testAccount, BigDecimal.valueOf(200.00), TransactionDirection.CREDIT);

    // Filter by direction
    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("direction", "DEBIT"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].direction").value("DEBIT"));

    // Filter by amount range
    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("minAmount", "150")
                .param("maxAmount", "250"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].amount").value(200.00));
  }

  @Test
  void testUpdateTransaction() throws Exception {
    Transaction transaction =
        createTransaction(testAccount, BigDecimal.valueOf(100.00), TransactionDirection.DEBIT);

    TransactionRequest updateRequest =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(150.00),
            TransactionDirection.DEBIT,
            "Updated description",
            testCategory.getId(),
            "Updated Store",
            "Updated notes");

    mockMvc
        .perform(
            put("/api/transactions/" + transaction.getId())
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(transaction.getId().toString()))
        .andExpect(jsonPath("$.amount").value(150.00))
        .andExpect(jsonPath("$.description").value("Updated description"))
        .andExpect(jsonPath("$.merchant").value("Updated Store"))
        .andExpect(jsonPath("$.notes").value("Updated notes"));
  }

  @Test
  void testDeleteTransaction() throws Exception {
    Transaction transaction =
        createTransaction(testAccount, BigDecimal.valueOf(100.00), TransactionDirection.DEBIT);

    mockMvc
        .perform(
            delete("/api/transactions/" + transaction.getId())
                .header("Authorization", bearerToken(authToken)))
        .andExpect(status().isNoContent());

    // Verify deleted
    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(0)));
  }

  @Test
  void testTransactionPagination() throws Exception {
    // Create 25 transactions
    for (int i = 0; i < 25; i++) {
      createTransaction(testAccount, BigDecimal.valueOf(10.00 + i), TransactionDirection.DEBIT);
    }

    // Get first page
    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("size", "10")
                .param("page", "0"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(10)))
        .andExpect(jsonPath("$.totalElements").value(25))
        .andExpect(jsonPath("$.totalPages").value(3))
        .andExpect(jsonPath("$.number").value(0));

    // Get second page
    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("size", "10")
                .param("page", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(10)))
        .andExpect(jsonPath("$.number").value(1));
  }

  @Test
  void testTransactionUserIsolation() throws Exception {
    // Create another user
    User otherUser = createTestUser("other@example.com", "password123", "Other User");
    String otherToken = createToken(otherUser);
    Account otherAccount = createTestAccount(otherUser, "Other Account", AccountType.CHECKING);

    // Create transaction for other user
    Transaction otherTransaction =
        createTransaction(otherAccount, BigDecimal.valueOf(100.00), TransactionDirection.DEBIT);

    // First user should not see other user's transactions
    mockMvc
        .perform(
            get("/api/transactions")
                .header("Authorization", bearerToken(authToken))
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(0)));

    // First user should not be able to update other user's transaction
    TransactionRequest updateRequest =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(150.00),
            TransactionDirection.DEBIT,
            "Unauthorized update",
            null,
            null,
            null);

    mockMvc
        .perform(
            put("/api/transactions/" + otherTransaction.getId())
                .header("Authorization", bearerToken(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isNotFound());

    // First user should not be able to delete other user's transaction
    mockMvc
        .perform(
            delete("/api/transactions/" + otherTransaction.getId())
                .header("Authorization", bearerToken(authToken)))
        .andExpect(status().isNotFound());
  }

  @Test
  void testTransactionWithoutAuth() throws Exception {
    TransactionRequest request =
        new TransactionRequest(
            testAccount.getId(),
            Instant.now(),
            BigDecimal.valueOf(50.00),
            TransactionDirection.DEBIT,
            "Test",
            null,
            null,
            null);

    mockMvc
        .perform(
            post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(get("/api/transactions")).andExpect(status().isUnauthorized());
  }

  private Transaction createTransaction(
      Account account, BigDecimal amount, TransactionDirection direction) {
    Transaction transaction =
        Transaction.builder()
            .account(account)
            .postedAt(Instant.now().minus(1, ChronoUnit.DAYS))
            .amount(amount)
            .direction(direction)
            .description("Test transaction")
            .category(testCategory)
            .build();
    transaction = transactionRepository.save(transaction);
    entityManager.flush();
    return transaction;
  }
}
