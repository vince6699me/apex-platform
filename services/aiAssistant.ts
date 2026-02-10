import { MarketDataService } from "./marketData";
import { AIIntelligenceService } from "./aiIntelligence";
import { RiskManagementService } from "./riskManagement";
import { TechnicalIndicatorService } from "./technicalIndicators";
import { SMCBacktestEngine } from "./smcBacktest";
import { TradeLoggerService } from "./tradeLogger";

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  data?: any;
  type?: "text" | "market-scan" | "stock-analysis" | "risk-report" | "trading-insight" | "smc-analysis" | "backtest-result";
}

export class AIAssistantService {
  static async processMessage(input: string): Promise<AIChatMessage> {
    const lower = input.toLowerCase();
    const timestamp = Date.now();
    const id = Math.random().toString(36).substring(7);

    // 1. SMC Analysis Request
    if (lower.includes("smc") || lower.includes("smart money") || lower.includes("order block") || 
        lower.includes("fvg") || lower.includes("fair value") || lower.includes("market structure")) {
      // Extract symbol if present
      const symbolMatch = input.match(/\b[A-Z]{2,5}\b(?!\.\d+)/);
      const symbol = symbolMatch ? symbolMatch[0].toUpperCase() : "AAPL";
      
      try {
        const analysis = await AIIntelligenceService.analyzeWithSMC(symbol);
        const patterns = await AIIntelligenceService.getEnhancedSMCPatterns(symbol);
        const silverBullet = AIIntelligenceService.detectSilverBullet(
          await MarketDataService.getHistoryFromPolygon(symbol)
        );
        const judasSwing = AIIntelligenceService.detectJudasSwing(
          await MarketDataService.getHistoryFromPolygon(symbol)
        );
        const powerOf3 = AIIntelligenceService.analyzePowerOf3(
          await MarketDataService.getHistoryFromPolygon(symbol)
        );

        return {
          id, role: "assistant", timestamp,
          type: "smc-analysis",
          content: `SMC Analysis for ${symbol}:

**Market Structure:** ${analysis.smcAnalysis.currentBias} (${analysis.smcAnalysis.trendStrength}% strength)
**Premium/Discount:** ${analysis.smcAnalysis.premiumDiscount.position} zone (${analysis.smcAnalysis.premiumDiscount.percentage}%)
**Active Kill Zone:** ${analysis.killZone?.name || "Off Hours"}

**Order Blocks:** ${analysis.smcAnalysis.orderBlocks.length} detected (${analysis.smcAnalysis.orderBlocks.filter(ob => ob.quality === "High").length} high quality)
**Fair Value Gaps:** ${analysis.smcAnalysis.fairValueGaps.filter(f => !f.mitigated).length} unfilled
**BOS Signals:** ${analysis.smcAnalysis.bos.length} confirmed

**Trade Setups:** ${analysis.tradeSetups.length} active setups detected

${silverBullet.isActive ? `⚡ **SILVER BULLET:** ${silverBullet.direction} | ${silverBullet.confidence}% confidence\n${silverBullet.description}` : ""}
${judasSwing.isActive ? `🎯 **JUDAS SWING:** ${judasSwing.direction} | ${judasSwing.confidence}% confidence\n${judasSwing.description}` : ""}
📊 **Power of 3:** ${powerOf3.phase} (${powerOf3.confidence}% confidence)`,
          data: { symbol, analysis, patterns, silverBullet, judasSwing, powerOf3 }
        };
      } catch (error) {
        return {
          id, role: "assistant", timestamp,
          type: "text",
          content: `Unable to complete SMC analysis for ${symbol}. Please check API connectivity.`
        };
      }
    }

    // 2. Backtest Request
    if (lower.includes("backtest") || lower.includes("test strategy") || lower.includes("run simulation")) {
      const symbolMatch = input.match(/\b[A-Z]{2,5}\b/);
      const symbol = symbolMatch ? symbolMatch[0].toUpperCase() : "AAPL";
      
      try {
        const history = await MarketDataService.getHistoryFromPolygon(symbol);
        const engine = new SMCBacktestEngine(history, {
          initialCapital: 10000,
          riskPercent: 0.02,
          enableOB: true,
          enableFVG: true,
          enableCHOCH: true,
          enablePD: true,
          trendFilter: true,
        });
        const result = engine.run();

        return {
          id, role: "assistant", timestamp,
          type: "backtest-result",
          content: `Backtest Results for ${symbol} (${history.length} bars):

**Performance:**
- Net P&L: $${result.result.totalPnL.toFixed(2)} (${result.result.totalPnLPercent.toFixed(1)}%)
- Win Rate: ${result.result.winRate.toFixed(1)}%
- Profit Factor: ${result.result.profitFactor.toFixed(2)}
- Max Drawdown: ${result.result.maxDrawdown.toFixed(2)}%

**Trade Statistics:**
- Total Trades: ${result.result.totalTrades}
- Wins: ${result.result.wins} | Losses: ${result.result.losses}
- Avg Win: $${result.result.averageWin.toFixed(2)} | Avg Loss: $${result.result.averageLoss.toFixed(2)}
- Sharpe Ratio: ${result.result.sharpeRatio.toFixed(2)}

**Best Setups:** ${Object.entries(result.setupStats).sort((a, b) => b[1].trades - a[1].trades).slice(0, 3).map(([k, v]) => `${k} (${v.trades} trades)`).join(", ")}`,
          data: { symbol, result }
        };
      } catch (error) {
        return {
          id, role: "assistant", timestamp,
          type: "text",
          content: "Backtest failed. Please check data connectivity."
        };
      }
    }

    // 3. Trade Journal Request
    if (lower.includes("journal") || lower.includes("trade log") || lower.includes("my trades") ||
        lower.includes("performance") || lower.includes("win rate")) {
      const logger = new TradeLoggerService();
      const stats = logger.calculateStats();
      
      return {
        id, role: "assistant", timestamp,
        type: "trading-insight",
        content: `Your Trading Journal Summary:

**Overall Performance:**
- Total Trades: ${stats.totalTrades} | Win Rate: ${stats.winRate.toFixed(1)}%
- Net P&L: $${stats.totalPnL.toFixed(2)}
- Profit Factor: ${stats.profitFactor.toFixed(2)}

**Current Streak:** ${stats.currentStreak > 0 ? `+${stats.currentStreak} wins` : stats.currentStreak < 0 ? `${stats.currentStreak} losses` : "Neutral"}

**Best Timeframes:** ${Object.entries(stats.timeframePerformance).sort((a, b) => (b[1].wins/(b[1].wins+b[1].losses||1) - a[1].wins/(a[1].wins+a[1].losses||1))).slice(0, 3).map(([k, v]) => `${k}: ${((v.wins/(v.wins+v.losses||1))*100).toFixed(0)}%`).join(", ")}

**Longest Win Streak:** ${stats.longestWinStreak} | **Longest Loss Streak:** ${stats.longestLossStreak}`,
        data: { stats }
      };
    }

    // 4. Market Scanning
    if (lower.includes("scan") || lower.includes("opportunities") || lower.includes("find stocks") ||
        lower.includes("market scan") || lower.includes("watchlist")) {
      try {
        const symbols = ["AAPL", "TSLA", "MSFT", "NVDA", "GOOGL", "AMZN", "META"];
        const scans: any[] = [];
        
        for (const symbol of symbols.slice(0, 5)) {
          try {
            const analysis = await AIIntelligenceService.analyzeWithSMC(symbol);
            const patterns = await AIIntelligenceService.getEnhancedSMCPatterns(symbol);
            const quote = await MarketDataService.getQuoteFromAlphaVantage(symbol);
            
            scans.push({
              symbol,
              price: quote.price,
              change: quote.changePercent,
              bias: analysis.smcAnalysis.currentBias,
              setups: analysis.tradeSetups.length,
              killZone: analysis.killZone?.name || "Off",
              topPattern: patterns[0]?.concept || "None"
            });
          } catch (e) {
            scans.push({ symbol, error: true });
          }
        }

        return {
          id, role: "assistant", timestamp,
          type: "market-scan",
          content: `Market Scan Results:

${scans.filter(s => !s.error).map(s => 
  `**${s.symbol}** $${s.price.toFixed(2)} (${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%)
   Bias: ${s.bias} | Setups: ${s.setups} | ${s.killZone}
   Top Pattern: ${s.topPattern}`
).join('\n\n')}

*Analysis generated using real-time SMC algorithms.*`,
          data: { scans }
        };
      } catch (error) {
        return {
          id, role: "assistant", timestamp,
          type: "text",
          content: "Market scan failed. Please check API connectivity."
        };
      }
    }

    // 5. Stock/Symbol Analysis
    const stockMatch = input.match(/\b[A-Z]{2,5}\b(?!\.\d+)/);
    if (stockMatch || lower.includes("analyze") || lower.includes("price") || lower.includes("chart")) {
      const symbol = stockMatch ? stockMatch[0].toUpperCase() : "AAPL";
      
      try {
        const [quote, history, analysis, patterns] = await Promise.all([
          MarketDataService.getQuoteFromAlphaVantage(symbol),
          MarketDataService.getHistoryFromPolygon(symbol),
          AIIntelligenceService.analyzeWithSMC(symbol),
          AIIntelligenceService.getEnhancedSMCPatterns(symbol)
        ]);

        const prices = history.map(d => d.close);
        const rsi = TechnicalIndicatorService.calculateRSI(prices);
        const structure = AIIntelligenceService.getMarketStructure(symbol, history);

        return {
          id, role: "assistant", timestamp,
          type: "stock-analysis",
          content: `${symbol} Analysis:

**Price:** $${quote.price.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)
**RSI:** ${rsi.toFixed(1)} (${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'})

**SMC Analysis:**
- Bias: ${analysis.smcAnalysis.currentBias} (${analysis.smcAnalysis.trendStrength}% strength)
- Position: ${analysis.smcAnalysis.premiumDiscount.position} zone
- Active Kill Zone: ${analysis.killZone?.name || "Off Hours"}

**Market Structure:**
- Trend: ${structure.trend}
- BOS Signals: ${structure.bos.length}
- CHOCH: ${structure.choch ? structure.choch.type : "None"}

**Top SMC Patterns:**
${patterns.slice(0, 3).map(p => `- ${p.concept}: ${p.bias} (${p.confidence}% confidence)`).join('\n')}

**Active Trade Setups:** ${analysis.tradeSetups.length}`,
          data: { symbol, quote, analysis, patterns, rsi, structure }
        };
      } catch (error) {
        return {
          id, role: "assistant", timestamp,
          type: "text",
          content: `Unable to analyze ${symbol}. Please check API connectivity or try another symbol.`
        };
      }
    }

    // 6. Risk Management
    if (lower.includes("risk") || lower.includes("exposure") || lower.includes("portfolio") ||
        lower.includes("drawdown") || lower.includes("position size")) {
      const logger = new TradeLoggerService();
      const openTrades = logger.getOpenTrades();
      const metrics = RiskManagementService.calculateRiskMetrics([], openTrades);
      const level = RiskManagementService.assessRiskLevel(metrics);
      
      return {
        id, role: "assistant", timestamp,
        type: "risk-report",
        content: `Risk Assessment: ${level}

**Portfolio Risk:**
- Open Positions: ${openTrades.length}
- Total Risk Exposure: $${metrics.valueAtRisk95.toFixed(2)} (95% VaR)
- Max Drawdown: ${metrics.maxDrawdownPercent.toFixed(2)}%

**Recommendations:**
${level === "High" || level === "Extreme" ? "⚠️ Consider reducing position sizes or closing some trades" : "✅ Risk levels within acceptable range"}`,
        data: { metrics, level, openTrades }
      };
    }

    // Default help response
    return {
      id, role: "assistant", timestamp,
      type: "text",
      content: `I'm connected to the Apex Trading Engine. I can help with:

📊 **SMC Analysis:** "Analyze [symbol]" or "Show SMC for AAPL"
🔍 **Market Scan:** "Scan market" or "Find opportunities"
📈 **Backtesting:** "Backtest strategy" or "Run simulation"
📓 **Trade Journal:** "Show my performance" or "Trade log"
🎯 **Specific Analysis:** "Analyze TSLA" or "What's AAPL doing?"
⚠️ **Risk Check:** "Check risk" or "Portfolio exposure"

What would you like to explore?`
    };
  }
}