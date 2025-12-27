
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/primitives";
import { Brain, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { AIIntelligenceService } from "../services/aiIntelligence";
import { SentimentInsight, SmartMoneyPattern } from "../types";

const ProgressBar = ({ value, colorClass }: { value: number; colorClass: string }) => (
  <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
    <div className={`h-full ${colorClass}`} style={{ width: `${value}%` }} />
  </div>
);

const SentimentCard: React.FC<{ insight: SentimentInsight }> = ({ insight }) => (
  <Card className="bg-card/50 hover:bg-card/80 transition-colors border-border/50">
    <CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-muted-foreground">{insight.name}</div>
          <div className="text-xl font-bold">{insight.symbol}</div>
        </div>
        <Badge 
          className={insight.sentimentLabel === "Bullish" ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"}
        >
          {insight.sentimentLabel}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <span className={insight.change >= 0 ? "text-green-500" : "text-red-500"}>
           {insight.change > 0 && <TrendingUp className="inline h-3 w-3 mr-1" />}
           {insight.change > 0 && "+"}{insight.change}
        </span>
        <span className="text-muted-foreground text-sm">{insight.signalCount} signals</span>
      </div>

      <div className="space-y-3 pt-2 border-t border-border/50">
        {insight.signals.map((signal, i) => (
          <div key={i} className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="text-sm leading-tight text-foreground/90">{signal.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{signal.source}</p>
            </div>
            <span className="text-sm font-mono opacity-70">{signal.score}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const SmartMoneyCard: React.FC<{ item: SmartMoneyPattern }> = ({ item }) => (
  <Card className="bg-card/50 hover:bg-card/80 transition-colors border-border/50">
    <CardContent className="p-4 flex flex-col h-full justify-between gap-3">
      <div className="flex justify-between items-start">
        <div>
           <div className="text-sm text-muted-foreground">{item.symbol}</div>
           <div className="font-bold text-base">{item.concept}</div>
        </div>
        <Badge variant="outline" className="text-xs h-5">{item.timeframe}</Badge>
      </div>
      
      <div className="flex gap-2">
         <Badge 
            variant="default" 
            className={
                item.bias === "Bullish" ? "bg-yellow-500 text-black hover:bg-yellow-600" : 
                item.bias === "Bearish" ? "bg-red-500 text-white hover:bg-red-600" : 
                "bg-gray-500 text-white hover:bg-gray-600"
            }
         >
            {item.bias}
         </Badge>
         <Badge variant="secondary" className="bg-muted text-muted-foreground">{item.zone}</Badge>
      </div>

      <p className="text-sm text-muted-foreground leading-snug min-h-[2.5rem]">{item.description}</p>
      
      <div className="space-y-1">
         <div className="flex justify-between text-xs text-muted-foreground">
            <span>{item.confidence}% confidence</span>
            <span>Retested {item.retested}</span>
         </div>
         <ProgressBar value={item.confidence} colorClass="bg-green-500" />
      </div>
    </CardContent>
  </Card>
);

export default function AIIntelligence() {
  const scans = AIIntelligenceService.scanPatterns();
  const sentiments = AIIntelligenceService.getSentimentInsights();
  const smc = AIIntelligenceService.getSmartMoneyPatterns();

  return (
    <div className="space-y-8 p-6 animate-fade-in pb-20">
      <div>
         <h1 className="text-3xl font-bold">AI Intelligence</h1>
         <p className="text-muted-foreground mt-1 text-sm">AI-powered pattern recognition, sentiment scoring, and anomaly detection</p>
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
