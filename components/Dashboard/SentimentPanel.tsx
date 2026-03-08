/**
 * Enhanced Sentiment Dashboard Panel
 * 
 * Displays comprehensive sentiment analysis including:
 * - Composite sentiment score
 * - Fear & Greed Index
 * - Social media sentiment (Twitter, Reddit)
 * - News sentiment
 * - Options market sentiment
 * - Divergence detection
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/primitives";
import { Badge } from "../../components/ui/primitives";
import {
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Newspaper,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Activity,
  Users,
  Globe,
  BarChart3
} from "lucide-react";
import {
  EnhancedSentimentService,
  CompositeSentiment,
  FearGreedIndex,
  SentimentSignal
} from "../../services/enhancedSentiment";

// ============================================================================
// SENTIMENT BADGES
// ============================================================================

function SentimentLabel({ sentiment }: { sentiment: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    extremeFear: { color: "text-red-400", bg: "bg-red-500/20" },
    fear: { color: "text-orange-400", bg: "bg-orange-500/20" },
    neutral: { color: "text-gray-400", bg: "bg-gray-500/20" },
    greed: { color: "text-blue-400", bg: "bg-blue-500/20" },
    extremeGreed: { color: "text-green-400", bg: "bg-green-500/20" }
  };
  
  const { color, bg } = config[sentiment] || config.neutral;
  const labels: Record<string, string> = {
    extremeFear: "Extreme Fear",
    fear: "Fear",
    neutral: "Neutral",
    greed: "Greed",
    extremeGreed: "Extreme Greed"
  };
  
  return (
    <Badge className={`${bg} ${color} border px-3 py-1`}>
      {labels[sentiment] || sentiment}
    </Badge>
  );
}

function FearGreedGauge({ value }: { value: number }) {
  const position = value;
  
  const segments = [
    { label: "Extreme Fear", color: "bg-red-500", range: [0, 25] },
    { label: "Fear", color: "bg-orange-500", range: [25, 45] },
    { label: "Neutral", color: "bg-yellow-500", range: [45, 55] },
    { label: "Greed", color: "bg-blue-500", range: [55, 75] },
    { label: "Extreme Greed", color: "bg-green-500", range: [75, 100] }
  ];
  
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-700">
        {segments.map((seg, i) => (
          <div key={i} className={`${seg.color} flex-1`} />
        ))}
      </div>
      <div className="relative">
        <div 
          className="absolute w-3 h-4 bg-white rounded shadow-lg transform -translate-x-1/2"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}

function MomentumArrow({ trend, momentum }: { trend: string; momentum: number }) {
  if (trend === "stable") return <span className="text-gray-400">→</span>;
  
  const isImproving = trend === "improving";
  const color = isImproving ? "text-green-400" : "text-red-400";
  const icon = isImproving ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      {icon}
      <span className="text-xs">{momentum > 0 ? "+" : ""}{momentum.toFixed(1)}</span>
    </div>
  );
}

function SourceCard({
  icon: Icon,
  label,
  score,
  volume,
  confidence
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  volume: number;
  confidence: number;
}) {
  const scoreColor = score > 20 ? "text-green-400" : score < -20 ? "text-red-400" : "text-gray-400";
  
  return (
    <div className="bg-gray-700/30 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-lg font-semibold ${scoreColor}`}>
          {score > 0 ? "+" : ""}{score.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">{volume} mentions</span>
      </div>
      <div className="mt-2">
        <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className={`h-full ${scoreColor.replace('text-', 'bg-')}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function DivergenceAlert({ divergence }: { divergence: { present: boolean; type: string; description: string } }) {
  if (!divergence.present) return null;
  
  return (
    <Card className="bg-yellow-500/10 border-yellow-500/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-400">
              Sentiment Divergence: {divergence.type.replace(/([A-Z])/g, ' $1')}
            </p>
            <p className="text-sm text-gray-400">{divergence.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN SENTIMENT PANEL
// ============================================================================

interface SentimentPanelProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function SentimentPanel({
  symbol = "AAPL",
  autoRefresh = true,
  refreshInterval = 60000
}: SentimentPanelProps) {
  const [composite, setComposite] = useState<CompositeSentiment | null>(null);
  const [fearGreed, setFearGreed] = useState<FearGreedIndex | null>(null);
  const [signal, setSignal] = useState<SentimentSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSentimentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate sample sentiment analysis
      const sentimentData = await EnhancedSentimentService.runSentimentAnalysis(
        symbol,
        [], // Would pass real tweets
        [], // Would pass real reddit posts
        []  // Would pass real news
      );
      
      setComposite(sentimentData.composite);
      setFearGreed(sentimentData.fearGreed);
      setSignal(sentimentData.signal);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sentiment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSentimentData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, autoRefresh, refreshInterval]);

  if (loading && !composite) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Analyzing sentiment...</span>
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
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sentiment Analysis</h2>
            <p className="text-sm text-gray-400">{symbol} • Composite Sentiment</p>
          </div>
        </div>
        <button
          onClick={fetchSentimentData}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {composite && fearGreed && signal && (
        <>
          {/* Overall Sentiment Card */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Overall Sentiment</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SentimentLabel sentiment={composite.sentiment} />
                    <MomentumArrow trend={composite.trend} momentum={composite.momentum} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{composite.overall > 0 ? "+" : ""}{composite.overall}</p>
                  <p className="text-xs text-gray-500">Composite Score</p>
                </div>
              </div>
              
              <FearGreedGauge value={fearGreed.value} />
              
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-400">{fearGreed.label}</span>
                <span className="text-gray-500">{fearGreed.value.toFixed(0)}/100</span>
              </div>
            </CardContent>
          </Card>

          {/* Signal Card */}
          <Card className={`${
            signal.signal === "Bullish" ? "bg-green-500/10 border-green-500/30" :
            signal.signal === "Bearish" ? "bg-red-500/10 border-red-500/30" :
            "bg-gray-800/50 border-gray-700"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {signal.signal === "Bullish" ? (
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  ) : signal.signal === "Bearish" ? (
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  ) : (
                    <Activity className="h-6 w-6 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold">{signal.signal}</p>
                    <p className="text-xs text-gray-400">{signal.strength}% confidence</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-3">{signal.description}</p>
            </CardContent>
          </Card>

          {/* Source Breakdown */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sentiment Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <SourceCard
                  icon={MessageCircle}
                  label="Twitter"
                  score={composite.sources.twitter?.sentimentScore || 0}
                  volume={composite.sources.twitter?.volume || 0}
                  confidence={composite.sources.twitter?.confidence || 0}
                />
                <SourceCard
                  icon={Users}
                  label="Reddit"
                  score={composite.sources.reddit?.sentimentScore || 0}
                  volume={composite.sources.reddit?.volume || 0}
                  confidence={composite.sources.reddit?.confidence || 0}
                />
                <SourceCard
                  icon={Newspaper}
                  label="News"
                  score={composite.sources.news?.sentimentScore || 0}
                  volume={composite.sources.news?.volume || 0}
                  confidence={composite.sources.news?.confidence || 0}
                />
                <SourceCard
                  icon={DollarSign}
                  label="Options"
                  score={composite.sources.options?.sentimentScore || 0}
                  volume={composite.sources.options?.volume || 0}
                  confidence={composite.sources.options?.confidence || 0}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fear & Greed Components */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Fear & Greed Components
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {Object.entries(fearGreed.components).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">{key}</span>
                    <span className="font-medium">{value.toFixed(0)}/100</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Divergence Alert */}
          <DivergenceAlert divergence={composite.divergence} />

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

export default SentimentPanel;
