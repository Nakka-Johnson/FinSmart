package com.finsmart.web.controller;

import com.finsmart.service.DemoDataService;
import com.finsmart.service.DemoDataService.ClearResult;
import com.finsmart.service.DemoDataService.SeedResult;
import com.finsmart.service.UkDemoDataService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin controller for demo data management. */
@Slf4j
@RestController
@RequestMapping("/api/admin/demo")
@RequiredArgsConstructor
public class AdminController {

  private final DemoDataService demoDataService;
  private final UkDemoDataService ukDemoDataService;
  private final AuthenticationHelper authenticationHelper;

  @PostMapping("/seed")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<DemoSeedResponse> seedDemoData() {
    log.info("Seeding demo data");
    SeedResult result = demoDataService.seedDemoData();

    return ResponseEntity.ok(
        new DemoSeedResponse(
            "Demo data seeded successfully",
            result.usersCreated(),
            result.accountsCreated(),
            result.categoriesCreated(),
            result.transactionsCreated(),
            result.budgetsCreated(),
            result.rulesCreated()));
  }

  @DeleteMapping("/clear")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<DemoClearResponse> clearDemoData() {
    log.info("Clearing demo data");
    ClearResult result = demoDataService.clearDemoData();

    return ResponseEntity.ok(
        new DemoClearResponse(
            "Demo data cleared successfully",
            result.usersDeleted(),
            result.accountsDeleted(),
            result.categoriesDeleted(),
            result.transactionsDeleted(),
            result.budgetsDeleted(),
            result.rulesDeleted()));
  }

  // =====================================================================
  // User-scoped UK demo data endpoints (for current authenticated user)
  // =====================================================================

  /**
   * Seed UK demo data for the current authenticated user. Does not require ADMIN role - any
   * authenticated user can seed their own data.
   */
  @PostMapping("/uk/seed")
  public ResponseEntity<DemoSeedResponse> seedUkDemoData() {
    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("Seeding UK demo data for user: {}", userId);

    UkDemoDataService.SeedResult result = ukDemoDataService.seedUkDemoData(userId);

    return ResponseEntity.ok(
        new DemoSeedResponse(
            "UK demo data seeded successfully for user",
            result.usersCreated(),
            result.accountsCreated(),
            result.categoriesCreated(),
            result.transactionsCreated(),
            result.budgetsCreated(),
            result.rulesCreated()));
  }

  /**
   * Clear demo data for the current authenticated user. Only clears data with demo marker, safe for
   * user data.
   */
  @PostMapping("/uk/clear")
  public ResponseEntity<DemoClearResponse> clearUkDemoData() {
    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("Clearing UK demo data for user: {}", userId);

    UkDemoDataService.ClearResult result = ukDemoDataService.clearDemoData(userId);

    return ResponseEntity.ok(
        new DemoClearResponse(
            "Demo data cleared successfully for user",
            result.usersDeleted(),
            result.accountsDeleted(),
            result.categoriesDeleted(),
            result.transactionsDeleted(),
            result.budgetsDeleted(),
            result.rulesDeleted()));
  }

  /** Response for seed operation. */
  public record DemoSeedResponse(
      String message,
      int usersCreated,
      int accountsCreated,
      int categoriesCreated,
      int transactionsCreated,
      int budgetsCreated,
      int rulesCreated) {}

  /** Response for clear operation. */
  public record DemoClearResponse(
      String message,
      int usersDeleted,
      int accountsDeleted,
      int categoriesDeleted,
      int transactionsDeleted,
      int budgetsDeleted,
      int rulesDeleted) {}
}
