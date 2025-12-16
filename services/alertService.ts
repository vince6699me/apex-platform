import { toast } from "sonner";
import { RiskAlert } from "../types";

export interface Alert {
  id: string;
  symbol: string;
  type: string;
  condition: string;
  value: number;
  currentValue?: number;
  message: string;
  isActive: boolean;
  triggered: boolean;
  createdAt: number;
}

class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private listeners: Set<(alerts: Alert[]) => void> = new Set();

  createAlert(alert: Omit<Alert, 'id' | 'triggered' | 'createdAt'>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: Alert = { ...alert, id, triggered: false, createdAt: Date.now() };
    this.alerts.set(id, newAlert);
    this.notifyListeners();
    toast.success('Alert Created', { description: `Alert set for ${alert.symbol}` });
    return id;
  }

  getAlerts(): Alert[] { return Array.from(this.alerts.values()); }
  
  deleteAlert(id: string) {
    this.alerts.delete(id);
    this.notifyListeners();
  }

  toggleAlert(id: string) {
    const a = this.alerts.get(id);
    if (a) { a.isActive = !a.isActive; this.alerts.set(id, a); this.notifyListeners(); }
  }

  checkAlert(symbol: string, currentValue: number, previousValue?: number) {
    this.alerts.forEach(alert => {
      if (alert.symbol === symbol && alert.isActive && !alert.triggered) {
        if (alert.condition === 'above' && currentValue > alert.value) {
          alert.triggered = true;
          this.notifyListeners();
          toast.warning(`Alert: ${alert.symbol}`, { description: alert.message });
        }
      }
    });
  }

  subscribe(listener: (alerts: Alert[]) => void) {
    this.listeners.add(listener);
    listener(this.getAlerts());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.getAlerts()));
  }
}

export const alertService = new AlertService();