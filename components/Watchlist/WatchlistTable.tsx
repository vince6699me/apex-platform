import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button } from "../ui/primitives";
import { ArrowUpRight, ArrowDownRight, Plus, ArrowUpDown, Activity } from "lucide-react";
import { MarketDataService } from "../../services/marketData";
import { WatchlistItem } from "../../types";
import { wsService } from "../../services/websocketService";

export function WatchlistTable() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof WatchlistItem | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Initial Load
    const initialList = MarketDataService.generateWatchlist();
    setWatchlist(initialList);
    setIsLive(true);

    // WebSocket Handler
    const handleQuote = (quote: any) => {
      setWatchlist(current => current.map(item => {
        if (item.symbol === quote.symbol) {
          return {
            ...item,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            // Simple logic to update volume if provided, or keep existing
            volume: quote.volume || item.volume
          };
        }
        return item;
      }));
    };

    // Subscribe
    initialList.forEach(item => {
      wsService.subscribe(`quote:${item.symbol}`, handleQuote);
    });

    return () => {
      initialList.forEach(item => {
        wsService.unsubscribe(`quote:${item.symbol}`, handleQuote);
      });
    };
  }, []);

  const handleSort = (key: keyof WatchlistItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedWatchlist = useMemo(() => {
    if (!sortConfig.key) return watchlist;
    return [...watchlist].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [watchlist, sortConfig]);

  const SortIcon = ({ column }: { column: keyof WatchlistItem }) => {
      if (sortConfig.key !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground opacity-30" />;
      return sortConfig.direction === 'asc' ? <ArrowUpRight className="h-3 w-3 ml-1 text-primary" /> : <ArrowDownRight className="h-3 w-3 ml-1 text-primary" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <CardTitle>Watchlist</CardTitle>
            {isLive && <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 gap-1 animate-pulse"><Activity className="h-3 w-3" /> Live</Badge>}
        </div>
        <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Symbol</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('symbol')}>Symbol <SortIcon column="symbol" /></TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>Name <SortIcon column="name" /></TableHead>
              <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('price')}>Price <SortIcon column="price" /></TableHead>
              <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('changePercent')}>Change <SortIcon column="changePercent" /></TableHead>
              <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('rsi')}>RSI <SortIcon column="rsi" /></TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('macd')}>MACD <SortIcon column="macd" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWatchlist.map((item) => (
              <TableRow key={item.symbol}>
                <TableCell className="font-mono font-bold">{item.symbol}</TableCell>
                <TableCell className="text-muted-foreground">{item.name}</TableCell>
                <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.change > 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                    <span className={item.change > 0 ? "text-green-500" : "text-red-500"}>{item.changePercent.toFixed(2)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{item.rsi.toFixed(1)}</TableCell>
                <TableCell><Badge variant={item.macd === "Bullish" ? "default" : item.macd === "Bearish" ? "destructive" : "secondary"}>{item.macd}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}