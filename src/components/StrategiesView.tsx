import React, { useState } from 'react';
import { Strategy, Trade } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  TrendingUp, 
  Activity, 
  Check, 
  AlertTriangle,
  Info,
  Award,
  DollarSign
} from 'lucide-react';

interface StrategiesViewProps {
  strategies: Strategy[];
  trades: Trade[];
  onSaveStrategy: (strategy: Strategy) => Promise<Strategy | null>;
  onDeleteStrategy: (id: string) => Promise<boolean>;
  usdToBrlRate: number;
}

export default function StrategiesView({ 
  strategies, 
  trades, 
  onSaveStrategy, 
  onDeleteStrategy,
  usdToBrlRate
}: StrategiesViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultSetup, setDefaultSetup] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper to calculate statistics for a specific strategy name
  const getStrategyStats = (stratName: string) => {
    const stratTrades = trades.filter(t => 
      t.strategy && t.strategy.trim().toLowerCase() === stratName.trim().toLowerCase()
    );
    
    const total = stratTrades.length;
    if (total === 0) return { total: 0, winRate: 0, profitBRL: 0, profitUSD: 0 };

    const wins = stratTrades.filter(t => t.financialResult > 0).length;
    const winRate = (wins / total) * 100;

    // Financial calculations
    const profitBRL = stratTrades
      .filter(t => t.currency === 'BRL')
      .reduce((sum, t) => sum + t.financialResult, 0);

    const profitUSD = stratTrades
      .filter(t => t.currency === 'USD')
      .reduce((sum, t) => sum + t.financialResult, 0);

    return {
      total,
      winRate: Math.round(winRate),
      profitBRL,
      profitUSD
    };
  };

  // Find best performing strategy by total combined BRL profit
  const getBestStrategy = () => {
    if (strategies.length === 0) return null;
    
    let bestStrat: Strategy | null = null;
    let bestProfitCombined = -Infinity;

    strategies.forEach(s => {
      const stats = getStrategyStats(s.name);
      const combined = stats.profitBRL + (stats.profitUSD * usdToBrlRate);
      if (stats.total > 0 && combined > bestProfitCombined) {
        bestProfitCombined = combined;
        bestStrat = s;
      }
    });

    return bestStrat ? { strategy: bestStrat, profit: bestProfitCombined } : null;
  };

  const bestStratData = getBestStrategy();

  const handleEditInit = (strat: Strategy) => {
    setEditingId(strat.id);
    setName(strat.name);
    setDescription(strat.description || '');
    setDefaultSetup(strat.defaultSetup || '');
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setDefaultSetup('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('El nombre de la estrategia es obligatorio.');
      return;
    }

    const stratData: Strategy = {
      id: editingId || `s-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      defaultSetup: defaultSetup.trim(),
    };

    const saved = await onSaveStrategy(stratData);
    if (saved) {
      setSuccess(editingId ? 'Estrategia actualizada correctamente.' : 'Estrategia creada correctamente.');
      setName('');
      setDescription('');
      setDefaultSetup('');
      setEditingId(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('Ocurrió un error al guardar la estrategia.');
    }
  };

  const handleDelete = async (id: string, stratName: string) => {
    const usageCount = trades.filter(t => 
      t.strategy && t.strategy.trim().toLowerCase() === stratName.trim().toLowerCase()
    ).length;

    const confirmMsg = usageCount > 0 
      ? `Esta estrategia tiene ${usageCount} operación(es) registrada(s). Si la eliminas, las operaciones seguirán existiendo pero perderán la referencia de la estrategia. ¿Estás seguro de que deseas eliminarla?`
      : `¿Estás seguro de que deseas eliminar la estrategia "${stratName}"?`;

    if (window.confirm(confirmMsg)) {
      const ok = await onDeleteStrategy(id);
      if (ok) {
        setSuccess('Estrategia eliminada con éxito.');
        setTimeout(() => setSuccess(null), 3000);
        if (editingId === id) {
          handleCancelEdit();
        }
      } else {
        setError('No se pudo eliminar la estrategia.');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 font-sans text-zinc-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-400 font-mono font-bold uppercase tracking-wider mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Planificación & Backtesting</span>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight">
            Creador & Gestor de Estrategias
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Crea, analiza y personaliza tus sistemas de trading. Las estrategias creadas aquí estarán disponibles inmediatamente al registrar o modificar operaciones.
          </p>
        </div>
      </div>

      {/* Strategy Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-lg flex items-center space-x-4">
          <div className="p-3 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 font-mono uppercase">ESTRATEGIAS TOTALES</div>
            <div className="text-xl font-mono font-bold mt-0.5">{strategies.length}</div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-lg flex items-center space-x-4">
          <div className="p-3 rounded bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 font-mono uppercase">ESTRATEGIA ESTRELLA</div>
            <div className="text-xs font-bold mt-0.5 truncate text-zinc-100 max-w-[180px]">
              {bestStratData ? bestStratData.strategy.name : 'N/A'}
            </div>
            {bestStratData && (
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                R$ {bestStratData.profit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} netos
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-lg flex items-center space-x-4">
          <div className="p-3 rounded bg-cyan-600/10 text-cyan-400 border border-cyan-500/20">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 font-mono uppercase">TRADES VINCULADOS</div>
            <div className="text-xl font-mono font-bold mt-0.5">
              {trades.filter(t => t.strategy).length} / {trades.length}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/50 text-rose-400 rounded flex items-center space-x-2 text-xs font-mono">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 rounded flex items-center space-x-2 text-xs font-mono">
          <Check className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Strategies List (2 Columns on Large Screens) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-sm text-zinc-300 flex items-center space-x-2 mb-2">
            <span>Tus Sistemas de Trading</span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 rounded">
              {strategies.length}
            </span>
          </h3>

          {strategies.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded bg-zinc-950">
              <Info className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">No hay estrategias creadas en el sistema.</p>
              <p className="text-[10px] text-zinc-600 mt-1">Crea tu primera estrategia usando el formulario de la derecha.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategies.map((strat) => {
                const stats = getStrategyStats(strat.name);
                const combinedProfitBRL = stats.profitBRL + (stats.profitUSD * usdToBrlRate);
                
                return (
                  <div 
                    key={strat.id} 
                    className="bg-zinc-900/30 border border-zinc-800 rounded p-4 flex flex-col justify-between hover:border-zinc-700 transition"
                  >
                    <div>
                      {/* Strat Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-zinc-100 truncate flex items-center space-x-2">
                            <span>{strat.name}</span>
                          </h4>
                          {strat.defaultSetup && (
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 font-mono rounded bg-zinc-800 text-zinc-400 max-w-full truncate">
                              Setup: {strat.defaultSetup}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleEditInit(strat)}
                            title="Editar estrategia"
                            className="p-1 rounded bg-zinc-800/60 text-zinc-400 hover:text-white transition cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(strat.id, strat.name)}
                            title="Eliminar estrategia"
                            className="p-1 rounded bg-zinc-800/60 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Strat Description */}
                      <p className="text-[11px] text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                        {strat.description || 'Sin descripción detallada.'}
                      </p>
                    </div>

                    {/* Strat Stats Info */}
                    <div className="mt-5 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2">
                      <div className="text-center bg-zinc-950/40 rounded py-1.5 px-1">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase leading-none">TRADES</div>
                        <div className="text-xs font-mono font-bold text-zinc-300 mt-1">{stats.total}</div>
                      </div>
                      
                      <div className="text-center bg-zinc-950/40 rounded py-1.5 px-1">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase leading-none">WIN RATE</div>
                        <div className={`text-xs font-mono font-bold mt-1 ${
                          stats.total === 0 
                            ? 'text-zinc-500' 
                            : stats.winRate >= 60 
                            ? 'text-emerald-400' 
                            : stats.winRate >= 40 
                            ? 'text-yellow-400' 
                            : 'text-rose-400'
                        }`}>
                          {stats.total > 0 ? `${stats.winRate}%` : '-'}
                        </div>
                      </div>

                      <div className="text-center bg-zinc-950/40 rounded py-1.5 px-1">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase leading-none">RESULTADO</div>
                        <div className={`text-[10px] font-mono font-bold mt-1 truncate ${
                          stats.total === 0
                            ? 'text-zinc-500'
                            : combinedProfitBRL > 0
                            ? 'text-emerald-400'
                            : combinedProfitBRL < 0
                            ? 'text-rose-400'
                            : 'text-zinc-400'
                        }`}>
                          {stats.total > 0 
                            ? `${combinedProfitBRL > 0 ? '+' : ''}R$ ${Math.round(combinedProfitBRL)}`
                            : 'R$ 0'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Creator / Editor Form (1 Column) */}
        <div className="bg-zinc-900/20 border border-zinc-800 rounded p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-display font-bold text-xs text-zinc-300 uppercase tracking-wider">
              {editingId ? 'Editar Estrategia' : 'Crear Estrategia'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition cursor-pointer font-bold uppercase"
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Strategy Name */}
            <div>
              <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">NOMBRE DE LA ESTRATEGIA *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. Pullback de Medias Móviles"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Default Setup */}
            <div>
              <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">SETUP / GATILLO SUGERIDO</label>
              <input
                type="text"
                value={defaultSetup}
                onChange={(e) => setDefaultSetup(e.target.value)}
                placeholder="Ej. Pinbar en promedio de 20 / Engolfo"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">DESCRIPCIÓN OPERATIVA</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe la lógica operativa de este sistema (ej. condiciones de entrada, objetivos, filtros de volumen...)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              {editingId ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5px]" />
                  <span>Guardar Cambios</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 stroke-[2.5px]" />
                  <span>Crear Estrategia</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
