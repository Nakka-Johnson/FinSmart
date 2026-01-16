package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "budgets",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_budget_user_category_month_year",
          columnNames = {"user_id", "category_id", "\"month\"", "\"year\""})
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Budget {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_budget_user"))
  private User user;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(
      name = "category_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_budget_category"))
  private Category category;

  @NotNull
  @Min(1)
  @Max(12)
  @Column(name = "\"month\"", nullable = false)
  private Integer month;

  @NotNull
  @Min(2000)
  @Column(name = "\"year\"", nullable = false)
  private Integer year;

  @NotNull
  @DecimalMin(value = "0.00", inclusive = true)
  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal limitAmount;
}
