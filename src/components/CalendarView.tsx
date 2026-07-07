import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  HelpCircle,
  Activity,
  Plus
} from 'lucide-react';
import { Trade } from '../types';

interface CalendarViewProps {
  trades: Trade[];
  usdToBrlRate: number;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onOpenNewTradeModal: () => void;
}

export default function CalendarView({ 
  trades, 
  usdToBrlRate, 
  onEditTrade, 
  onDeleteTrade,
  onOpenNewTradeModal 
}: CalendarViewProps) {
  
  // July 2026 is our active month
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed, 6 = July
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-07');

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Calculate day-by-day stats
  const getBrlVal = (t: Trade) => {
    return t.currency === 'BRL' ? t.financialResult : t.financialResult * usdToBrlRate;
  };

  const getDayStats = (dateStr: string) => {
    const dayTrades = trades.filter(t => t.date === dateStr);
    const profit = dayTrades.reduce((sum, t) => sum + getBrlVal(t), 0);
    return {
      count: dayTrades.length,
      profit
    };
  };

  // Generate July 2026 Days (July 2026 starts on Wednesday, 31 days)
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays = [];
  
  // Fill empty prepending spaces
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }

  // Fill actual days
  for (let d = 1; d <= daysCount; d++) {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      dateString: dayStr
    });
  }

  const selectedDayTrades = trades.filter(t => t.date === selectedDate);
  const selectedDayStats = getDayStats(selectedDate);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div id="calendar-view" className="p-4 space-y-4 overflow-y-auto h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header */}
      <div id="calendar-header" className="border-b border-zinc-800 pb-3">
        <h2 className="font-sans font-bold text-xl text-white tracking-tight">Calendario de Operaciones</h2>
        <p className="text-zinc-400 text-xs mt-0.5">Análisis cronológico visual. Identifica patrones según el día de la semana y resultados consolidados.</p>
      </div>

      {/* Main Calendar split layout */}
      <div id="calendar-split-container" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Left 2 Cols: The Grid Calendar */}
        <div className="lg:col-span-2 bg-zinc-900 rounded border border-zinc-800 p-4 space-y-4">
          
          {/* Month selector bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">
                {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button 
                id="btn-prev-month"
                onClick={handlePrevMonth} 
                className="p-1 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button 
                id="btn-next-month"
                onClick={handleNextMonth} 
                className="p-1 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 text-center font-mono text-[9px] font-bold text-zinc-500 tracking-wider">
            {daysOfWeek.map(d => (
              <div key={d}>{d.toUpperCase()}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-16 bg-transparent" />;
              }

              const stats = getDayStats(day.dateString);
              const isSelected = selectedDate === day.dateString;
              
              // Coloring logic
              let bgClass = 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700';
              let textAccentClass = 'text-zinc-500';

              if (stats.count > 0) {
                if (stats.profit > 0) {
                  bgClass = isSelected 
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400 scale-[0.98] ring-1 ring-emerald-500 shadow-md' 
                    : 'bg-[#10b981]/10 border-emerald-500/20 text-emerald-400 hover:bg-[#10b981]/15';
                  textAccentClass = 'text-emerald-500 font-bold';
                } else if (stats.profit < 0) {
                  bgClass = isSelected 
                    ? 'bg-rose-950 border-rose-500 text-rose-400 scale-[0.98] ring-1 ring-rose-500 shadow-md' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15';
                  textAccentClass = 'text-rose-500 font-bold';
                } else {
                  bgClass = isSelected 
                    ? 'bg-zinc-800 border-zinc-500 text-white' 
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-300';
                  textAccentClass = 'text-zinc-400';
                }
              } else {
                if (isSelected) {
                  bgClass = 'bg-zinc-850 border-blue-500 text-white scale-[0.98] ring-1 ring-blue-500';
                }
              }

              return (
                <div
                  id={`calendar-day-${day.dayNumber}`}
                  key={day.dateString}
                  onClick={() => setSelectedDate(day.dateString)}
                  className={`h-16 p-1.5 border rounded flex flex-col justify-between cursor-pointer transition-all duration-150 relative ${bgClass}`}
                >
                  <span className="text-[10px] font-mono font-bold">{day.dayNumber}</span>
                  
                  {stats.count > 0 && (
                    <div className="text-right flex flex-col items-end">
                      <span className={`text-[8px] font-mono leading-none ${textAccentClass}`}>
                        {stats.profit > 0 ? '+' : ''}{stats.profit.toFixed(0)}
                      </span>
                      <span className="text-[7px] font-mono text-zinc-500 mt-0.5">
                        {stats.count} T
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Color meaning legend bar */}
          <div className="flex items-center space-x-4 text-[10px] font-mono text-zinc-500 pt-1 justify-center">
            <div className="flex items-center space-x-1.5">
              <div className="h-2.5 w-2.5 rounded bg-emerald-500/10 border border-emerald-500/20" />
              <span>Ganancias</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="h-2.5 w-2.5 rounded bg-rose-500/10 border border-rose-500/20" />
              <span>Pérdidas</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="h-2.5 w-2.5 rounded bg-zinc-950 border border-zinc-800" />
              <span>Sin operaciones</span>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Day detail logs */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-sans font-bold text-sm text-white">Detalle de Sesión</h3>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 mt-1 inline-block">
              {selectedDate}
            </span>

            {/* Selected day summary */}
            <div className="mt-3 p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-1 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Operaciones:</span>
                <span className="text-white font-bold">{selectedDayStats.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Resultado Neto:</span>
                <span className={`font-bold ${selectedDayStats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedDayStats.profit >= 0 ? '+' : ''}
                  R$ {selectedDayStats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Listed trades on selected day */}
            <div className="mt-4 space-y-2 overflow-y-auto max-h-[40vh]">
              {selectedDayTrades.map((t) => (
                <div key={t.id} className="p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white">{t.asset}</span>
                    <span className={t.financialResult >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                      {t.financialResult >= 0 ? '+' : ''}
                      {t.currency === 'BRL' ? 'R$' : '$'} {t.financialResult.toLocaleString(t.currency === 'BRL' ? 'pt-BR' : 'en-US')}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-zinc-400 space-y-0.5 font-mono">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-2.5 w-2.5 text-zinc-500" />
                      <span>{t.time} ({t.timeframe}) • {t.side}</span>
                    </div>
                    <div>Estrategia: {t.strategy}</div>
                    <div>Psicología: <span className="font-semibold text-zinc-300 bg-zinc-800 px-1.5 py-0.2 rounded text-[9px]">{t.emotionBefore}</span></div>
                  </div>

                  <div className="flex justify-end space-x-1.5 pt-1 border-t border-zinc-850">
                    <button 
                      id={`btn-cal-edit-${t.id}`}
                      onClick={() => onEditTrade(t)}
                      className="text-[9px] text-zinc-400 hover:text-blue-400 font-bold"
                    >
                      Editar
                    </button>
                    <span className="text-zinc-800">|</span>
                    <button 
                      id={`btn-cal-del-${t.id}`}
                      onClick={() => {
                        if (confirm('¿Eliminar esta operación?')) onDeleteTrade(t.id);
                      }}
                      className="text-[9px] text-zinc-400 hover:text-rose-400 font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {selectedDayTrades.length === 0 && (
                <div className="py-8 text-center text-zinc-500 font-mono text-[10px] border border-dashed border-zinc-800 rounded">
                  Sin operaciones registradas.
                </div>
              )}
            </div>
          </div>

          {selectedDayTrades.length === 0 && (
            <button
              id="btn-cal-quick-add"
              onClick={onOpenNewTradeModal}
              className="w-full flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition text-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3px]" />
              <span>Registrar en esta fecha</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
