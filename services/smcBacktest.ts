/**
 * SMC Backtesting Module
 * 
 * Tests SMC trading strategies against historical data:
 * - Order Block strategies
 * - FVG trading strategies
 * - Liquidity grab strategies
 * - Premium/Discount strategies
 * - Multi-timeframe strategies
 */

import { OHLCV, BacktestResult, BacktestConfig, TradeSignal } from "../types";
import { 
  detectOrderBlocks, 
  detectFVGs, 
  detectBOS, 
  detectCHOCH,
  detectMSS,
  calculatePremiumDiscount,
  runSMCAnalysis 
} from "./smcIndicators";

// ============================================================================
// TYPES
// ============================================================================

export interface BacktestTrade {
  id: string;
  entryIndex: number;
  exitIndex: number;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  direction: "long" | "short";
  pnl: number;
  pnlPercent: number;
  setup: string;
  reason: string;
  holdingPeriod: number; // in bars
  smcContext?: {
    orderBlock?: any;
    liquidity?: any;
    fvg?: any;
    trend: string;
    structure: string;
    premiumDiscount: string;
  };
}

export interface BacktestEquityCurve {
  time: number[];
  equity: number[];
  drawdown: number[];
}

export interface BacktestReport {
  config: BacktestConfig;
  result: BacktestResult;
  trades: BacktestTrade[];
  equityCurve: BacktestEquityCurve;
  monthlyReturns: Record<string, number>;
  setupStats: Record<string, { trades: number; wins: number; losses: number; avgPnL: number }>;
  error?: string;
}

// ============================================================================
// BACKTEST ENGINE
// ============================================================================

export class SMCBacktestEngine {
  private ohlcv: OHLCV[];
  private config: BacktestConfig;
  private trades: BacktestTrade[] = [];
  private equity: number = 0;
  private equityCurve: { time: number; equity: number; drawdown: number }[] = [];
  private positions: Map<number, { direction: "long" | "short"; entryPrice: number; stopLoss: number; takeProfit?: number }> = new Map();

  constructor(ohlcv: OHLCV[], config: Partial<BacktestConfig> = {}) {
    this.ohlcv = ohlcv;
    this.config = {
      initialCapital: 10000,
      positionSize: 0.02, // 2% risk per trade
      riskPercent: 0.01, // 1% risk per trade
      maxPositions: 5,
      spread: 0.0001, // 1 pip spread
      commission: 0,
      slMultiplier: 1.5, // SL at 1.5x ATR or OB size
      tpMultiplier: 3.0, // TP at 3x risk (1:3 R:R)
      ...config,
    };
    this.equity = this.config.initialCapital;
  }

  /**
   * Run full backtest
   */
  run(): BacktestReport {
    this.trades = [];
    this.positions.clear();
    this.equity = this.config.initialCapital;
    this.equityCurve = [{ 
      time: this.ohlcv[0]?.timestamp || Date.now(), 
      equity: this.equity, 
      drawdown: 0 
    }];

    const startIndex = 50; // Warmup period for SMC indicators
    
    for (let i = startIndex; i < this.ohlcv.length; i++) {
      // Check for exits first
      this.checkExits(i);
      
      // Check for new entries
      if (this.positions.size < this.config.maxPositions) {
        const signals = this.generateSignals(i);
        for (const signal of signals) {
          if (this.positions.size < this.config.maxPositions) {
            this.executeTrade(i, signal);
          }
        }
      }
      
      // Record equity
      this.recordEquity(i);
    }

    // Close any remaining positions
    this.closeAllPositions(this.ohlcv.length - 1);

    return this.generateReport();
  }

  /**
   * Generate trading signals at index
   */
  private generateSignals(index: number): TradeSignal[] {
    const signals: TradeSignal[] = [];
    const candles = this.ohlcv.slice(0, index + 1);
    const currentCandle = this.ohlcv[index];

    // Run full SMC analysis
    const smc = runSMCAnalysis(candles, currentCandle.close);

    // === ORDER BLOCK SIGNALS ===
    const bullishOBs = smc.orderBlocks
      .filter(ob => ob.type === "Bullish" && ob.quality !== "Low")
      .slice(0, 3);
    
    const bearishOBs = smc.orderBlocks
      .filter(ob => ob.type === "Bearish" && ob.quality !== "Low")
      .slice(0, 3);

    // Bullish OB in discount = LONG signal
    for (const ob of bullishOBs) {
      if (this.config.enableOB && smc.premiumDiscount.position === "Discount") {
        signals.push({
          type: "long",
          entry: ob.high - (ob.high - ob.low) * 0.5, // Enter mid-OB
          stopLoss: ob.low - (ob.high - ob.low) * 0.5,
          takeProfit: ob.high + (ob.high - ob.low) * this.config.tpMultiplier,
          confidence: ob.quality === "High" ? 85 : 70,
          setup: "Bullish OB",
          reason: `Bullish OB at discount | Quality: ${ob.quality}`,
          smcContext: {
            orderBlock: ob,
            trend: smc.currentBias,
            structure: smc.choch ? "CHOCH" : smc.mss ? "MSS" : "BOS",
            premiumDiscount: smc.premiumDiscount.position,
          }
        });
      }
    }

    // Bearish OB in premium = SHORT signal
    for (const ob of bearishOBs) {
      if (this.config.enableOB && smc.premiumDiscount.position === "Premium") {
        signals.push({
          type: "short",
          entry: ob.low + (ob.high - ob.low) * 0.5,
          stopLoss: ob.high + (ob.high - ob.low) * 0.5,
          takeProfit: ob.low - (ob.high - ob.low) * this.config.tpMultiplier,
          confidence: ob.quality === "High" ? 85 : 70,
          setup: "Bearish OB",
          reason: `Bearish OB at premium | Quality: ${ob.quality}`,
          smcContext: {
            orderBlock: ob,
            trend: smc.currentBias,
            structure: smc.choch ? "CHOCH" : smc.mss ? "MSS" : "BOS",
            premiumDiscount: smc.premiumDiscount.position,
          }
        });
      }
    }

    // === FAIR VALUE GAP SIGNALS ===
    const unfilledFVGs = smc.fairValueGaps.filter(fvg => !fvg.mitigated).slice(0, 3);
    
    for (const fvg of unfilledFVGs) {
      if (!this.config.enableFVG) continue;
      
      // Bullish FVG below price = LONG
      if (fvg.type === "Bullish" && currentCandle.close > fvg.priceLevel) {
        signals.push({
          type: "long",
          entry: fvg.priceLevel,
          stopLoss: fvg.priceLevel - fvg.size,
          takeProfit: fvg.priceLevel + fvg.size * this.config.tpMultiplier,
          confidence: fvg.strength === "Strong" ? 80 : 65,
          setup: "Bullish FVG",
          reason: `Bullish FVG unfilled | Strength: ${fvg.strength}`,
          smcContext: {
            fvg,
            trend: smc.currentBias,
            structure: smc.choch ? "CHOCH" : smc.mss ? "MSS" : "BOS",
            premiumDiscount: smc.premiumDiscount.position,
          }
        });
      }

      // Bearish FVG above price = SHORT
      if (fvg.type === "Bearish" && currentCandle.close < fvg.priceLevel) {
        signals.push({
          type: "short",
          entry: fvg.priceLevel,
          stopLoss: fvg.priceLevel + fvg.size,
          takeProfit: fvg.priceLevel - fvg.size * this.config.tpMultiplier,
          confidence: fvg.strength === "Strong" ? 80 : 65,
          setup: "Bearish FVG",
          reason: `Bearish FVG unfilled | Strength: ${fvg.strength}`,
          smcContext: {
            fvg,
            trend: smc.currentBias,
            structure: smc.choch ? "CHOCH" : smc.mss ? "MSS" : "BOS",
            premiumDiscount: smc.premiumDiscount.position,
          }
        });
      }
    }

    // === MARKET STRUCTURE SIGNALS ===
    if (smc.choch && this.config.enableCHOCH) {
      signals.push({
        type: smc.choch.type === "Bullish" ? "long" : "short",
        entry: currentCandle.close,
        stopLoss: smc.choch.type === "Bullish" 
          ? currentCandle.low - (currentCandle.high - currentCandle.low)
          : currentCandle.high + (currentCandle.high - currentCandle.low),
        takeProfit: smc.choch.type === "Bullish"
          ? currentCandle.close + Math.abs(currentCandle.close - (smc.choch.price || currentCandle.close)) * this.config.tpMultiplier
          : currentCandle.close - Math.abs((smc.choch.price || currentCandle.close) - currentCandle.close) * this.config.tpMultiplier,
        confidence: smc.choch.confidence,
        setup: smc.choch.type === "Bullish" ? "Bullish CHOCH" : "Bearish CHOCH",
        reason: `Change of Character detected | ${smc.choch.reversalSignal ? "Reversal" : "Continuation"}`,
        smcContext: {
          trend: smc.choch.type === "Bullish" ? "bearish" : "bullish", // Reversal
          structure: "CHOCH",
          premiumDiscount: smc.premiumDiscount.position,
        }
      });
    }

    // === PREMIUM/DISCOUNT SIGNALS ===
    if (this.config.enablePD) {
      // Long in discount with structure confirmation
      if (smc.premiumDiscount.position === "Discount" && smc.currentBias === "Bullish") {
        signals.push({
          type: "long",
          entry: currentCandle.close,
          stopLoss: currentCandle.low,
          takeProfit: currentCandle.close + (currentCandle.close - currentCandle.low) * this.config.tpMultiplier,
          confidence: 60,
          setup: "Discount Long",
          reason: "Buying at discount in uptrend",
          smcContext: {
            trend: smc.currentBias,
            structure: smc.bos.length > 0 ? "BOS" : "No Structure",
            premiumDiscount: "Discount",
          }
        });
      }

      // Short in premium with structure confirmation
      if (smc.premiumDiscount.position === "Premium" && smc.currentBias === "Bearish") {
        signals.push({
          type: "short",
          entry: currentCandle.close,
          stopLoss: currentCandle.high,
          takeProfit: currentCandle.close - (currentCandle.high - currentCandle.close) * this.config.tpMultiplier,
          confidence: 60,
          setup: "Premium Short",
          reason: "Selling at premium in downtrend",
          smcContext: {
            trend: smc.currentBias,
            structure: smc.bos.length > 0 ? "BOS" : "No Structure",
            premiumDiscount: "Premium",
          }
        });
      }
    }

    // === FILTER BY TREND ===
    return signals.filter(s => {
      if (this.config.trendFilter && s.smcContext?.trend) {
        if (s.type === "long" && s.smcContext.trend !== "Bullish") return false;
        if (s.type === "short" && s.smcContext.trend !== "Bearish") return false;
      }
      return true;
    });
  }

  /**
   * Execute trade at index
   */
  private executeTrade(index: number, signal: TradeSignal): void {
    // Check if already have position in same direction
    for (const [idx, pos] of this.positions) {
      if (pos.direction === signal.type) return; // Already in position
    }

    const candle = this.ohlcv[index];
    const entryPrice = signal.entry * (1 + (signal.type === "long" ? -this.config.spread : this.config.spread));
    const stopLoss = signal.stopLoss * (1 + (signal.type === "long" ? this.config.spread : -this.config.spread));
    const takeProfit = signal.takeProfit;

    // Calculate position size based on risk
    const riskAmount = this.equity * this.config.riskPercent;
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    const positionSize = Math.floor(riskAmount / riskPerUnit);

    if (positionSize <= 0) return;

    this.positions.set(index, {
      direction: signal.type,
      entryPrice,
      stopLoss,
      takeProfit,
    });
  }

  /**
   * Check for exits at index
   */
  private checkExits(index: number): void {
    const exitedPositions: number[] = [];

    for (const [entryIndex, position] of this.positions) {
      const candle = this.ohlcv[index];
      let exitSignal: "sl" | "tp" | "trail" | null = null;
      let exitPrice = candle.close;

      // Check stop loss
      if (position.direction === "long" && candle.low <= position.stopLoss) {
        exitSignal = "sl";
        exitPrice = position.stopLoss;
      } else if (position.direction === "short" && candle.high >= position.stopLoss) {
        exitSignal = "sl";
        exitPrice = position.stopLoss;
      }

      // Check take profit
      if (position.takeProfit) {
        if (position.direction === "long" && candle.high >= position.takeProfit) {
          exitSignal = "tp";
          exitPrice = position.takeProfit;
        } else if (position.direction === "short" && candle.low <= position.takeProfit) {
          exitSignal = "tp";
          exitPrice = position.takeProfit;
        }
      }

      if (exitSignal) {
        // Calculate P&L
        const position = this.positions.get(entryIndex)!;
        const positionData = this.calculateTradePnl(entryIndex, index, position, exitPrice, exitSignal);
        
        this.trades.push(positionData);
        this.equity += positionData.pnl;
        exitedPositions.push(entryIndex);
      }
    }

    // Remove closed positions
    exitedPositions.forEach(idx => this.positions.delete(idx));
  }

  /**
   * Close all positions at end of backtest
   */
  private closeAllPositions(finalIndex: number): void {
    for (const [entryIndex, position] of this.positions) {
      const candle = this.ohlcv[finalIndex];
      const positionData = this.calculateTradePnl(entryIndex, finalIndex, position, candle.close, "end");
      this.trades.push(positionData);
      this.equity += positionData.pnl;
    }
    this.positions.clear();
  }

  /**
   * Calculate trade P&L
   */
  private calculateTradePnl(
    entryIndex: number,
    exitIndex: number,
    position: { direction: "long" | "short"; entryPrice: number; stopLoss: number; takeProfit?: number },
    exitPrice: number,
    reason: "sl" | "tp" | "end"
  ): BacktestTrade {
    const entryCandle = this.ohlcv[entryIndex];
    const exitCandle = this.ohlcv[exitIndex];

    const pnl = position.direction === "long"
      ? (exitPrice - position.entryPrice)
      : (position.entryPrice - exitPrice);
    
    const pnlPercent = (pnl / position.entryPrice) * 100;

    return {
      id: `backtest-${entryIndex}-${exitIndex}`,
      entryIndex,
      exitIndex,
      entryTime: entryCandle.timestamp,
      exitTime: exitCandle.timestamp,
      entryPrice: position.entryPrice,
      exitPrice,
      direction: position.direction,
      pnl,
      pnlPercent,
      setup: reason === "sl" ? "Stop Loss" : reason === "tp" ? "Take Profit" : "End of Backtest",
      reason: `Closed at ${reason.toUpperCase()}`,
      holdingPeriod: exitIndex - entryIndex,
      smcContext: {
        trend: position.direction === "long" ? "Bullish" : "Bearish",
        structure: "BOS",
        premiumDiscount: "Unknown",
      }
    };
  }

  /**
   * Record equity point
   */
  private recordEquity(index: number): void {
    const candle = this.ohlcv[index];
    const peak = Math.max(...this.equityCurve.map(e => e.equity));
    const drawdown = this.equity < peak ? ((peak - this.equity) / peak) * 100 : 0;
    
    this.equityCurve.push({
      time: candle.timestamp,
      equity: this.equity,
      drawdown,
    });
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(): BacktestReport {
    const wins = this.trades.filter(t => t.pnl > 0);
    const losses = this.trades.filter(t => t.pnl < 0);
    const breakevens = this.trades.filter(t => t.pnl === 0);

    const totalPnL = this.trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalPnLPercent = this.trades.reduce((sum, t) => sum + t.pnlPercent, 0);

    // Calculate metrics
    const winRate = this.trades.length > 0 ? (wins.length / this.trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    // Max drawdown
    const maxDrawdown = Math.max(...this.equityCurve.map(e => e.drawdown));

    // Average trade duration
    const avgDuration = this.trades.length > 0
      ? this.trades.reduce((s, t) => s + t.holdingPeriod, 0) / this.trades.length
      : 0;

    // Monthly returns
    const monthlyReturns: Record<string, number> = {};
    this.trades.forEach(t => {
      const month = new Date(t.exitTime).toISOString().slice(0, 7);
      monthlyReturns[month] = (monthlyReturns[month] || 0) + t.pnlPercent;
    });

    // Setup statistics
    const setupStats: Record<string, { trades: number; wins: number; losses: number; avgPnL: number }> = {};
    this.trades.forEach(t => {
      if (!setupStats[t.setup]) {
        setupStats[t.setup] = { trades: 0, wins: 0, losses: 0, avgPnL: 0 };
      }
      setupStats[t.setup].trades++;
      if (t.pnl > 0) setupStats[t.setup].wins++;
      else if (t.pnl < 0) setupStats[t.setup].losses++;
      setupStats[t.setup].avgPnL += t.pnlPercent;
    });
    Object.values(setupStats).forEach(s => s.avgPnL /= s.trades);

    // Calculate Sharpe Ratio (simplified)
    const returns = this.trades.map(t => t.pnlPercent / 100);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 1
      ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
      : 0;
    const sharpe = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0; // Annualized

    // Calculate Sortino Ratio
    const negativeReturns = returns.filter(r => r < 0);
    const downsideDev = negativeReturns.length > 0
      ? Math.sqrt(negativeReturns.reduce((s, r) => s + Math.pow(r, 2), 0) / negativeReturns.length)
      : 0;
    const sortino = downsideDev > 0 ? (avgReturn * 252) / (downsideDev * Math.sqrt(252)) : 0;

    const result: BacktestResult = {
      totalTrades: this.trades.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      winRate,
      profitFactor,
      totalPnL,
      totalPnLPercent: ((totalPnL / this.config.initialCapital) * 100),
      averageWin,
      averageLoss,
      maxDrawdown,
      sharpeRatio: sharpe,
      sortinoRatio: sortino,
      averageTradeDuration: avgDuration,
      bestTrade: Math.max(...this.trades.map(t => t.pnlPercent), 0),
      worstTrade: Math.min(...this.trades.map(t => t.pnlPercent), 0),
      consecutiveWins: this.calculateMaxStreak("win"),
      consecutiveLosses: this.calculateMaxStreak("loss"),
    };

    return {
      config: this.config,
      result,
      trades: this.trades,
      equityCurve: {
        time: this.equityCurve.map(e => e.time),
        equity: this.equityCurve.map(e => e.equity),
        drawdown: this.equityCurve.map(e => e.drawdown),
      },
      monthlyReturns,
      setupStats,
    };
  }

  /**
   * Calculate maximum streak
   */
  private calculateMaxStreak(type: "win" | "loss"): number {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const trade of this.trades) {
      const isWin = trade.pnl > 0;
      if ((type === "win" && isWin) || (type === "loss" && !isWin)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Run quick backtest on historical data
 */
export function runQuickBacktest(
  ohlcv: OHLCV[],
  config?: Partial<BacktestConfig>
): BacktestReport {
  const engine = new SMCBacktestEngine(ohlcv, config);
  return engine.run();
}

/**
 * Compare two strategies
 */
export function compareStrategies(
  ohlcv: OHLCV[],
  configs: Partial<BacktestConfig>[]
): BacktestReport[] {
  return configs.map(config => runQuickBacktest(ohlcv, config));
}

/**
 * Optimize parameters
 */
export function optimizeParameters(
  ohlcv: OHLCV[],
  paramGrid: Record<string, number[]>
): { best: BacktestReport; results: { params: any; result: BacktestResult }[] } {
  const results: { params: any; result: BacktestResult }[] = [];
  
  // Generate all parameter combinations (simplified - in production use proper optimization)
  const combinations = generateCombinations(paramGrid);
  
  let bestReport: BacktestReport | null = null;
  let bestProfitFactor = -Infinity;

  for (const params of combinations) {
    try {
      const report = runQuickBacktest(ohlcv, params);
      results.push({ params, result: report.result });
      
      if (report.result.profitFactor > bestProfitFactor) {
        bestProfitFactor = report.result.profitFactor;
        bestReport = report;
      }
    } catch (e) {
      // Skip invalid combinations
    }
  }

  return {
    best: bestReport!,
    results,
  };
}

/**
 * Generate all combinations from parameter grid
 */
function generateCombinations(grid: Record<string, number[]>): any[] {
  const keys = Object.keys(grid);
  if (keys.length === 0) return [{}];

  const values = keys.map(k => grid[k]);
  const combinations: any[] = [];

  function* cartesian(index: number, current: any): Generator<any> {
    if (index === keys.length) {
      yield current;
      return;
    }

    for (const value of values[index]) {
      yield* cartesian(index + 1, { ...current, [keys[index]]: value });
    }
  }

  return Array.from(cartesian(0, {}));
}

// ============================================================================
// STRATEGY TEMPLATES
// ============================================================================

/**
 * Conservative OB Strategy
 */
export const conservativeOBStrategy: Partial<BacktestConfig> = {
  enableOB: true,
  enableFVG: false,
  enableCHOCH: false,
  enablePD: false,
  riskPercent: 0.01, // 1% risk
  tpMultiplier: 2.0, // 1:2 R:R
  slMultiplier: 1.0,
  trendFilter: true,
};

/**
 * Aggressive FVG Strategy
 */
export const aggressiveFVGStrategy: Partial<BacktestConfig> = {
  enableOB: false,
  enableFVG: true,
  enableCHOCH: true,
  enablePD: true,
  riskPercent: 0.02, // 2% risk
  tpMultiplier: 3.0, // 1:3 R:R
  slMultiplier: 1.5,
  trendFilter: false,
};

/**
 * Multi-Timeframe Strategy
 */
export const multiTimeframeStrategy: Partial<BacktestConfig> = {
  enableOB: true,
  enableFVG: true,
  enableCHOCH: true,
  enablePD: true,
  riskPercent: 0.015, // 1.5% risk
  tpMultiplier: 2.5, // 1:2.5 R:R
  slMultiplier: 1.2,
  trendFilter: true,
};

/**
 * Default Balanced Strategy
 */
export const balancedStrategy: Partial<BacktestConfig> = {
  enableOB: true,
  enableFVG: true,
  enableCHOCH: false,
  enablePD: true,
  riskPercent: 0.02,
  tpMultiplier: 2.0,
  slMultiplier: 1.5,
  trendFilter: true,
};
