import React from "react";
import { WatchlistTable } from "../components/Watchlist/WatchlistTable";

export default function Watchlist() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Watchlist</h1>
      <WatchlistTable />
    </div>
  );
}