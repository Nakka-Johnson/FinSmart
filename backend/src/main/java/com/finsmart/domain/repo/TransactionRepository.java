package com.finsmart.domain.repo;

import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.enums.TransactionDirection;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository
    extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

  Page<Transaction> findByAccountIdOrderByPostedAtDesc(UUID accountId, Pageable pageable);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.id = :accountId
        AND t.direction = :direction
        AND YEAR(t.postedAt) = :year
        AND MONTH(t.postedAt) = :month
      """)
  BigDecimal sumAmountByAccountAndDirectionAndMonthAndYear(
      @Param("accountId") UUID accountId,
      @Param("direction") TransactionDirection direction,
      @Param("year") int year,
      @Param("month") int month);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.direction = :direction
        AND YEAR(t.postedAt) = :year
        AND MONTH(t.postedAt) = :month
      """)
  BigDecimal sumAmountByUserAndDirectionAndMonthAndYear(
      @Param("userId") UUID userId,
      @Param("direction") TransactionDirection direction,
      @Param("year") int year,
      @Param("month") int month);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.category.id = :categoryId
        AND t.direction = :direction
        AND t.postedAt >= :startDate
        AND t.postedAt <= :endDate
      """)
  Optional<BigDecimal> sumAmountByUserAndCategoryAndDirectionAndDateRange(
      @Param("userId") UUID userId,
      @Param("categoryId") UUID categoryId,
      @Param("direction") TransactionDirection direction,
      @Param("startDate") Instant startDate,
      @Param("endDate") Instant endDate);

  // Duplicate detection by hash
  Optional<Transaction> findByHash(String hash);

  boolean existsByHash(String hash);

  // Delete operations
  int deleteByAccountUserId(UUID userId);

  int deleteByAccountUserIdAndNotesContaining(UUID userId, String marker);

  // Sprint-1: Find transactions for insights and anomaly detection
  @Query(
      """
      SELECT t FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.postedAt >= :cutoffDate
      ORDER BY t.postedAt DESC
      """)
  List<Transaction> findByUserIdAndPostedAtAfter(
      @Param("userId") UUID userId, @Param("cutoffDate") Instant cutoffDate);
}
