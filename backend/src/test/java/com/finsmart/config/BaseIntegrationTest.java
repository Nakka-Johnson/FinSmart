package com.finsmart.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.enums.AccountType;
import com.finsmart.domain.repo.AccountRepository;
import com.finsmart.domain.repo.CategoryRepository;
import com.finsmart.domain.repo.UserRepository;
import com.finsmart.security.JwtUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base class for integration tests. Provides common setup and helper methods for testing with a
 * real database (H2 in-memory).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class BaseIntegrationTest {

  @Autowired protected MockMvc mockMvc;

  @Autowired protected ObjectMapper objectMapper;

  @Autowired protected UserRepository userRepository;

  @Autowired protected AccountRepository accountRepository;

  @Autowired protected CategoryRepository categoryRepository;

  @Autowired protected PasswordEncoder passwordEncoder;

  @Autowired protected JwtUtil jwtUtil;

  @PersistenceContext protected EntityManager entityManager;

  /**
   * Creates a test user with the given email and password.
   *
   * @param email User email
   * @param password User password
   * @param fullName User full name
   * @return Created user
   */
  protected User createTestUser(String email, String password, String fullName) {
    User user =
        User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .fullName(fullName)
            .build();
    user = userRepository.save(user);
    entityManager.flush();
    return user;
  }

  /**
   * Creates a JWT token for the given user.
   *
   * @param user User to create token for
   * @return JWT token
   */
  protected String createToken(User user) {
    return jwtUtil.createToken(user.getId(), user.getEmail());
  }

  /**
   * Creates a test account for the given user.
   *
   * @param user Account owner
   * @param name Account name
   * @param type Account type
   * @return Created account
   */
  protected Account createTestAccount(User user, String name, AccountType type) {
    Account account =
        Account.builder()
            .user(user)
            .name(name)
            .institution("Test Bank")
            .type(type)
            .currency("GBP")
            .balance(BigDecimal.valueOf(1000.00))
            .build();
    account = accountRepository.save(account);
    entityManager.flush();
    return account;
  }

  /**
   * Creates a test category.
   *
   * @param name Category name
   * @param color Category color
   * @return Created category
   */
  protected Category createTestCategory(String name, String color) {
    Category category = Category.builder().name(name).color(color).build();
    category = categoryRepository.save(category);
    entityManager.flush();
    return category;
  }

  /**
   * Creates a bearer token header value.
   *
   * @param token JWT token
   * @return Bearer token string
   */
  protected String bearerToken(String token) {
    return "Bearer " + token;
  }
}
