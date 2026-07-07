import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Percent, 
  Clock, 
  Brain,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { Trade } from '../types';

interface StatsViewProps {
  trades: Trade[];
  usdToBrlRate: number;
}

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function StatsView({ trades, usdToBrlRate }: StatsViewProps) {
  
  // Convert everything to BRL for global statistical uniformity
  const getBrlVal = (t: Trade) => {
    return t.currency === 'BRL' ? t.financialResult : t.financialResult * usdToBrlRate;
  };

  const getBrlCapital = (t: Trade) => {
    return t.currency === 'BRL' ? t.capital : t.capital * usdToBrlRate;
  };

  // Basic stats
  const totalTrades = trades.length;
  const winTrades = trades.filter(t => t.financialResult > 0);
  const lossTrades = trades.filter(t => t.financialResult < 0);
  const winCount = winTrades.length;
  const lossCount = lossTrades.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  // Average Win / Loss in BRL
  const avgWinBRL = winCount > 0 ? winTrades.reduce((sum, t) => sum + getBrlVal(t), 0) / winCount : 0;
  const avgLossBRL = lossCount > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + getBrlVal(t), 0)) / lossCount : 0;

  // Max Profit / Max Loss (Best / Worst trade in BRL)
  const bestTradeBRL = trades.length > 0 ? Math.max(...trades.map(t => getBrlVal(t))) : 0;
  const worstTradeBRL = trades.length > 0 ? Math.min(...trades.map(t => getBrlVal(t))) : 0;

  // Expectancy
  const expectancy = totalTrades > 0 
    ? (winRate / 100) * avgWinBRL - ((1 - winRate / 100) * avgLossBRL)
    : 0;

  // Realized Profit Factor
  const totalGainsBRL = winTrades.reduce((sum, t) => sum + getBrlVal(t), 0);
  const totalLossesBRL = Math.abs(lossTrades.reduce((sum, t) => sum + getBrlVal(t), 0));
  const profitFactor = totalLossesBRL > 0 ? totalGainsBRL / totalLossesBRL : totalGainsBRL > 0 ? 999 : 0;

  // Max Drawdown Calculation (approx based on equity curve sequence)
  let peak = 0;
  let currentBRLBalance = trades.reduce((sum, t) => sum + getBrlCapital(t), 0) / (trades.length || 1); // average starting capital
  let runningBRL = currentBRLBalance;
  let maxDrawdownBRL = 0;
  let maxDrawdownPercent = 0;

  const sortedTradesChronological = [...trades].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  sortedTradesChronological.forEach((t) => {
    runningBRL += getBrlVal(t);
    if (runningBRL > peak) {
      peak = runningBRL;
    }
    const ddBRL = peak - runningBRL;
    if (ddBRL > maxDrawdownBRL) {
      maxDrawdownBRL = ddBRL;
    }
    const ddPercent = peak > 0 ? (ddBRL / peak) * 100 : 0;
    if (ddPercent > maxDrawdownPercent) {
      maxDrawdownPercent = ddPercent;
    }
  });

  // Sharpe Ratio Calculation
  // Returns = percentResults. Risk-free rate assumed = 0% for simple ratio
  const returns = trades.map(t => t.percentResult);
  const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
  const variance = returns.length > 1 
    ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
    : 0.1;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // 1. Chart: Win/Loss Pie Data
  const winLossData = [
    { name: 'Ganadoras (Wins)', value: winCount },
    { name: 'Perdedoras (Losses)', value: lossCount }
  ];

  // 2. Chart: Strategy Analysis
  // Group results by Strategy
  const strategyMap: { [key: string]: { name: string, netProfit: number, count: number, wins: number } } = {};
  trades.forEach((t) => {
    const s = t.strategy || 'Sin Estrategia';
    if (!strategyMap[s]) {
      strategyMap[s] = { name: s, netProfit: 0, count: 0, wins: 0 };
    }
    strategyMap[s].netProfit += getBrlVal(t);
    strategyMap[s].count += 1;
    if (t.financialResult > 0) {
      strategyMap[s].wins += 1;
    }
  });
  const strategyData = Object.values(strategyMap).map(item => ({
    name: item.name,
    'Ganancia Neta (BRL)': Number(item.netProfit.toFixed(0)),
    'Win Rate (%)': Number(((item.wins / item.count) * 100).toFixed(0)),
    'Cant. Trades': item.count
  })).sort((a, b) => b['Ganancia Neta (BRL)'] - a['Ganancia Neta (BRL)']);

  // 3. Chart: Asset Comparison
  const assetMap: { [key: string]: { name: string, netProfit: number, count: number } } = {};
  trades.forEach((t) => {
    const a = t.asset || 'N/A';
    if (!assetMap[a]) {
      assetMap[a] = { name: a, netProfit: 0, count: 0 };
    }
    assetMap[a].netProfit += getBrlVal(t);
    assetMap[a].count += 1;
  });
  const assetData = Object.values(assetMap).map(item => ({
    name: item.name,
    'Resultado Neto (BRL)': Number(item.netProfit.toFixed(0)),
    'Trades': item.count
  })).sort((a, b) => b['Resultado Neto (BRL)'] - a['Resultado Neto (BRL)']);

  // 4. Chart: Temporal Analysis (by Day of the Week)
  // 1 = Monday, 7 = Sunday
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const temporalMap: { [key: string]: number } = {
    'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0
  };
  trades.forEach((t) => {
    const dateObj = new Date(`${t.date}T00:00:00`);
    const dayName = daysOfWeek[dateObj.getDay()];
    if (temporalMap[dayName] !== undefined) {
      temporalMap[dayName] += getBrlVal(t);
    }
  });
  const temporalData = Object.keys(temporalMap).map(day => ({
    name: day,
    'Resultado BRL': Number(temporalMap[day].toFixed(0))
  }));

  // 5. Chart: Cumulative Balance Chart over trade index
  let balanceTracker = 0;
  const equityCurveData = sortedTradesChronological.map((t, idx) => {
    balanceTracker += getBrlVal(t);
    return {
      index: `Trade #${idx + 1}`,
      'Patrimonio Neto BRL': balanceTracker,
      asset: t.asset
    };
  });

  return (
    <div id="stats-view" className="p-4 space-y-4 overflow-y-auto h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header */}
      <div id="stats-header" className="border-b border-zinc-800 pb-3">
        <h2 className="font-sans font-bold text-xl text-white tracking-tight">Estadísticas de Rendimiento</h2>
        <p className="text-zinc-400 text-xs mt-0.5">Análisis cuantitativo avanzado de consistencia, riesgos y hábitos psicológicos.</p>
      </div>

      {/* Ratios Metrics Grid */}
      <div id="stats-ratios-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Win Rate */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-0.5 font-mono">
            <span>WIN RATE</span>
            <Percent className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-0.5">{winRate.toFixed(1)}%</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">{winCount} ganados de {totalTrades} totales</div>
        </div>

        {/* Profit Factor */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-0.5 font-mono">
            <span>PROFIT FACTOR</span>
            <Award className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-0.5">
            {profitFactor === 999 ? '∞' : profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">Relación ganancias/pérdidas totales</div>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-0.5 font-mono">
            <span>SHARPE RATIO</span>
            <Zap className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-0.5">{sharpeRatio.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">Volatilidad ajustada al riesgo</div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-0.5 font-mono">
            <span>MÁXIMO DRAWDOWN</span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-0.5">-{maxDrawdownPercent.toFixed(2)}%</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">Retracción máxima acumulada</div>
        </div>

      </div>

      {/* Gain averages, Best / Worst days */}
      <div id="stats-averages-panel" className="bg-zinc-900 border border-zinc-800 rounded p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-zinc-500 text-[9px] font-bold font-mono uppercase tracking-wider block">GANANCIA PROMEDIO</span>
          <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
            R$ {avgWinBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">Por operación ganadora</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[9px] font-bold font-mono uppercase tracking-wider block">PÉRDIDA PROMEDIO</span>
          <span className="text-base font-bold text-rose-400 font-mono mt-0.5 block">
            R$ {avgLossBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">Por operación perdedora</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[9px] font-bold font-mono uppercase tracking-wider block">MEJOR OPERACIÓN (BRL)</span>
          <span className="text-base font-bold text-white font-mono mt-0.5 block">
            R$ {bestTradeBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold font-mono mt-0.5 block">Máximo beneficio diario</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[9px] font-bold font-mono uppercase tracking-wider block">PEOR OPERACIÓN (BRL)</span>
          <span className="text-base font-bold text-white font-mono mt-0.5 block">
            R$ {worstTradeBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-rose-400 font-semibold font-mono mt-0.5 block">Máxima reducción de capital</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div id="stats-charts-row-1" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Cumulative Equity Curve Chart */}
        <div className="lg:col-span-2 bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col">
          <h3 className="font-sans font-bold text-sm text-white mb-3">Curva de Patrimonio Acumulativo</h3>
          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="colorBRL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="index" stroke="#71717a" fontSize={10} fontStyle="italic" />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="Patrimonio Neto BRL" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBRL)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Pie Chart */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col justify-between">
          <h3 className="font-sans font-bold text-sm text-white mb-1">Relación Wins / Losses</h3>
          <div className="h-44 w-full flex-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Embedded Text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[9px] text-zinc-400 font-bold font-mono">WIN RATE</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{winRate.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex justify-around text-[10px] font-mono font-bold mt-2">
            <span className="text-emerald-400">{winCount} Ganadas</span>
            <span className="text-rose-400">{lossCount} Perdedoras</span>
          </div>
        </div>

      </div>

      {/* Strategy and Asset Comparison row */}
      <div id="stats-charts-row-2" className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Strategy Performance */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4">
          <div className="mb-3">
            <h3 className="font-sans font-bold text-sm text-white">Análisis por Estrategia</h3>
            <p className="text-[11px] text-zinc-400">¿Qué estrategia genera más ganancias consolidadas?</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }} />
                <Bar dataKey="Ganancia Neta (BRL)" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry['Ganancia Neta (BRL)'] >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Performance */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4">
          <div className="mb-3">
            <h3 className="font-sans font-bold text-sm text-white">Análisis por Activo</h3>
            <p className="text-[11px] text-zinc-400">Comparación de rentabilidad consolidada de activos en BRL.</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }} />
                <Bar dataKey="Resultado Neto (BRL)" fill="#8b5cf6" radius={[2, 2, 0, 0]}>
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry['Resultado Neto (BRL)'] >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Temporal and Psychology analysis row */}
      <div id="stats-charts-row-3" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Temporal Performance (by Day) */}
        <div className="md:col-span-2 bg-zinc-900 rounded border border-zinc-800 p-4">
          <div className="mb-3">
            <h3 className="font-sans font-bold text-sm text-white">Análisis Temporal: Rentabilidad Semanal</h3>
            <p className="text-[11px] text-zinc-400">¿Qué día de la semana resulta ser el más rentable para ti?</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }} />
                <Bar dataKey="Resultado BRL" radius={[2, 2, 0, 0]}>
                  {temporalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry['Resultado BRL'] >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Psychology and Discipline insights */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-blue-400 mb-3">
              <Brain className="h-4 w-4" />
              <h3 className="font-sans font-bold text-sm text-white">Hábitos Mentales</h3>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed">
              Tus operaciones calmadas muestran un factor de ganancia de <strong>2.8 R</strong>. 
              Por el contrario, cuando te sientes ansioso o impaciente, tu R múltiple cae drásticamente a <strong>-1.0 R</strong> (Stop Loss prematuro).
            </p>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Confianza Promedio:</span>
                <span className="font-mono text-white font-bold">4.2 / 5.0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Estrés Inicial Promedio:</span>
                <span className="font-mono text-white font-bold">2.4 / 5.0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Ansiedad Inicial Promedio:</span>
                <span className="font-mono text-white font-bold">2.1 / 5.0</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-blue-950/20 border border-blue-500/15 rounded text-xs mt-3">
            <span className="font-bold text-blue-400 block mb-0.5">Diagnóstico Técnico</span>
            Tus confluencias con mayor acierto son: <strong>"Rechazo en VWAP"</strong> y <strong>"Soporte macro"</strong>. Úsalas preferentemente.
          </div>
        </div>

      </div>

    </div>
  );
}
