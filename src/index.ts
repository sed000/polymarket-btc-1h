import { Bot, type BotConfig } from "./bot";
import { renderUI } from "./ui";
import { initDatabase } from "./db";

const parseEnvFloat = (key: string, defaultVal: string): number =>
  parseFloat(process.env[key] || defaultVal);

const parseEnvInt = (key: string, defaultVal: string): number =>
  parseInt(process.env[key] || defaultVal);

const paperTrading = process.env.PAPER_TRADING === "true";
const riskMode = (process.env.RISK_MODE || "normal") as "normal" | "optimized";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY && !paperTrading) {
  console.error("Error: PRIVATE_KEY environment variable is required for real trading");
  console.error("Create a .env file with your wallet private key:");
  console.error("  PRIVATE_KEY=0x...");
  console.error("\nOr enable paper trading mode:");
  console.error("  PAPER_TRADING=true");
  process.exit(1);
}

// Optimized mode defaults (from backtesting optimization)
// These values were found to maximize saved profits over 30-day backtest
const OPTIMIZED_DEFAULTS = {
  entryThreshold: 0.90,
  maxEntryPrice: 0.95,
  stopLoss: 0.72,
  maxSpread: 0.05,
  timeWindowMins: 20,
  // Compound limits scale with starting balance (10x limit, 5x base)
  compoundMultiplier: 10,
  baseMultiplier: 5
};

const paperBalance = parseEnvFloat("PAPER_BALANCE", "100");

// Build config based on risk mode
const config: BotConfig = riskMode === "optimized" ? {
  // Optimized mode: use backtested optimal values
  entryThreshold: parseEnvFloat("ENTRY_THRESHOLD", String(OPTIMIZED_DEFAULTS.entryThreshold)),
  maxEntryPrice: parseEnvFloat("MAX_ENTRY_PRICE", String(OPTIMIZED_DEFAULTS.maxEntryPrice)),
  stopLoss: parseEnvFloat("STOP_LOSS", String(OPTIMIZED_DEFAULTS.stopLoss)),
  maxSpread: parseEnvFloat("MAX_SPREAD", String(OPTIMIZED_DEFAULTS.maxSpread)),
  timeWindowMs: parseEnvInt("TIME_WINDOW_MINS", String(OPTIMIZED_DEFAULTS.timeWindowMins)) * 60 * 1000,
  pollIntervalMs: parseEnvInt("POLL_INTERVAL_MS", "10000"),
  paperTrading,
  paperBalance,
  riskMode,
  // Auto-scale compound limits based on starting balance (can be overridden via env)
  compoundLimit: parseEnvFloat("COMPOUND_LIMIT", String(paperBalance * OPTIMIZED_DEFAULTS.compoundMultiplier)),
  baseBalance: parseEnvFloat("BASE_BALANCE", String(paperBalance * OPTIMIZED_DEFAULTS.baseMultiplier)),
  signatureType: parseEnvInt("SIGNATURE_TYPE", "0") as 0 | 1 | 2,  // Default to EOA (0) for safety
  funderAddress: process.env.FUNDER_ADDRESS,
  maxPositions: parseEnvInt("MAX_POSITIONS", "1")
} : {
  // Normal mode: use conservative defaults
  entryThreshold: parseEnvFloat("ENTRY_THRESHOLD", "0.95"),
  maxEntryPrice: parseEnvFloat("MAX_ENTRY_PRICE", "0.98"),
  stopLoss: parseEnvFloat("STOP_LOSS", "0.80"),
  maxSpread: parseEnvFloat("MAX_SPREAD", "0.03"),
  timeWindowMs: parseEnvInt("TIME_WINDOW_MINS", "20") * 60 * 1000,
  pollIntervalMs: parseEnvInt("POLL_INTERVAL_MS", "10000"),
  paperTrading,
  paperBalance,
  riskMode,
  compoundLimit: parseEnvFloat("COMPOUND_LIMIT", "0"),
  baseBalance: parseEnvFloat("BASE_BALANCE", "10"),
  signatureType: parseEnvInt("SIGNATURE_TYPE", "0") as 0 | 1 | 2,  // Default to EOA (0) for safety
  funderAddress: process.env.FUNDER_ADDRESS,
  maxPositions: parseEnvInt("MAX_POSITIONS", "1")
};

// Validate configuration to catch invalid env vars early
const validateRange = (val: number, min: number, max: number): boolean =>
  !isNaN(val) && val >= min && val <= max;

function validateConfig(config: BotConfig): void {
  const errors: string[] = [];

  if (!validateRange(config.entryThreshold, 0, 1)) {
    errors.push("ENTRY_THRESHOLD must be a number between 0 and 1");
  }
  if (!validateRange(config.stopLoss, 0, 1)) {
    errors.push("STOP_LOSS must be a number between 0 and 1");
  }
  if (!validateRange(config.maxEntryPrice, 0, 1)) {
    errors.push("MAX_ENTRY_PRICE must be a number between 0 and 1");
  }
  if (config.stopLoss >= config.entryThreshold) {
    errors.push("STOP_LOSS must be less than ENTRY_THRESHOLD");
  }
  if (config.entryThreshold > config.maxEntryPrice) {
    errors.push("ENTRY_THRESHOLD must be less than or equal to MAX_ENTRY_PRICE");
  }
  if (isNaN(config.paperBalance) || config.paperBalance <= 0) {
    errors.push("PAPER_BALANCE must be a positive number");
  }
  if (!validateRange(config.maxPositions, 1, Infinity)) {
    errors.push("MAX_POSITIONS must be at least 1");
  }
  if (!validateRange(config.maxSpread, 0, 1)) {
    errors.push("MAX_SPREAD must be between 0 and 1");
  }
  if (config.timeWindowMs <= 0) {
    errors.push("TIME_WINDOW_MINS must be positive");
  }

  // Validate signature type and funder address
  if (config.signatureType === 1 && !config.funderAddress && !config.paperTrading) {
    errors.push("FUNDER_ADDRESS is required when SIGNATURE_TYPE=1 (Magic.link proxy)");
  }
  if (config.signatureType !== 0 && config.signatureType !== 1 && config.signatureType !== 2) {
    errors.push("SIGNATURE_TYPE must be 0 (EOA), 1 (Magic.link proxy), or 2 (Gnosis Safe)");
  }

  if (errors.length > 0) {
    console.error("Configuration errors:");
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}

validateConfig(config);

async function main() {
  // Global error handlers for unhandled rejections and exceptions
  // SECURITY FIX: Prevent crashes from unhandled async errors
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRITICAL] Unhandled Promise Rejection:", reason);
    // Don't exit - try to keep running, but log the error
  });

  process.on("uncaughtException", (error) => {
    console.error("[CRITICAL] Uncaught Exception:", error);
    // Exit on uncaught exceptions - state may be corrupted
    process.exit(1);
  });

  // Track bot instance for graceful shutdown
  let bot: Bot | null = null;
  let isShuttingDown = false;

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[${signal}] Initiating graceful shutdown...`);

    if (bot) {
      try {
        bot.stop();
        console.log("Bot stopped");

        // Note: We don't cancel open orders on shutdown to avoid
        // accidentally closing profitable limit orders
        // Users should manually manage positions if needed

        const state = bot.getState();
        if (state.positions.size > 0) {
          console.log(`\nWARNING: ${state.positions.size} open position(s) remain:`);
          for (const [tokenId, pos] of state.positions) {
            console.log(`  - ${pos.side} @ $${pos.entryPrice.toFixed(2)} (${pos.shares.toFixed(2)} shares)`);
          }
          console.log("Positions will continue to be managed by limit orders on Polymarket.");
        }
      } catch (err) {
        console.error("Error during shutdown:", err);
      }
    }

    console.log("Shutdown complete.");
    process.exit(0);
  };

  // Register shutdown handlers
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  console.log("Initializing Polymarket BTC 1-Hour Bot...\n");

  // Initialize database based on mode
  initDatabase(config.paperTrading, config.riskMode);

  // In paper trading mode, use a placeholder key (no real transactions)
  // For real trading, PRIVATE_KEY is validated at startup
  const privateKey = PRIVATE_KEY || "paper-trading-mode";

  bot = new Bot(privateKey, config, () => {
    // Logs are handled by UI
  });

  // Suppress verbose axios errors during init
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = args[0]?.toString() || "";
    // Only suppress axios/CLOB verbose errors
    if (msg.includes("request error") || msg.includes("CLOB Client")) {
      return;
    }
    originalError.apply(console, args);
  };

  try {
    await bot.init();
  } finally {
    console.error = originalError;
  }

  renderUI(bot);
}

main();
