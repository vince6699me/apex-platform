/**
 * COT Analysis Dashboard Panel
 * 
 * Displays Commitment of Traders analysis including:
 * - Commercial trader positioning (Smart Money)
 * - Large speculator positioning
 * - Sentiment extremes
 * - Trade setups based on COT data
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/primitives";
import { Badge } from "../../components/ui/primitives";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Activity,
  Target
} from "lucide-react";
import {
  COTAnalysisService,
  COTAnalysis,
  COTSignal,
  COTTradeSetup
} from "../../services/cotAnalysis";

// ============================================================================
// COT STATUS BADGES
// ============================================================================

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    extremeLong: "bg-red-500/20 text-red-400 border-red-500/30",
    extremeShort: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };
  
  const labels: Record<string, string> = {
    extremeLong: "Extreme Long",
    extremeShort: "Extreme Short",
    neutral: "Neutral"
  };
  
  return (
    <Badge className={`${colors[sentiment] || colors.neutral} border px-2 py-1`}>
      {labels[sentiment] || sentiment}
    </Badge>
  );
}

function BiasBadge({ bias }: { bias: string }) {
  const colors: Record<string, string> = {
    bullish: "bg-green-500/20 text-green-400 border-green-500/30",
    bearish: "bg-red-500/20 text-red-400 border-red-500/30",
    neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };
  
  return (
    <Badge className={`${colors[bias] || colors.neutral} border px-2 py-1`}>
      {bias.charAt(0).toUpperCase() + bias.slice(1)}
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
      <span className="text-sm text-gray-400 w-12">{confidence}%</span>
    </div>
  );
}

// ============================================================================
// POSITION BAR CHART
// ============================================================================

function PositionBar({ 
  label, 
  netPosition, 
  maxPosition,
  color 
}: { 
  label: string; 
  netPosition: number; 
  maxPosition: number;
  color: string;
}) {
  const percent = Math.min(100, Math.abs(netPosition) / maxPosition * 100);
  const isPositive = netPosition > 0;
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={isPositive ? "text-green-400" : "text-red-400"}>
          {isPositive ? "+" : ""}{netPosition.toLocaleString()}
        </span>
      </div>
      <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
        <div 
          className={`${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// COT SETUP CARD
// ============================================================================

function COTSetupCard({ setup }: { setup: COTTradeSetup }) {
  const directionColors = {
    long: "border-green-500/30 bg-green-500/5",
    short: "border-red-500/30 bg-red-500/5"
  };
  
  return (
    <div className={`border rounded-lg p-3 ${directionColors[setup.direction]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {setup.direction === "long" ? (
            <TrendingUp className="h-4 w-4 text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span className="font-medium capitalize">{setup.strategy.replace(/([A-Z])/g, ' $1')}</span>
        </div>
        <ConfidenceMeter confidence={setup.confidence} />
      </div>
      
      <div className="text-sm text-gray-400 mb-2">
        {setup.reasoning.slice(0, 100)}...
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">R:R {setup.riskReward}:1</span>
        <span className="text-gray-500">Entry: {setup.entryTrigger.slice(0, 30)}...</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COT PANEL
// ============================================================================

interface COTPanelProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function COTPanel({ 
  symbol = "AAPL", 
  autoRefresh = true,
  refreshInterval = 60000 
}: COTPanelProps) {
  const [analysis, setAnalysis] = useState<COTAnalysis | null>(null);
  const [signal, setSignal] = useState<COTSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchCOTData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cotData = await COTAnalysisService.getCOTData(symbol);
      const cotAnalysis = COTAnalysisService.analyzeCOT(cotData);
      const cotSignal = COTAnalysisService.getCOTSignal(cotData);
      
      setAnalysis(cotAnalysis);
      setSignal(cotSignal);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch COT data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCOTData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchCOTData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, autoRefresh, refreshInterval]);

  if (loading && !analysis) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading COT data...</span>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">COT Analysis</h2>
            <p className="text-sm text-gray-400">{symbol} • Commitment of Traders</p>
          </div>
        </div>
        <button
          onClick={fetchCOTData}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {analysis && (
        <>
          {/* Report Date & Overall Signal */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Report Date</p>
                  <p className="font-medium">{analysis.reportDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Overall Sentiment</p>
                  <BiasBadge bias={analysis.sentimentAnalysis.overall} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position Bars */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Net Positions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <PositionBar
                label="Commercials (Smart Money)"
                netPosition={analysis.commercialPosition.netPosition}
                maxPosition={analysis.commercialPosition.historicalContext.yearHigh}
                color="bg-green-500"
              />
              <PositionBar
                label="Large Speculators"
                netPosition={analysis.largeSpecPosition.netPosition}
                maxPosition={analysis.largeSpecPosition.historicalContext.yearHigh}
                color="bg-red-500"
              />
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Commercial Bias</span>
                  <BiasBadge bias={analysis.sentimentAnalysis.commercialBias} />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Large Spec Bias</span>
                  <BiasBadge bias={analysis.sentimentAnalysis.largeSpecBias} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historical Context */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Historical Context
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Commercial Percentile</p>
                  <p className="text-lg font-semibold text-green-400">
                    {analysis.commercialPosition.historicalContext.percentile.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Large Spec Percentile</p>
                  <p className="text-lg font-semibold text-red-400">
                    {analysis.largeSpecPosition.historicalContext.percentile.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Divergence Alert */}
          {analysis.divergence.present && (
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-400">COT Divergence Detected</p>
                    <p className="text-sm text-gray-400">{analysis.divergence.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trade Setups */}
          {analysis.tradeSetups.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  COT Trade Setups ({analysis.tradeSetups.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {analysis.tradeSetups.slice(0, 3).map((setup) => (
                  <COTSetupCard key={setup.id} setup={setup} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Last Update */}
          {lastUpdate && (
            <p className="text-xs text-gray-500 text-center">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default COTPanel;
