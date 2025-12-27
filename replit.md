# Apex Trading Platform

## Overview

Apex is an enterprise-grade trading command center built with React and TypeScript. It provides real-time market simulation, advanced technical analysis, AI-driven intelligence powered by Google Gemini, and risk management tools. The platform is designed as a single-page application with a modular service-oriented architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **React 18.3 with TypeScript** - Core UI framework
- **Vite** - Build tool and development server (port 5000)
- **HashRouter** - Client-side routing for SPA navigation

### Styling System
- **Tailwind CSS** - Utility-first CSS loaded via CDN
- **Custom design tokens** - HSL-based CSS variables for theming (light/dark mode)
- **shadcn/ui patterns** - Component primitives built on Radix UI

### State Management
- **TanStack Query** - Server state and data fetching
- **Local component state** - React useState for UI state
- **LocalStorage** - Persistence for user preferences and chat history

### Service-API-Component Architecture

The codebase follows a three-layer pattern:

1. **API Layer** (`/api`) - RESTful abstraction with simulated latency
   - `marketApi` - Stock quotes and historical OHLCV data
   - `aiApi` - Gemini AI chat integration
   - `portfolioApi` - Positions and performance metrics
   - `alertApi` - Price and technical alerts

2. **Service Layer** (`/services`) - Business logic and calculations
   - `TechnicalIndicatorService` - SMA, EMA, RSI, MACD, Bollinger Bands
   - `AIIntelligenceService` - Smart Money Concepts and pattern scanning
   - `PatternRecognitionService` - Candlestick pattern detection
   - `RiskManagementService` - VaR, Sharpe Ratio, position sizing
   - `WebSocketService` - Mock real-time price updates via pub/sub
   - `MarketDataService` - Data generation and external API calls

3. **Components** - React components organized by domain
   - UI primitives in `/components/ui/primitives.tsx`
   - Feature components in dedicated folders (Charts, AI, Layout, etc.)

### Data Visualization
- **lightweight-charts** - High-performance candlestick charting
- **recharts** - Portfolio analytics and area charts

### Path Aliases
- `@/*` maps to project root for clean imports

## External Dependencies

### AI Integration
- **Google Gemini API** (`@google/genai`) - Powers the AI assistant chat
- Model: `gemini-3-flash-preview`
- Requires `GEMINI_API_KEY` environment variable

### Market Data APIs (Optional)
- **Alpha Vantage** - Real-time stock quotes
  - Requires `ALPHA_VANTAGE_API_KEY` environment variable
- **Polygon.io** - Historical OHLCV data
  - Requires `POLYGON_API_KEY` environment variable
- Falls back to simulated data when API keys are not configured

### UI Component Libraries
- **Radix UI** - Accessible primitives (Dialog, Select, Switch, Tabs, Tooltip)
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **next-themes** - Theme switching (light/dark/system)

### Environment Variables
Set in `.env.local`:
```
GEMINI_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_key (optional)
POLYGON_API_KEY=your_key (optional)
```