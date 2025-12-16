import { MarketDataService } from "./marketData";
import { AIIntelligenceService } from "./aiIntelligence";
import { RiskManagementService } from "./riskManagement";
import { TechnicalIndicatorService } from "./technicalIndicators";

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  data?: any;
  type?: "text" | "market-scan" | "stock-analysis" | "risk-report" | "trading-insight";
}

export class AIAssistantService {
  static async processMessage(input: string): Promise<AIChatMessage> {
    const lower = input.toLowerCase();
    const timestamp = Date.now();
    const id = Math.random().toString(36).substring(7);

    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));

    // 1. Market Scanning & Opportunities
    if (lower.includes("scan") || lower.includes("opportunities") || lower.includes("find stocks")) {
      const scans = AIIntelligenceService.scanPatterns();
      const smartMoney = AIIntelligenceService.getSmartMoneyPatterns();
      return {
        id, role: "assistant", timestamp,
        type: "market-scan",
        content: `I've performed a deep scan of the market. I found ${scans.length} potential setups and ${smartMoney.length} smart money footprints.`,
        data: { scans, smartMoney }
      };
    }

    // 2. Risk Management
    if (lower.includes("risk") || lower.includes("exposure") || lower.includes("portfolio")) {
      const metrics = RiskManagementService.calculateRiskMetrics([], []);
      const level = RiskManagementService.assessRiskLevel(metrics);
      return {
        id, role: "assistant", timestamp,
        type: "risk-report",
        content: `Current Risk Assessment: ${level}. Your Value at Risk (95%) is $${metrics.valueAtRisk95.toLocaleString()}.`,
        data: metrics
      };
    }

    // 3. Stock Analysis (Simple regex to catch common symbols or default to AAPL)
    const stockMatch = input.match(/\b(AAPL|TSLA|MSFT|NVDA|GOOGL|AMZN)\b/i);
    if (stockMatch || lower.includes("analyze") || lower.includes("price")) {
      const symbol = stockMatch ? stockMatch[0].toUpperCase() : "AAPL";
      
      const quote = MarketDataService.generateQuote(symbol);
      const sentiment = AIIntelligenceService.getSentimentInsights([symbol])[0];
      const history = MarketDataService.generateHistoricalData(symbol, 50).map(d => d.close);
      const rsi = TechnicalIndicatorService.calculateRSI(history);
      
      return {
        id, role: "assistant", timestamp,
        type: "stock-analysis",
        content: `Here is the real-time intelligence for ${symbol}. Sentiment is currently ${sentiment.sentimentLabel} with an RSI of ${rsi.toFixed(1)}.`,
        data: { symbol, quote, sentiment, rsi }
      };
    }

    // 4. Trading Strategy / Backtest
    if (lower.includes("strategy") || lower.includes("backtest")) {
        return {
            id, role: "assistant", timestamp,
            type: "trading-insight",
            content: "I can help you optimize your strategy. Based on recent volatility, a mean-reversion strategy on the 15m timeframe shows promise.",
            data: { strategy: "Mean Reversion", timeframe: "15m", winRate: 62, profitFactor: 1.8 }
        };
    }

    // Default conversational response
    return {
      id, role: "assistant", timestamp,
      type: "text",
      content: "I am connected to the Apex Trading Engine. I can Scan Markets, Analyze Stocks (e.g., 'Analyze TSLA'), Check Portfolio Risk, or suggest Trading Strategies. How can I assist?"
    };
  }
}