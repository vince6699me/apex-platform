import { MarketDataService } from "./marketData";

export class WebSocketService {
  private handlers: Map<string, Set<(data: any) => void>> = new Map();
  private statusHandlers: Set<(status: string) => void> = new Set();
  private interval: any;

  connect() {
    this.notifyStatus('connected');
    this.interval = setInterval(() => {
      this.handlers.forEach((handlers, channel) => {
        if (channel.startsWith('quote:')) {
          const symbol = channel.split(':')[1];
          const quote = MarketDataService.generateQuote(symbol);
          // Add random noise
          quote.price *= (1 + (Math.random() - 0.5) * 0.001);
          handlers.forEach(h => h(quote));
        }
      });
    }, 2000);
  }

  subscribe(channel: string, handler: (data: any) => void) {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);
  }

  unsubscribe(channel: string, handler: (data: any) => void) {
    this.handlers.get(channel)?.delete(handler);
  }

  onConnectionStatus(handler: (status: string) => void) {
    this.statusHandlers.add(handler);
    handler('connected'); // Immediately connected in mock
    return () => this.statusHandlers.delete(handler);
  }

  private notifyStatus(status: string) {
    this.statusHandlers.forEach(h => h(status));
  }
}

export const wsService = new WebSocketService();
wsService.connect();