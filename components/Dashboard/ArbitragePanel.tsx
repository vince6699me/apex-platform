/**
 * Arbitrage Dashboard Panel
 * 
 * Displays arbitrage opportunities including:
 * - Spatial arbitrage (price differences between exchanges)
 * - Triangular arbitrage (forex/crypto)
 * - Statistical arbitrage (correlation-based)
 * - Opportunity summary and statistics
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/primitives";
import { Badge } from "../../components/ui/primitives";
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Activity,
  Target,
  Globe,
  BarChart3,
  ArrowRight,
  Clock
} from "lucide-react";
import {
  ArbitrageService,
  ArbitrageOpportunity,
  TriangularArbitrageOpportunity,
  CorrelationPair
} from "../../services/arbitrageService";

// ============================================================================
// ARBITRAGE BADGES
// ============================================================================

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    spatial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    triangular: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    statistical: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    merger: "bg-green-500/20 text-green-400 border-green-500/30"
  };
  
  const labels: Record<string, string> = {
    spatial: "Spatial",
    triangular: "Triangular",
    statistical: "Statistical",
    merger: "Merger"
  };
  
  return (
    <Badge className={`${colors[type] || colors.spatial} border px-2 py-1`}>
      {labels[type] || type}
    </Badge>
  );
}

function ProfitBadge({ percent }: { percent: number }) {
  const color = percent > 0.5 ? "bg-green-500/20 text-green-400" :
               percent > 0.2 ? "bg-yellow-500/20 text-yellow-400" :
               "bg-gray-500/20 text-gray-400";
  
  return (
    <Badge className={`${color} border px-2 py-1`}>
      {percent > 0 ? "+" : ""}{percent.toFixed(3)}%
    </Badge>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const color = confidence > 70 ? "bg-green-500" : confidence > 50 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-10">{confidence.toFixed(0)}%</span>
    </div>
  );
}

// ============================================================================
// ARBITRAGE OPPORTUNITY CARD
// ============================================================================

function ArbitrageOpportunityCard({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  return (
    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TypeBadge type={opportunity.type} />
          <span className="text-sm font-medium">{opportunity.symbol}</span>
        </div>
        <ProfitBadge percent={opportunity.profitPercent} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-gray-500">Buy @ {opportunity.buyExchange}</p>
          <p className="font-medium">${opportunity.buyPrice.toFixed(4)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Sell @ {opportunity.sellExchange}</p>
          <p className="font-medium">${opportunity.sellPrice.toFixed(4)}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>Spread: {opportunity.spreadPercent.toFixed(3)}%</span>
        <span>Confidence: {opportunity.confidence.toFixed(0)}%</span>
      </div>
      
      <ConfidenceMeter confidence={opportunity.confidence} />
      
      <div className="mt-3 pt-3 border-t border-gray-600/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Expires in {Math.max(0, (opportunity.expiry - Date.now()) / 1000).toFixed(0)}s</span>
        </div>
        {opportunity.requiresExecution && (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            Auto-Execution
          </Badge>
        )}
      </div>
    </div>
  );
}

function TriangularCard({ opportunity }: { opportunity: TriangularArbitrageOpportunity }) {
  return (
    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
      <div className="flex items-center justify-between mb-3">
        <TypeBadge type="triangular" />
        <ProfitBadge percent={opportunity.profitPercent} />
      </div>
      
      <div className="flex items-center gap-2 mb-3 text-sm">
        {opportunity.path.map((currency, i) => (
          <React.Fragment key={i}>
            <span className="font-medium">{currency}</span>
            {i < opportunity.path.length - 1 && (
              <ArrowRight className="h-3 w-3 text-gray-500" />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        {opportunity.path.map((currency, i) => (
          <span key={i}>
            {currency}{i < opportunity.path.length - 1} →{" "}
          </span>
        ))}
        Rate: {opportunity.rates.map(r => r.toFixed(4)).join(" → ")}
      </div>
      
      <ConfidenceMeter confidence={opportunity.confidence} />
    </div>
  );
}

function CorrelationCard({ pair }: { pair: CorrelationPair }) {
  const directionColors = {
    meanReversion: "bg-green-500/20 text-green-400",
    momentum: "bg-blue-500/20 text-blue-400",
    pairTrade: "bg-purple-500/20 text-purple-400"
  };
  
  return (
    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{pair.symbol1}</span>
          <ArrowRight className="h-3 w-3 text-gray-500" />
          <span className="font-medium">{pair.symbol2}</span>
        </div>
        <Badge className={`${directionColors[pair.direction]} border px-2 py-1`}>
          {pair.direction.replace(/([A-Z])/g, ' $1')}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
        <div>
          <p className="text-xs text-gray-500">Correlation</p>
          <p className="font-medium">{pair.correlation.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Z-Score</p>
          <p className="font-medium">{pair.zScore > 0 ? "+" : ""}{pair.zScore}</p>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Spread: {pair.currentSpread.toFixed(4)} (mean: {pair.historicalSpreadMean.toFixed(4)})
      </div>
    </div>
  );
}

// ============================================================================
// SUMMARY STATS CARD
// ============================================================================

function SummaryStats({
  total,
  avgSpread,
  avgProfit,
  byType
}: {
  total: number;
  avgSpread: number;
  avgProfit: number;
  byType: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-gray-700/30 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-white">{total}</p>
        <p className="text-xs text-gray-400">Total Opportunities</p>
      </div>
      <div className="bg-gray-700/30 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-green-400">{avgSpread.toFixed(3)}%</p>
        <p className="text-xs text-gray-400">Avg Spread</p>
      </div>
      <div className="bg-gray-700/30 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-blue-400">{avgProfit.toFixed(3)}%</p>
        <p className="text-xs text-gray-400">Avg Profit</p>
      </div>
      <div className="bg-gray-700/30 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-purple-400">{Object.keys(byType).length}</p>
        <p className="text-xs text-gray-400">Types Active</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ARBITRAGE PANEL
// ============================================================================

interface ArbitragePanelProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ArbitragePanel({
  symbol = "BTC",
  autoRefresh = true,
  refreshInterval = 30000
}: ArbitragePanelProps) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [triangular, setTriangular] = useState<TriangularArbitrageOpportunity[]>([]);
  const [statistical, setStatistical] = useState<CorrelationPair[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"spatial" | "triangular" | "statistical">("spatial");

  const fetchArbitrageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const prices = new Map<string, { symbol: string; exchange: string; bid: number; ask: number; last: number; volume: number; timestamp: number }>();
      
      // Add simulated exchange prices
      prices.set(`${symbol}-binance`, {
        symbol, exchange: "Binance", bid: 100.05, ask: 100.08, last: 100.06, volume: 1000000, timestamp: Date.now()
      });
      prices.set(`${symbol}-coinbase`, {
        symbol, exchange: "Coinbase", bid: 100.02, ask: 100.05, last: 100.04, volume: 800000, timestamp: Date.now()
      });
      prices.set(`${symbol}-kraken`, {
        symbol, exchange: "Kraken", bid: 100.03, ask: 100.07, last: 100.05, volume: 600000, timestamp: Date.now()
      });
      prices.set(`${symbol}-ftx`, {
        symbol, exchange: "FTX", bid: 100.01, ask: 100.09, last: 100.05, volume: 400000, timestamp: Date.now()
      });
      
      const exchangeMap = new Map<string, Map<string, any>>();
      prices.forEach((data, key) => {
        if (!exchangeMap.has(data.exchange)) {
          exchangeMap.set(data.exchange, new Map());
        }
        exchangeMap.get(data.exchange)!.set(data.symbol, data);
      });

      const spatialOpps = ArbitrageService.findSpatialArbitrage(exchangeMap);
      setOpportunities(spatialOpps.slice(0, 5));
      setSummary(ArbitrageService.generateArbitrageSummary(symbol, spatialOpps, [], []));
      setTriangular([]);
      setStatistical([]);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch arbitrage data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArbitrageData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchArbitrageData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, autoRefresh, refreshInterval]);

  if (loading && opportunities.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Scanning for arbitrage...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const byType = opportunities.reduce((acc, opp) => {
    acc[opp.type] = (acc[opp.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgSpread = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + o.spreadPercent, 0) / opportunities.length
    : 0;
    
  const avgProfit = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + o.profitPercent, 0) / opportunities.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Arbitrage Scanner</h2>
            <p className="text-sm text-gray-400">{symbol} • Multi-Exchange</p>
          </div>
        </div>
        <button
          onClick={fetchArbitrageData}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">{summary || "Scanning exchanges for price differences..."}</p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <SummaryStats
        total={opportunities.length + triangular.length + statistical.length}
        avgSpread={avgSpread}
        avgProfit={avgProfit}
        byType={byType}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(["spatial", "triangular", "statistical"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-green-500 text-green-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {(tab === "spatial" && opportunities.length > 0) && (
              <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400">
                {opportunities.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {activeTab === "spatial" && (
          opportunities.length > 0 ? (
            opportunities.map((opp) => (
              <ArbitrageOpportunityCard key={opp.id} opportunity={opp} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No spatial arbitrage opportunities detected</p>
              <p className="text-xs">Markets appear efficient</p>
            </div>
          )
        )}

        {activeTab === "triangular" && (
          triangular.length > 0 ? (
            triangular.map((opp) => (
              <TriangularCard key={opp.id} opportunity={opp} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No triangular arbitrage opportunities</p>
              <p className="text-xs">Check forex pairs for opportunities</p>
            </div>
          )
        )}

        {activeTab === "statistical" && (
          statistical.length > 0 ? (
            statistical.map((pair, i) => (
              <CorrelationCard key={i} pair={pair} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No statistical arbitrage opportunities</p>
              <p className="text-xs">Monitor correlated assets</p>
            </div>
          )
        )}
      </div>

      {/* Disclaimer */}
      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              Arbitrage opportunities are typically short-lived. Factor in exchange fees,
              withdrawal costs, and execution latency before trading.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      {lastUpdate && (
        <p className="text-xs text-gray-500 text-center">
          Last scanned: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export default ArbitragePanel;
