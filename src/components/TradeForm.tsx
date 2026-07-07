import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Check, 
  Brain, 
  DollarSign, 
  Activity, 
  ShieldAlert,
  Image as ImageIcon,
  Plus,
  Info
} from 'lucide-react';
import { Trade, Strategy } from '../types';

interface TradeFormProps {
  onSave: (trade: Trade) => void;
  editingTrade?: Trade | null;
  usdToBrlRate: number;
  strategies: Strategy[];
  onSaveStrategy: (strategy: Strategy) => Promise<Strategy | null>;
}

const PRESET_CONFIRMATIONS = [
  'Volumen comprador alto',
  'Rechazo en VWAP / Media',
  'RSI en sobrecompra/sobreventa',
  'Soporte/Resistencia macro fuerte',
  'Patrón de vela gatillo confirmado',
  'Flujo a favor (Order Flow)',
  'Divergencia MACD/RSI',
  'Confluencia de niveles Fibonacci'
];

// Mock evidences for users to choose from
const MOCK_GRAPHICS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=500&auto=format&fit=crop&q=60'
];

export default function TradeForm({ 
  onSave, 
  editingTrade, 
  usdToBrlRate,
  strategies,
  onSaveStrategy
}: TradeFormProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'risk' | 'psychology'>('general');

  // General Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [platform, setPlatform] = useState<'ProfitPRO' | 'MT5'>('ProfitPRO');
  const [market, setMarket] = useState('Nacional');
  const [asset, setAsset] = useState('WIN');
  const [assetType, setAssetType] = useState('Mini Índice');
  const [side, setSide] = useState<'Compra' | 'Venta'>('Compra');
  const [timeframe, setTimeframe] = useState('5m');

  // Technical Form State
  const [strategy, setStrategy] = useState('');
  const [setup, setSetup] = useState('');
  const [trend, setTrend] = useState<'Alcista' | 'Bajista' | 'Lateral'>('Alcista');
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [entryReason, setEntryReason] = useState('');
  const [exitReason, setExitReason] = useState('');

  // Inline Strategy Creator State
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [newStratName, setNewStratName] = useState('');
  const [newStratSetup, setNewStratSetup] = useState('');
  const [newStratDesc, setNewStratDesc] = useState('');
  const [inlineCreatorError, setInlineCreatorError] = useState<string | null>(null);

  // Risk & Results State
  const [capital, setCapital] = useState<number>(15000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [stopLoss, setStopLoss] = useState<number>(100);
  const [takeProfit, setTakeProfit] = useState<number>(200);
  const [rMultiple, setRMultiple] = useState<number>(2.0);
  const [size, setSize] = useState<number>(5);
  const [financialResult, setFinancialResult] = useState<number>(200);
  const [pointsResult, setPointsResult] = useState<number>(200);
  const [ticksResult, setTicksResult] = useState<number>(40);
  const [percentResult, setPercentResult] = useState<number>(1.33);

  // Psychology State
  const [emotionBefore, setEmotionBefore] = useState<'Calmado' | 'Ansioso' | 'Codicioso' | 'Asustado' | 'Impaciente'>('Calmado');
  const [confidenceBefore, setConfidenceBefore] = useState<number>(4);
  const [stressBefore, setStressBefore] = useState<number>(2);
  const [anxietyBefore, setAnxietyBefore] = useState<number>(1);
  const [feelAfter, setFeelAfter] = useState('');
  const [learned, setLearned] = useState('');
  const [toRepeat, setToRepeat] = useState('');
  const [toAvoid, setToAvoid] = useState('');

  // Evidence & Notes
  const [images, setImages] = useState<string[]>([]);
  const [observations, setObservations] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editingTrade) {
      setDate(editingTrade.date);
      setTime(editingTrade.time);
      setPlatform(editingTrade.platform);
      setMarket(editingTrade.market);
      setAsset(editingTrade.asset);
      setAssetType(editingTrade.assetType);
      setSide(editingTrade.side);
      setTimeframe(editingTrade.timeframe);
      setStrategy(editingTrade.strategy);
      setSetup(editingTrade.setup);
      setTrend(editingTrade.trend);
      setConfirmations(editingTrade.confirmations || []);
      setEntryReason(editingTrade.entryReason);
      setExitReason(editingTrade.exitReason);
      setCapital(editingTrade.capital);
      setRiskPercent(editingTrade.riskPercent);
      setStopLoss(editingTrade.stopLoss);
      setTakeProfit(editingTrade.takeProfit);
      setRMultiple(editingTrade.rMultiple);
      setSize(editingTrade.size);
      setFinancialResult(editingTrade.financialResult);
      setPointsResult(editingTrade.pointsResult);
      setTicksResult(editingTrade.ticksResult);
      setPercentResult(editingTrade.percentResult);
      setEmotionBefore(editingTrade.emotionBefore);
      setConfidenceBefore(editingTrade.confidenceBefore);
      setStressBefore(editingTrade.stressBefore);
      setAnxietyBefore(editingTrade.anxietyBefore);
      setFeelAfter(editingTrade.feelAfter || '');
      setLearned(editingTrade.learned || '');
      setToRepeat(editingTrade.toRepeat || '');
      setToAvoid(editingTrade.toAvoid || '');
      setImages(editingTrade.images || []);
      setObservations(editingTrade.observations || '');
    } else {
      // Set defaults for new trade
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().split(' ')[0].slice(0, 5));
    }
  }, [editingTrade]);

  // Handle platform change constraints
  const handlePlatformChange = (p: 'ProfitPRO' | 'MT5') => {
    setPlatform(p);
    if (p === 'ProfitPRO') {
      setMarket('Nacional');
      setAsset('WIN');
      setAssetType('Mini Índice');
      setCapital(15000);
    } else {
      setMarket('Internacional');
      setAsset('EURUSD');
      setAssetType('Forex');
      setCapital(5000);
    }
  };

  const handleStrategyChange = (selectedName: string) => {
    setStrategy(selectedName);
    const matched = strategies.find(s => s.name.trim().toLowerCase() === selectedName.trim().toLowerCase());
    if (matched && matched.defaultSetup) {
      setSetup(matched.defaultSetup);
    }
  };

  const handleSaveInlineStrategy = async (e: React.MouseEvent) => {
    e.preventDefault();
    setInlineCreatorError(null);

    if (!newStratName.trim()) {
      setInlineCreatorError('El nombre es obligatorio.');
      return;
    }

    const duplicate = strategies.some(s => s.name.trim().toLowerCase() === newStratName.trim().toLowerCase());
    if (duplicate) {
      setInlineCreatorError('Ya existe una estrategia con ese nombre.');
      return;
    }

    const newStrat: Strategy = {
      id: `s-${Date.now()}`,
      name: newStratName.trim(),
      defaultSetup: newStratSetup.trim(),
      description: newStratDesc.trim()
    };

    const saved = await onSaveStrategy(newStrat);
    if (saved) {
      setStrategy(saved.name);
      if (saved.defaultSetup) {
        setSetup(saved.defaultSetup);
      }
      // Reset inline creator state
      setNewStratName('');
      setNewStratSetup('');
      setNewStratDesc('');
      setShowInlineCreator(false);
    } else {
      setInlineCreatorError('Error al guardar la estrategia.');
    }
  };

  // Autocalculate values when fields update
  useEffect(() => {
    if (!editingTrade) {
      // Only do automatic math on new insertions to make it easier
      const calcPercent = (financialResult / capital) * 100;
      setPercentResult(Number(calcPercent.toFixed(2)));
    }
  }, [financialResult, capital]);

  const toggleConfirmation = (item: string) => {
    if (confirmations.includes(item)) {
      setConfirmations(confirmations.filter(c => c !== item));
    } else {
      setConfirmations([...confirmations, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tradeData: Trade = {
      id: editingTrade ? editingTrade.id : `t-${Date.now()}`,
      date,
      time,
      platform,
      market,
      asset,
      assetType,
      side,
      timeframe,
      strategy,
      setup,
      trend,
      confirmations,
      entryReason,
      exitReason,
      capital,
      riskPercent,
      stopLoss,
      takeProfit,
      rMultiple,
      size,
      currency: platform === 'ProfitPRO' ? 'BRL' : 'USD',
      financialResult,
      pointsResult,
      ticksResult,
      percentResult,
      emotionBefore,
      confidenceBefore,
      stressBefore,
      anxietyBefore,
      feelAfter,
      learned,
      toRepeat,
      toAvoid,
      images,
      observations,
      exchangeRateUsed: usdToBrlRate,
      createdAt: editingTrade ? editingTrade.createdAt : new Date().toISOString()
    };

    onSave(tradeData);
  };

  return (
    <div className="flex flex-col text-zinc-100 font-sans">
      
      {/* Tab Selection */}
      <div className="border-b border-zinc-800 flex space-x-6 text-xs mb-4 pb-2">
        <button
          type="button"
          id="tab-general"
          onClick={() => setActiveTab('general')}
          className={`py-1.5 font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'general' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          1. Información General & Técnica
        </button>
        <button
          type="button"
          id="tab-risk"
          onClick={() => setActiveTab('risk')}
          className={`py-1.5 font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'risk' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          2. Gestión de Riesgo & Resultados
        </button>
        <button
          type="button"
          id="tab-psychology"
          onClick={() => setActiveTab('psychology')}
          className={`py-1.5 font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'psychology' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          3. Psicología & Evidencias
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* TAB 1: General & Technical */}
        {activeTab === 'general' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Platform Selection */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">PLATAFORMA</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlatformChange('ProfitPRO')}
                    className={`py-1.5 text-xs font-mono font-bold rounded border transition cursor-pointer ${
                      platform === 'ProfitPRO' 
                        ? 'bg-zinc-900 border-blue-500 text-blue-400' 
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    ProfitPRO (BRL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformChange('MT5')}
                    className={`py-1.5 text-xs font-mono font-bold rounded border transition cursor-pointer ${
                      platform === 'MT5' 
                        ? 'bg-zinc-900 border-blue-500 text-blue-400' 
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    MetaTrader 5 (USD)
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">FECHA</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">HORA</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Asset */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">ACTIVO</label>
                <input
                  type="text"
                  value={asset}
                  onChange={(e) => setAsset(e.target.value.toUpperCase())}
                  required
                  placeholder={platform === 'ProfitPRO' ? 'WIN / WDO' : 'EURUSD / XAUUSD'}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">TIPO DE ACTIVO</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {platform === 'ProfitPRO' ? (
                    <>
                      <option>Mini Índice</option>
                      <option>Mini Dólar</option>
                      <option>Acciones</option>
                      <option>Opciones</option>
                      <option>ETFs</option>
                      <option>Contratos Futuros</option>
                    </>
                  ) : (
                    <>
                      <option>Forex</option>
                      <option>Índices</option>
                      <option>Commodities</option>
                      <option>Oro</option>
                      <option>Petróleo</option>
                      <option>Criptomonedas</option>
                      <option>CFDs</option>
                    </>
                  )}
                </select>
              </div>

              {/* Side */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">SENTIDO</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSide('Compra')}
                    className={`py-1.5 text-xs font-bold rounded border transition cursor-pointer ${
                      side === 'Compra' 
                        ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400' 
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('Venta')}
                    className={`py-1.5 text-xs font-bold rounded border transition cursor-pointer ${
                      side === 'Venta' 
                        ? 'bg-rose-950/20 border-rose-500 text-rose-400' 
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    Venta
                  </button>
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">TEMPORALIDAD</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option>1m</option>
                  <option>2m</option>
                  <option>5m</option>
                  <option>15m</option>
                  <option>1H</option>
                  <option>4H</option>
                  <option>1D</option>
                </select>
              </div>

            </div>

            {/* Technical Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
              
              {/* Strategy with Inline Creator option */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold font-mono text-zinc-400">ESTRATEGIA</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineCreator(!showInlineCreator);
                      setInlineCreatorError(null);
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center space-x-1 font-mono cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{showInlineCreator ? 'Cerrar' : 'Nueva'}</span>
                  </button>
                </div>

                {!showInlineCreator ? (
                  <>
                    <select
                      value={strategy}
                      onChange={(e) => handleStrategyChange(e.target.value)}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Seleccionar Estrategia --</option>
                      {strategies.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    {/* Small matched description under dropdown */}
                    {strategy && strategies.find(s => s.name.trim().toLowerCase() === strategy.trim().toLowerCase()) && (
                      <div className="mt-1.5 flex items-start space-x-1 text-[10px] text-zinc-500 leading-tight">
                        <Info className="h-3 w-3 mt-0.5 text-blue-500/70 shrink-0" />
                        <span>
                          {strategies.find(s => s.name.trim().toLowerCase() === strategy.trim().toLowerCase())?.description || 'Sin descripción detallada.'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded p-3 space-y-2.5 z-20 absolute left-0 right-0 top-[100%] mt-1 shadow-2xl">
                    <div className="text-[10px] font-bold text-zinc-300 font-mono border-b border-zinc-800 pb-1">NUEVA ESTRATEGIA RAPIDA</div>
                    {inlineCreatorError && (
                      <div className="text-[9px] text-rose-400 font-mono bg-rose-950/20 border border-rose-900/40 p-1 rounded">
                        {inlineCreatorError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newStratName}
                        onChange={(e) => setNewStratName(e.target.value)}
                        placeholder="Nombre (ej. Fading Extremo)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={newStratSetup}
                        onChange={(e) => setNewStratSetup(e.target.value)}
                        placeholder="Setup/Gatillo sugerido (opcional)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-blue-500"
                      />
                      <textarea
                        value={newStratDesc}
                        onChange={(e) => setNewStratDesc(e.target.value)}
                        placeholder="Descripción de la lógica (opcional)"
                        rows={2}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveInlineStrategy}
                        className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        Crear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInlineCreator(false)}
                        className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Setup */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">SETUP / GATILLO</label>
                <input
                  type="text"
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  required
                  placeholder="Vela envolvente, fallo, pinbar..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Trend */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">TENDENCIA MACRO</label>
                <select
                  value={trend}
                  onChange={(e) => setTrend(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Alcista">🚀 Alcista</option>
                  <option value="Bajista">📉 Bajista</option>
                  <option value="Lateral">⚖️ Lateral</option>
                </select>
              </div>

            </div>

            {/* Confirmations Checklist */}
            <div>
              <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">CONFIRMACIONES TÉCNICAS (CONFLUENCIAS)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {PRESET_CONFIRMATIONS.map((c) => {
                  const checked = confirmations.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleConfirmation(c)}
                      className={`px-2.5 py-1.5 text-left rounded text-xs border transition flex items-center justify-between cursor-pointer ${
                        checked 
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-medium' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="truncate mr-2">{c}</span>
                      {checked && <Check className="h-3 w-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entry & Exit Reasons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">MOTIVO DE ENTRADA</label>
                <textarea
                  rows={3}
                  value={entryReason}
                  onChange={(e) => setEntryReason(e.target.value)}
                  required
                  placeholder="Describe por qué ingresaste a esta operación..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">MOTIVO DE SALIDA</label>
                <textarea
                  rows={3}
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  required
                  placeholder="Describe por qué saliste (target automático, stop, salida manual)..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Button to proceed */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('risk')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-1.5 rounded text-xs cursor-pointer"
              >
                Continuar a Gestión de Riesgo &gt;
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: Risk Management & Results */}
        {activeTab === 'risk' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded flex items-start space-x-3 text-zinc-400 mb-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <div className="text-[10px] font-mono">
                <span className="font-bold block mb-0.5 text-xs text-zinc-200">Gestión de Riesgo Integrada</span>
                Esta sección calcula y audita el tamaño de la posición y la rentabilidad relativa al capital operacional en {platform === 'ProfitPRO' ? 'Reales (BRL)' : 'Dólares (USD)'}.
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Capital */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">
                  CAPITAL OPERACIONAL ({platform === 'ProfitPRO' ? 'R$' : '$'})
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Risk Percent */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">RIESGO ASUMIDO (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Lots / Size */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">
                  {platform === 'ProfitPRO' ? 'CANT. CONTRATOS' : 'LOTES'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* R Multiple */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">R MÚLTIPLO REALIZADO</label>
                <input
                  type="number"
                  step="0.1"
                  value={rMultiple}
                  onChange={(e) => setRMultiple(Number(e.target.value))}
                  required
                  placeholder="e.g. +2.0, -1.0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
              
              {/* Stop Loss */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">STOP LOSS (PUNTOS/PIPS)</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Take Profit */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">TAKE PROFIT (PUNTOS/PIPS)</label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Financial Result */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">
                  RESULTADO FINANCIERO ({platform === 'ProfitPRO' ? 'R$' : '$'})
                </label>
                <input
                  type="number"
                  value={financialResult}
                  onChange={(e) => setFinancialResult(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              {/* Percent Result */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">RETORNO (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={percentResult}
                  onChange={(e) => setPercentResult(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              
              {/* Points Result */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">RESULTADO EN PUNTOS</label>
                <input
                  type="number"
                  value={pointsResult}
                  onChange={(e) => setPointsResult(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Ticks Result */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">RESULTADO EN TICKS</label>
                <input
                  type="number"
                  value={ticksResult}
                  onChange={(e) => setTicksResult(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-200 font-bold px-4 py-1.5 rounded text-xs cursor-pointer"
              >
                &lt; Atrás
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('psychology')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-1.5 rounded text-xs cursor-pointer"
              >
                Continuar a Psicología &gt;
              </button>
            </div>

          </div>
        )}

        {/* TAB 3: Psychology & Evidences */}
        {activeTab === 'psychology' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Psychology Before Section */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                <Brain className="h-4 w-4" />
                <span>Estado Psicológico Antes de Operar (Mindset Inicial)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Dominant Emotion */}
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">EMOCIÓN DOMINANTE</label>
                  <select
                    value={emotionBefore}
                    onChange={(e) => setEmotionBefore(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Calmado">Calmado (Centrado y paciente)</option>
                    <option value="Ansioso">Ansioso (Falta de paciencia)</option>
                    <option value="Codicioso">Codicioso (Buscando revancha o sobreganancia)</option>
                    <option value="Asustado">Asustado (Miedo a perder)</option>
                    <option value="Impaciente">Impaciente (Apresurando gatillos)</option>
                  </select>
                </div>

                {/* Confidence level */}
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5 flex justify-between">
                    <span>NIVEL DE CONFIANZA</span>
                    <span className="font-mono text-blue-400 font-bold text-xs">{confidenceBefore} / 5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={confidenceBefore}
                    onChange={(e) => setConfidenceBefore(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                
                {/* Stress Level */}
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5 flex justify-between">
                    <span>NIVEL DE ESTRÉS</span>
                    <span className="font-mono text-blue-400 font-bold text-xs">{stressBefore} / 5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={stressBefore}
                    onChange={(e) => setStressBefore(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Anxiety Level */}
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5 flex justify-between">
                    <span>NIVEL DE ANSIEDAD</span>
                    <span className="font-mono text-blue-400 font-bold text-xs">{anxietyBefore} / 5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={anxietyBefore}
                    onChange={(e) => setAnxietyBefore(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

              </div>
            </div>

            {/* Psychology After Operating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">¿CÓMO TE SENTISTE DESPUÉS?</label>
                <input
                  type="text"
                  value={feelAfter}
                  onChange={(e) => setFeelAfter(e.target.value)}
                  placeholder="Satisfecho, frustrado..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">¿QUÉ APRENDISTE DE ESTO?</label>
                <input
                  type="text"
                  value={learned}
                  onChange={(e) => setLearned(e.target.value)}
                  placeholder="Tener paciencia, no entrar tarde..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">¿QUÉ DEBERÍAS REPETIR?</label>
                <input
                  type="text"
                  value={toRepeat}
                  onChange={(e) => setToRepeat(e.target.value)}
                  placeholder="Esperar el bloque de órdenes..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">¿QUÉ DEBERÍAS EVITAR?</label>
                <input
                  type="text"
                  value={toAvoid}
                  onChange={(e) => setToAvoid(e.target.value)}
                  placeholder="Sobreapalancarme antes de noticias..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Evidence Section */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <label className="block text-[10px] font-bold font-mono text-zinc-400">EVIDENCIAS GRÁFICAS (CAPTURA DE PANTALLA)</label>
              
              <p className="text-xs text-zinc-500 font-medium">Selecciona uno de los gráficos de análisis técnico cargados o deja vacío:</p>
              
              <div className="grid grid-cols-3 gap-3">
                {MOCK_GRAPHICS.map((imgUrl, i) => {
                  const isSelected = images.includes(imgUrl);
                  return (
                    <div 
                      key={i}
                      onClick={() => {
                        if (isSelected) {
                          setImages(images.filter(img => img !== imgUrl));
                        } else {
                          setImages([...images, imgUrl]);
                        }
                      }}
                      className={`cursor-pointer rounded overflow-hidden border-2 relative h-20 group transition ${
                        isSelected ? 'border-blue-500 scale-95 shadow' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Technical Chart ${i+1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-medium">
                        {isSelected ? '✓ Seleccionado' : `Gráfico ${i+1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Observations */}
            <div>
              <label className="block text-[10px] font-bold font-mono text-zinc-400 mb-1.5">OBSERVACIONES / COMENTARIOS ADICIONALES</label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Detalles sobre deslizamientos de órdenes (slippage), spread, o noticias macros..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Navigation and Save */}
            <div className="flex justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('risk')}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-200 font-bold px-4 py-1.5 rounded text-xs cursor-pointer"
              >
                &lt; Atrás
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-4 py-1.5 rounded transition duration-150 text-xs flex items-center space-x-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Operación</span>
              </button>
            </div>

          </div>
        )}

      </form>
    </div>
  );
}
