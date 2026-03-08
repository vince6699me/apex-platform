/**
 * All Strategies Trading Dashboard
 * 
 * Comprehensive dashboard combining all trading strategies:
 * - SMC (Smart Money Concepts)
 * - COT (Commitment of Traders)
 * - Arbitrage Analysis
 * - Enhanced Sentiment
 * 
 * Unified view with cross-strategy signals
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/primitives";
import { Badge } from "../../components/ui/primitives";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Target,
  Users,
  DollarSign,
  BarChart3,
  Clock,
  ChevronRight,
  Zap,
  AlertTriangle
} from "lucide-react";
import { AIIntelligenceService, ComprehensiveSignal } from "../../services/aiIntelligence";
import { COTPanel } from "./COTPanel";
import { SentimentPanel } from "./SentimentPanel";
import { ArbitragePanel } from "./ArbitragePanel";

// ============================================================================
// SIGNAL OVERVIEW CARD
// ============================================================================

function SignalOverviewCard({ signal }: { signal: ComprehensiveSignal }) {
  const biasColors = {
    Bullish: "bg-green-500/20 border-green-500/30 text-green-400",
    Bearish: "bg-red-500/20 border-red-500/30 text-red-400",
    Neutral: "bg-gray-500/20 border-gray-500/30 text-gray-400"
  };
  
  const priorityColors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };
  
  return (
    <Card className={`${biasColors[signal.overallBias]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-70">Overall Signal</p>
            <p className="text-2xl font-bold">{signal.overallBias}</p>
          </div>
          <Badge className={`${priorityColors[signal.priority]} border px-3 py-1`}>
            {signal.priority.toUpperCase()} PRIORITY
          </Badge>
        </div>
        
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs opacity-70">SMC</p>
            <p className="font-semibold">{signal.smc.bias}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">COT</p>
            <p className="font-semibold">{signal.cot.sentiment}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Sentiment</p>
            <p className="font-semibold">{signal.sentiment.compositeScore > 0 ? "Greed" : "Fear"}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Arbitrage</p>
            <p className="font-semibold">{signal.arbitrage.opportunities > 0 ? "Active" : "None"}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="flex items-center justify-between text-sm">
            <span>Confidence</span>
            <span className="font-bold">{signal.overallConfidence.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-current/20 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-current transition-all duration-500"
              style={{ width: `${signal.overallConfidence}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STRATEGY STATUS GRID
// ============================================================================

function StrategyStatus({
  name,
  icon: Icon,
  status,
  setups,
  confidence
}: {
  name: string;
  icon: React.ElementType;
  status: string;
  setups: number;
  confidence: number;
}) {
  const statusColors = {
    Bullish: "text-green-400",
    Bearish: "text-red-400",
    Neutral: "text-gray-400",
    Active: "text-blue-400",
    None: "text-gray-500"
  };
  
  return (
    <div className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-600/30 rounded-lg">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className={`text-xs ${statusColors[status as keyof typeof statusColors] || "text-gray-400"}`}>
            {status} • {setups} setups
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-400"
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{confidence}%</span>
      </div>
    </div>
  );
}

// ============================================================================
// MULTI-STRATEGY SETUPS PANEL
// ============================================================================

interface CombinedSetupsPanelProps {
  setups: Array<{
    id: string;
    symbol: string;
    direction: string;
    entryPrice: number;
    stopLoss: number;
    takeProfits: number[];
    riskReward: number;
    confidence: number;
    reasoning: string;
    killZone: string;
    timestamp: number;
  }>;
}

function CombinedSetupsPanel({ setups }: CombinedSetupsPanelProps) {
  if (setups.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center text-gray-500">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No trade setups from any strategy</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          All Trade Setups ({setups.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {setups.slice(0, 10).map((setup) => (
          <div 
            key={setup.id}
            className={`p-3 rounded-lg border ${
              setup.direction === "Bullish" 
                ? "bg-green-500/10 border-green-500/20" 
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {setup.direction === "Bullish" ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className="font-medium">{setup.symbol}</span>
                <Badge variant="secondary" className="text-xs">
                  {setup.killZone}
                </Badge>
              </div>
              <span className="text-sm font-medium">{setup.confidence}%</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-2">
              <div>
                <p>Entry</p>
                <p className="text-white">${setup.entryPrice.toFixed(2)}</p>
              </div>
              <div>
                <p>Stop</p>
                <p className="text-red-400">${setup.stopLoss.toFixed(2)}</p>
              </div>
              <div>
                <p>Target</p>
                <p className="text-green-400">${setup.takeProfits[0]?.toFixed(2) || "N/A"}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">R:R {setup.riskReward}:1</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN ALL-STRATEGIES DASHBOARD
// ============================================================================

interface AllStrategiesDashboardProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function AllStrategiesDashboard({
  symbol = "AAPL",
  autoRefresh = true,
  refreshInterval = 60000
}: AllStrategiesDashboardProps) {
  const [signal, setSignal] = useState<ComprehensiveSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "smc" | "cot" | "sentiment" | "arbitrage">("overview");

  const fetchAllAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analysis = await AIIntelligenceService.analyzeAllStrategies(symbol);
      setSignal(analysis.signal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalysis();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllAnalysis, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, autoRefresh, refreshInterval]);

  if (loading && !signal) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Analyzing with all strategies...</span>
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

  return (
    <div className="space-y-4">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">All Strategies Dashboard</h2>
            <p className="text-sm text-gray-400">{symbol} • AI-Powered Analysis</p>
          </div>
        </div>
        <button
          onClick={fetchAllAnalysis}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "smc", label: "SMC", icon: Activity },
          { id: "cot", label: "COT", icon: Users },
          { id: "sentiment", label: "Sentiment", icon: Target },
          { id: "arbitrage", label: "Arbitrage", icon: DollarSign }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && signal && (
        <div className="space-y-4">
          <SignalOverviewCard signal={signal} />
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Strategy Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <StrategyStatus
                name="Smart Money Concepts"
                icon={Activity}
                status={signal.smc.bias}
                setups={signal.smc.orderBlocks + signal.smc.fvgs}
                confidence={signal.smc.trendStrength}
              />
              <StrategyStatus
                name="Commitment of Traders"
                icon={Users}
                status={signal.cot.sentiment}
                setups={0}
                confidence={signal.cot.confidence}
              />
              <StrategyStatus
                name="Sentiment Analysis"
                icon={Target}
                status={signal.sentiment.compositeScore > 0 ? "Greed" : "Fear"}
                setups={0}
                confidence={Math.abs(signal.sentiment.compositeScore)}
              />
              <StrategyStatus
                name="Arbitrage Scanner"
                icon={DollarSign}
                status={signal.arbitrage.opportunities > 0 ? "Active" : "None"}
                setups={signal.arbitrage.opportunities}
                confidence={signal.arbitrage.opportunities > 0 ? 80 : 50}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "smc" && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-gray-400 text-center">
              SMC Panel component would be rendered here.
              <br />
              <span className="text-sm">Use existing SMCPanel.tsx</span>
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === "cot" && (
        <COTPanel symbol={symbol} autoRefresh={autoRefresh} refreshInterval={refreshInterval} />
      )}

      {activeTab === "sentiment" && (
        <SentimentPanel symbol={symbol} autoRefresh={autoRefresh} refreshInterval={refreshInterval} />
      )}

      {activeTab === "arbitrage" && (
        <ArbitragePanel symbol={symbol} autoRefresh={autoRefresh} refreshInterval={refreshInterval} />
      )}

      {/* Footer */}
      {signal && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Last analysis: {new Date(signal.timestamp).toLocaleTimeString()}</span>
          </div>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            {symbol} • All Strategies
          </Badge>
        </div>
      )}
    </div>
  );
}

export default AllStrategiesDashboard;
