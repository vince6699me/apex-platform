
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button } from "../components/ui/primitives";
import { Brain, Sparkles, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { AIIntelligenceService } from "../services/aiIntelligence";
import { SentimentInsight, SmartMoneyPattern } from "../types";

const ProgressBar = ({ value, colorClass }: { value: number; colorClass: string }) => (
  <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
    <div className={`h-full ${colorClass}`} style={{ width: `${value}%` }} />
  </div>
);

export default function AIIntelligence() {
  const [analysis, setAnalysis] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const scans = AIIntelligenceService.scanPatterns();
  const sentiments = AIIntelligenceService.getSentimentInsights();
  const smc = AIIntelligenceService.getSmartMoneyPatterns();

  const handleAnalyze = async (symbol: string) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const result = await AIIntelligenceService.analyzeMarketSignals(symbol);
      // Try to parse JSON from Markdown if needed
      const jsonStr = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      setAnalysis(prev => ({ ...prev, [symbol]: parsed }));
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  return (
    <div className="space-y-8 p-6 animate-fade-in pb-20">
      <div>
         <h1 className="text-3xl font-bold">AI Intelligence</h1>
         <p className="text-muted-foreground mt-1 text-sm">AI-powered pattern recognition, sentiment scoring, and anomaly detection</p>
      </div>

      {/* Advanced AI Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["AAPL", "TSLA", "NVDA"].map(symbol => (
          <Card key={symbol} className="border-border/50 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" /> {symbol} AI Insight
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAnalyze(symbol)}
                  disabled={loading[symbol]}
                >
                  {loading[symbol] ? "Analyzing..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analysis[symbol] ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bias</span>
                    <Badge className={analysis[symbol].bias === 'Bullish' ? 'bg-green-500' : 'bg-red-500'}>
                      {analysis[symbol].bias}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Levels</span>
                    <span className="text-sm font-mono">{analysis[symbol].levels}</span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Signal</div>
                    <div className="text-sm font-bold text-primary">{analysis[symbol].signal}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {analysis[symbol].reason}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm italic">
                  Run AI analysis to generate signals
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Scanner and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card className="h-full border-border/50 bg-card/40">
                <CardHeader className="py-4 border-b border-border/50">
                    <CardTitle className="flex gap-2 text-lg"><Brain className="w-5 h-5"/> Pattern Scanner</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-[100px]">Symbol</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead className="w-[120px]">Score</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Patterns</TableHead>
                                <TableHead className="text-right">Last Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scans.map(s => (
                                <TableRow key={s.symbol} className="border-border/50 hover:bg-muted/20">
                                    <TableCell className="font-bold">{s.symbol}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            className={
                                                s.direction === 'Bullish' ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' : 
                                                s.direction === 'Bearish' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 
                                                'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                            }
                                        >
                                            {s.direction}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1"><ProgressBar value={s.score} colorClass="bg-yellow-500" /></div>
                                            <span className="text-xs text-muted-foreground w-6 text-right">{s.score}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{s.confidence}%</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[150px]">
                                        {s.patterns.join(", ")}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        <div className="flex flex-col items-end">
                                            <span>{s.lastUpdated}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card className="h-full border-border/50 bg-card/40">
                <CardHeader className="py-4 border-b border-border/50">
                     <CardTitle className="text-lg">Real-Time Anomaly Alerts</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-muted-foreground text-sm flex items-center gap-2">
                         No anomalies detected.
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Row 2: Market Sentiment */}
      <div>
         <h2 className="text-xl font-bold mb-4">Market Sentiment Pulse</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {sentiments.map((insight) => (
                 <SentimentCard key={insight.symbol} insight={insight} />
             ))}
         </div>
      </div>

      {/* Row 3: Smart Money Concepts */}
      <div>
         <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5"/> Smart Money Concepts</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {smc.map((item) => (
                 <SmartMoneyCard key={item.id} item={item} />
             ))}
         </div>
      </div>
    </div>
  );
}
