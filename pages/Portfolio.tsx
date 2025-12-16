import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "../components/ui/primitives";
import { MarketDataService } from "../services/marketData";

export default function Portfolio() {
  const positions = MarketDataService.generatePositions();
  const totalValue = positions.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Portfolio</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Value</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">${totalValue.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Cash</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">$25,000</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Day Change</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-500">+$1,240 (1.2%)</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Positions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Symbol</TableHead><TableHead className="text-right">Shares</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">P&L</TableHead></TableRow></TableHeader>
            <TableBody>
              {positions.map(p => (
                <TableRow key={p.symbol}>
                  <TableCell className="font-bold">{p.symbol}</TableCell>
                  <TableCell className="text-right">{p.shares}</TableCell>
                  <TableCell className="text-right">${p.value.toLocaleString()}</TableCell>
                  <TableCell className={`text-right ${p.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>${p.pnl.toLocaleString()} ({p.pnlPercent.toFixed(2)}%)</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}