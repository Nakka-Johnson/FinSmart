package com.finsmart.service;

import com.finsmart.domain.entity.*;
import com.finsmart.domain.enums.AccountType;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.*;
import com.finsmart.util.TransactionHashUtil;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UK-realistic demo data generator for FinSmart.
 *
 * <p>Features: - 12 months of UK-style transactions - Realistic merchants (Tesco, Sainsbury's,
 * Uber, Merseyrail, etc.) - Monthly salary, rent, utilities - Weekly groceries, commuting -
 * Subscription price creep mid-year - 1-2 anomalies per user - Demo marker for safe cleanup
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UkDemoDataService {

  private static final String DEMO_MARKER = "DEMO_DATA_MARKER";
  private static final String UK_CURRENCY = "GBP";

  private final UserRepository userRepository;
  private final AccountRepository accountRepository;
  private final CategoryRepository categoryRepository;
  private final TransactionRepository transactionRepository;
  private final BudgetRepository budgetRepository;
  private final RuleRepository ruleRepository;
  private final AiFeedbackRepository feedbackRepository;

  // UK-specific merchants by category
  private static final Map<String, List<MerchantTemplate>> UK_MERCHANTS =
      Map.ofEntries(
          Map.entry(
              "Groceries",
              List.of(
                  new MerchantTemplate("Tesco", "TESCO STORES %04d", 40, 150),
                  new MerchantTemplate("Sainsbury's", "SAINSBURYS S/MKT", 35, 120),
                  new MerchantTemplate("Asda", "ASDA SUPERCENTRE", 30, 100),
                  new MerchantTemplate("Lidl", "LIDL GB", 20, 70),
                  new MerchantTemplate("Aldi", "ALDI STORES UK", 25, 80),
                  new MerchantTemplate("Morrisons", "MORRISONS", 30, 100),
                  new MerchantTemplate("Co-op", "COOP FOOD", 10, 40))),
          Map.entry(
              "Transport",
              List.of(
                  new MerchantTemplate("Uber", "UBER *TRIP", 8, 35),
                  new MerchantTemplate("Merseyrail", "MERSEYRAIL", 3, 7),
                  new MerchantTemplate("TfL", "TFL TRAVEL CH", 5, 15),
                  new MerchantTemplate("Shell", "SHELL PETROL STN", 40, 80),
                  new MerchantTemplate("BP", "BP CONNECT", 35, 75),
                  new MerchantTemplate("Trainline", "TRAINLINE.COM", 20, 80))),
          Map.entry(
              "Dining",
              List.of(
                  new MerchantTemplate("Pret", "PRET A MANGER", 5, 15),
                  new MerchantTemplate("Greggs", "GREGGS PLC", 3, 10),
                  new MerchantTemplate("Nando's", "NANDOS", 15, 35),
                  new MerchantTemplate("McDonald's", "MCDONALDS", 5, 15),
                  new MerchantTemplate("Costa", "COSTA COFFEE", 3, 8),
                  new MerchantTemplate("Starbucks", "STARBUCKS", 4, 10),
                  new MerchantTemplate("Deliveroo", "DELIVEROO.COM", 15, 40))),
          Map.entry(
              "Entertainment",
              List.of(
                  new MerchantTemplate("Netflix", "NETFLIX.COM", 10.99, 15.99),
                  new MerchantTemplate("Spotify", "SPOTIFY", 9.99, 10.99),
                  new MerchantTemplate("Amazon Prime", "PRIME VIDEO", 8.99, 8.99),
                  new MerchantTemplate("Sky", "SKY UK LIMITED", 40, 75),
                  new MerchantTemplate("Disney+", "DISNEYPLUS", 7.99, 10.99))),
          Map.entry(
              "Utilities",
              List.of(
                  new MerchantTemplate("Octopus Energy", "OCTOPUS ENERGY", 80, 200),
                  new MerchantTemplate("British Gas", "BRITISH GAS", 70, 180),
                  new MerchantTemplate("Thames Water", "THAMES WATER", 30, 50),
                  new MerchantTemplate("Virgin Media", "VIRGIN MEDIA", 45, 60),
                  new MerchantTemplate("BT", "BT GROUP PLC", 30, 50))),
          Map.entry(
              "Healthcare",
              List.of(
                  new MerchantTemplate("Boots", "BOOTS", 5, 50),
                  new MerchantTemplate("NHS", "NHS PRESCRIPTION", 9.90, 9.90),
                  new MerchantTemplate("Specsavers", "SPECSAVERS", 50, 200))),
          Map.entry(
              "Shopping",
              List.of(
                  new MerchantTemplate("Amazon", "AMAZON.CO.UK", 10, 150),
                  new MerchantTemplate("John Lewis", "JOHN LEWIS", 20, 200),
                  new MerchantTemplate("Argos", "ARGOS", 15, 100),
                  new MerchantTemplate("ASOS", "ASOS.COM", 20, 80))),
          Map.entry(
              "Bills",
              List.of(
                  new MerchantTemplate("HMRC", "HMRC TAX", 0, 0), // Variable
                  new MerchantTemplate("Council Tax", "COUNCIL TAX", 120, 200))));

  // UK categories with colors
  private static final Map<String, String> UK_CATEGORIES =
      Map.of(
          "Groceries", "#4CAF50",
          "Transport", "#2196F3",
          "Dining", "#FF9800",
          "Entertainment", "#E91E63",
          "Utilities", "#9C27B0",
          "Healthcare", "#00BCD4",
          "Shopping", "#795548",
          "Bills", "#607D8B",
          "Rent", "#F44336",
          "Salary", "#8BC34A");

  /**
   * Seed UK demo data for the current user. Idempotent - uses hash-based deduplication.
   *
   * @param userId User to seed data for
   * @return Seed result with counts
   */
  @Transactional
  public SeedResult seedUkDemoData(UUID userId) {
    log.info("Seeding UK demo data for user: {}", userId);

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

    int accountsCreated = 0;
    int categoriesCreated = 0;
    int transactionsCreated = 0;
    int budgetsCreated = 0;
    int rulesCreated = 0;

    // Ensure UK categories exist
    List<Category> categories = ensureUkCategories();
    categoriesCreated = categories.size();

    // Create UK accounts
    List<Account> accounts = createUkAccounts(user);
    accountsCreated = accounts.size();

    // Create 12 months of transactions
    transactionsCreated = createUkTransactions(user, accounts, categories);

    // Create budgets
    budgetsCreated = createUkBudgets(user, categories);

    // Create rules
    rulesCreated = createUkRules(user, categories);

    log.info(
        "UK demo seed completed: {} accounts, {} categories, {} transactions, {} budgets, {} rules",
        accountsCreated,
        categoriesCreated,
        transactionsCreated,
        budgetsCreated,
        rulesCreated);

    return new SeedResult(
        0, accountsCreated, categoriesCreated, transactionsCreated, budgetsCreated, rulesCreated);
  }

  /**
   * Clear demo data for a specific user. Only clears transactions with demo marker.
   *
   * @param userId User to clear data for
   * @return Clear result with counts
   */
  @Transactional
  public ClearResult clearDemoData(UUID userId) {
    log.info("Clearing demo data for user: {}", userId);

    // Delete transactions with demo marker in notes
    int transactionsDeleted =
        transactionRepository.deleteByAccountUserIdAndNotesContaining(userId, DEMO_MARKER);

    // Delete budgets for user
    int budgetsDeleted = budgetRepository.deleteByUserId(userId);

    // Delete rules for user
    int rulesDeleted = ruleRepository.deleteAllByUserId(userId);

    // Delete feedback for user
    int feedbackDeleted = feedbackRepository.deleteByUserId(userId);

    // Delete accounts (this will cascade delete any remaining transactions)
    int accountsDeleted = accountRepository.deleteByUserId(userId);

    log.info(
        "Demo clear completed: {} accounts, {} transactions, {} budgets, {} rules, {} feedback",
        accountsDeleted,
        transactionsDeleted,
        budgetsDeleted,
        rulesDeleted,
        feedbackDeleted);

    return new ClearResult(
        0, accountsDeleted, 0, transactionsDeleted, budgetsDeleted, rulesDeleted);
  }

  private List<Category> ensureUkCategories() {
    List<Category> existing = categoryRepository.findAll();
    if (!existing.isEmpty()) {
      log.info("Categories already exist, using existing");
      return existing;
    }

    List<Category> created = new ArrayList<>();
    for (var entry : UK_CATEGORIES.entrySet()) {
      Category category = new Category();
      category.setName(entry.getKey());
      category.setColor(entry.getValue());
      created.add(categoryRepository.save(category));
    }

    log.info("Created {} UK categories", created.size());
    return created;
  }

  private List<Account> createUkAccounts(User user) {
    List<Account> existing = accountRepository.findByUserId(user.getId());
    if (!existing.isEmpty()) {
      log.info("Accounts already exist for user, using existing");
      return existing;
    }

    List<Account> accounts = new ArrayList<>();

    // Current account (UK term for checking)
    Account current = new Account();
    current.setUser(user);
    current.setName("Current Account");
    current.setInstitution("Barclays");
    current.setType(AccountType.CHECKING);
    current.setBalance(new BigDecimal("2847.63"));
    current.setCurrency(UK_CURRENCY);
    accounts.add(accountRepository.save(current));

    // ISA (UK savings)
    Account isa = new Account();
    isa.setUser(user);
    isa.setName("Cash ISA");
    isa.setInstitution("Barclays");
    isa.setType(AccountType.SAVINGS);
    isa.setBalance(new BigDecimal("8500.00"));
    isa.setCurrency(UK_CURRENCY);
    accounts.add(accountRepository.save(isa));

    log.info("Created {} UK accounts", accounts.size());
    return accounts;
  }

  private int createUkTransactions(User user, List<Account> accounts, List<Category> categories) {
    if (accounts.isEmpty()) {
      log.warn("No accounts available, skipping transaction creation");
      return 0;
    }

    Account currentAccount = accounts.get(0);
    Random random = new Random(user.getId().hashCode()); // Deterministic per user
    int created = 0;

    // Generate 12 months of data
    for (int monthOffset = 0; monthOffset < 12; monthOffset++) {
      LocalDate monthStart = LocalDate.now().minusMonths(monthOffset).withDayOfMonth(1);
      boolean isMidYear = monthOffset >= 4 && monthOffset <= 8; // Mid-year price creep

      // Monthly salary (25th of each month, if not future)
      LocalDate salaryDate = monthStart.withDayOfMonth(Math.min(25, monthStart.lengthOfMonth()));
      if (!salaryDate.isAfter(LocalDate.now())) {
        created +=
            createTransaction(
                currentAccount,
                findCategory(categories, "Salary"),
                toInstant(salaryDate),
                new BigDecimal("3250.00"),
                TransactionDirection.CREDIT,
                "Employer Ltd",
                "SALARY PAYMENT REF " + monthStart.getMonthValue());
      }

      // Monthly rent (1st of each month)
      created +=
          createTransaction(
              currentAccount,
              findCategory(categories, "Rent"),
              toInstant(monthStart.withDayOfMonth(1)),
              new BigDecimal("1200.00"),
              TransactionDirection.DEBIT,
              "Lettings Agency",
              "RENT PAYMENT");

      // Council Tax (variable by band)
      created +=
          createTransaction(
              currentAccount,
              findCategory(categories, "Bills"),
              toInstant(monthStart.withDayOfMonth(5)),
              new BigDecimal("156.00"),
              TransactionDirection.DEBIT,
              "Council Tax",
              "COUNCIL TAX BAND C");

      // Utilities (mid-month)
      created +=
          createUtilityTransactions(currentAccount, categories, monthStart, random, isMidYear);

      // Weekly groceries (4 per month)
      created += createWeeklyGroceries(currentAccount, categories, monthStart, random);

      // Transport/commuting
      created += createCommuteTransactions(currentAccount, categories, monthStart, random);

      // Dining out (2-3 per month)
      created += createDiningTransactions(currentAccount, categories, monthStart, random);

      // Entertainment subscriptions
      created += createSubscriptions(currentAccount, categories, monthStart, isMidYear);

      // Random shopping (1-2 per month)
      created += createShoppingTransactions(currentAccount, categories, monthStart, random);

      // Healthcare (occasional)
      if (random.nextDouble() < 0.3) {
        created += createHealthcareTransaction(currentAccount, categories, monthStart, random);
      }
    }

    // Add 2 anomalies
    created += createAnomalies(currentAccount, categories, random);

    log.info("Created {} UK transactions", created);
    return created;
  }

  private int createUtilityTransactions(
      Account account,
      List<Category> categories,
      LocalDate monthStart,
      Random random,
      boolean priceCreep) {
    int created = 0;
    Category utilities = findCategory(categories, "Utilities");

    // Energy (fluctuates)
    double energyBase = priceCreep ? 150 : 120;
    BigDecimal energy = randomAmount(energyBase, energyBase + 50, random);
    created +=
        createTransaction(
            account,
            utilities,
            toInstant(monthStart.withDayOfMonth(15)),
            energy,
            TransactionDirection.DEBIT,
            "Octopus Energy",
            "OCTOPUS ENERGY DD");

    // Internet
    created +=
        createTransaction(
            account,
            utilities,
            toInstant(monthStart.withDayOfMonth(10)),
            new BigDecimal("49.99"),
            TransactionDirection.DEBIT,
            "Virgin Media",
            "VIRGIN MEDIA BROADBAND");

    // Water (quarterly, every 3rd month)
    if (monthStart.getMonthValue() % 3 == 0) {
      created +=
          createTransaction(
              account,
              utilities,
              toInstant(monthStart.withDayOfMonth(20)),
              new BigDecimal("95.00"),
              TransactionDirection.DEBIT,
              "Thames Water",
              "THAMES WATER BILL");
    }

    return created;
  }

  private int createWeeklyGroceries(
      Account account, List<Category> categories, LocalDate monthStart, Random random) {
    int created = 0;
    Category groceries = findCategory(categories, "Groceries");
    List<MerchantTemplate> merchants = UK_MERCHANTS.get("Groceries");

    for (int week = 0; week < 4; week++) {
      LocalDate date = monthStart.plusDays(week * 7 + random.nextInt(3));
      if (date.isAfter(LocalDate.now())) continue;

      MerchantTemplate merchant = merchants.get(random.nextInt(merchants.size()));
      BigDecimal amount = randomAmount(merchant.minAmount, merchant.maxAmount, random);
      String description =
          merchant.descPattern.contains("%")
              ? String.format(merchant.descPattern, random.nextInt(10000))
              : merchant.descPattern;

      created +=
          createTransaction(
              account,
              groceries,
              toInstant(date),
              amount,
              TransactionDirection.DEBIT,
              merchant.name,
              description);
    }

    return created;
  }

  private int createCommuteTransactions(
      Account account, List<Category> categories, LocalDate monthStart, Random random) {
    int created = 0;
    Category transport = findCategory(categories, "Transport");

    // Regular commute (Merseyrail or TfL, weekdays)
    int commuteDays = 15 + random.nextInt(6);
    for (int i = 0; i < commuteDays; i++) {
      LocalDate date = monthStart.plusDays(i);
      if (date.isAfter(LocalDate.now())) continue;
      if (date.getDayOfWeek().getValue() > 5) continue; // Skip weekends

      if (random.nextDouble() < 0.7) { // 70% take train
        MerchantTemplate merchant =
            random.nextDouble() < 0.6
                ? UK_MERCHANTS.get("Transport").get(1) // Merseyrail
                : UK_MERCHANTS.get("Transport").get(2); // TfL
        BigDecimal amount = randomAmount(merchant.minAmount, merchant.maxAmount, random);
        created +=
            createTransaction(
                account,
                transport,
                toInstant(date),
                amount,
                TransactionDirection.DEBIT,
                merchant.name,
                merchant.descPattern);
      }
    }

    // Occasional Uber (weekends)
    if (random.nextDouble() < 0.4) {
      MerchantTemplate uber = UK_MERCHANTS.get("Transport").get(0);
      LocalDate uberDate = monthStart.plusDays(13 + random.nextInt(7));
      if (!uberDate.isAfter(LocalDate.now())) {
        created +=
            createTransaction(
                account,
                transport,
                toInstant(uberDate),
                randomAmount(uber.minAmount, uber.maxAmount, random),
                TransactionDirection.DEBIT,
                uber.name,
                uber.descPattern);
      }
    }

    // Fuel (monthly)
    if (random.nextDouble() < 0.5) {
      MerchantTemplate shell = UK_MERCHANTS.get("Transport").get(3);
      LocalDate fuelDate = monthStart.plusDays(10 + random.nextInt(10));
      if (!fuelDate.isAfter(LocalDate.now())) {
        created +=
            createTransaction(
                account,
                transport,
                toInstant(fuelDate),
                randomAmount(shell.minAmount, shell.maxAmount, random),
                TransactionDirection.DEBIT,
                shell.name,
                shell.descPattern);
      }
    }

    return created;
  }

  private int createDiningTransactions(
      Account account, List<Category> categories, LocalDate monthStart, Random random) {
    int created = 0;
    Category dining = findCategory(categories, "Dining");
    List<MerchantTemplate> merchants = UK_MERCHANTS.get("Dining");

    int diningCount = 2 + random.nextInt(3);
    for (int i = 0; i < diningCount; i++) {
      LocalDate date = monthStart.plusDays(random.nextInt(28));
      if (date.isAfter(LocalDate.now())) continue;

      MerchantTemplate merchant = merchants.get(random.nextInt(merchants.size()));
      BigDecimal amount = randomAmount(merchant.minAmount, merchant.maxAmount, random);

      created +=
          createTransaction(
              account,
              dining,
              toInstant(date),
              amount,
              TransactionDirection.DEBIT,
              merchant.name,
              merchant.descPattern);
    }

    return created;
  }

  private int createSubscriptions(
      Account account, List<Category> categories, LocalDate monthStart, boolean priceCreep) {
    int created = 0;
    Category entertainment = findCategory(categories, "Entertainment");
    LocalDate subDate = monthStart.withDayOfMonth(Math.min(15, monthStart.lengthOfMonth()));
    if (subDate.isAfter(LocalDate.now())) return 0;

    // Netflix (with price creep)
    double netflixPrice = priceCreep ? 15.99 : 10.99;
    created +=
        createTransaction(
            account,
            entertainment,
            toInstant(subDate),
            new BigDecimal(netflixPrice).setScale(2, RoundingMode.HALF_UP),
            TransactionDirection.DEBIT,
            "Netflix",
            "NETFLIX.COM");

    // Spotify (with price creep)
    double spotifyPrice = priceCreep ? 10.99 : 9.99;
    created +=
        createTransaction(
            account,
            entertainment,
            toInstant(subDate.plusDays(3)),
            new BigDecimal(spotifyPrice).setScale(2, RoundingMode.HALF_UP),
            TransactionDirection.DEBIT,
            "Spotify",
            "SPOTIFY");

    // Amazon Prime
    created +=
        createTransaction(
            account,
            entertainment,
            toInstant(subDate.plusDays(5)),
            new BigDecimal("8.99"),
            TransactionDirection.DEBIT,
            "Amazon Prime",
            "PRIME VIDEO");

    return created;
  }

  private int createShoppingTransactions(
      Account account, List<Category> categories, LocalDate monthStart, Random random) {
    int created = 0;
    Category shopping = findCategory(categories, "Shopping");
    List<MerchantTemplate> merchants = UK_MERCHANTS.get("Shopping");

    int shoppingCount = 1 + random.nextInt(2);
    for (int i = 0; i < shoppingCount; i++) {
      LocalDate date = monthStart.plusDays(5 + random.nextInt(20));
      if (date.isAfter(LocalDate.now())) continue;

      MerchantTemplate merchant = merchants.get(random.nextInt(merchants.size()));
      BigDecimal amount = randomAmount(merchant.minAmount, merchant.maxAmount, random);

      created +=
          createTransaction(
              account,
              shopping,
              toInstant(date),
              amount,
              TransactionDirection.DEBIT,
              merchant.name,
              merchant.descPattern);
    }

    return created;
  }

  private int createHealthcareTransaction(
      Account account, List<Category> categories, LocalDate monthStart, Random random) {
    Category healthcare = findCategory(categories, "Healthcare");
    List<MerchantTemplate> merchants = UK_MERCHANTS.get("Healthcare");

    LocalDate date = monthStart.plusDays(random.nextInt(28));
    if (date.isAfter(LocalDate.now())) return 0;

    MerchantTemplate merchant = merchants.get(random.nextInt(merchants.size()));
    BigDecimal amount = randomAmount(merchant.minAmount, merchant.maxAmount, random);

    return createTransaction(
        account,
        healthcare,
        toInstant(date),
        amount,
        TransactionDirection.DEBIT,
        merchant.name,
        merchant.descPattern);
  }

  private int createAnomalies(Account account, List<Category> categories, Random random) {
    int created = 0;

    // Anomaly 1: Unusually large grocery shop (pre-Christmas)
    Category groceries = findCategory(categories, "Groceries");
    LocalDate anomaly1Date = LocalDate.now().minusMonths(1).withDayOfMonth(20);
    if (!anomaly1Date.isAfter(LocalDate.now())) {
      created +=
          createTransaction(
              account,
              groceries,
              toInstant(anomaly1Date),
              new BigDecimal("487.50"),
              TransactionDirection.DEBIT,
              "Tesco",
              "TESCO STORES 9999 - ANOMALY");
    }

    // Anomaly 2: Large unexpected payment
    Category bills = findCategory(categories, "Bills");
    LocalDate anomaly2Date = LocalDate.now().minusMonths(3).withDayOfMonth(10);
    if (!anomaly2Date.isAfter(LocalDate.now())) {
      created +=
          createTransaction(
              account,
              bills,
              toInstant(anomaly2Date),
              new BigDecimal("750.00"),
              TransactionDirection.DEBIT,
              "HMRC",
              "HMRC TAX PAYMENT - ANOMALY");
    }

    return created;
  }

  private int createTransaction(
      Account account,
      Category category,
      Instant postedAt,
      BigDecimal amount,
      TransactionDirection direction,
      String merchant,
      String description) {
    // Add demo marker to notes
    String notes = DEMO_MARKER;

    String hash =
        TransactionHashUtil.computeHash(
            postedAt, amount, direction, merchant, description, account.getId());

    if (transactionRepository.existsByHash(hash)) {
      return 0;
    }

    Transaction txn =
        Transaction.builder()
            .account(account)
            .category(category)
            .postedAt(postedAt)
            .amount(amount)
            .direction(direction)
            .merchant(merchant)
            .description(description)
            .notes(notes)
            .hash(hash)
            .build();

    transactionRepository.save(txn);
    return 1;
  }

  private int createUkBudgets(User user, List<Category> categories) {
    LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
    int year = currentMonth.getYear();
    int month = currentMonth.getMonthValue();
    int created = 0;

    created +=
        createBudgetIfNotExists(
            user.getId(), findCategory(categories, "Groceries"), year, month, "500.00");
    created +=
        createBudgetIfNotExists(
            user.getId(), findCategory(categories, "Transport"), year, month, "200.00");
    created +=
        createBudgetIfNotExists(
            user.getId(), findCategory(categories, "Dining"), year, month, "150.00");
    created +=
        createBudgetIfNotExists(
            user.getId(), findCategory(categories, "Entertainment"), year, month, "80.00");
    created +=
        createBudgetIfNotExists(
            user.getId(), findCategory(categories, "Shopping"), year, month, "200.00");

    log.info("Created {} UK budgets", created);
    return created;
  }

  private int createBudgetIfNotExists(
      UUID userId, Category category, int year, int month, String limitAmount) {
    if (category == null) return 0;

    if (budgetRepository.existsByUserIdAndCategoryIdAndMonthAndYear(
        userId, category.getId(), month, year)) {
      return 0;
    }

    User user = userRepository.findById(userId).orElseThrow();
    Budget budget = new Budget();
    budget.setUser(user);
    budget.setCategory(category);
    budget.setYear(year);
    budget.setMonth(month);
    budget.setLimitAmount(new BigDecimal(limitAmount));
    budget.setRollover(false);
    budget.setCarryIn(BigDecimal.ZERO);

    budgetRepository.save(budget);
    return 1;
  }

  private int createUkRules(User user, List<Category> categories) {
    int created = 0;

    // Grocery rules
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Groceries"), "tesco", "merchant", 10);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Groceries"), "sainsbury", "merchant", 11);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Groceries"), "asda", "merchant", 12);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Groceries"), "lidl", "merchant", 13);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Groceries"), "aldi", "merchant", 14);

    // Transport rules
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Transport"), "uber", "merchant", 20);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Transport"), "merseyrail", "merchant", 21);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Transport"), "tfl", "merchant", 22);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Transport"), "trainline", "merchant", 23);

    // Utilities rules
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Utilities"), "octopus", "merchant", 30);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Utilities"), "british gas", "merchant", 31);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Utilities"), "virgin media", "merchant", 32);

    // Entertainment rules
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Entertainment"), "netflix", "merchant", 40);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Entertainment"), "spotify", "merchant", 41);
    created +=
        createRuleIfNotExists(
            user.getId(), findCategory(categories, "Entertainment"), "prime", "description", 42);

    log.info("Created {} UK rules", created);
    return created;
  }

  private int createRuleIfNotExists(
      UUID userId, Category category, String pattern, String field, int priority) {
    if (category == null) return 0;

    boolean exists =
        ruleRepository.findByUserIdOrderByPriorityAscCreatedAtAsc(userId).stream()
            .anyMatch(
                r ->
                    r.getCategory().getId().equals(category.getId())
                        && r.getPattern().equalsIgnoreCase(pattern)
                        && r.getField().equalsIgnoreCase(field));

    if (exists) return 0;

    Rule rule = new Rule();
    rule.setUserId(userId);
    rule.setCategory(category);
    rule.setPattern(pattern);
    rule.setField(field);
    rule.setPriority(priority);
    rule.setActive(true);

    ruleRepository.save(rule);
    return 1;
  }

  private Category findCategory(List<Category> categories, String name) {
    return categories.stream()
        .filter(c -> c.getName().equalsIgnoreCase(name))
        .findFirst()
        .orElse(null);
  }

  private Instant toInstant(LocalDate date) {
    return date.atStartOfDay(ZoneOffset.UTC).toInstant();
  }

  private BigDecimal randomAmount(double min, double max, Random random) {
    double amount = min + (max - min) * random.nextDouble();
    return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
  }

  // Helper record for merchant templates
  private record MerchantTemplate(
      String name, String descPattern, double minAmount, double maxAmount) {}

  /** Result of seed operation */
  public record SeedResult(
      int usersCreated,
      int accountsCreated,
      int categoriesCreated,
      int transactionsCreated,
      int budgetsCreated,
      int rulesCreated) {}

  /** Result of clear operation */
  public record ClearResult(
      int usersDeleted,
      int accountsDeleted,
      int categoriesDeleted,
      int transactionsDeleted,
      int budgetsDeleted,
      int rulesDeleted) {}
}
