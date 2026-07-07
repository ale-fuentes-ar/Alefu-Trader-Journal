import React, { useState } from 'react';
import { 
  Target, 
  ShieldAlert, 
  Save, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  AlertCircle
} from 'lucide-react';
import { Trade, TradingGoal } from '../types';

interface GoalsViewProps {
  trades: Trade[];
  goals: TradingGoal[];
  onSaveGoals: (updatedGoals: TradingGoal[]) => void;
  usdToBrlRate: number;
}

export default function GoalsView({ trades, goals, onSaveGoals, usdToBrlRate }: GoalsViewProps) {
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Form states initialized with current goals or default arrays
  const [formGoals, setFormGoals] = useState<TradingGoal[]>(goals);

  const handleGoalChange = (index: number, field: keyof TradingGoal, value: number) => {
    const updated = [...formGoals];
    updated[index] = { ...updated[index], [field]: value };
    setFormGoals(updated);
  };

  const handleSave = () => {
    onSaveGoals(formGoals);
    setEditing(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Calculate current progress dynamically from trade log
  const todayStr = '2026-07-07';
  const getTradeDate = (t: Trade) => new Date(`${t.date}T00:00:00`);

  // Filtering functions
  const isToday = (t: Trade) => t.date === todayStr;
  const isThisWeek = (t: Trade) => {
    const tradeTime = getTradeDate(t).getTime();
    const limitTime = new Date('2026-07-01T00:00:00').getTime();
    return tradeTime >= limitTime;
  };
  const isThisMonth = (t: Trade) => t.date.startsWith('2026-07');
  const isThisYear = (t: Trade) => t.date.startsWith('2026');

  const getProfit = (platform: 'ProfitPRO' | 'MT5', filterFn: (t: Trade) => boolean) => {
    return trades
      .filter(t => t.platform === platform && filterFn(t))
      .reduce((sum, t) => sum + t.financialResult, 0);
  };

  const periods = [
    { key: 'diaria', label: 'Diaria', filter: isToday },
    { key: 'semanal', label: 'Semanal', filter: isThisWeek },
    { key: 'mensual', label: 'Mensual', filter: isThisMonth },
    { key: 'anual', label: 'Anual', filter: isThisYear }
  ];

  return (
    <div id="goals-view" className="p-4 space-y-4 overflow-y-auto h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header */}
      <div id="goals-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div>
          <h2 className="font-sans font-bold text-xl text-white tracking-tight">Objetivos de Consistencia</h2>
          <p className="text-zinc-400 text-xs mt-0.5">Configura tus límites de pérdida (drawdown) y metas de ganancia para blindar tu capital.</p>
        </div>
        
        <button
          id="btn-edit-goals"
          onClick={() => {
            if (editing) {
              handleSave();
            } else {
              setEditing(true);
            }
          }}
          className={`flex items-center space-x-1.5 font-bold px-3 py-1.5 rounded transition duration-200 text-xs ${
            editing 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white'
          }`}
        >
          {editing ? <Save className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5 text-blue-400" />}
          <span>{editing ? 'Guardar Cambios' : 'Ajustar Metas'}</span>
        </button>
      </div>

      {successMsg && (
        <div id="goals-success-alert" className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded flex items-center space-x-1.5 text-xs">
          <CheckCircle className="h-4 w-4" />
          <span>¡Tus objetivos operativos han sido actualizados con éxito!</span>
        </div>
      )}

      {/* Main progress panels */}
      <div id="goals-progress-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* ProfitPRO Goals progress */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 space-y-4">
          <div className="flex items-center space-x-2 text-white">
            <div className="p-1.5 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Objetivos ProfitPRO (BRL)</h3>
              <p className="text-[10px] text-zinc-400">Progreso operativo acumulado en el mercado brasileño.</p>
            </div>
          </div>

          <div className="space-y-3">
            {periods.map((p, idx) => {
              const goalObj = goals.find(g => g.period === p.key) || formGoals[idx];
              const achieved = getProfit('ProfitPRO', p.filter);
              const target = goalObj.targetBRL;
              const lossLimit = goalObj.lossLimitBRL;
              
              // Progress percentage
              const percent = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
              const progressColor = achieved >= 0 ? 'bg-emerald-500' : 'bg-rose-500';

              return (
                <div key={p.key} className="space-y-1.5 p-3 bg-zinc-950 rounded border border-zinc-800">
                  <div className="flex justify-between text-[10px] font-mono font-bold">
                    <span className="text-zinc-400 capitalize">META {p.label}</span>
                    <span className={achieved >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      R$ {achieved.toLocaleString('pt-BR')} / R$ {target.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.max(0, percent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <span>Límite de Pérdida: R$ {lossLimit.toLocaleString('pt-BR')}</span>
                    <span className={achieved >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {achieved >= 0 ? `${percent.toFixed(0)}% Alcanzado` : `Drawdown Activo`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MT5 Goals progress */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 space-y-4">
          <div className="flex items-center space-x-2 text-white">
            <div className="p-1.5 bg-blue-950/20 border border-blue-500/20 rounded text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Objetivos MetaTrader 5 (USD)</h3>
              <p className="text-[10px] text-zinc-400">Progreso operativo acumulado en Forex & Criptomonedas.</p>
            </div>
          </div>

          <div className="space-y-3">
            {periods.map((p, idx) => {
              const goalObj = goals.find(g => g.period === p.key) || formGoals[idx];
              const achieved = getProfit('MT5', p.filter);
              const target = goalObj.targetUSD;
              const lossLimit = goalObj.lossLimitUSD;
              
              // Progress percentage
              const percent = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
              const progressColor = achieved >= 0 ? 'bg-emerald-500' : 'bg-rose-500';

              return (
                <div key={p.key} className="space-y-1.5 p-3 bg-zinc-950 rounded border border-zinc-800">
                  <div className="flex justify-between text-[10px] font-mono font-bold">
                    <span className="text-zinc-400 capitalize">META {p.label}</span>
                    <span className={achieved >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      $ {achieved.toLocaleString('en-US')} / $ {target.toLocaleString('en-US')} USD
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.max(0, percent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <span>Límite de Pérdida: $ {lossLimit.toLocaleString('en-US')} USD</span>
                    <span className={achieved >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {achieved >= 0 ? `${percent.toFixed(0)}% Alcanzado` : `Drawdown Activo`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Editing Form Panel */}
      {editing && (
        <div id="goals-editing-panel" className="bg-zinc-900 rounded border border-blue-500/30 p-4 space-y-4 animate-fade-in">
          <div>
            <h3 className="font-sans font-bold text-sm text-white">Configuración Detallada de Objetivos</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Modifica los valores ideales de Target y Límites de Drawdown para cada horizonte temporal.</p>
          </div>

          <div className="space-y-3">
            {formGoals.map((g, index) => (
              <div key={g.period} className="p-3 bg-zinc-950 rounded border border-zinc-800 space-y-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider block">META {g.period}</span>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Target BRL */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-zinc-500 mb-1">TARGET BRL (ProfitPRO)</label>
                    <input
                      type="number"
                      value={g.targetBRL}
                      onChange={(e) => handleGoalChange(index, 'targetBRL', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {/* Loss Limit BRL */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-zinc-500 mb-1">LIMITE LOSS BRL (ProfitPRO)</label>
                    <input
                      type="number"
                      value={g.lossLimitBRL}
                      onChange={(e) => handleGoalChange(index, 'lossLimitBRL', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {/* Target USD */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-zinc-500 mb-1">TARGET USD (MT5)</label>
                    <input
                      type="number"
                      value={g.targetUSD}
                      onChange={(e) => handleGoalChange(index, 'targetUSD', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {/* Loss Limit USD */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-zinc-500 mb-1">LIMITE LOSS USD (MT5)</label>
                    <input
                      type="number"
                      value={g.lossLimitUSD}
                      onChange={(e) => handleGoalChange(index, 'lossLimitUSD', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormGoals(goals);
                }}
                className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold px-3 py-1.5 rounded text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center space-x-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Aplicar Configuración</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defensive mindset box */}
      <div id="goals-defensive-mindset-banner" className="p-3 bg-blue-500/5 border border-blue-500/10 rounded flex items-start space-x-3">
        <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs block">Importancia de la Defensa Operativa</span>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Los traders consistentes no son aquellos que más ganan, sino los que menos pierden en sus días malos. 
            Tener tus <strong>Límites de Pérdida Diarios y Semanales</strong> cargados en el diario te ayuda a generar alertas automáticas de drawdown y recordarte cuándo suspender actividades (por ejemplo, después de alcanzar tu límite de pérdida diaria de 2 operaciones fallidas consecutivas).
          </p>
        </div>
      </div>

    </div>
  );
}
