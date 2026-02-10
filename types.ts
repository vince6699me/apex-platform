
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

// ============================================================================
// SMC (Smart Money Concepts) Types
// ============================================================================

export interface OrderBlock {
  /** Type of order block */
  type: "Bullish" | "Bearish";
  /** Candle index where order block starts */
  startIndex: number;
  /** Candle index where order block ends */
  endIndex: number;
  /** High price of the order block zone */
  high: number;
  /** Low price of the order block zone */
  low: number;
  /** Quality ranking based on confluence */
  quality: "High" | "Medium" | "Low";
  /** Position relative to move */
  discountPremium: "Discount" | "Premium" | "Equilibrium";
  /** Whether FVG exists within/below/above */
  hasFVG: boolean;
  /** Whether liquidity is nearby */
  hasLiquidity: boolean;
  /** Timestamp for reference */
  timestamp: number;
}

export interface FairValueGap {
  /** Type of FVG */
  type: "Bullish" | "Bearish";
  /** Candle index where FVG starts */
  startIndex: number;
  /** Candle index where FVG ends */
  endIndex: number;
  /** High price (for bullish) or low price (for bearish) */
  priceLevel: number;
  /** Gap size in pips/points */
  size: number;
  /** Strength ranking */
  strength: "Strong" | "Medium" | "Weak";
  /** Whether price has returned to fill this gap */
  mitigated: boolean;
  /** Mitigation price if mitigated */
  mitigationPrice?: number;
  /** Timestamp */
  timestamp: number;
}

export interface LiquidityZone {
  /** Type of liquidity */
  type: "SwingHigh" | "SwingLow" | "RoundNumber" | "FractalHigh" | "FractalLow" | "DayHigh" | "DayLow" | "WeekHigh" | "WeekLow";
  /** Price level */
  price: number;
  /** Strength based on touches */
  strength: number;
  /** Number of times tested */
  grabCount: number;
  /** Whether liquidity has been grabbed */
  grabbed: boolean;
  /** Timestamp of last test */
  lastTested: number;
}

export interface BreakOfStructure {
  /** Direction of BOS */
  type: "Bullish" | "Bearish";
  /** Index where BOS occurred */
  index: number;
  /** Price level of BOS */
  price: number;
  /** Previous swing point */
  previousSwing: number;
  /** Confidence level */
  confidence: number;
  /** Whether this confirmed trend continuation */
  trendContinuation: boolean;
}

export interface ChangeOfCharacter {
  /** Direction of CHOCH */
  type: "Bullish" | "Bearish";
  /** Index where CHOCH occurred */
  index: number;
  /** Price level */
  price: number;
  /** Supply/Demand zone that was broken */
  zoneType: "Supply" | "Demand";
  /** Confidence level */
  confidence: number;
  /** Indicates potential trend reversal */
  reversalSignal: boolean;
}

export interface MarketStructureShift {
  /** Direction of MSS */
  type: "Bullish" | "Bearish";
  /** Index where MSS occurred */
  index: number;
  /** Price level */
  price: number;
  /** Extreme zone that was broken */
  zoneType: "Demand" | "Supply";
  /** Confidence level */
  confidence: number;
}

export interface PremiumDiscountResult {
  position: "Premium" | "Discount" | "Equilibrium";
  percentage: number;
  entryPrice: number;
  moveOrigin: number;
  moveExtreme: number;
  description: string;
}

export interface OTEResult {
  entryPrice: number;
  fibLevel: number;
  zoneDescription: string;
  riskRewardFavorable: boolean;
}

export interface SMCAnalysis {
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquidityZones: LiquidityZone[];
  bos: BreakOfStructure[];
  choch?: ChangeOfCharacter;
  mss?: MarketStructureShift;
  currentBias: "Bullish" | "Bearish" | "Neutral";
  trendStrength: number;
  premiumDiscount: PremiumDiscountResult;
  optimalEntry?: OTEResult;
}

// ============================================================================
// Kill Zone Types
// ============================================================================

export interface KillZone {
  /** Name of the kill zone */
  name: string;
  /** Start hour in EST (0-23) */
  startHour: number;
  /** End hour in EST (0-23) */
  endHour: number;
  /** Array of recommended pairs */
  pairs: string[];
  /** Description of what this zone is best for */
  bestFor: string;
  /** Volatility level */
  volatility: "Low" | "Medium" | "High";
  /** Typical trading direction bias */
  directionBias: "Long" | "Short" | "Neutral" | "Mixed";
}

export interface ActiveKillZone {
  /** Current active zone */
  zone: KillZone | null;
  /** Time remaining in zone (minutes) */
  timeRemaining: number;
  /** Whether we're in the zone */
  isActive: boolean;
  /** Current hour in EST */
  currentHour: number;
}

// ============================================================================
// Trade Execution Types
// ============================================================================

export interface TradeSetup {
  /** Unique ID for the setup */
  id: string;
  /** Symbol being traded */
  symbol: string;
  /** Direction of the trade */
  direction: "Bullish" | "Bearish";
  /** Entry zone price */
  entryPrice: number;
  /** Stop loss price */
  stopLoss: number;
  /** Take profit levels */
  takeProfits: number[];
  /** Risk/Reward ratio */
  riskReward: number;
  /** Order block if applicable */
  orderBlock?: OrderBlock;
  /** FVG if applicable */
  fvg?: FairValueGap;
  /** Liquidity zone if applicable */
  liquidityZone?: LiquidityZone;
  /** Kill zone name */
  killZone: string;
  /** Confidence score */
  confidence: number;
  /** Premium/Discount status */
  premiumDiscount: "Premium" | "Discount" | "Equilibrium";
  /** OTE level if applicable */
  ote?: number;
  /** Timestamp of setup */
  timestamp: number;
}

export interface TradeSignal {
  /** Signal ID */
  id: string;
  /** Type of signal */
  type: "SMC" | "Technical" | "AI" | "Sentiment";
  /** Signal name */
  name: string;
  /** Description */
  description: string;
  /** Bias direction */
  bias: SignalDirection;
  /** Strength 0-100 */
  strength: number;
  /** Timeframe */
  timeframe: string;
  /** Symbol */
  symbol: string;
  /** Created at */
  createdAt: number;
}

// ============================================================================
// MULTI-ASSET TYPES
// ============================================================================

export type AssetClass = "forex" | "crypto" | "commodity" | "index" | "stock";

export interface AssetConfig {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  baseCurrency?: string;
  quoteCurrency?: string;
  enabled: boolean;
}

export interface MultiAssetQuote extends Quote {
  assetClass: AssetClass;
  bid?: number;
  ask?: number;
  spread?: number;
  dailyChange?: number;
  dailyChangePercent?: number;
  volume24h?: string;
  marketCap?: string;
}

export interface MultiAssetHistory extends OHLCV {
  volume?: number;
  turnover?: number;
}

export interface WatchlistItemMulti extends WatchlistItem {
  assetClass: AssetClass;
  bid?: number;
  ask?: number;
  spread?: number;
  dailyChangePercent: number;
}

// ============================================================================
// NEWS TYPES
// ============================================================================

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  url?: string;
  description?: string;
  author?: string;
  category?: string;
  timestamp: number;
  sentiment: number; // -1 to 1
  relevance?: number; // 0 to 1
}

export interface NewsSource {
  id: string;
  name: string;
  category: "general" | "crypto" | "forex" | "commodity" | "stock";
  url?: string;
  enabled: boolean;
}

export interface NewsFilter {
  categories?: string[];
  sources?: string[];
  keywords?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  sentiment?: "positive" | "negative" | "all";
  limit?: number;
}

export interface NewsSentiment {
  overall: number; // -1 to 1
  bullish: number; // count
  bearish: number; // count
  neutral: number; // count
  topStories: NewsArticle[];
}

export interface EconomicEvent {
  id: string;
  event: string;
  country: string;
  currency?: string;
  impact: "High" | "Medium" | "Low";
  time: string; // ISO time
  forecast?: string;
  previous?: string;
  actual?: string;
}

export interface EconomicCalendar {
  date: string;
  events: EconomicEvent[];
}

// ============================================================================
// SOCIAL SENTIMENT TYPES
// ============================================================================

export interface Tweet {
  id: string;
  text: string;
  author: string;
  username: string;
  followers: number;
  following?: number;
  timestamp: number;
  sentiment: number; // -1 to 1
  engagement: number; // likes + retweets + replies
  url?: string;
}

export interface RedditPost {
  id: string;
  title: string;
  body?: string;
  subreddit: string;
  author: string;
  upvotes: number;
  comments: number;
  timestamp: number;
  sentiment: number; // -1 to 1
  url?: string;
}

export interface SocialSentiment {
  twitter: {
    overall: number;
    label: "Bullish" | "Bearish" | "Neutral";
    tweetCount: number;
    topTweet?: Tweet;
  };
  reddit: {
    subreddits: {
      name: string;
      score: number;
      postCount: number;
    }[];
    overall: number;
    label: "Bullish" | "Bearish" | "Neutral";
    topPost?: RedditPost;
  };
  combined: {
    score: number;
    label: "Bullish" | "Bearish" | "Neutral";
    confidence: number;
  };
}

export interface TrendingTag {
  tag: string;
  volume: number;
  sentiment?: number;
}

export interface SocialSearchResult {
  query: string;
  tweets: Tweet[];
  redditPosts: RedditPost[];
  overallSentiment: number;
  label: "Bullish" | "Bearish" | "Neutral";
}

export interface CryptoSentiment {
  overall: number;
  label: "Bullish" | "Bearish" | "Neutral";
  coins: {
    symbol: string;
    sentiment: number;
    mentions: number;
    trending: boolean;
  }[];
}

// ============================================================================
// BACKTEST TYPES (Already defined - ensure production ready)
// ============================================================================

export interface BacktestConfig {
  /** Initial capital for backtest */
  initialCapital: number;
  /** Position size as % of capital */
  positionSize: number;
  /** Risk per trade as % of capital */
  riskPercent: number;
  /** Maximum concurrent positions */
  maxPositions: number;
  /** Spread in pips/points */
  spread: number;
  /** Commission per trade */
  commission: number;
  /** Stop loss multiplier for OB sizing */
  slMultiplier: number;
  /** Take profit multiplier (R:R ratio) */
  tpMultiplier: number;
  /** Enable order block strategy */
  enableOB: boolean;
  /** Enable FVG strategy */
  enableFVG: boolean;
  /** Enable CHOCH strategy */
  enableCHOCH: boolean;
  /** Enable Premium/Discount strategy */
  enablePD: boolean;
  /** Filter by trend direction */
  trendFilter: boolean;
}

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
  holdingPeriod: number;
  smcContext?: {
    orderBlock?: any;
    fvg?: any;
    liquidity?: any;
    trend: string;
    structure: string;
    premiumDiscount: string;
  };
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  averageTradeDuration: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
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
}

// ============================================================================
// TRADE LOGGER TYPES (Already defined - ensure production ready)
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
  setup: string;
  timeframe: string;
  killZone?: string;
  orderBlockId?: string;
  fvgId?: string;
  liquidityZone?: string;
  
  // Market Context
  trend: "bullish" | "bearish" | "ranging";
  structure: string;
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
  trades?: string[];
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
