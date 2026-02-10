/**
 * Multi-Asset Markets Page - With Custom Symbol Support
 * 
 * Comprehensive view of all markets:
 * - Stocks (7 default + unlimited custom)
 * - Forex (Major pairs)
 * - Crypto (Bitcoin, Ethereum, altcoins)
 * - Commodities (Gold, Oil, Natural Gas)
 * - Indices (S&P 500, NASDAQ, Dow Jones)
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "../components/ui/primitives";
import { MultiAssetWatchlist } from "../components/Watchlist/MultiAssetWatchlist";
import { TrendingUp, TrendingDown, Activity, RefreshCw, Zap, Plus, X, Search } from "lucide-react";
import { MultiAssetService, ASSET_CONFIG, ASSET_CLASSES, AssetClass } from "../services/multiAssetData";
import { Quote } from "../types";

interface MarketSummary {
  assetClass: AssetClass;
  topGainer: Quote | null;
  topLoser: Quote | null;
  avgChange: number;
  totalVolume: string;
}

export default function MarketsPage() {
  const [summaries, setSummaries] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);
  const [addSymbolInput, setAddSymbolInput] = useState("");
  const [addError, setAddError] = useState("");

  // Load custom symbols from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("customStockSymbols");
    if (saved) {
      setCustomSymbols(JSON.parse(saved));
    }
  }, []);

  // Fetch market data
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [customSymbols]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // Get all quotes including custom stocks
      const quotes = await MultiAssetService.getAllQuotes(customSymbols);
      const assetClasses: AssetClass[] = ["stock", "forex", "crypto", "commodity", "index"];
      
      const newSummaries = assetClasses.map(assetClass => {
        const classQuotes = quotes.filter(q => {
          const config = ASSET_CONFIG[q.symbol];
          return config?.assetClass === assetClass;
        });
        
        const gains = classQuotes.filter(q => q.changePercent > 0);
        const losses = classQuotes.filter(q => q.changePercent < 0);
        const avgChange = classQuotes.length > 0
          ? classQuotes.reduce((sum, q) => sum + q.changePercent, 0) / classQuotes.length
          : 0;
        
        const topGainer = gains.sort((a, b) => b.changePercent - a.changePercent)[0] || null;
        const topLoser = losses.sort((a, b) => a.changePercent - b.changePercent)[0] || null;
        
        const totalVolume = classQuotes.reduce((sum, q) => {
          const vol = parseFloat(q.volume?.replace(/[^0-9.-]/g, "") || "0");
          return sum + (isNaN(vol) ? 0 : vol);
        }, 0);
        
        return {
          assetClass,
          topGainer,
          topLoser,
          avgChange,
          totalVolume: formatVolume(totalVolume)
        };
      });
      
      setSummaries(newSummaries);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1e12) return `${(vol / 1e12).toFixed(1)}T`;
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
    return vol.toFixed(0);
  };

  // Handle adding custom symbol
  const handleAddSymbol = async () => {
    const symbol = addSymbolInput.toUpperCase().trim();
    if (!symbol) {
      setAddError("Please enter a symbol");
      return;
    }
    
    // Validate format (2-5 uppercase letters, optionally with . for tickers like BRK.B)
    if (!/^[A-Z]{1,5}(\.[A-Z])?$/.test(symbol)) {
      setAddError("Invalid symbol format (e.g., AAPL, MSFT, BRK.B)");
      return;
    }
    
    if (customSymbols.includes(symbol)) {
      setAddError("Symbol already added");
      return;
    }
    
    // Test if symbol is valid by fetching data
    const quote = await MultiAssetService.getQuote(symbol);
    if (!quote) {
      setAddError("Symbol not found or API unavailable");
      return;
    }
    
    // Add symbol
    const newSymbols = [...customSymbols, symbol];
    setCustomSymbols(newSymbols);
    localStorage.setItem("customStockSymbols", JSON.stringify(newSymbols));
    setAddSymbolInput("");
    setAddError("");
    setShowAddModal(false);
  };

  // Handle removing custom symbol
  const handleRemoveSymbol = (symbol: string) => {
    const newSymbols = customSymbols.filter(s => s !== symbol);
    setCustomSymbols(newSymbols);
    localStorage.setItem("customStockSymbols", JSON.stringify(newSymbols));
  };

  const totalStocks = 7 + customSymbols.length;

  return (
    <div className="flex flex-col animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-muted-foreground mt-1">
            Multi-asset market overview • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Symbol
          </Button>
          <Badge variant="outline" className="gap-2">
            <Activity className="h-3 w-3 animate-pulse text-green-500" />
            Live Data
          </Badge>
          <button
            onClick={fetchMarketData}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Add Symbol Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Add Stock Symbol
                </CardTitle>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Symbol</label>
                <Input
                  placeholder="e.g., AAPL, MSFT, BRK.B"
                  value={addSymbolInput}
                  onChange={(e) => setAddSymbolInput(e.target.value.toUpperCase())}
                  className="mt-1"
                />
                {addError && (
                  <p className="text-red-500 text-sm mt-1">{addError}</p>
                )}
              </div>
              
              {customSymbols.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Custom Symbols</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customSymbols.map(sym => (
                      <Badge key={sym} variant="secondary" className="gap-1">
                        {sym}
                        <button onClick={() => handleRemoveSymbol(sym)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddSymbol} className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Market Summaries */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {summaries.map((summary) => {
            const config = ASSET_CLASSES[summary.assetClass];
            const isPositive = summary.avgChange >= 0;
            
            return (
              <Card key={summary.assetClass} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config?.icon}</span>
                      <span className="font-medium">{config?.name}</span>
                    </div>
                    <Badge variant="outline" className={isPositive ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}>
                      {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {summary.avgChange >= 0 ? "+" : ""}{summary.avgChange.toFixed(2)}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Top Gainer</div>
                      {summary.topGainer ? (
                        <div className="font-mono font-medium text-green-500">
                          {summary.topGainer.symbol}
                          <span className="text-xs ml-1">+{summary.topGainer.changePercent.toFixed(2)}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Top Loser</div>
                      {summary.topLoser ? (
                        <div className="font-mono font-medium text-red-500">
                          {summary.topLoser.symbol}
                          <span className="text-xs ml-1">{summary.topLoser.changePercent.toFixed(2)}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                      Volume: <span className="text-foreground">{summary.totalVolume}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Watchlist */}
      <div className="px-6">
        <MultiAssetWatchlist customSymbols={customSymbols} />
      </div>

      {/* Quick Stats Footer */}
      <div className="p-6 mt-6 border-t border-border/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Auto-refresh: 30s
            </span>
            <span>
              Data: AlphaVantage, Polygon, CoinGecko, Frankfurter
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Stocks: {totalStocks} {customSymbols.length > 0 && `(${customSymbols.length} custom)`}</span>
            <span>Forex: 10</span>
            <span>Crypto: 7</span>
            <span>Commodities: 5</span>
            <span>Indices: 5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
