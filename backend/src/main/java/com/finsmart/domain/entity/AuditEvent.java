package com.finsmart.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_email")
  private String userEmail;

  @Column(name = "method", nullable = false)
  private String method;

  @Column(name = "path", nullable = false)
  private String path;

  @Column(name = "status")
  private Integer status;

  @Column(name = "ip")
  private String ip;

  @Column(name = "user_agent", length = 512)
  private String userAgent;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }
}
