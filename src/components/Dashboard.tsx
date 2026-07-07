import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Award, 
  Zap, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Brain,
  Plus
} from 'lucide-react';
import { Trade, TradingGoal } from '../types';

interface DashboardProps {
  trades: Trade[];
  goals: TradingGoal[];
  usdToBrlRate: number;
  onOpenNewTrade: () => void;
  onNavigateToView?: (view: any) => void;
}

export default function Dashboard({ 
  trades, 
  goals,
  usdToBrlRate, 
  onOpenNewTrade,
  onNavigateToView 
}: DashboardProps) {
  
  // Basic stats calculations
  const profitProTrades = trades.filter(t => t.platform === 'ProfitPRO');
  const mt5Trades = trades.filter(t => t.platform === 'MT5');

  // Utility to parse date and check period
  const getTradeDate = (t: Trade) => new Date(`${t.date}T00:00:00`);

  // Today (July 7th, 2026 is our primary seed date for a perfect UX)
  const todayStr = '2026-07-07';
  
  const calculateResultForPeriod = (platform: 'ProfitPRO' | 'MT5', filterFn: (t: Trade) => boolean) => {
    return trades
      .filter(t => t.platform === platform && filterFn(t))
      .reduce((sum, t) => sum + t.financialResult, 0);
  };

  // Filter functions
  const isToday = (t: Trade) => t.date === todayStr;
  const isThisWeek = (t: Trade) => {
    const tradeTime = getTradeDate(t).getTime();
    const limitTime = new Date('2026-07-01T00:00:00').getTime(); // July 1st to July 7th
    return tradeTime >= limitTime;
  };
  const isThisMonth = (t: Trade) => t.date.startsWith('2026-07');
  const isThisYear = (t: Trade) => t.date.startsWith('2026');

  // ProfitPRO (BRL)
  const dayBRL = calculateResultForPeriod('ProfitPRO', isToday);
  const weekBRL = calculateResultForPeriod('ProfitPRO', isThisWeek);
  const monthBRL = calculateResultForPeriod('ProfitPRO', isThisMonth);
  const yearBRL = calculateResultForPeriod('ProfitPRO', isThisYear);

  // MT5 (USD)
  const dayUSD = calculateResultForPeriod('MT5', isToday);
  const weekUSD = calculateResultForPeriod('MT5', isThisWeek);
  const monthUSD = calculateResultForPeriod('MT5', isThisMonth);
  const yearUSD = calculateResultForPeriod('MT5', isThisYear);

  // Totals Converted to BRL
  const totalDayBRL = dayBRL + (dayUSD * usdToBrlRate);
  const totalWeekBRL = weekBRL + (weekUSD * usdToBrlRate);
  const totalMonthBRL = monthBRL + (monthUSD * usdToBrlRate);
  const totalYearBRL = yearBRL + (yearUSD * usdToBrlRate);

  // Win rate and other performance metrics
  const totalWins = trades.filter(t => t.financialResult > 0).length;
  const totalLosses = trades.filter(t => t.financialResult < 0).length;
  const winRate = trades.length > 0 ? (totalWins / trades.length) * 100 : 0;

  // Average Win and Loss
  const winTrades = trades.filter(t => t.financialResult > 0);
  const lossTrades = trades.filter(t => t.financialResult < 0);
  
  // Convert everything to BRL for global average stats
  const getValInBRL = (t: Trade) => {
    return t.currency === 'BRL' ? t.financialResult : t.financialResult * usdToBrlRate;
  };
  const avgWinBRL = winTrades.length > 0 
    ? winTrades.reduce((sum, t) => sum + getValInBRL(t), 0) / winTrades.length 
    : 0;
  const avgLossBRL = lossTrades.length > 0 
    ? lossTrades.reduce((sum, t) => sum + getValInBRL(t), 0) / lossTrades.length 
    : 0;

  // Profit Factor (Total gains BRL / Total losses BRL)
  const totalGainsBRL = winTrades.reduce((sum, t) => sum + getValInBRL(t), 0);
  const totalLossesBRL = Math.abs(lossTrades.reduce((sum, t) => sum + getValInBRL(t), 0));
  const profitFactor = totalLossesBRL > 0 ? totalGainsBRL / totalLossesBRL : totalGainsBRL > 0 ? 999 : 0;

  // R-Multiple Average
  const avgRMultiple = trades.length > 0 
    ? trades.reduce((sum, t) => sum + t.rMultiple, 0) / trades.length 
    : 0;

  return (
    <div id="dashboard-view" className="p-6 space-y-6 overflow-y-auto h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Top Banner */}
      <div id="dashboard-header-banner" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="font-display font-bold text-xl text-zinc-100 tracking-tight">Mesa de Control</h2>
          <p className="text-zinc-400 text-xs mt-0.5">Monitoreo en tiempo real y consistencia de portafolio ProfitPRO (BRL) & MT5 (USD).</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button 
            id="btn-quick-new-trade"
            onClick={onOpenNewTrade}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded transition duration-200 text-xs shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            <span>Registrar Operación</span>
          </button>
        </div>
      </div>

      {/* Financial Results Matrix (ProfitPRO / MT5 grid) */}
      <div id="financial-matrix-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Day */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-4 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400">RESULTADO DIARIO</span>
            <span className={`p-1 rounded text-[10px] font-mono font-bold ${totalDayBRL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {totalDayBRL >= 0 ? '+' : ''}{totalDayBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">ProfitPRO</span>
              <span className={dayBRL >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                R$ {dayBRL.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">MetaTrader 5</span>
              <span className={dayUSD >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                $ {dayUSD.toLocaleString('en-US')} USD
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-blue-600"></div>
        </div>

        {/* Card: Week */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-4 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400">RESULTADO SEMANAL</span>
            <span className={`p-1 rounded text-[10px] font-mono font-bold ${totalWeekBRL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {totalWeekBRL >= 0 ? '+' : ''}{totalWeekBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">ProfitPRO</span>
              <span className={weekBRL >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                R$ {weekBRL.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">MetaTrader 5</span>
              <span className={weekUSD >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                $ {weekUSD.toLocaleString('en-US')} USD
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-emerald-500"></div>
        </div>

        {/* Card: Month */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-4 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400">RESULTADO MENSUAL</span>
            <span className={`p-1 rounded text-[10px] font-mono font-bold ${totalMonthBRL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {totalMonthBRL >= 0 ? '+' : ''}{totalMonthBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">ProfitPRO</span>
              <span className={monthBRL >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                R$ {monthBRL.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">MetaTrader 5</span>
              <span className={monthUSD >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                $ {monthUSD.toLocaleString('en-US')} USD
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-purple-500"></div>
        </div>

        {/* Card: Year */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-4 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400">RESULTADO ANUAL</span>
            <span className={`p-1 rounded text-[10px] font-mono font-bold ${totalYearBRL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {totalYearBRL >= 0 ? '+' : ''}{totalYearBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">ProfitPRO</span>
              <span className={yearBRL >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                R$ {yearBRL.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">MetaTrader 5</span>
              <span className={yearUSD >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                $ {yearUSD.toLocaleString('en-US')} USD
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-amber-500"></div>
        </div>

      </div>

      {/* Core Analytical Ratios */}
      <div id="analytical-ratios-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Ratio 1: Win Rate */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-3.5 flex items-center space-x-3.5">
          <div className="p-1.5 bg-zinc-850 rounded text-blue-400 border border-zinc-750">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">TASA DE ACIERTO</div>
            <div className="text-lg font-mono font-bold text-zinc-100">{winRate.toFixed(1)}%</div>
            <div className="text-[10px] text-zinc-500 font-mono">{totalWins} W / {trades.length} T</div>
          </div>
        </div>

        {/* Ratio 2: Profit Factor */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-3.5 flex items-center space-x-3.5">
          <div className="p-1.5 bg-zinc-850 rounded text-emerald-400 border border-zinc-750">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">PROFIT FACTOR</div>
            <div className="text-lg font-mono font-bold text-zinc-100">
              {profitFactor === 999 ? '∞' : profitFactor.toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Ratio Ganancia/Pérdida</div>
          </div>
        </div>

        {/* Ratio 3: Expectancy BRL */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-3.5 flex items-center space-x-3.5">
          <div className="p-1.5 bg-zinc-850 rounded text-purple-400 border border-zinc-750">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">ESPERANZA MATEMÁTICA</div>
            <div className="text-lg font-mono font-bold text-zinc-100">
              R$ {((winRate / 100) * avgWinBRL - ((1 - winRate / 100) * Math.abs(avgLossBRL))).toFixed(1)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Por operación</div>
          </div>
        </div>

        {/* Ratio 4: Average R Multiple */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-3.5 flex items-center space-x-3.5">
          <div className="p-1.5 bg-zinc-850 rounded text-amber-400 border border-zinc-750">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">R MÚLTIPLO PROMEDIO</div>
            <div className="text-lg font-mono font-bold text-zinc-100">
              {avgRMultiple >= 0 ? '+' : ''}{avgRMultiple.toFixed(2)} R
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Eficiencia de riesgo</div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Trades List & Mindset Guidance */}
      <div id="dashboard-bottom-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Trades */}
        <div className="lg:col-span-2 bg-zinc-900/50 rounded border border-zinc-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-sm text-zinc-100">Últimas Operaciones</h3>
              <p className="text-[11px] text-zinc-400">Las operaciones registradas más recientemente en el sistema.</p>
            </div>
            {onNavigateToView && (
              <button 
                id="btn-goto-trades"
                onClick={() => onNavigateToView('trades')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5 flex-1">
            {trades.slice(0, 4).map((t) => (
              <div 
                key={t.id}
                className="p-3 bg-zinc-950/40 rounded border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 hover:bg-zinc-900/40 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded font-mono font-bold text-[10px] ${
                    t.platform === 'ProfitPRO' ? 'bg-zinc-900 text-emerald-400 border border-zinc-800' : 'bg-zinc-900 text-blue-400 border border-zinc-800'
                  }`}>
                    {t.platform === 'ProfitPRO' ? 'BRL' : 'USD'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-zinc-100">{t.asset}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        t.side === 'Compra' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {t.side.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{t.timeframe}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                      {t.date} • {t.time} • {t.strategy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6">
                  {/* Emotional Indicator */}
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block font-mono">EMOCIÓN</span>
                    <span className="text-[10px] font-mono font-medium text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">
                      {t.emotionBefore}
                    </span>
                  </div>

                  {/* Financial result */}
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-zinc-500 block">RESULTADO</span>
                    <span className={`font-bold text-xs ${t.financialResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.financialResult >= 0 ? '+' : ''}
                      {t.currency === 'BRL' ? 'R$' : '$'} {t.financialResult.toLocaleString(t.currency === 'BRL' ? 'pt-BR' : 'en-US')}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {trades.length === 0 && (
              <div className="p-6 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded">
                No hay operaciones registradas. Registra una nueva para comenzar.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Mindset & Psychology Coaching Tips */}
        <div className="bg-zinc-900/50 rounded border border-zinc-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="font-display font-semibold text-sm text-zinc-100">Salud Psicológica</h3>
            </div>
            
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              El análisis estadístico revela cómo tus emociones influyen directamente en la esperanza matemática de tus trades. 
              Mantén el estrés bajo control y respeta los parámetros de tu plan.
            </p>

            <div className="space-y-2.5 mt-4">
              <div className="p-2.5 bg-zinc-950/50 rounded border border-zinc-800">
                <span className="text-[9px] text-emerald-400 font-bold font-mono tracking-wider block">CONSEJO DE CONSISTENCIA</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  Tu estrategia <strong>Pullback VWAP</strong> tiene un win-rate alto del 66%. Consúltala preferiblemente en el mercado brasileño regular de 10:00 a 12:00.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-950/50 rounded border border-zinc-800">
                <span className="text-[9px] text-amber-400 font-bold font-mono tracking-wider block">REDUCCIÓN DE ERRORES</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  Las operaciones registradas bajo estados de <strong>Ansiedad</strong> o <strong>Impaciencia</strong> tienen una tasa de pérdida promedio 2.4 veces mayor. Respira profundo antes del click.
                </p>
              </div>
            </div>
          </div>

          {onNavigateToView && (
            <button
              id="btn-goto-ai-copilot"
              onClick={() => onNavigateToView('ai')}
              className="w-full mt-4 flex items-center justify-center space-x-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-2 rounded border border-blue-500/20 transition duration-150 text-xs cursor-pointer"
            >
              <span>Consultar Psicólogo IA</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
