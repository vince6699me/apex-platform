/**
 * Multi-Asset Watchlist Component
 * 
 * Displays real-time data for:
 * - Stocks
 * - Forex (Major & Cross pairs)
 * - Crypto (Bitcoin, Ethereum, Altcoins)
 * - Commodities (Gold, Silver, Oil)
 * - Indices (S&P 500, NASDAQ, etc.)
 */

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button } from "../ui/primitives";
import { ArrowUpRight, ArrowDownRight, Plus, ArrowUpDown, Activity, RefreshCw, TrendingUp, TrendingDown, DollarSign, Bitcoin, BarChart2, Globe } from "lucide-react";
import { MultiAssetService, ASSET_CONFIG, ASSET_CLASSES, AssetClass } from "../../services/multiAssetData";
import { MarketDataService } from "../../services/marketData";
import { Quote, AssetClass as AssetClassType, WatchlistItem as BaseWatchlistItem } from "../../types";

// ============================================================================
// TYPES
// ============================================================================

export interface WatchlistItem extends BaseWatchlistItem {
  assetClass: AssetClassType;
  bid?: number;
  ask?: number;
  spread?: number;
  spreadPercent?: number;
  volume24h?: string;
}

export type AssetTab = "all" | "stock" | "forex" | "crypto" | "commodity" | "index";

// ============================================================================
// ASSET CLASS BADGES
// ============================================================================

function AssetBadge({ assetClass }: { assetClass: AssetClass }) {
  const config = ASSET_CLASSES[assetClass];
  return (
    <Badge variant="outline" className={`${config?.color || ""} gap-1`}>
      <span>{config?.icon}</span>
      <span>{config?.name}</span>
    </Badge>
  );
}

// ============================================================================
// SPREAD INDICATOR
// ============================================================================

function SpreadIndicator({ spread, percent }: { spread: number; percent: number }) {
  const isWide = percent > 0.1;
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs ${isWide ? "text-yellow-500" : "text-muted-foreground"}`}>
        {spread.toFixed(2)}
      </span>
      <Badge variant="outline" className={`text-xs ${isWide ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}`}>
        {percent.toFixed(2)}%
      </Badge>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MultiAssetWatchlist({ customSymbols = [] }: { customSymbols?: string[] }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState<WatchlistItem[]>([]);
  const [activeTab, setActiveTab] = useState<AssetTab>("all");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sortConfig, setSortConfig] = useState<{ key: keyof WatchlistItem | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  // Fetch all quotes on mount
  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter when tab changes
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredWatchlist(watchlist);
    } else {
      setFilteredWatchlist(watchlist.filter(item => item.assetClass === activeTab));
    }
  }, [watchlist, activeTab]);

  // Fetch quotes from all asset classes (INCLUDING CUSTOM SYMBOLS)
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const quotes = await MultiAssetService.getAllQuotes(customSymbols);
      
      // Convert quotes to watchlist items
      const items: WatchlistItem[] = quotes.map(quote => {
        const config = ASSET_CONFIG[quote.symbol];
        const spread = quote.ask && quote.bid ? quote.ask - quote.bid : 0;
        const spreadPercent = quote.price ? (spread / quote.price) * 100 : 0;
        
        return {
          ...quote,
          name: config?.name || quote.symbol,
          assetClass: (config?.assetClass || "stock") as AssetClass,
          bid: quote.price * 0.9999,
          ask: quote.price * 1.0001,
          spread,
          spreadPercent,
          volume24h: quote.volume,
          // Stock-specific fields (will be empty for other assets)
          rsi: 50,
          macd: "Neutral" as const,
          sma50: quote.price,
          ema20: quote.price
        };
      });

      setWatchlist(items);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting
  const handleSort = (key: keyof WatchlistItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedWatchlist = useMemo(() => {
    if (!sortConfig.key) return filteredWatchlist;
    return [...filteredWatchlist].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredWatchlist, sortConfig]);

  const SortIcon = ({ column }: { column: keyof WatchlistItem }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUpRight className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDownRight className="h-3 w-3 ml-1 text-primary" />;
  };

  // Format price based on asset class
  const formatPrice = (price: number, symbol: string) => {
    // Forex pairs usually show 4-5 decimals
    if (symbol.includes("/")) {
      return price.toFixed(symbol.includes("JPY") ? 2 : 5);
    }
    // Crypto shows more decimals for small prices
    if (price < 1) return price.toFixed(6);
    if (price < 10) return price.toFixed(4);
    return price.toFixed(2);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Market Watch</CardTitle>
            <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
              <Activity className="h-3 w-3 animate-pulse" />
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button size="sm" variant="ghost" onClick={fetchQuotes} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Symbol
            </Button>
          </div>
        </div>

        {/* Asset Class Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          <TabButton 
            label="All" 
            icon={<BarChart2 className="h-4 w-4" />} 
            active={activeTab === "all"} 
            onClick={() => setActiveTab("all")} 
          />
          <TabButton 
            label="Stocks" 
            icon={<TrendingUp className="h-4 w-4" />} 
            active={activeTab === "stock"} 
            onClick={() => setActiveTab("stock")} 
          />
          <TabButton 
            label="Forex" 
            icon={<DollarSign className="h-4 w-4" />} 
            active={activeTab === "forex"} 
            onClick={() => setActiveTab("forex")} 
          />
          <TabButton 
            label="Crypto" 
            icon={<Bitcoin className="h-4 w-4" />} 
            active={activeTab === "crypto"} 
            onClick={() => setActiveTab("crypto")} 
          />
          <TabButton 
            label="Commodities" 
            icon={<Activity className="h-4 w-4" />} 
            active={activeTab === "commodity"} 
            onClick={() => setActiveTab("commodity")} 
          />
          <TabButton 
            label="Indices" 
            icon={<Globe className="h-4 w-4" />} 
            active={activeTab === "index"} 
            onClick={() => setActiveTab("index")} 
          />
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('symbol')}>
                Symbol <SortIcon column="symbol" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('assetClass')}>
                Asset <SortIcon column="assetClass" />
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('price')}>
                Price <SortIcon column="price" />
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('changePercent')}>
                24h % <SortIcon column="changePercent" />
              </TableHead>
              <TableHead className="text-right">Spread</TableHead>
              <TableHead className="text-right">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWatchlist.map((item) => (
              <TableRow key={item.symbol} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{item.symbol}</span>
                    <AssetBadge assetClass={item.assetClass} />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.name}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  ${formatPrice(item.price, item.symbol)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.changePercent >= 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">+{item.changePercent.toFixed(2)}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                        <span className="text-red-500">{item.changePercent.toFixed(2)}%</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {item.assetClass === "forex" && (
                    <SpreadIndicator spread={item.spread || 0} percent={item.spreadPercent || 0} />
                  )}
                  {item.assetClass !== "forex" && (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {item.volume24h || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sortedWatchlist.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No assets in this category
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-5 gap-4 text-sm">
            <StatBox 
              label="Stocks" 
              value={watchlist.filter(w => w.assetClass === "stock").length}
              color="text-green-400"
            />
            <StatBox 
              label="Forex" 
              value={watchlist.filter(w => w.assetClass === "forex").length}
              color="text-blue-400"
            />
            <StatBox 
              label="Crypto" 
              value={watchlist.filter(w => w.assetClass === "crypto").length}
              color="text-orange-400"
            />
            <StatBox 
              label="Commodities" 
              value={watchlist.filter(w => w.assetClass === "commodity").length}
              color="text-amber-400"
            />
            <StatBox 
              label="Indices" 
              value={watchlist.filter(w => w.assetClass === "index").length}
              color="text-purple-400"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabButton({ 
  label, 
  icon, 
  active, 
  onClick 
}: { 
  label: string; 
  icon: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
        ${active 
          ? "bg-primary/20 text-primary border border-primary/30" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default MultiAssetWatchlist;
