package com.finsmart.domain.repo;

import com.finsmart.domain.entity.AiFeedback;
import com.finsmart.domain.enums.AiFeedbackType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AiFeedbackRepository extends JpaRepository<AiFeedback, UUID> {

  /** Find all feedback for a user ordered by creation date desc */
  Page<AiFeedback> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

  /** Find all feedback of a specific type for a user */
  List<AiFeedback> findByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, AiFeedbackType type);

  /** Find feedback for a specific transaction */
  List<AiFeedback> findByTransactionIdOrderByCreatedAtDesc(UUID transactionId);

  /** Count feedback by type for a user */
  long countByUserIdAndType(UUID userId, AiFeedbackType type);

  /** Find recent feedback for export/training */
  @Query(
      """
            SELECT f FROM AiFeedback f
            WHERE f.createdAt >= :since
            ORDER BY f.createdAt DESC
            """)
  List<AiFeedback> findRecentFeedback(@Param("since") Instant since);

  /** Delete all feedback for a user (for data cleanup) */
  int deleteByUserId(UUID userId);
}
