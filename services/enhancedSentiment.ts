/**
 * Enhanced Sentiment Analysis Service
 * 
 * Combines multiple sentiment sources:
 * - Social Media Sentiment (Twitter, Reddit)
 * - News Sentiment Analysis
 * - COT Commercial Sentiment
 * - Fear & Greed Index
 * - Options Market Sentiment
 * 
 * Generates composite sentiment scores and trade signals
 */

import { OHLCV, TradeSetup, IndicatorSignal, SentimentInsight } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface SentimentData {
  source: "twitter" | "reddit" | "news" | "cot" | "options" | "composite";
  symbol: string;
  timestamp: number;
  sentimentScore: number; // -100 (extreme fear) to +100 (extreme greed)
  volume: number; // Number of mentions/data points
  confidence: number; // 0-100
  keywords: string[];
  trending: boolean;
}

export interface CompositeSentiment {
  overall: number; // Weighted average sentiment
  sentiment: "extremeFear" | "fear" | "neutral" | "greed" | "extremeGreed";
  confidence: number;
  sources: {
    twitter: SentimentData;
    reddit: SentimentData;
    news: SentimentData;
    cot: SentimentData;
    options: SentimentData;
  };
  divergence: {
    present: boolean;
    type: "fearGreed" | "socialPrice" | "optionsPrice";
    description: string;
  };
  trend: "improving" | "stable" | "declining";
  momentum: number; // Rate of change
}

export interface SentimentSignal {
  indicator: string;
  signal: "Bullish" | "Bearish" | "Neutral";
  strength: number; // 0-100
  value: string;
  description: string;
  sentimentScore: number;
  fearGreedIndex: number;
}

export interface FearGreedIndex {
  value: number; // 0-100
  label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  components: {
    volatility: number;
    momentum: number;
    callPutRatio: number;
    socialSentiment: number;
    surveys: number;
  };
  timestamp: number;
}

export interface OptionsSentiment {
  symbol: string;
  putCallRatio: number;
  putVolume: number;
  callVolume: number;
  putCallRatioPercentile: number; // Historical percentile
  sentiment: "bullish" | "bearish" | "neutral";
  ivPercentile: number; // Implied volatility percentile
  maxPain: number; // Strike with most open interest
}

// ============================================================================
// WEIGHTS FOR COMPOSITE SENTIMENT
// ============================================================================

const SENTIMENT_WEIGHTS = {
  twitter: 0.15,
  reddit: 0.1,
  news: 0.2,
  cot: 0.35, // COT is weighted highest (smart money)
  options: 0.2
};

// ============================================================================
// ENHANCED SENTIMENT SERVICE
// ============================================================================

export class EnhancedSentimentService {
  
  // ============================================================================
  // FEAR & GREED INDEX
  // ============================================================================
  
  /**
   * Calculate Fear & Greed Index (simulated)
   */
  static calculateFearGreedIndex(
    volatility: number,
    momentum: number,
    callPutRatio: number,
    socialSentiment: number,
    surveys: number
  ): FearGreedIndex {
    // Normalize components to 0-100
    const components = {
      volatility: Math.min(100, Math.max(0, volatility)), // Higher volatility = more fear
      momentum: Math.min(100, Math.max(0, momentum)), // Higher momentum = more greed
      callPutRatio: Math.min(100, Math.max(0, callPutRatio * 50)), // Higher ratio = more greed
      socialSentiment: Math.min(100, Math.max(0, (socialSentiment + 100) / 2)), // Convert -100 to 100 range
      surveys: Math.min(100, Math.max(0, surveys)) // Higher survey readings = more greed
    };
    
    // Calculate weighted average (inverse volatility since it indicates fear)
    const value = (
      (100 - components.volatility) * 0.2 +
      components.momentum * 0.25 +
      components.callPutRatio * 0.15 +
      components.socialSentiment * 0.25 +
      components.surveys * 0.15
    );
    
    let label: FearGreedIndex["label"];
    if (value < 25) label = "Extreme Fear";
    else if (value < 45) label = "Fear";
    else if (value < 55) label = "Neutral";
    else if (value < 75) label = "Greed";
    else label = "Extreme Greed";
    
    return {
      value: parseFloat(value.toFixed(1)),
      label,
      components,
      timestamp: Date.now()
    };
  }
  
  // ============================================================================
  // OPTIONS SENTIMENT
  // ============================================================================
  
  /**
   * Analyze options market sentiment
   */
  static analyzeOptionsSentiment(
    symbol: string,
    putVolume: number,
    callVolume: number,
    historicalPutCallRatios: number[]
  ): OptionsSentiment {
    const putCallRatio = putVolume > 0 ? putVolume / callVolume : 1;
    
    // Calculate percentile of current ratio
    const sortedRatios = [...historicalPutCallRatios].sort((a, b) => a - b);
    let percentile = 50;
    for (let i = 0; i < sortedRatios.length; i++) {
      if (sortedRatios[i] <= putCallRatio) {
        percentile = (i / sortedRatios.length) * 100;
      }
    }
    
    let sentiment: OptionsSentiment["sentiment"];
    if (putCallRatio > 1.2) sentiment = "bearish"; // High puts = fear
    else if (putCallRatio < 0.8) sentiment = "bullish"; // High calls = greed
    else sentiment = "neutral";
    
    return {
      symbol,
      putCallRatio: parseFloat(putCallRatio.toFixed(3)),
      putVolume,
      callVolume,
      putCallRatioPercentile: parseFloat(percentile.toFixed(1)),
      sentiment,
      ivPercentile: 50, // Would need IV data
      maxPain: 0 // Would need options chain data
    };
  }
  
  // ============================================================================
  // SOCIAL SENTIMENT ANALYSIS
  // ============================================================================
  
  /**
   * Analyze sentiment from text (Twitter, Reddit, News)
   */
  static analyzeTextSentiment(texts: string[]): {
    sentimentScore: number; // -100 to 100
    confidence: number;
    keywords: string[];
    trending: boolean;
  } {
    if (texts.length === 0) {
      return { sentimentScore: 0, confidence: 0, keywords: [], trending: false };
    }
    
    // Bullish keywords
    const bullishKeywords = [
      "moon", "to the moon", "bullish", "buy", "long", "up", "pump",
      "breakout", "rally", "surge", "gain", "profit", "winning",
      "hodl", "accumulate", "support", "bottom", "reversal"
    ];
    
    // Bearish keywords
    const bearishKeywords = [
      "dump", "bearish", "sell", "short", "down", "crash", "drop",
      "breakdown", "selloff", "loss", "losing", "fear", "fud",
      "scam", "rug", "top", "resistance", "rejection"
    ];
    
    let bullishCount = 0;
    let bearishCount = 0;
    const foundKeywords: string[] = [];
    
    texts.forEach(text => {
      const lowerText = text.toLowerCase();
      bullishKeywords.forEach(kw => {
        if (lowerText.includes(kw)) {
          bullishCount++;
          if (!foundKeywords.includes(kw)) foundKeywords.push(kw);
        }
      });
      bearishKeywords.forEach(kw => {
        if (lowerText.includes(kw)) {
          bearishCount++;
          if (!foundKeywords.includes(kw)) foundKeywords.push(kw);
        }
      });
    });
    
    // Calculate sentiment score
    const total = bullishCount + bearishCount;
    const sentimentScore = total > 0
      ? ((bullishCount - bearishCount) / total) * 100
      : 0;
    
    // Confidence based on volume and consensus
    const consensus = total / texts.length; // Mentions per text
    const confidence = Math.min(100, Math.min(total * 5, 100));
    
    // Trending if high engagement
    const trending = texts.length > 10 && consensus > 0.5;
    
    return {
      sentimentScore: parseFloat(sentimentScore.toFixed(1)),
      confidence: parseFloat(confidence.toFixed(1)),
      keywords: foundKeywords.slice(0, 10),
      trending
    };
  }
  
  // ============================================================================
  // COMPOSITE SENTIMENT ANALYSIS
  // ============================================================================
  
  /**
   * Calculate composite sentiment from multiple sources
   */
  static calculateCompositeSentiment(
    sources: {
      twitter?: SentimentData;
      reddit?: SentimentData;
      news?: SentimentData;
      cot?: SentimentData;
      options?: SentimentData;
    }
  ): CompositeSentiment {
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Twitter
    if (sources.twitter) {
      weightedSum += sources.twitter.sentimentScore * SENTIMENT_WEIGHTS.twitter;
      totalWeight += SENTIMENT_WEIGHTS.twitter;
    }
    
    // Reddit
    if (sources.reddit) {
      weightedSum += sources.reddit.sentimentScore * SENTIMENT_WEIGHTS.reddit;
      totalWeight += SENTIMENT_WEIGHTS.reddit;
    }
    
    // News
    if (sources.news) {
      weightedSum += sources.news.sentimentScore * SENTIMENT_WEIGHTS.news;
      totalWeight += SENTIMENT_WEIGHTS.news;
    }
    
    // COT
    if (sources.cot) {
      weightedSum += sources.cot.sentimentScore * SENTIMENT_WEIGHTS.cot;
      totalWeight += SENTIMENT_WEIGHTS.cot;
    }
    
    // Options
    if (sources.options) {
      weightedSum += sources.options.sentimentScore * SENTIMENT_WEIGHTS.options;
      totalWeight += SENTIMENT_WEIGHTS.options;
    }
    
    const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Determine sentiment label
    let sentiment: CompositeSentiment["sentiment"];
    if (overall < -60) sentiment = "extremeFear";
    else if (overall < -20) sentiment = "fear";
    else if (overall < 20) sentiment = "neutral";
    else if (overall < 60) sentiment = "greed";
    else sentiment = "extremeGreed";
    
    // Calculate confidence
    const confidences: number[] = [];
    if (sources.twitter) confidences.push(sources.twitter.confidence);
    if (sources.reddit) confidences.push(sources.reddit.confidence);
    if (sources.news) confidences.push(sources.news.confidence);
    if (sources.cot) confidences.push(sources.cot.confidence);
    if (sources.options) confidences.push(sources.options.confidence);
    const confidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;
    
    // Detect divergence
    const divergence = this.detectSentimentDivergence(sources);
    
    // Calculate momentum (simplified)
    const momentum = overall * 0.1; // Simplified
    
    // Determine trend
    let trend: CompositeSentiment["trend"] = "stable";
    if (momentum > 5) trend = "improving";
    else if (momentum < -5) trend = "declining";
    
    return {
      overall: parseFloat(overall.toFixed(1)),
      sentiment,
      confidence: parseFloat(confidence.toFixed(1)),
      sources: {
        twitter: sources.twitter || this.getEmptySentimentData("twitter", ""),
        reddit: sources.reddit || this.getEmptySentimentData("reddit", ""),
        news: sources.news || this.getEmptySentimentData("news", ""),
        cot: sources.cot || this.getEmptySentimentData("cot", ""),
        options: sources.options || this.getEmptySentimentData("options", "")
      },
      divergence,
      trend,
      momentum: parseFloat(momentum.toFixed(1))
    };
  }
  
  /**
   * Detect divergences between sentiment sources
   */
  static detectSentimentDivergence(
    sources: CompositeSentiment["sources"]
  ): CompositeSentiment["divergence"] {
    // Fear/Greed divergence (social vs COT)
    if (sources.twitter && sources.cot) {
      const socialSent = sources.twitter.sentimentScore;
      const cotSent = sources.cot.sentimentScore;
      
      if ((socialSent > 30 && cotSent < -30) || (socialSent < -30 && cotSent > 30)) {
        return {
          present: true,
          type: "fearGreed",
          description: `Social sentiment (${socialSent > 0 ? 'Greed' : 'Fear'}) diverges from COT smart money (${cotSent > 0 ? 'Bullish' : 'Bearish'}). contrarian opportunity.`
        };
      }
    }
    
    // Social/Price divergence
    if (sources.twitter && sources.news) {
      // Would need price data for full analysis
    }
    
    return {
      present: false,
      type: "fearGreed",
      description: "No significant divergence detected"
    };
  }
  
  // ============================================================================
  // SENTIMENT SIGNALS
  // ============================================================================
  
  /**
   * Generate sentiment-based trading signal
   */
  static getSentimentSignal(
    compositeSentiment: CompositeSentiment,
    fearGreedIndex: FearGreedIndex
  ): SentimentSignal {
    let signal: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    let strength = 50;
    let description = "";
    
    // Extreme fear often precedes buying opportunity
    if (compositeSentiment.sentiment === "extremeFear" && fearGreedIndex.value < 25) {
      signal = "Bullish";
      strength = Math.min(90, 70 + (25 - fearGreedIndex.value) / 2);
      description = "Extreme fear in market - historically good buying opportunity";
    }
    // Extreme greed often precedes sell-off
    else if (compositeSentiment.sentiment === "extremeGreed" && fearGreedIndex.value > 75) {
      signal = "Bearish";
      strength = Math.min(90, 70 + (fearGreedIndex.value - 75) / 2);
      description = "Extreme greed in market - consider taking profits or shorting";
    }
    // Fear with improving trend
    else if (compositeSentiment.sentiment === "fear" && compositeSentiment.trend === "improving") {
      signal = "Bullish";
      strength = 65;
      description = "Fear declining, sentiment improving - potential bottom forming";
    }
    // Greed with declining trend
    else if (compositeSentiment.sentiment === "greed" && compositeSentiment.trend === "declining") {
      signal = "Bearish";
      strength = 65;
      description = "Greed declining, sentiment turning - top may be near";
    }
    // Neutral
    else {
      signal = "Neutral";
      strength = 50;
      description = "Sentiment is neutral, no clear directional bias";
    }
    
    return {
      indicator: "Composite Sentiment",
      signal,
      strength,
      value: `${compositeSentiment.sentiment} (${compositeSentiment.overall})`,
      description,
      sentimentScore: compositeSentiment.overall,
      fearGreedIndex: fearGreedIndex.value
    };
  }
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * Create empty sentiment data placeholder
   */
  static getEmptySentimentData(source: CompositeSentiment["sources"][keyof CompositeSentiment["sources"]]["source"], symbol: string): SentimentData {
    return {
      source,
      symbol,
      timestamp: Date.now(),
      sentimentScore: 0,
      volume: 0,
      confidence: 0,
      keywords: [],
      trending: false
    };
  }
  
  // ============================================================================
  // FULL SENTIMENT ANALYSIS
  // ============================================================================
  
  /**
   * Run comprehensive sentiment analysis on a symbol
   */
  static async runSentimentAnalysis(
    symbol: string,
    tweets?: string[],
    redditPosts?: string[],
    newsHeadlines?: string[],
    cotData?: { commercialNet: number; largeSpecNet: number },
    optionsData?: { putVolume: number; callVolume: number; historicalRatios: number[] }
  ): Promise<{
    composite: CompositeSentiment;
    fearGreed: FearGreedIndex;
    optionsSentiment: OptionsSentiment | null;
    signal: SentimentSignal;
    setups: TradeSetup[];
  }> {
    // Analyze Twitter sentiment
    const twitterSent = this.analyzeTextSentiment(tweets || []);
    const twitterData: SentimentData = {
      source: "twitter",
      symbol,
      timestamp: Date.now(),
      sentimentScore: twitterSent.sentimentScore,
      volume: tweets?.length || 0,
      confidence: twitterSent.confidence,
      keywords: twitterSent.keywords,
      trending: twitterSent.trending
    };
    
    // Analyze Reddit sentiment
    const redditSent = this.analyzeTextSentiment(redditPosts || []);
    const redditData: SentimentData = {
      source: "reddit",
      symbol,
      timestamp: Date.now(),
      sentimentScore: redditSent.sentimentScore,
      volume: redditPosts?.length || 0,
      confidence: redditSent.confidence,
      keywords: redditSent.keywords,
      trending: redditSent.trending
    };
    
    // Analyze News sentiment
    const newsSent = this.analyzeTextSentiment(newsHeadlines || []);
    const newsData: SentimentData = {
      source: "news",
      symbol,
      timestamp: Date.now(),
      sentimentScore: newsSent.sentimentScore,
      volume: newsHeadlines?.length || 0,
      confidence: newsSent.confidence,
      keywords: newsSent.keywords,
      trending: newsSent.trending
    };
    
    // COT sentiment
    const cotSentimentScore = cotData
      ? (cotData.commercialNet / (Math.abs(cotData.commercialNet) + Math.abs(cotData.largeSpecNet))) * 100
      : 0;
    const cotDataSent: SentimentData = {
      source: "cot",
      symbol,
      timestamp: Date.now(),
      sentimentScore: cotSentimentScore,
      volume: 1,
      confidence: 80, // COT data is generally reliable
      keywords: [],
      trending: false
    };
    
    // Options sentiment
    let optionsSentimentData: SentimentData | null = null;
    let optionsSentiment: OptionsSentiment | null = null;
    if (optionsData) {
      optionsSentiment = this.analyzeOptionsSentiment(
        symbol,
        optionsData.putVolume,
        optionsData.callVolume,
        optionsData.historicalRatios
      );
      const optionsSentScore = optionsSentiment.sentiment === "bullish" ? 50 :
                               optionsSentiment.sentiment === "bearish" ? -50 : 0;
      optionsSentimentData = {
        source: "options",
        symbol,
        timestamp: Date.now(),
        sentimentScore: optionsSentScore,
        volume: optionsData.putVolume + optionsData.callVolume,
        confidence: 70,
        keywords: [],
        trending: false
      };
    }
    
    // Calculate composite sentiment
    const composite = this.calculateCompositeSentiment({
      twitter: twitterData,
      reddit: redditData,
      news: newsData,
      cot: cotDataSent,
      options: optionsSentimentData || undefined
    });
    
    // Calculate Fear & Greed Index
    const fearGreed = this.calculateFearGreedIndex(
      Math.random() * 100, // volatility - would use real data
      Math.random() * 100, // momentum - would use real data
      optionsSentiment?.putCallRatio || 1,
      twitterSent.sentimentScore,
      50 // surveys - would use real data
    );
    
    // Generate signal
    const signal = this.getSentimentSignal(composite, fearGreed);
    
    // Convert to trade setups
    const setups: TradeSetup[] = [];
    if (signal.signal !== "Neutral" && signal.strength > 60) {
      const currentPrice = 100; // Would use real price
      setups.push({
        id: `sentiment-${signal.signal.toLowerCase()}-${Date.now()}`,
        symbol,
        direction: signal.signal === "Bullish" ? "Bullish" : "Bearish",
        entryPrice: currentPrice,
        stopLoss: currentPrice * (signal.signal === "Bullish" ? 0.95 : 1.05),
        takeProfits: [
          currentPrice * (signal.signal === "Bullish" ? 1.05 : 0.95),
          currentPrice * (signal.signal === "Bullish" ? 1.1 : 0.9)
        ],
        riskReward: 2,
        confidence: signal.strength,
        reasoning: `Sentiment ${signal.signal}: ${signal.description}`,
        killZone: "Sentiment Signal",
        timestamp: Date.now()
      });
    }
    
    return {
      composite,
      fearGreed,
      optionsSentiment,
      signal,
      setups
    };
  }
}

// ============================================================================
// SENTIMENT INDICATOR INTEGRATION
// ============================================================================

/**
 * Get sentiment indicators for charts
 */
export function getSentimentIndicators(
  composite: CompositeSentiment,
  fearGreed: FearGreedIndex
): IndicatorSignal[] {
  const signals: IndicatorSignal[] = [];
  
  // Composite Sentiment
  signals.push({
    indicator: "Composite Sentiment",
    signal: composite.sentiment.includes("Fear") ? "Bearish" :
            composite.sentiment.includes("Greed") ? "Bullish" : "Neutral",
    strength: Math.abs(composite.overall) / 1.5,
    value: `${composite.overall}`,
    description: `Sentiment: ${composite.sentiment} (${composite.trend})`
  });
  
  // Fear & Greed
  signals.push({
    indicator: "Fear & Greed Index",
    signal: fearGreed.value < 40 ? "Bearish" :
            fearGreed.value > 60 ? "Bullish" : "Neutral",
    strength: Math.abs(fearGreed.value - 50) * 2,
    value: `${fearGreed.value} (${fearGreed.label})`,
    description: `Index: ${fearGreed.label}`
  });
  
  // Momentum
  signals.push({
    indicator: "Sentiment Momentum",
    signal: composite.momentum > 0 ? "Bullish" :
            composite.momentum < 0 ? "Bearish" : "Neutral",
    strength: Math.abs(composite.momentum),
    value: `${composite.momentum}`,
    description: `Trend: ${composite.trend}`
  });
  
  return signals;
}
