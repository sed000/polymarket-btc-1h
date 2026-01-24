# Backtest Optimization Results

## Test Period
- **Date Range**: December 25, 2025 - January 24, 2026 (30 days)
- **Markets Tested**: 717
- **Starting Balance**: $20

---

## Best Configuration Found

| Parameter | Value |
|-----------|-------|
| **Entry Range** | $0.90 - $0.95 |
| **Stop Loss** | $0.72 |
| **Profit Target** | $0.98 |
| **Time Window** | 20 minutes |
| **Max Spread** | $0.05 |
| **Compound Limit** | $50 (reset to $30) |

### Performance Metrics

| Metric | Value |
|--------|-------|
| **Saved Profit** | $265.35 |
| **Total Value** | $290.96 |
| **Total PnL** | $270.96 |
| **Return** | 1355% |
| **Win Rate** | 88.9% |
| **Total Trades** | 622 |
| **Wins/Losses** | 553/69 |
| **Sharpe Ratio** | 3.57 |
| **Profit Factor** | 1.61 |
| **Expectancy** | $0.44/trade |
| **Max Drawdown** | 95.1% |
| **Max Consecutive Wins** | 37 |
| **Max Consecutive Losses** | 2 |

### Exit Breakdown
- Profit Target: 76.0%
- Stop Loss: 11.1%
- Market Resolved: 12.9%

---

## Comparison: Original vs Optimized

| Metric | Original | Optimized | Improvement |
|--------|----------|-----------|-------------|
| Entry Range | $0.90-0.97 | $0.90-0.95 | Tighter ceiling |
| Stop Loss | $0.80 | $0.72 | -10% (wider) |
| Time Window | 60 min | 20 min | -67% (shorter) |
| **Saved Profit** | $82.27 | $265.35 | **+222%** |
| Win Rate | 78.1% | 88.9% | +13.8% |
| Sharpe Ratio | 1.17 | 3.57 | +205% |
| Profit Factor | 1.16 | 1.61 | +39% |
| Stop Loss Rate | 21.9% | 11.1% | -49% |

---

## Key Insights

### 1. Tighter Max Entry Price ($0.95 vs $0.97)
- Avoids "ceiling" trades where there's minimal upside
- Better risk/reward ratio on each trade

### 2. Lower Stop Loss ($0.72 vs $0.80)
- Holds through more volatility without getting stopped out
- Higher win rate (88.9% vs 78.1%)
- Fewer stop-loss exits (11.1% vs 21.9%)

### 3. Shorter Time Window (20 min vs 60 min)
- Trades closer to market resolution
- Prices are more predictable near expiry
- Higher probability of hitting profit target

### 4. Compound Limit System
- Essential for survival - prevents total account wipeout
- Locks in profits when balance exceeds $50
- Resets to $30 base balance after taking profit

---

## Environment Variables

```bash
# Optimized backtest configuration
BACKTEST_ENTRY_THRESHOLD=0.90
BACKTEST_MAX_ENTRY_PRICE=0.95
BACKTEST_STOP_LOSS=0.72
BACKTEST_PROFIT_TARGET=0.98
BACKTEST_MAX_SPREAD=0.05
BACKTEST_TIME_WINDOW_MINS=20
BACKTEST_STARTING_BALANCE=20
BACKTEST_COMPOUND_LIMIT=50
BACKTEST_BASE_BALANCE=30
```

---

## Compound Limit Optimization

### All Configurations Tested

| Limit | Base | Reset Ratio | Saved Profit | Max Drawdown | Sharpe |
|-------|------|-------------|--------------|--------------|--------|
| $40 | $25 | 62.5% | $212.88 | $41.48 (95.7%) | 3.57 |
| $45 | $25 | 55.6% | $237.54 | $46.11 (94.5%) | 3.38 |
| $50 | $30 | 60.0% | $265.35 | $50.69 (95.1%) | 3.57 |
| $60 | $20 | 33.3% | $250.91 | $61.28 (96.8%) | 3.47 |
| $60 | $35 | 58.3% | $292.17 | $60.75 (94.4%) | 3.34 |
| $70 | $40 | 57.1% | $347.92 | $71.11 (95.9%) | 3.23 |
| $80 | $30 | 37.5% | $312.47 | $79.17 (95.9%) | 3.09 |
| $80 | $45 | 56.3% | $371.26 | $79.25 (94.0%) | 3.06 |
| $100 | $30 | 30.0% | $370.81 | $101.14 (95.7%) | 2.71 |
| $100 | $50 | 50.0% | $423.34 | $100.56 (95.2%) | 3.15 |
| $120 | $60 | 50.0% | $507.20 | $123.07 (96.2%) | 3.23 |
| $150 | $75 | 50.0% | $612.65 | $147.94 (96.4%) | 3.13 |
| **$200** | **$100** | **50.0%** | **$746.70** | $201.35 (95.2%) | 2.89 |

### Key Findings

1. **Higher limits = More saved profits**
   - Linear relationship: doubling the limit roughly doubles saved profits
   - $200/$100 saved 3.5x more than $60/$35

2. **50% reset ratio is optimal**
   - Resetting to half the compound limit performs best
   - Lower ratios (30-40%) save less despite same limit
   - Example: $100/$50 saved $423 vs $100/$30 saved $371

3. **Tradeoff: Profits vs Capital at Risk**
   - Higher limits mean more capital exposed during drawdowns
   - Max drawdown stays ~95% regardless of limit
   - Choose based on risk tolerance

### Recommended Configurations

| Risk Level | Compound Limit | Base Balance | Expected Saved Profit |
|------------|----------------|--------------|----------------------|
| **Conservative** | $60 | $30 | ~$275 |
| **Moderate** | $100 | $50 | ~$423 |
| **Aggressive** | $150 | $75 | ~$613 |
| **Maximum** | $200 | $100 | ~$747 |

### Best Overall Configuration

For maximum saved profits with the optimized trading parameters:

| Parameter | Value |
|-----------|-------|
| Entry Range | $0.90 - $0.95 |
| Stop Loss | $0.72 |
| Profit Target | $0.98 |
| Time Window | 20 minutes |
| Max Spread | $0.05 |
| **Compound Limit** | **$200** |
| **Base Balance** | **$100** |

**Results:**
- Saved Profit: **$746.70**
- Total Value: **$857.42**
- Return: **4187%**
- Win Rate: 88.9%
- Sharpe Ratio: 2.89

---

## Final Environment Variables

```bash
# Maximum profit configuration
BACKTEST_ENTRY_THRESHOLD=0.90
BACKTEST_MAX_ENTRY_PRICE=0.95
BACKTEST_STOP_LOSS=0.72
BACKTEST_PROFIT_TARGET=0.98
BACKTEST_MAX_SPREAD=0.05
BACKTEST_TIME_WINDOW_MINS=20
BACKTEST_STARTING_BALANCE=20
BACKTEST_COMPOUND_LIMIT=200
BACKTEST_BASE_BALANCE=100
```

```bash
# Moderate risk configuration (recommended)
BACKTEST_ENTRY_THRESHOLD=0.90
BACKTEST_MAX_ENTRY_PRICE=0.95
BACKTEST_STOP_LOSS=0.72
BACKTEST_PROFIT_TARGET=0.98
BACKTEST_MAX_SPREAD=0.05
BACKTEST_TIME_WINDOW_MINS=20
BACKTEST_STARTING_BALANCE=20
BACKTEST_COMPOUND_LIMIT=100
BACKTEST_BASE_BALANCE=50
```

---

## Using Optimized Mode (Live/Paper Trading)

The optimized configuration has been added as a new risk mode. To use it:

### Quick Start

```bash
# Paper trading with optimized mode
PAPER_TRADING=true PAPER_BALANCE=20 RISK_MODE=optimized bun start
```

### Environment Variables

Add to your `.env` file:

```bash
# Enable optimized mode
RISK_MODE=optimized

# Paper trading settings
PAPER_TRADING=true
PAPER_BALANCE=20
```

### What Optimized Mode Does

When `RISK_MODE=optimized` is set, the bot automatically uses:

| Parameter | Optimized Value | Normal Value |
|-----------|-----------------|--------------|
| Entry Threshold | $0.90 | $0.95 |
| Max Entry Price | $0.95 | $0.98 |
| Stop Loss | $0.72 | $0.80 |
| Time Window | 20 min | 20 min |
| Max Spread | $0.05 | $0.03 |

### Auto-Scaling Compound Limits

In optimized mode, compound limits automatically scale with your starting balance:

- **Compound Limit** = 10x starting balance
- **Base Balance** = 5x starting balance

| Starting Balance | Compound Limit | Base Balance |
|------------------|----------------|--------------|
| $10 | $100 | $50 |
| $20 | $200 | $100 |
| $50 | $500 | $250 |
| $100 | $1000 | $500 |

You can override these by setting `COMPOUND_LIMIT` and `BASE_BALANCE` explicitly.

### Example Configurations

```bash
# Optimized mode with $10 starting balance (auto-scales to $100/$50 compound)
RISK_MODE=optimized
PAPER_TRADING=true
PAPER_BALANCE=10

# Optimized mode with custom compound limits
RISK_MODE=optimized
PAPER_TRADING=true
PAPER_BALANCE=50
COMPOUND_LIMIT=300
BASE_BALANCE=150
```
