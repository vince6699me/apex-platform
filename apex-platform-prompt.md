# Apex-Platform Trading System - Project Prompt

*A comprehensive AI-powered trading platform with multi-strategy analysis capabilities*

---

## Project Overview

**Apex-Platform** is a production-ready trading intelligence system that combines multiple trading strategies into a unified analysis platform. It provides real-time market analysis, trade setup generation, and portfolio management through an intelligent AI interface.

**Key Value Proposition:**
- Multi-strategy analysis (SMC + COT + Sentiment + Arbitrage)
- AI-powered trade setup generation
- Real-time market data integration
- Comprehensive backtesting capabilities
- Professional-grade UI dashboard

---

## Technology Stack

### Core Technologies
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design system
- **Charts:** Recharts for data visualization
- **Icons:** Lucide React
- **State Management:** React hooks with context

### External APIs (Production)
- **Market Data:** Polygon.io (stock data), AlphaVantage (quotes)
- **News:** NewsAPI for market news
- **Social:** Twitter/X API v2 for sentiment analysis
- **Trading:** CLOB API for order execution

---

## Project Structure

```
apex-platform/
├── api/                    # Backend API routes
├── components/
│   ├── AI/                # AI-related components
│   ├── Charts/            # Chart overlays and visualizations
│   ├── Dashboard/          # Dashboard panels
│   ├── Layout/             # Layout components
│   ├── providers/          # React context providers
│   ├── ui/                 # Base UI components
│   └── Watchlist/          # Watchlist components
├── services/               # Business logic services
├── types.ts               # TypeScript type definitions
├── App.tsx                # Main application component
├── index.css              # Global styles
└── index.html            # Entry HTML file
```

---

## Core Services

### 1. SMC Analysis Service (`smcAnalysis.ts`)

**Purpose:** Implements Smart Money Concepts trading methodology

**Key Features:**
- Order Block detection (bullish/bearish)
- Fair Value Gap (FVG) identification
- Liquidity zone analysis
- Market structure detection (BOS/CHOCH/MSS)
- Premium/Discount zone calculation
- Optimal Trade Entry (OTE) analysis

**Key Functions:**
```typescript
detectOrderBlocks(candles): OrderBlock[]
detectFVGs(candles): FairValueGap[]
detectLiquidityZones(candles): LiquidityZone[]
detectBOS(candles): BreakOfStructure[]
calculatePremiumDiscount(candles, currentPrice)
runSMCAnalysis(candles, currentPrice)
```

---

### 2. SMC Indicators Service (`smcIndicators.ts`)

**Purpose:** Technical indicator calculations for SMC analysis

**Key Features:**
- Swing point detection
- Order block quality scoring
- FVG strength assessment
- Market bias determination
- Pattern recognition

**Key Functions:**
```typescript
identifySwingPoints(candles): SwingPoint[]
assessOrderBlockQuality(ob, candles)
calculateFVGFillProbability(fvg, candles)
determineMarketBias(candles)
```

---

### 3. Kill Zone Service (`killZoneService.ts`)

**Purpose:** Trading session timing and session management

**Key Features:**
- Real-time session detection (Asian, London, NY sessions)
- Best trading pair suggestions per session
- Session schedule visualization
- Time until next session calculation

**Sessions Tracked:**
```typescript
interface KillZone {
  name: string;
  start: string;  // HH:mm EST
  end: string;
  bestPairs: string[];
  characteristics: string;
}
```

**Active Sessions:**
- Asian Kill Zone (21:00-04:00 EST)
- London Kill Zone (03:00-05:00 EST)
- London Open Kill Zone (02:50-04:00 EST)
- New York Kill Zone (08:00-12:00 EST)
- London Close Kill Zone (10:30-11:00 EST)

---

### 4. COT Analysis Service (`cotAnalysis.ts`)

**Purpose:** Commitment of Traders data analysis

**Key Features:**
- Commercial trader positioning (Smart Money)
- Large speculator tracking
- Historical context and percentile analysis
- Sentiment extremes identification
- Contrarian trade setups
- Divergence detection

**Key Functions:**
```typescript
getCOTData(symbol): COTData
analyzeCOT(cotData): COTAnalysis
analyzePosition(netPosition, longCount, shortCount, totalOI)
analyzeSentiment(commercialPosition, largeSpecPosition)
generateTradeSetups(commercial, largeSpec, sentiment)
detectDivergence(commercial, largeSpec, priceAction)
```

**Trade Strategies:**
1. **Fade Large Specs (Contrarian):** When specs are extreme, look for reversals
2. **Follow Commercials (Smart Money):** Trade in direction of commercials

---

### 5. Arbitrage Service (`arbitrageService.ts`)

**Purpose:** Multi-market arbitrage opportunity detection

**Key Features:**
- Spatial arbitrage (exchange price differences)
- Triangular arbitrage (currency pairs)
- Statistical arbitrage (correlation-based)
- Execution risk calculation
- Position sizing recommendations

**Key Functions:**
```typescript
findSpatialArbitrage(prices): ArbitrageOpportunity[]
findTriangularArbitrage(rates): TriangularOpportunity[]
findStatisticalArbitrage(prices, correlations)
estimateMaxPosition(opportunity, accountBalance)
isArbitrageOpportunityValid(opportunity, currentPrices)
convertToTradeSetups(opportunities)
```

**Configuration:**
```typescript
const ARBITRAGE_CONFIG = {
  minSpreadPercent: 0.1,
  maxExecutionTime: 5000,
  feePercent: 0.1,
  slippagePercent: 0.05,
  minProfitPercent: 0.05,
  maxPositionSize: 10000
};
```

---

### 6. Enhanced Sentiment Service (`enhancedSentiment.ts`)

**Purpose:** Multi-source sentiment aggregation

**Key Features:**
- Composite sentiment calculation (weighted average)
- Fear & Greed Index calculation
- Options market sentiment (put/call ratios)
- Social media sentiment (Twitter/Reddit)
- News sentiment analysis
- Divergence detection

**Key Functions:**
```typescript
calculateFearGreedIndex(volatility, momentum, callPutRatio, socialSentiment, surveys)
analyzeOptionsSentiment(putVolume, callVolume, historicalRatios)
analyzeTextSentiment(texts)
calculateCompositeSentiment(sources)
detectSentimentDivergence(sources)
getSentimentSignal(composite, fearGreed)
runSentimentAnalysis(symbol, tweets, redditPosts, newsHeadlines)
```

**Weight Configuration:**
```typescript
SENTIMENT_WEIGHTS = {
  twitter: 0.15,
  reddit: 0.1,
  news: 0.2,
  cot: 0.35,
  options: 0.2
};
```

---

### 7. AI Intelligence Service (`aiIntelligence.ts`)

**Purpose:** Unified analysis orchestration

**Key Features:**
- Multi-strategy signal generation
- Comprehensive trade setup production
- Market scanning across all strategies
- Special pattern detection (Silver Bullet, Judas Swing, Power of 3)

**Key Functions:**
```typescript
// Individual Analysis
analyzeWithSMC(symbol): SMCAnalysis
analyzeWithCOT(symbol): COTAnalysis
analyzeSentiment(symbol): SentimentAnalysis
analyzeArbitrage(symbol): ArbitrageAnalysis

// Comprehensive Analysis
analyzeAllStrategies(symbol): AllStrategiesAnalysis
scanAllStrategies(symbols[]): ScanResults
generateComprehensiveSignal(...)

# Trade Setup Generation
generateTradeSetups(symbol, analysis, currentPrice)

# Special Patterns
detectSilverBullet(symbol)
detectJudasSwing(symbol)
analyzePowerOf3(symbol)
```

---

### 8. Trade Logger Service (`tradeLogger.ts`)

**Purpose:** Trade tracking and performance analysis

**Key Features:**
- Full trade lifecycle logging
- SMC context tagging
- Performance metrics calculation
- Journal entries with lessons learned
- CSV export/import
- Position sizing calculator

**Metrics Tracked:**
- Win rate, Profit Factor
- Sharpe/Sortino ratios
- Max Drawdown
- Average Win/Loss
- Trade duration
- Setup performance by strategy

---

### 9. Backtest Engine (`smcBacktest.ts`)

**Purpose:** Strategy backtesting on historical data

**Key Features:**
- Configurable backtest parameters
- Multiple strategy presets (Conservative, Balanced, Aggressive)
- Comprehensive result metrics
- Equity curve generation
- Monthly return breakdown
- Trade-by-trade analysis

**Backtest Parameters:**
```typescript
interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  timeframe: string;
  initialBalance: number;
  riskPercent: number;
  strategy: "conservative" | "balanced" | "aggressive";
  maxPositions: number;
  stopLoss: number;
  takeProfit: number;
}
```

---

### 10. Additional Services

| Service | Purpose |
|---------|---------|
| `marketData.ts` | Polygon.io and AlphaVantage API integration |
| `newsService.ts` | NewsAPI for market news aggregation |
| `socialSentiment.ts` | Twitter/Reddit sentiment extraction |
| `multiAssetData.ts` | Multi-asset market data handling |
| `multiTimeframeAnalysis.ts` | Multi-timeframe trend analysis |
| `riskManagement.ts` | Position sizing and risk calculation |
| `patternRecognition.ts` | Candlestick and chart pattern detection |
| `technicalIndicators.ts` | RSI, MACD, Bollinger Bands, etc. |
| `websocketService.ts` | Real-time price updates |

---

## UI Components

### Dashboard Components

| Component | Features |
|-----------|----------|
| `SMCPanel.tsx` | Real-time SMC dashboard with OB, FVG, liquidity displays |
| `COTPanel.tsx` | COT position bars, historical context, trade setups |
| `SentimentPanel.tsx` | Fear/Greed gauge, source breakdown, divergence alerts |
| `ArbitragePanel.tsx` | Tabbed view for spatial/triangular/statistical arbitrage |
| `AllStrategiesDashboard.tsx` | Unified dashboard with all-strategy overview |
| `BacktesterPanel.tsx` | Backtest configuration and results display |

### Chart Components

| Component | Features |
|-----------|----------|
| `SMCOverlays.tsx` | Order Block, FVG, Liquidity visual overlays |
| `ChartComponents` | Price charts with technical indicators |

### Base UI Components

- `Card` - Container with styling variants
- `Badge` - Status indicators with color variants
- `Button` - Action buttons with states
- `Input` - Form inputs
- `Select` - Dropdown selections
- `Table` - Data tables
- `Tabs` - Tab navigation
- `Modal` - Dialog overlays

---

## Type Definitions (`types.ts`)

### Core Types

```typescript
// Market Data
interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// SMC Types
interface OrderBlock {
  id: string;
  type: "bullish" | "bearish";
  startIndex: number;
  endIndex: number;
  priceHigh: number;
  priceLow: number;
  quality: "high" | "medium" | "low";
  invalidationPrice: number;
}

interface FairValueGap {
  id: string;
  type: "bullish" | "bearish";
  index: number;
  high: number;
  low: number;
  size: number;
  mitigated: boolean;
  strength: "strong" | "medium" | "weak";
}

// Trade Setup
interface TradeSetup {
  id: string;
  symbol: string;
  direction: "Bullish" | "Bearish";
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  riskReward: number;
  confidence: number;
  reasoning: string;
  killZone: string;
  premiumDiscount: string;
  timestamp: number;
}

// Risk Management
interface RiskMetrics {
  valueAtRisk95: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
}
```

---

## Key Features

### 1. Real-Time Analysis
- Live market data from Polygon.io
- Real-time kill zone tracking
- Instant setup generation
- Auto-refresh capability

### 2. Multi-Strategy Approach
- SMC (Order Blocks, FVGs, Liquidity)
- COT (Commercial positioning)
- Sentiment (Composite, Fear/Greed)
- Arbitrage (Multi-exchange)

### 3. Trade Setup Generation
- Automated entry/exit levels
- Risk/Reward calculations
- Confidence scoring
- Kill zone filtering

### 4. Backtesting
- Historical strategy testing
- Multiple parameter presets
- Detailed performance metrics
- Export capabilities

### 5. Portfolio Management
- Trade logging with SMC context
- Performance tracking
- Risk assessment
- Journal entries

---

## API Integration

### Production APIs

| Service | Provider | Purpose |
|---------|----------|---------|
| Stock Data | Polygon.io | OHLCV candles |
| Quotes | AlphaVantage | Real-time prices |
| News | NewsAPI | Market news |
| Social | Twitter API v2 | Sentiment |

### Example Configuration

```typescript
// .env.local
VITE_POLYGON_API_KEY=your_polygon_key
VITE_ALPHA_VANTAGE_KEY=your_alpha_key
VITE_NEWS_API_KEY=your_news_key
VITE_TWITTER_BEARER_TOKEN=your_bearer_token
```

---

## Usage Examples

### Basic Analysis

```typescript
import { AIIntelligenceService } from "./services/aiIntelligence";

// Single strategy analysis
const smc = await AIIntelligenceService.analyzeWithSMC("AAPL");

// All strategies combined
const allAnalysis = await AIIntelligenceService.analyzeAllStrategies("BTC");

// Market scanning
const scan = await AIIntelligenceService.scanAllStrategies(["AAPL", "TSLA", "NVDA"]);
```

### COT Analysis

```typescript
import { COTAnalysisService } from "./services/cotAnalysis";

const cotData = await COTAnalysisService.getCOTData("AAPL");
const analysis = COTAnalysisService.analyzeCOT(cotData);
const signal = COTAnalysisService.getCOTSignal(cotData);
```

### Sentiment Analysis

```typescript
import { EnhancedSentimentService } from "./services/enhancedSentiment";

const sentiment = await EnhancedSentimentService.runSentimentAnalysis(
  "AAPL",
  tweets,       // Array of tweet texts
  redditPosts,  // Array of Reddit posts
  newsHeadlines // Array of news headlines
);
```

### Arbitrage Scanning

```typescript
import { ArbitrageService } from "./services/arbitrageService";

const prices = new Map(); // Fetch from exchanges
const opportunities = ArbitrageService.findSpatialArbitrage(prices);
const setups = ArbitrageService.convertToTradeSetups(opportunities);
```

---

## Extending the Platform

### Adding New Strategies

1. **Create Service:** `services/newStrategy.ts`
2. **Define Types:** Add interfaces to `types.ts`
3. **Implement Functions:**
   - `analyze()` - Main analysis logic
   - `generateSetups()` - Trade setup creation
   - `getSignal()` - Signal generation
4. **Integrate:** Add to `aiIntelligence.ts` in `analyzeAllStrategies()`
5. **Create UI:** Add dashboard panel in `components/Dashboard/`

### Adding New Data Sources

1. **Market Data:** Update `marketData.ts`
2. **Sentiment:** Update `socialSentiment.ts` or `enhancedSentiment.ts`
3. **News:** Update `newsService.ts`

### Customizing UI

- **Theme:** Modify `index.css` with custom Tailwind config
- **Components:** Extend base UI in `components/ui/`
- **Dashboard:** Create new panels in `components/Dashboard/`

---

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

---

## Production Deployment

### Build Process
```bash
npm run build
# Output to dist/ directory
```

### Environment Variables
- Configure API keys in `.env.local`
- Update `vite.config.ts` for deployment settings

### Recommended Hosting
- Vercel (frontend)
- Netlify (frontend)
- Cloudflare Pages (frontend)

---

## Performance Considerations

### Optimization Tips
1. **Memoize** expensive calculations with `useMemo()`
2. **Lazy load** dashboard panels with `React.lazy()`
3. **Cache** API responses where appropriate
4. **Debounce** user input for search
5. **Paginate** large data sets

### Monitoring
- Track API call frequency (rate limits)
- Monitor bundle size
- Profile rendering performance

---

## Security Notes

### API Key Management
- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly

### Data Validation
- Validate all external data
- Sanitize user inputs
- Use TypeScript strict mode

---

## Summary

Apex-Platform is a comprehensive trading intelligence system that combines multiple trading strategies (SMC, COT, Sentiment, Arbitrage) into a unified AI-powered analysis platform. The modular architecture allows easy extension while providing production-ready features including real-time analysis, backtesting, trade logging, and professional dashboards.

**To use:** Run `npm install && npm run dev` to start the development server.

---

*Generated: 2025-02-11*
*Version: 1.0.0*
*Platform: Apex-Platform Trading System*
