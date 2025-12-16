
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "../ui/primitives";
import { MarketDataService } from "../../services/marketData";
import { NewsHeadline } from "../../types";
import { Newspaper, Sparkles, RefreshCcw } from "lucide-react";

export function MarketNews() {
  const [news, setNews] = useState<NewsHeadline[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    // Initial load
    setNews(MarketDataService.generateMarketNews());
    
    // Auto-refresh hook
    const interval = setInterval(() => {
        setNews(prev => {
            const newHeadline = MarketDataService.generateMarketNews()[0];
            return [newHeadline, ...prev.slice(0, 4)];
        });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const runSentimentAnalysis = () => {
      setAnalyzing(true);
      // Simulate API call with confidence generation
      setTimeout(() => {
          setNews(current => current.map(item => ({
              ...item,
              sentiment: item.sentiment + (Math.random() * 0.2 - 0.1),
              confidence: Math.round(75 + Math.random() * 20) // Mock confidence
          })));
          setAnalyzing(false);
      }, 1500);
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (score < -0.3) return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Market News
        </CardTitle>
        <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10"
            onClick={runSentimentAnalysis}
            disabled={analyzing}
        >
            {analyzing ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {analyzing ? "Analyzing..." : "AI Analyze"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="flex flex-col space-y-2 border-b border-border pb-3 last:border-0 last:pb-0 group">
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium text-sm leading-tight">{item.headline}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`whitespace-nowrap text-xs px-1.5 py-0 h-5 ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment > 0.3 ? "Bullish" : item.sentiment < -0.3 ? "Bearish" : "Neutral"}
                    </Badge>
                    {(item as any).confidence && (
                         <span className="text-xs text-muted-foreground flex items-center gap-1">
                             <Sparkles className="h-3 w-3 text-primary/70" /> {(item as any).confidence}% Conf.
                         </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
