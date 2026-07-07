export interface Trade {
  id: string;
  // General Info
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  platform: 'ProfitPRO' | 'MT5';
  market: string; // "Nacional" (Brazilian) or "Internacional"
  asset: string; // WIN, WDO, EURUSD, XAUUSD, BTCUSD, etc.
  assetType: string; // Mini Índice, Mini Dólar, Acciones, Forex, Oro, Commodities, etc.
  side: 'Compra' | 'Venta';
  timeframe: string; // 1m, 5m, 15m, 1H, etc.
  
  // Technical Info
  strategy: string; // Pullback, Breakout, Fading, VWAP, Support/Resistance, etc.
  setup: string; // Gatillo, Pinbar, Engolfo, etc.
  trend: 'Alcista' | 'Bajista' | 'Lateral';
  confirmations: string[]; // List of checklist items satisfied
  entryReason: string;
  exitReason: string;
  
  // Risk Management
  capital: number; // Capital at trade start
  riskPercent: number; // Planned risk %
  stopLoss: number; // Stop loss value (price level or points)
  takeProfit: number; // Take profit value
  rMultiple: number; // R-Multiple realized (e.g. +2.0 R, -1.0 R)
  size: number; // Contracts or Lots (e.g. 5 contracts of WIN, 0.1 lots of EURUSD)
  
  // Results
  currency: 'BRL' | 'USD'; // ProfitPRO uses BRL, MT5 uses USD
  financialResult: number; // Profit or loss in native currency (e.g. +150 BRL, -20 USD)
  pointsResult: number; // Result in points (pips for Forex)
  ticksResult: number; // Result in ticks
  percentResult: number; // Realized return % on capital
  
  // Psychology
  emotionBefore: 'Calmado' | 'Ansioso' | 'Codicioso' | 'Asustado' | 'Impaciente';
  confidenceBefore: number; // 1 to 5
  stressBefore: number; // 1 to 5
  anxietyBefore: number; // 1 to 5
  
  feelAfter: string;
  learned: string;
  toRepeat: string;
  toAvoid: string;
  
  // Evidences & Notes
  images: string[]; // Base64 or object URL of graphics
  observations: string;
  
  // Meta
  exchangeRateUsed: number; // USD to BRL exchange rate on this trade's day
  createdAt: string;
}

export interface TradingGoal {
  period: 'diaria' | 'semanal' | 'mensual' | 'anual';
  targetBRL: number;
  lossLimitBRL: number;
  targetUSD: number;
  lossLimitUSD: number;
}

export interface ExchangeRate {
  rate: number; // USD to BRL (e.g. 5.50 means 1 USD = 5.50 BRL)
  date: string; // YYYY-MM-DD
}

export interface TradeBackup {
  timestamp: string;
  tradeCount: number;
  description: string;
}
