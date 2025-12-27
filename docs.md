# Apex Trading Platform: Technical Architecture & Feature Guide

Apex is an enterprise-grade trading command center designed with a focus on real-time market simulation, advanced technical analysis, AI-driven intelligence (Gemini), and robust risk governance.

---

## 1. Core Tech Stack
- **Frontend Framework**: React 18.3 with TypeScript.
- **Styling**: Tailwind CSS with a custom design system (shadcn/ui style).
- **Icons**: Lucide-React.
- **Data Visualization**: 
  - `lightweight-charts`: High-performance financial candlestick charts.
  - `recharts`: Portfolio performance and analytics charts.
- **AI Engine**: Google Gemini API (`gemini-3-flash-preview`).
- **Data Orchestration**: TanStack Query (fetching) and custom Service classes (domain logic).

---

## 2. Project Architecture

The project follows a modular "Service-API-Component" architecture:

### A. API Layer (`/api`)
Acts as a RESTful abstraction layer. Even though data is currently simulated, this layer uses `apiClient` to mimic network latency and standard HTTP patterns (`get`, `post`, `delete`).
- `marketApi`: Handles quotes and historical OHLCV data.
- `aiApi`: Interfaces with Google Gemini for real-time chat and pattern scans.
- `portfolioApi`: Manages positions and performance metrics.

### B. Service Layer (`/services`)
Contains the "Brain" of the application. These are pure TypeScript classes/objects handling complex logic:
- `TechnicalIndicatorService`: Mathematics for SMA, EMA, RSI, MACD, Bollinger Bands, ATR, VWAP, and MFI.
- `AIIntelligenceService`: Simulates advanced "Smart Money Concepts" (SMC) and sentiment pulse.
- `PatternRecognitionService`: Detects candlestick patterns (Doji, Hammer, Engulfing).
- `RiskManagementService`: Calculates VaR (Value at Risk), Sharpe Ratio, and Drawdown.
- `WebSocketService`: A mock pub/sub engine that pushes real-time price updates to components via subscribers.

### C. Components & Pages
- **Primitives (`/components/ui`)**: Low-level accessible components built on Radix UI.
- **Domain Components**: `CandlestickChart` (interactive canvas-based chart), `WatchlistTable` (real-time data grid).
- **Pages**: Top-level views mapping to the application routes.

---

## 3. Key Features Deep Dive

### High-Performance Charting (`/charts`)
The `CandlestickChart.tsx` is the most complex component. It:
- Uses `lightweight-charts` for canvas-level rendering performance.
- Supports dynamic indicators (SMA, EMA, RSI, BB, MACD).
- Implements a custom tooltip system.
- Listens to the `wsService` for sub-second price updates.

### AI Intelligence Lab (`/trading-intelligence`)
A unique feature that merges data science with LLMs:
- **Confluence Analysis**: Aggregates RSI, Moving Averages, and AI Pattern Scans into a single "Consensus Score."
- **PineScript Lab**: A simulated environment where users can write strategy logic and receive backtest results.
- **Apex AI Assistant**: A persistent sidebar chat powered by Gemini, specialized in financial analysis.

### Smart Money Concepts (SMC)
Unlike standard retail tools, Apex includes logic for:
- **Fair Value Gaps (FVG)**
- **Liquidity Pools** (Buy-side/Sell-side)
- **Breaker Blocks**
- **Silver Bullet** algorithmic windows.

### Risk Governance (`/risk`)
Focuses on institutional-level safety:
- **VaR (Value at Risk)** calculation.
- **Position Sizing**: Methods like Kelly Criterion or Volatility-adjusted sizing.
- **Safety Scores**: Real-time evaluation of portfolio health.

---

## 4. Rebuilding Guide

### Step 1: Design System
Start by implementing the `index.html` tailwind configuration. The theme uses a "Luxury Dark/Amber" palette:
- Primary: `hsl(40 94% 55%)` (Amber Gold)
- Background: `hsl(218 25% 8%)` (Deep Charcoal)

### Step 2: Establish the Mock Data Flow
Implement `MarketDataService` first. Everything in the app flows from the historical data generator. Ensure the `OHLCV` type is strictly adhered to across indicators.

### Step 3: Implement the Chart
Integrate `lightweight-charts`. The trick to a "pro" look is disabling vertical/horizontal grid lines and using a transparent layout background with `hsl(var(--card))` for the surrounding container.

### Step 4: AI Connectivity
Use the `@google/genai` SDK. Ensure you set up a robust `systemInstruction` in `aiApi.ts` to keep the model focused on trading.

### Step 5: Real-time Pub/Sub
Create the `WebSocketService` using `setInterval` or `requestAnimationFrame`. Any component needing live data should `subscribe` on mount and `unsubscribe` on unmount to prevent memory leaks.

---

## 5. Directory Structure
```text
/
├── api/          # RESTful abstraction layer
├── components/   
│   ├── AI/       # Gemini chat UI
│   ├── Charts/   # Lightweight-charts integration
│   ├── Layout/   # Sidebar, Header
│   ├── ui/       # Radix UI primitives
│   └── Watchlist/# Real-time tables
├── pages/        # Route-level views
├── services/     # Pure business logic & math
├── types.ts      # Global interfaces
└── App.tsx       # Routing and providers
```

---

## 6. Important Architectural Notes
- **State Management**: The app uses a mix of LocalState for UI and the Service pattern for data. For a production rebuild, integrating **Redux Toolkit** or **Zustand** would be the next step for syncing portfolio state across pages.
- **Theme Support**: Built-in support for Light/Dark modes via `next-themes`.
- **Latency Simulation**: All API calls have an intentional delay (`400ms-600ms`) to provide visual feedback (loaders/skeletons) to the user.
