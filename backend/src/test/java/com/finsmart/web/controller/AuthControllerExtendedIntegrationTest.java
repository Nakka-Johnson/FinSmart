package com.finsmart.web.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finsmart.config.BaseIntegrationTest;
import com.finsmart.domain.entity.User;
import com.finsmart.web.dto.auth.LoginRequest;
import com.finsmart.web.dto.auth.RegisterRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class AuthControllerExtendedIntegrationTest extends BaseIntegrationTest {

  @Autowired private ObjectMapper mapper;

  @Test
  void testTokenValidation() throws Exception {
    // Register user
    RegisterRequest registerRequest =
        new RegisterRequest("token.test@example.com", "password123", "Token Tester");

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    String token = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();

    // Use valid token
    mockMvc
        .perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("token.test@example.com"));

    // Use invalid token format
    mockMvc
        .perform(get("/api/auth/me").header("Authorization", "InvalidTokenFormat"))
        .andExpect(status().isUnauthorized());

    // Use malformed bearer token
    mockMvc
        .perform(get("/api/auth/me").header("Authorization", "Bearer invalid.token.here"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void testLoginWithNonExistentUser() throws Exception {
    LoginRequest request = new LoginRequest("nonexistent@example.com", "password123");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void testRegisterWithEmptyFields() throws Exception {
    RegisterRequest emptyEmail = new RegisterRequest("", "password123", "Test User");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyEmail)))
        .andExpect(status().isBadRequest());

    RegisterRequest emptyPassword = new RegisterRequest("test@example.com", "", "Test User");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyPassword)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testMultipleLoginsSameUser() throws Exception {
    // Register user
    RegisterRequest registerRequest =
        new RegisterRequest("multilogin@example.com", "password123", "Multi Login User");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isCreated());

    // Login multiple times should succeed
    LoginRequest loginRequest = new LoginRequest("multilogin@example.com", "password123");

    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              post("/api/auth/login")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(loginRequest)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.token").exists())
          .andExpect(jsonPath("$.email").value("multilogin@example.com"));
    }
  }

  @Test
  void testConcurrentRegistrationAttempts() throws Exception {
    int threadCount = 5;
    CountDownLatch latch = new CountDownLatch(threadCount);
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicInteger conflictCount = new AtomicInteger(0);

    List<Thread> threads = new ArrayList<>();

    for (int i = 0; i < threadCount; i++) {
      Thread thread =
          new Thread(
              () -> {
                try {
                  RegisterRequest request =
                      new RegisterRequest(
                          "concurrent@example.com", "password123", "Concurrent User");

                  MvcResult result =
                      mockMvc
                          .perform(
                              post("/api/auth/register")
                                  .contentType(MediaType.APPLICATION_JSON)
                                  .content(objectMapper.writeValueAsString(request)))
                          .andReturn();

                  if (result.getResponse().getStatus() == 201) {
                    successCount.incrementAndGet();
                  } else if (result.getResponse().getStatus() == 409) {
                    conflictCount.incrementAndGet();
                  }
                } catch (Exception e) {
                  // Ignore
                } finally {
                  latch.countDown();
                }
              });
      threads.add(thread);
    }

    // Start all threads
    for (Thread thread : threads) {
      thread.start();
    }

    // Wait for all to complete
    latch.await();

    // Only one should succeed, others should get conflict
    assert successCount.get() == 1 : "Expected 1 success, got " + successCount.get();
    assert conflictCount.get() == threadCount - 1
        : "Expected " + (threadCount - 1) + " conflicts, got " + conflictCount.get();
  }

  @Test
  void testAuthEndpointsWithNoAuthHeader() throws Exception {
    mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
  }

  @Test
  void testRegisterAndImmediateLogin() throws Exception {
    RegisterRequest registerRequest =
        new RegisterRequest("immediate@example.com", "password123", "Immediate User");

    // Register
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.email").value("immediate@example.com"));

    // Immediately login
    LoginRequest loginRequest = new LoginRequest("immediate@example.com", "password123");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.email").value("immediate@example.com"));
  }

  @Test
  void testEmailCaseSensitivity() throws Exception {
    // Register with lowercase
    RegisterRequest registerRequest =
        new RegisterRequest("CaseSensitive@Example.com", "password123", "Case User");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isCreated());

    // Try to register with different case
    RegisterRequest duplicateRequest =
        new RegisterRequest("casesensitive@example.com", "password123", "Case User 2");

    // This test documents current behavior - adjust expectation if case-insensitive
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRequest)))
        .andExpect(status().isCreated()); // Or isConflict() if case-insensitive
  }

  @Test
  void testGetCurrentUserDetails() throws Exception {
    User user = createTestUser("details@example.com", "password123", "Details User");
    String token = createToken(user);

    mockMvc
        .perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value(user.getId().toString()))
        .andExpect(jsonPath("$.email").value("details@example.com"))
        .andExpect(jsonPath("$.fullName").value("Details User"))
        .andExpect(jsonPath("$.token").doesNotExist()); // Token not returned in /me
  }

  @Test
  void testSpecialCharactersInPassword() throws Exception {
    RegisterRequest request =
        new RegisterRequest("special@example.com", "P@ssw0rd!#$%^&*()", "Special Char User");

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

    // Login with special characters
    LoginRequest loginRequest = new LoginRequest("special@example.com", "P@ssw0rd!#$%^&*()");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
        .andExpect(status().isOk());
  }

  @Test
  void testLongEmailAddress() throws Exception {
    String longEmail = "very.long.email.address.for.testing.purposes@example.com";
    RegisterRequest request = new RegisterRequest(longEmail, "password123", "Long Email User");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.email").value(longEmail));
  }
}
