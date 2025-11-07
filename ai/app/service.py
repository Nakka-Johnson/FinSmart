"""Core analytics and insights service logic."""

from collections import defaultdict
from datetime import datetime
import statistics
from app.models import Txn, CategoryGuess, TopCategory, ForecastItem, AnomalyItem


# Category keywords mapping
CATEGORY_KEYWORDS = {
    "Groceries": ["grocery", "supermarket", "food", "market", "whole foods", "trader joe", "safeway", "kroger"],
    "Transport": ["gas", "fuel", "uber", "lyft", "taxi", "transit", "metro", "parking", "shell", "chevron"],
    "Rent": ["rent", "lease", "landlord", "property management"],
    "Utilities": ["electric", "water", "gas bill", "utility", "internet", "phone", "wireless", "verizon", "at&t"],
    "Entertainment": ["movie", "netflix", "spotify", "game", "concert", "theater", "entertainment"],
}


def summarize(transactions: list[Txn]) -> dict:
    """
    Compute spending summary.
    
    Returns:
        - totalDebit: sum of all DEBIT transactions
        - totalCredit: sum of all CREDIT transactions
        - biggestCategory: category with highest debit spending
        - topCategories: top 5 categories by debit spending
    """
    total_debit = 0.0
    total_credit = 0.0
    category_debits = defaultdict(float)
    
    for txn in transactions:
        if txn.direction == "DEBIT":
            total_debit += txn.amount
            if txn.category:
                category_debits[txn.category] += txn.amount
        elif txn.direction == "CREDIT":
            total_credit += txn.amount
    
    # Find biggest category
    biggest_category = None
    if category_debits:
        biggest_category = max(category_debits.items(), key=lambda x: x[1])[0]
    
    # Top 5 categories
    top_categories = sorted(category_debits.items(), key=lambda x: x[1], reverse=True)[:5]
    top_categories_list = [
        TopCategory(category=cat, total=total) for cat, total in top_categories
    ]
    
    return {
        "totalDebit": total_debit,
        "totalCredit": total_credit,
        "biggestCategory": biggest_category,
        "topCategories": top_categories_list,
    }


def categorize(transactions: list[Txn]) -> list[CategoryGuess]:
    """
    Guess categories for transactions using simple keyword matching.
    
    Returns list aligned by transaction index.
    """
    results = []
    
    for txn in transactions:
        # Build search text from description
        search_text = ""
        if txn.description:
            search_text += txn.description.lower()
        
        # Match against keywords
        matched_category = None
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in search_text for keyword in keywords):
                matched_category = category
                break
        
        if matched_category:
            results.append(
                CategoryGuess(
                    guessCategory=matched_category,
                    reason=f"Matched keyword in description: {matched_category.lower()}"
                )
            )
        else:
            results.append(
                CategoryGuess(
                    guessCategory="Uncategorized",
                    reason="No matching keywords found"
                )
            )
    
    return results


def anomalies(transactions: list[Txn]) -> list[AnomalyItem]:
    """
    Detect anomalies using z-score within each category's debit amounts.
    
    Flag transactions with |z-score| >= 2 as anomalies.
    """
    # Group debit transactions by category
    category_amounts = defaultdict(list)
    
    for txn in transactions:
        if txn.direction == "DEBIT":
            category_amounts[txn.category or "Uncategorized"].append(txn)
    
    results = []
    
    for txn in transactions:
        if txn.direction != "DEBIT":
            # Only analyze debits
            results.append(
                AnomalyItem(
                    date=txn.date,
                    amount=txn.amount,
                    category=txn.category,
                    score=0.0,
                    isAnomaly=False
                )
            )
            continue
        
        category = txn.category or "Uncategorized"
        amounts_in_category = [t.amount for t in category_amounts[category]]
        
        # Need at least 3 transactions to compute meaningful z-score
        if len(amounts_in_category) < 3:
            results.append(
                AnomalyItem(
                    date=txn.date,
                    amount=txn.amount,
                    category=txn.category,
                    score=0.0,
                    isAnomaly=False
                )
            )
            continue
        
        # Compute z-score
        mean = statistics.mean(amounts_in_category)
        stdev = statistics.stdev(amounts_in_category)
        
        if stdev == 0:
            z_score = 0.0
        else:
            z_score = (txn.amount - mean) / stdev
        
        is_anomaly = abs(z_score) >= 2.0
        
        results.append(
            AnomalyItem(
                date=txn.date,
                amount=txn.amount,
                category=txn.category,
                score=round(z_score, 2),
                isAnomaly=is_anomaly
            )
        )
    
    return results


def forecast(transactions: list[Txn]) -> list[ForecastItem]:
    """
    Forecast next month spending by category using simple methods.
    
    Methods:
    - SMA3: 3-month simple moving average
    - lastValue: Use last month's value if not enough data
    """
    # Group debit transactions by category and month
    category_monthly = defaultdict(lambda: defaultdict(float))
    
    for txn in transactions:
        if txn.direction == "DEBIT":
            try:
                # Extract YYYY-MM from date
                month = txn.date[:7]  # "2025-01-15" -> "2025-01"
                category = txn.category or "Uncategorized"
                category_monthly[category][month] += txn.amount
            except (ValueError, IndexError):
                continue
    
    forecasts = []
    
    for category, monthly_data in category_monthly.items():
        # Sort months chronologically
        sorted_months = sorted(monthly_data.items())
        
        if len(sorted_months) == 0:
            continue
        
        amounts = [amount for _, amount in sorted_months]
        
        # Use SMA3 if we have at least 3 months
        if len(amounts) >= 3:
            last_three = amounts[-3:]
            predicted = statistics.mean(last_three)
            method = "SMA3"
        else:
            # Use last value
            predicted = amounts[-1]
            method = "lastValue"
        
        forecasts.append(
            ForecastItem(
                category=category,
                nextMonthForecast=round(predicted, 2),
                method=method
            )
        )
    
    return forecasts
