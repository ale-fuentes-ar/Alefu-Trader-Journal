import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  BarChart3, 
  Target, 
  Calendar, 
  UploadCloud, 
  Bot, 
  Plus,
  TrendingUp,
  Globe,
  Database,
  Layers
} from 'lucide-react';
import { Trade, TradingGoal } from '../types';

interface SidebarProps {
  activeView: 'dashboard' | 'trades' | 'stats' | 'calendar' | 'goals' | 'import' | 'ai' | 'strategies';
  onViewChange: (view: any) => void;
  trades: Trade[];
  goals: TradingGoal[];
  usdToBrlRate: number;
  onOpenNewTrade: () => void;
  onTriggerBackup: () => void;
}

export default function Sidebar({ 
  activeView, 
  onViewChange, 
  trades,
  goals,
  usdToBrlRate,
  onOpenNewTrade,
  onTriggerBackup
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trades', label: 'Operaciones', icon: History },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'strategies', label: 'Estrategias', icon: Layers },
    { id: 'goals', label: 'Objetivos', icon: Target },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'import', label: 'Importación', icon: UploadCloud },
    { id: 'ai', label: 'Trader Copilot AI', icon: Bot, badge: 'IA' },
  ];

  // Dynamic balance calculations
  const totalBalanceBRL = trades
    .filter(t => t.currency === 'BRL')
    .reduce((sum, t) => sum + t.financialResult, 0);

  const totalBalanceUSD = trades
    .filter(t => t.currency === 'USD')
    .reduce((sum, t) => sum + t.financialResult, 0);

  const totalCombinedBRL = totalBalanceBRL + (totalBalanceUSD * usdToBrlRate);

  return (
    <aside id="sidebar-container" className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen text-zinc-300 font-sans shrink-0">
      {/* Brand Header */}
      <div id="sidebar-header" className="p-6 border-b border-zinc-800 flex items-center space-x-3">
        <div className="p-2 bg-blue-600 rounded text-white shadow-sm">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-base text-zinc-100 leading-none">TraderJournal</h1>
          <span className="text-[10px] text-blue-400 font-mono tracking-wider font-semibold">PRO EDITION</span>
        </div>
      </div>

      {/* Equity Overview Card */}
      <div id="sidebar-equity-card" className="p-4 mx-4 my-5 bg-zinc-900/50 rounded border border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="font-medium">PATRIMONIO ACUMULADO</span>
          <Globe className="h-3 w-3 text-zinc-500" />
        </div>
        <div className="text-xl font-mono font-bold text-zinc-100 leading-tight">
          R$ {totalCombinedBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center space-x-1 justify-between">
          <span>≈ $ {(totalCombinedBRL / usdToBrlRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded font-bold">1$ = R${usdToBrlRate}</span>
        </div>
      </div>

      {/* Primary Action Button: New Trade */}
      <div className="px-4 mb-4">
        <button
          id="btn-sidebar-new-trade"
          onClick={onOpenNewTrade}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2 rounded transition duration-150 text-xs shadow-md"
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span>Registrar Trade</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav id="sidebar-navigation" className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded text-xs font-medium transition-all duration-200 group cursor-pointer ${
                isActive 
                  ? 'bg-zinc-900 text-blue-400 border border-zinc-800 shadow-[0_0_15px_rgba(59,130,246,0.05)] font-bold' 
                  : 'hover:bg-zinc-900/40 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-2 py-0.5 font-bold rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Backups Panel */}
      <div className="px-4 mb-4">
        <button
          id="btn-sidebar-backup"
          onClick={onTriggerBackup}
          className="w-full flex items-center justify-center space-x-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold py-2 rounded transition text-[10px] font-mono uppercase tracking-wider cursor-pointer"
          title="Crear copia de seguridad manual de tus operaciones"
        >
          <Database className="h-3.5 w-3.5 text-cyan-400" />
          <span>Backup Manual</span>
        </button>
      </div>

      {/* Footer Branding */}
      <div id="sidebar-footer" className="p-4 border-t border-zinc-800 text-center text-[10px] text-zinc-500 font-mono">
        <div>TRADER JOURNAL PRO</div>
        <div className="text-zinc-600 mt-0.5">Notion & Bloomberg Inspired</div>
      </div>
    </aside>
  );
}
