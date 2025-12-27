
// Market
export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

export interface WatchlistItem extends Quote {
  name: string;
  rsi: number;
  macd: "Bullish" | "Bearish" | "Neutral";
  sma50: number;
  ema20: number;
}

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M";

// Risk
export interface RiskMetrics {
  valueAtRisk95: number;
  valueAtRisk99: number;
  conditionalVaR: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
  volatility: number;
}

export interface PositionSizing {
  method: "fixedFractional" | "volatility" | "kellyCriterion";
  accountSize: number;
  riskPercent: number;
  stopLoss: number;
  entryPrice: number;
  shares: number;
  positionSize: number;
  riskAmount: number;
}

export interface RiskAlert {
  level: "low" | "medium" | "high" | "extreme";
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export type RiskLevel = "Low" | "Medium" | "High" | "Extreme";

// Indicators
export interface IndicatorValue {
  timestamp: number;
  value: number;
}

export interface MACDResult {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsResult {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface IndicatorSignal {
  indicator: string;
  signal: "Bullish" | "Bearish" | "Neutral";
  strength: number; // 0-100
  value?: number;
  description: string;
}

export interface MultiTimeframeAnalysis {
  timeframe: string;
  trend: "Bullish" | "Bearish" | "Neutral";
  signals: IndicatorSignal[];
  overallStrength: number;
  confidence: number;
}

// Patterns
export type CandlestickPattern = "Doji" | "Hammer" | "InvertedHammer" | "BullishEngulfing" | "BearishEngulfing" | "MorningStar" | "EveningStar";
export type ChartPattern = "HeadAndShoulders" | "DoubleTop" | "DoubleBottom";

export interface PatternDetection {
  pattern: CandlestickPattern | ChartPattern;
  type: "candlestick" | "chart";
  timestamp: number;
  confidence: number;
  direction: "Bullish" | "Bearish" | "Neutral";
  description: string;
  priceLevel?: number;
}

export interface SupportResistanceLevel {
  price: number;
  strength: number;
  touches: number;
  type: "support" | "resistance";
  lastTested: number;
  volume: number;
}

// AI
export type SignalDirection = "Bullish" | "Bearish" | "Neutral";
export type AlertSeverity = "info" | "warning" | "critical";

export interface PatternScanResult {
  symbol: string;
  direction: SignalDirection;
  score: number;
  confidence: number;
  patterns: string[];
  lastUpdated: string;
}

export interface NewsHeadline {
  id: string;
  headline: string;
  source: string;
  timestamp: number;
  sentiment: number;
}

export interface SentimentSignal {
  source: string;
  message: string;
  score: number;
}

export interface SentimentInsight {
  symbol: string;
  name: string;
  sentimentLabel: SignalDirection;
  change: number;
  signalCount: number;
  signals: SentimentSignal[];
}

export interface AnomalyAlert {
  id: string;
  symbol: string;
  name: string;
  type: string;
  severity: AlertSeverity;
  description: string;
  changePercent: number;
  timestamp: number;
}

export interface SmartMoneyPattern {
  id: string;
  symbol: string;
  concept: string;
  bias: SignalDirection;
  timeframe: string;
  confidence: number;
  zone: string;
  description: string;
  retested: string;
}

// Trading Intelligence
export interface TechnicalBias {
  bias: SignalDirection;
  rsiState: string;
  sma20: number;
  sma50: number;
  ema20: number;
}

export interface ConfluenceAnalysis {
  symbol: string;
  spotPrice: number;
  atr: number;
  consensusScore: number;
  technicalBias: TechnicalBias;
  aiPatternScan: {
    bias: SignalDirection;
    score: number;
    patterns: { name: string; bias: SignalDirection }[];
  };
  summary: {
    sentiment: { bias: SignalDirection; score: number };
    anomalies: number;
    smcSetups: number;
  };
}

export interface PrioritySignal {
  id: string;
  type: string;
  title: string;
  bias?: SignalDirection;
  edge: number;
  description: string;
  subtitle?: string;
}

// Expanded for Detailed Technical Analysis
export interface DetailedTimeframeData {
  timeframe: string;
  bias: SignalDirection;
  strength: number;
  confidence: number;
  keySignals: {
    name: string;
    value: number;
    bias?: SignalDirection;
  }[];
}

export interface DetailedConsensusAnalysis {
  symbol: string;
  overallBias: SignalDirection;
  overallStrength: number;
  timeframeAgreement: string;
  conflicts: number;
  conflictDescription: string;
  timeframes: DetailedTimeframeData[];
}
