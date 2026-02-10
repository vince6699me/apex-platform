/**
 * Trade Logger & Journal Service
 * 
 * Records, manages, and analyzes trades with full SMC context:
 * - Trade entry/exit logging
 * - Performance metrics (Win rate, P&L, R:R)
 * - Pattern recognition for wins/losses
 * - Journal notes and screenshots
 */

import { OHLCV, TradeSetup, SMCAnalysis } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface TradeLog {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entryTime: number;
  exitTime?: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit?: number;
  positionSize: number;
  riskAmount: number;
  rewardAmount?: number;
  pnl?: number;
  pnlPercent?: number;
  status: "open" | "closed" | "cancelled";
  outcome?: "win" | "loss" | "breakeven";
  riskReward?: number;
  
  // SMC Context
  setup: string;           // e.g., "Bullish OB", "FVG Fill", "Liquidity Grab"
  timeframe: string;        // e.g., "H4", "H1", "M15"
  killZone?: string;        // e.g., "London Open", "NY Session"
  orderBlockId?: string;
  fvgId?: string;
  liquidityZone?: string;
  
  // Market Context
  trend: "bullish" | "bearish" | "ranging";
  structure: string;        // e.g., "BOS", "CHOCH", "MSS"
  premiumDiscount: "premium" | "discount" | "equilibrium";
  
  // Journal
  notes: string;
  screenshot?: string;
  lessons?: string[];
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  averageRiskReward: number;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: number;
  averageTradeDuration: number;
  bestTrade: number;
  worstTrade: number;
  
  // SMC-specific stats
  setupPerformance: Record<string, { wins: number; losses: number; avgPnL: number }>;
  timeframePerformance: Record<string, { wins: number; losses: number; avgPnL: number }>;
  killZonePerformance: Record<string, { wins: number; losses: number; avgPnL: number }>;
}

export interface JournalEntry {
  id: string;
  date: number;
  type: "trade" | "observation" | "lesson" | "strategy";
  title: string;
  content: string;
  tags: string[];
  trades?: string[];  // Related trade IDs
  emotions?: {
    feeling: string;
    intensity: 1 | 2 | 3 | 4 | 5;
  };
}

export interface TradeFilter {
  symbol?: string;
  direction?: "long" | "short";
  status?: "open" | "closed";
  outcome?: "win" | "loss" | "breakeven";
  setup?: string;
  timeframe?: string;
  startDate?: number;
  endDate?: number;
  minPnL?: number;
  maxPnL?: number;
}

// ============================================================================
// TRADE LOGGER SERVICE
// ============================================================================

export class TradeLoggerService {
  private trades: Map<string, TradeLog> = new Map();
  private journalEntries: Map<string, JournalEntry> = new Map();
  
  constructor() {
    this.loadFromStorage();
  }

  // ============================================================================
  // TRADE MANAGEMENT
  // ============================================================================

  /**
   * Open a new trade
   */
  openTrade(params: {
    symbol: string;
    direction: "long" | "short";
    entryPrice: number;
    stopLoss: number;
    takeProfit?: number;
    positionSize: number;
    setup: string;
    timeframe: string;
    smcContext?: {
      orderBlockId?: string;
      fvgId?: string;
      liquidityZone?: string;
      killZone?: string;
      structure: string;
      trend: "bullish" | "bearish" | "ranging";
      premiumDiscount: "premium" | "discount" | "equilibrium";
    };
    notes?: string;
  }): TradeLog {
    const riskAmount = Math.abs(params.entryPrice - params.stopLoss) * params.positionSize;
    const riskReward = params.takeProfit 
      ? Math.abs(params.takeProfit - params.entryPrice) / Math.abs(params.entryPrice - params.stopLoss)
      : undefined;

    const trade: TradeLog = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: params.symbol,
      direction: params.direction,
      entryTime: Date.now(),
      entryPrice: params.entryPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      positionSize: params.positionSize,
      riskAmount,
      riskReward,
      status: "open",
      setup: params.setup,
      timeframe: params.timeframe,
      killZone: params.smcContext?.killZone,
      orderBlockId: params.smcContext?.orderBlockId,
      fvgId: params.smcContext?.fvgId,
      liquidityZone: params.smcContext?.liquidityZone,
      trend: params.smcContext?.trend || "ranging",
      structure: params.smcContext?.structure || "",
      premiumDiscount: params.smcContext?.premiumDiscount || "equilibrium",
      notes: params.notes || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.trades.set(trade.id, trade);
    this.saveToStorage();
    return trade;
  }

  /**
   * Close a trade
   */
  closeTrade(tradeId: string, exitPrice: number, notes?: string): TradeLog | null {
    const trade = this.trades.get(tradeId);
    if (!trade || trade.status !== "open") return null;

    const pnl = trade.direction === "long"
      ? (exitPrice - trade.entryPrice) * trade.positionSize
      : (trade.entryPrice - exitPrice) * trade.positionSize;
    
    const pnlPercent = (pnl / (trade.entryPrice * trade.positionSize)) * 100;
    
    let outcome: "win" | "loss" | "breakeven";
    if (pnl > 0) outcome = "win";
    else if (pnl < 0) outcome = "loss";
    else outcome = "breakeven";

    trade.exitTime = Date.now();
    trade.exitPrice = exitPrice;
    trade.pnl = pnl;
    trade.pnlPercent = pnlPercent;
    trade.outcome = outcome;
    trade.status = "closed";
    trade.updatedAt = Date.now();
    if (notes) trade.notes += `\n\nExit Notes: ${notes}`;

    this.trades.set(tradeId, trade);
    this.saveToStorage();
    
    // Auto-generate lesson for losing trades
    if (outcome === "loss") {
      this.generateLossLesson(trade);
    }
    
    return trade;
  }

  /**
   * Cancel an open trade
   */
  cancelTrade(tradeId: string, reason?: string): TradeLog | null {
    const trade = this.trades.get(tradeId);
    if (!trade || trade.status !== "open") return null;

    trade.status = "cancelled";
    trade.exitTime = Date.now();
    trade.exitPrice = trade.entryPrice; // No change
    trade.pnl = 0;
    trade.outcome = "breakeven";
    trade.notes += `\n\nCancelled: ${reason || "No reason provided"}`;
    trade.updatedAt = Date.now();

    this.trades.set(tradeId, trade);
    this.saveToStorage();
    return trade;
  }

  /**
   * Update trade with new info
   */
  updateTrade(tradeId: string, updates: Partial<TradeLog>): TradeLog | null {
    const trade = this.trades.get(tradeId);
    if (!trade) return null;

    const updated = { ...trade, ...updates, updatedAt: Date.now() };
    this.trades.set(tradeId, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Get trade by ID
   */
  getTrade(tradeId: string): TradeLog | null {
    return this.trades.get(tradeId) || null;
  }

  /**
   * Get all trades
   */
  getAllTrades(): TradeLog[] {
    return Array.from(this.trades.values()).sort((a, b) => b.entryTime - a.entryTime);
  }

  /**
   * Get open trades
   */
  getOpenTrades(): TradeLog[] {
    return this.getAllTrades().filter(t => t.status === "open");
  }

  /**
   * Get closed trades
   */
  getClosedTrades(): TradeLog[] {
    return this.getAllTrades().filter(t => t.status === "closed");
  }

  /**
   * Filter trades
   */
  filterTrades(filter: TradeFilter): TradeLog[] {
    let trades = this.getAllTrades();

    if (filter.symbol) trades = trades.filter(t => t.symbol === filter.symbol);
    if (filter.direction) trades = trades.filter(t => t.direction === filter.direction);
    if (filter.status) trades = trades.filter(t => t.status === filter.status);
    if (filter.outcome) trades = trades.filter(t => t.outcome === filter.outcome);
    if (filter.setup) trades = trades.filter(t => t.setup === filter.setup);
    if (filter.timeframe) trades = trades.filter(t => t.timeframe === filter.timeframe);
    if (filter.startDate) trades = trades.filter(t => t.entryTime >= filter.startDate!);
    if (filter.endDate) trades = trades.filter(t => t.entryTime <= filter.endDate!);
    if (filter.minPnL !== undefined) trades = trades.filter(t => (t.pnl || 0) >= filter.minPnL!);
    if (filter.maxPnL !== undefined) trades = trades.filter(t => (t.pnl || 0) <= filter.maxPnL!);

    return trades;
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Calculate comprehensive trade statistics
   */
  calculateStats(filter?: TradeFilter): TradeStats {
    const trades = filter ? this.filterTrades(filter) : this.getClosedTrades();
    
    const wins = trades.filter(t => t.outcome === "win");
    const losses = trades.filter(t => t.outcome === "loss");
    const breakevens = trades.filter(t => t.outcome === "breakeven");

    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalPnLPercent = trades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
    
    const avgWin = wins.length > 0 
      ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length 
      : 0;
    const avgLoss = losses.length > 0 
      ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) 
      : 0;
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    // Calculate streaks
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let currentStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    trades.forEach(t => {
      if (t.outcome === "win") {
        tempWinStreak++;
        tempLossStreak = 0;
        currentStreak = t === trades[trades.length - 1] ? tempWinStreak : currentStreak;
      } else if (t.outcome === "loss") {
        tempLossStreak++;
        tempWinStreak = 0;
        currentStreak = t === trades[trades.length - 1] ? -tempLossStreak : currentStreak;
      }
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
    });

    // Best/Worst trades
    const sortedByPnL = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    const bestTrade = sortedByPnL[0]?.pnl || 0;
    const worstTrade = sortedByPnL[sortedByPnL.length - 1]?.pnl || 0;

    // Average trade duration
    const durations = trades
      .filter(t => t.exitTime && t.entryTime)
      .map(t => t.exitTime! - t.entryTime!);
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Average R:R
    const rrTrades = trades.filter(t => t.riskReward);
    const avgRR = rrTrades.length > 0
      ? rrTrades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / rrTrades.length
      : 0;

    // SMC-specific performance
    const setupPerformance: Record<string, { wins: number; losses: number; avgPnL: number }> = {};
    const timeframePerformance: Record<string, { wins: number; losses: number; avgPnL: number }> = {};
    const killZonePerformance: Record<string, { wins: number; losses: number; avgPnL: number }> = {};

    trades.forEach(t => {
      // By setup
      if (!setupPerformance[t.setup]) {
        setupPerformance[t.setup] = { wins: 0, losses: 0, avgPnL: 0 };
      }
      if (t.outcome === "win") setupPerformance[t.setup].wins++;
      else if (t.outcome === "loss") setupPerformance[t.setup].losses++;
      setupPerformance[t.setup].avgPnL += (t.pnl || 0);
      
      // By timeframe
      if (!timeframePerformance[t.timeframe]) {
        timeframePerformance[t.timeframe] = { wins: 0, losses: 0, avgPnL: 0 };
      }
      if (t.outcome === "win") timeframePerformance[t.timeframe].wins++;
      else if (t.outcome === "loss") timeframePerformance[t.timeframe].losses++;
      timeframePerformance[t.timeframe].avgPnL += (t.pnl || 0);
      
      // By kill zone
      if (t.killZone) {
        if (!killZonePerformance[t.killZone]) {
          killZonePerformance[t.killZone] = { wins: 0, losses: 0, avgPnL: 0 };
        }
        if (t.outcome === "win") killZonePerformance[t.killZone].wins++;
        else if (t.outcome === "loss") killZonePerformance[t.killZone].losses++;
        killZonePerformance[t.killZone].avgPnL += (t.pnl || 0);
      }
    });

    // Calculate averages
    Object.values(setupPerformance).forEach(p => p.avgPnL /= (p.wins + p.losses || 1));
    Object.values(timeframePerformance).forEach(p => p.avgPnL /= (p.wins + p.losses || 1));
    Object.values(killZonePerformance).forEach(p => p.avgPnL /= (p.wins + p.losses || 1));

    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      totalPnL,
      totalPnLPercent,
      averageWin: avgWin,
      averageLoss: avgLoss,
      profitFactor,
      averageRiskReward: avgRR,
      longestWinStreak,
      longestLossStreak,
      currentStreak,
      averageTradeDuration: avgDuration,
      bestTrade,
      worstTrade,
      setupPerformance,
      timeframePerformance,
      killZonePerformance,
    };
  }

  /**
   * Get performance by time period
   */
  getPerformanceByPeriod(period: "daily" | "weekly" | "monthly"): Record<string, TradeStats> {
    const closed = this.getClosedTrades();
    const periods: Record<string, TradeLog[]> = {};

    closed.forEach(trade => {
      if (!trade.exitTime) return;
      const date = new Date(trade.exitTime);
      let key: string;

      if (period === "daily") {
        key = date.toISOString().split('T')[0];
      } else if (period === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!periods[key]) periods[key] = [];
      periods[key].push(trade);
    });

    const results: Record<string, TradeStats> = {};
    Object.entries(periods).forEach(([periodKey, periodTrades]) => {
      // Calculate stats for this period
      const wins = periodTrades.filter(t => t.outcome === "win").length;
      const losses = periodTrades.filter(t => t.outcome === "loss").length;
      const totalPnL = periodTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      results[periodKey] = {
        totalTrades: periodTrades.length,
        wins,
        losses,
        breakevens: periodTrades.filter(t => t.outcome === "breakeven").length,
        winRate: (wins / periodTrades.length) * 100,
        totalPnL,
        totalPnLPercent: totalPnL, // Simplified
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        averageRiskReward: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        currentStreak: 0,
        averageTradeDuration: 0,
        bestTrade: 0,
        worstTrade: 0,
        setupPerformance: {},
        timeframePerformance: {},
        killZonePerformance: {},
      };
    });

    return results;
  }

  // ============================================================================
  // JOURNAL ENTRIES
  // ============================================================================

  /**
   * Add journal entry
   */
  addJournalEntry(entry: Omit<JournalEntry, "id" | "date">): JournalEntry {
    const newEntry: JournalEntry = {
      ...entry,
      id: `journal-${Date.now()}`,
      date: Date.now(),
    };
    this.journalEntries.set(newEntry.id, newEntry);
    this.saveToStorage();
    return newEntry;
  }

  /**
   * Get journal entries
   */
  getJournalEntries(filter?: { type?: string; startDate?: number; endDate?: number }): JournalEntry[] {
    let entries = Array.from(this.journalEntries.values()).sort((a, b) => b.date - a.date);
    if (filter?.type) entries = entries.filter(e => e.type === filter.type);
    if (filter?.startDate) entries = entries.filter(e => e.date >= filter.startDate!);
    if (filter?.endDate) entries = entries.filter(e => e.date <= filter.endDate!);
    return entries;
  }

  // ============================================================================
  // AUTO-ANALYSIS
  // ============================================================================

  /**
   * Generate automatic lesson from losing trade
   */
  private generateLossLesson(trade: TradeLog): void {
    const lessons: string[] = [];

    // Pattern recognition
    if (trade.structure === "BOS" && trade.outcome === "loss") {
      lessons.push("Consider waiting for CHOCH confirmation before trading against structure");
    }
    if (trade.premiumDiscount === "premium" && trade.direction === "long") {
      lessons.push("Avoid buying in premium zone - wait for discount entry");
    }
    if (!trade.killZone) {
      lessons.push("Trade outside kill zones has lower probability - wait for active session");
    }

    // Add journal entry
    if (lessons.length > 0) {
      this.addJournalEntry({
        type: "lesson",
        title: `Lesson from ${trade.symbol} loss`,
        content: lessons.join("\n"),
        tags: ["loss-analysis", trade.setup, trade.symbol],
        trades: [trade.id],
      });
    }
  }

  /**
   * Generate trade summary report
   */
  generateReport(startDate?: number, endDate?: number): string {
    const stats = this.calculateStats({
      startDate,
      endDate,
    });

    const period = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      : "All Time";

    let report = `
╔══════════════════════════════════════════════════════════════╗
║                    TRADE JOURNAL REPORT                      ║
╚══════════════════════════════════════════════════════════════╝

PERIOD: ${period}
GENERATED: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PERFORMANCE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Trades:     ${stats.totalTrades}
Win Rate:         ${stats.winRate.toFixed(1)}%
Profit Factor:   ${stats.profitFactor.toFixed(2)}
Total P&L:        $${stats.totalPnL.toFixed(2)}

Wins:            ${stats.wins} (${((stats.wins / stats.totalTrades) * 100 || 0).toFixed(1)}%)
Losses:          ${stats.losses} (${((stats.losses / stats.totalTrades) * 100 || 0).toFixed(1)}%)
Breakeven:       ${stats.breakevens} (${((stats.breakevens / stats.totalTrades) * 100 || 0).toFixed(1)}%)

Average Win:     $${stats.averageWin.toFixed(2)}
Average Loss:    $${stats.averageLoss.toFixed(2)}

Best Trade:      $${stats.bestTrade.toFixed(2)}
Worst Trade:    $${stats.worstTrade.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 STREAKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Streak:  ${stats.currentStreak > 0 ? `+${stats.currentStreak} wins` : stats.currentStreak < 0 ? `${stats.currentStreak} losses` : "Neutral"}
Longest Win:     ${stats.longestWinStreak} trades
Longest Loss:    ${stats.longestLossStreak} trades

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SETUP PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    Object.entries(stats.setupPerformance)
      .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
      .slice(0, 10)
      .forEach(([setup, perf]) => {
        const total = perf.wins + perf.losses;
        const wr = total > 0 ? ((perf.wins / total) * 100).toFixed(0) : 0;
        report += `\n${setup}: ${perf.wins}/${total} (${wr}%) | Avg PnL: $${perf.avgPnL.toFixed(2)}`;
      });

    report += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ TIMEFRAME PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    Object.entries(stats.timeframePerformance)
      .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
      .forEach(([tf, perf]) => {
        const total = perf.wins + perf.losses;
        const wr = total > 0 ? ((perf.wins / total) * 100).toFixed(0) : 0;
        report += `\n${tf}: ${perf.wins}/${total} (${wr}%) | Avg PnL: $${perf.avgPnL.toFixed(2)}`;
      });

    if (Object.keys(stats.killZonePerformance).length > 0) {
      report += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 KILL ZONE PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      Object.entries(stats.killZonePerformance)
        .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
        .forEach(([zone, perf]) => {
          const total = perf.wins + perf.losses;
          const wr = total > 0 ? ((perf.wins / total) * 100).toFixed(0) : 0;
          report += `\n${zone}: ${perf.wins}/${total} (${wr}%) | Avg PnL: $${perf.avgPnL.toFixed(2)}`;
        });
    }

    report += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // Auto-generate recommendations
    const recommendations: string[] = [];
    
    if (stats.winRate < 40) {
      recommendations.push("⚠️ Win rate below 40% - Review entry criteria");
    }
    if (stats.profitFactor < 1) {
      recommendations.push("⚠️ Profit factor below 1 - R:R may be insufficient");
    }
    if (stats.longestLossStreak > 5) {
      recommendations.push("⚠️ Multiple losing streaks - Consider stricter filters");
    }
    
    // Best performing
    const bestSetup = Object.entries(stats.setupPerformance)
      .filter(([, p]) => p.wins + p.losses >= 3)
      .sort((a, b) => {
        const aWr = (a[1].wins / (a[1].wins + a[1].losses)) * 100;
        const bWr = (b[1].wins / (b[1].wins + b[1].losses)) * 100;
        return bWr - aWr;
      })[0];
    
    if (bestSetup) {
      recommendations.push(`✅ Best setup: ${bestSetup[0]} (${((bestSetup[1].wins / (bestSetup[1].wins + bestSetup[1].losses)) * 100).toFixed(0)}% WR)`);
    }

    if (recommendations.length === 0) {
      report += "\n✅ Performance metrics within acceptable range";
    } else {
      report += "\n" + recommendations.join("\n");
    }

    return report;
  }

  // ============================================================================
  // STORAGE
  // ============================================================================

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex-trades', JSON.stringify(Array.from(this.trades.entries())));
      localStorage.setItem('apex-journal', JSON.stringify(Array.from(this.journalEntries.entries())));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const trades = localStorage.getItem('apex-trades');
        if (trades) {
          const parsed = JSON.parse(trades);
          this.trades = new Map(parsed);
        }
        const journal = localStorage.getItem('apex-journal');
        if (journal) {
          const parsed = JSON.parse(journal);
          this.journalEntries = new Map(parsed);
        }
      } catch (e) {
        console.error("Failed to load trades from storage", e);
      }
    }
  }

  /**
   * Export trades to CSV
   */
  exportToCSV(): string {
    const trades = this.getClosedTrades();
    const headers = [
      "ID", "Symbol", "Direction", "Entry Time", "Exit Time", "Entry Price", "Exit Price",
      "Stop Loss", "Take Profit", "Position Size", "Risk Amount", "PnL", "PnL %",
      "Outcome", "Setup", "Timeframe", "Kill Zone", "Trend", "Structure"
    ];
    
    const rows = trades.map(t => [
      t.id, t.symbol, t.direction,
      new Date(t.entryTime).toISOString(),
      t.exitTime ? new Date(t.exitTime).toISOString() : "",
      t.entryPrice, t.exitPrice || "",
      t.stopLoss, t.takeProfit || "", t.positionSize, t.riskAmount,
      t.pnl || "", t.pnlPercent || "", t.outcome || "",
      t.setup, t.timeframe, t.killZone || "", t.trend, t.structure
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }

  /**
   * Import trades from CSV
   */
  importFromCSV(csv: string): { imported: number; errors: number } {
    const lines = csv.trim().split("\n");
    const headers = lines[0].split(",");
    let imported = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",");
        const trade: any = {};
        
        headers.forEach((h, idx) => {
          trade[h.trim()] = values[idx];
        });

        this.openTrade({
          symbol: trade.Symbol,
          direction: trade.Direction,
          entryPrice: parseFloat(trade["Entry Price"]),
          stopLoss: parseFloat(trade["Stop Loss"]),
          takeProfit: trade["Take Profit"] ? parseFloat(trade["Take Profit"]) : undefined,
          positionSize: parseFloat(trade["Position Size"]),
          setup: trade.Setup,
          timeframe: trade.Timeframe,
          notes: "Imported from CSV",
        });
        imported++;
      } catch (e) {
        errors++;
      }
    }

    return { imported, errors };
  }
}

// Singleton instance
export const tradeLogger = new TradeLoggerService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function getTradeLogger(): TradeLoggerService {
  return tradeLogger;
}

export function calculatePositionSize(
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number
): number {
  const riskAmount = accountSize * (riskPercent / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  return Math.floor(riskAmount / riskPerUnit);
}

export function calculateRiskReward(
  entry: number,
  stop: number,
  target: number
): number {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  return reward / risk;
}
