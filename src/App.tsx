import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  CloudLightning, 
  Database, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import StatsView from './components/StatsView';
import CalendarView from './components/CalendarView';
import GoalsView from './components/GoalsView';
import ImportView from './components/ImportView';
import AICopilot from './components/AICopilot';
import { Trade, TradingGoal } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'trades' | 'stats' | 'calendar' | 'goals' | 'import' | 'ai'>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [usdToBrlRate, setUsdToBrlRate] = useState<number>(5.65); // Real-time exchange rate
  
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load exchange rate
        const rateRes = await fetch('/api/rate');
        const rateData = await rateRes.json();
        if (rateData && rateData.rate) {
          setUsdToBrlRate(rateData.rate);
        }

        // Load trades
        const tradesRes = await fetch('/api/trades');
        const tradesData = await tradesRes.json();
        setTrades(tradesData || []);

        // Load goals
        const goalsRes = await fetch('/api/goals');
        const goalsData = await goalsRes.json();
        setGoals(goalsData || []);
      } catch (err) {
        console.error('Error fetching data from API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save or update trade
  const handleSaveTrade = async (tradeData: Trade) => {
    try {
      const isEdit = !!editingTrade;
      const url = isEdit ? `/api/trades/${tradeData.id}` : '/api/trades';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      });

      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setTrades(trades.map(t => t.id === saved.id ? saved : t));
        } else {
          setTrades([saved, ...trades]);
        }
        setIsTradeModalOpen(false);
        setEditingTrade(null);
      } else {
        alert('Ocurrió un error al guardar la transacción.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete trade
  const handleDeleteTrade = async (id: string) => {
    try {
      const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTrades(trades.filter(t => t.id !== id));
      } else {
        alert('No se pudo eliminar la transacción.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Edit modal
  const handleEditTradeTrigger = (trade: Trade) => {
    setEditingTrade(trade);
    setIsTradeModalOpen(true);
  };

  // Update objectives (goals)
  const handleSaveGoals = async (updatedGoals: TradingGoal[]) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGoals)
      });
      if (res.ok) {
        const saved = await res.json();
        setGoals(saved);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Import trades from files
  const handleImportComplete = async (importedTrades: Trade[]) => {
    // Save to server sequentially or let server handle bulk
    try {
      const savedTrades: Trade[] = [];
      for (const t of importedTrades) {
        const res = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t)
        });
        if (res.ok) {
          const saved = await res.json();
          savedTrades.push(saved);
        }
      }
      setTrades([...savedTrades, ...trades]);
    } catch (err) {
      console.error('Error importing bulk trades:', err);
    }
  };

  // Clear all trades
  const handleClearAllTrades = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/trades', { method: 'DELETE' });
      if (res.ok) {
        setTrades([]);
        return true;
      } else {
        alert('No se pudo limpiar la base de datos.');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Trigger manual Backup
  const handleManualBackup = async () => {
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBackupMsg(`Copia de seguridad guardada con éxito: ${data.file}`);
        setTimeout(() => setBackupMsg(null), 4000);
      } else {
        setBackupMsg('Fallo al crear la copia de seguridad.');
        setTimeout(() => setBackupMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white space-y-4">
        <Database className="h-12 w-12 text-blue-500 animate-bounce" />
        <span className="font-mono text-xs font-bold tracking-widest text-zinc-500">CARGANDO BASE DE DATOS OPERATIVA...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-zinc-950 text-zinc-300">
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeView={activeView}
        onViewChange={setActiveView}
        trades={trades}
        goals={goals}
        usdToBrlRate={usdToBrlRate}
        onOpenNewTrade={() => {
          setEditingTrade(null);
          setIsTradeModalOpen(true);
        }}
        onTriggerBackup={handleManualBackup}
      />

      {/* Main active view container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Backup alerts notification hub */}
        {backupMsg && (
          <div className="absolute top-4 right-4 z-50 p-4 bg-blue-950/20 border border-blue-900/50 text-blue-400 rounded flex items-center space-x-2 text-xs font-mono font-bold shadow-lg animate-fade-in">
            <CheckCircle className="h-4 w-4" />
            <span>{backupMsg}</span>
          </div>
        )}

        {activeView === 'dashboard' && (
          <Dashboard 
            trades={trades}
            goals={goals}
            usdToBrlRate={usdToBrlRate}
            onOpenNewTrade={() => {
              setEditingTrade(null);
              setIsTradeModalOpen(true);
            }}
            onNavigateToView={setActiveView}
          />
        )}

        {activeView === 'trades' && (
          <TradeList 
            trades={trades}
            onEditTrade={handleEditTradeTrigger}
            onDeleteTrade={handleDeleteTrade}
            usdToBrlRate={usdToBrlRate}
          />
        )}

        {activeView === 'stats' && (
          <StatsView 
            trades={trades}
            usdToBrlRate={usdToBrlRate}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView 
            trades={trades}
            usdToBrlRate={usdToBrlRate}
            onEditTrade={handleEditTradeTrigger}
            onDeleteTrade={handleDeleteTrade}
            onOpenNewTradeModal={() => {
              setEditingTrade(null);
              setIsTradeModalOpen(true);
            }}
          />
        )}

        {activeView === 'goals' && (
          <GoalsView 
            trades={trades}
            goals={goals}
            onSaveGoals={handleSaveGoals}
            usdToBrlRate={usdToBrlRate}
          />
        )}

        {activeView === 'import' && (
          <ImportView 
            onImportComplete={handleImportComplete}
            onClearAllTrades={handleClearAllTrades}
            usdToBrlRate={usdToBrlRate}
          />
        )}

        {activeView === 'ai' && (
          <AICopilot />
        )}

      </div>

      {/* Modal Popup Container for Trade Recording/Form */}
      {isTradeModalOpen && (
        <div id="trade-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-950 rounded border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-500" />
                <h3 className="font-display font-bold text-sm text-zinc-100">
                  {editingTrade ? 'Modificar Operación Registrada' : 'Registrar Nueva Operación'}
                </h3>
              </div>
              
              <button 
                id="btn-close-modal"
                onClick={() => {
                  setIsTradeModalOpen(false);
                  setEditingTrade(null);
                }}
                className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Render Form */}
            <div className="p-6">
              <TradeForm 
                onSave={handleSaveTrade} 
                editingTrade={editingTrade || undefined} 
                usdToBrlRate={usdToBrlRate}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
