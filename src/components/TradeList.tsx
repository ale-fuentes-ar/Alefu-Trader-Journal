import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  ChevronDown,
  ExternalLink,
  ChevronUp
} from 'lucide-react';
import { Trade } from '../types';
import { jsPDF } from 'jspdf';

interface TradeListProps {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  usdToBrlRate: number;
}

export default function TradeList({ trades, onEditTrade, onDeleteTrade, usdToBrlRate }: TradeListProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'Todos' | 'ProfitPRO' | 'MT5'>('Todos');
  const [sideFilter, setSideFilter] = useState<'Todos' | 'Compra' | 'Venta'>('Todos');
  const [resultFilter, setResultFilter] = useState<'Todos' | 'Ganancia' | 'Pérdida'>('Todos');
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Filter logic
  const filteredTrades = trades.filter((t) => {
    const matchesSearch = 
      t.asset.toLowerCase().includes(search.toLowerCase()) ||
      t.strategy.toLowerCase().includes(search.toLowerCase()) ||
      t.assetType.toLowerCase().includes(search.toLowerCase());
      
    const matchesPlatform = platformFilter === 'Todos' || t.platform === platformFilter;
    const matchesSide = sideFilter === 'Todos' || t.side === sideFilter;
    
    const matchesResult = 
      resultFilter === 'Todos' || 
      (resultFilter === 'Ganancia' && t.financialResult > 0) || 
      (resultFilter === 'Pérdida' && t.financialResult < 0);

    return matchesSearch && matchesPlatform && matchesSide && matchesResult;
  });

  const toggleExpand = (id: string) => {
    setExpandedTradeId(expandedTradeId === id ? null : id);
  };

  // High reliability CSV Export Utility with UTF-8 BOM for Excel support
  const exportToCSV = () => {
    const headers = [
      'ID', 'Fecha', 'Hora', 'Plataforma', 'Mercado', 'Activo', 'Tipo Activo', 'Lado', 'Timeframe',
      'Estrategia', 'Setup', 'Tendencia', 'Capital', 'Riesgo %', 'Stop Loss', 'Take Profit', 'Multiplo R',
      'Resultado Financiero', 'Moneda', 'Retorno %', 'Emocion Inicial', 'Confianza', 'Observaciones'
    ];
    
    const rows = trades.map(t => [
      t.id, t.date, t.time, t.platform, t.market, t.asset, t.assetType, t.side, t.timeframe,
      t.strategy, t.setup, t.trend, t.capital, t.riskPercent, t.stopLoss, t.takeProfit, t.rMultiple,
      t.financialResult, t.currency, t.percentResult, t.emotionBefore, t.confidenceBefore, t.observations
    ]);

    const csvContent = [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    try {
      // Add UTF-8 BOM so Excel decodes accents and special characters correctly
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `diario_de_trading_completo_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting to CSV:", err);
    }
  };

  // High-reliability PDF export using jsPDF (works perfectly inside iframes)
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Modern dark header
      doc.setFillColor(24, 24, 27); // zinc-900
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('DIARIO DE TRADING - REPORTE DE OPERACIONES', 15, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // zinc-400
      doc.text(`Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  |  Total Operaciones: ${filteredTrades.length}`, 15, 22);
      doc.text(`Tipo de Cambio Referencia: 1 USD = ${usdToBrlRate.toFixed(2)} BRL`, 15, 27);

      let y = 45;

      // Stats Summary Bar
      const totalTrades = filteredTrades.length;
      const winTrades = filteredTrades.filter(t => t.financialResult > 0).length;
      const winRate = totalTrades > 0 ? Math.round((winTrades / totalTrades) * 100) : 0;
      
      const totalBRL = filteredTrades.reduce((sum, t) => {
        const val = t.currency === 'BRL' ? t.financialResult : t.financialResult * usdToBrlRate;
        return sum + val;
      }, 0);

      doc.setFillColor(244, 244, 245); // zinc-100
      doc.rect(15, y, pageWidth - 30, 18, 'F');

      doc.setTextColor(63, 63, 70); // zinc-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('OPERACIONES', 20, y + 6);
      doc.text('TASA DE ACIERTO (WIN RATE)', 75, y + 6);
      doc.text('BALANCE ACUMULADO (BRL)', 135, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(24, 24, 27);
      doc.text(`${totalTrades}`, 20, y + 13);
      
      if (totalTrades > 0) {
        if (winRate >= 50) doc.setTextColor(16, 185, 129); // green
        else doc.setTextColor(220, 38, 38); // red
      }
      doc.text(`${winRate}%`, 75, y + 13);

      if (totalBRL >= 0) doc.setTextColor(16, 185, 129);
      else doc.setTextColor(220, 38, 38);
      doc.text(`R$ ${totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 135, y + 13);

      y += 28;

      // Table Header
      doc.setFillColor(39, 39, 42); // zinc-800
      doc.rect(15, y, pageWidth - 30, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('FECHA', 18, y + 5.5);
      doc.text('ACTIVO', 38, y + 5.5);
      doc.text('LADO', 65, y + 5.5);
      doc.text('ESTRATEGIA', 85, y + 5.5);
      doc.text('MULT. R', 135, y + 5.5);
      doc.text('RESULTADO', 165, y + 5.5);

      y += 8;

      // Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      filteredTrades.forEach((t, index) => {
        // Page boundary check
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 20;

          // Redraw simplified header on new page
          doc.setFillColor(39, 39, 42);
          doc.rect(15, y, pageWidth - 30, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text('FECHA', 18, y + 5.5);
          doc.text('ACTIVO', 38, y + 5.5);
          doc.text('LADO', 65, y + 5.5);
          doc.text('ESTRATEGIA', 85, y + 5.5);
          doc.text('MULT. R', 135, y + 5.5);
          doc.text('RESULTADO', 165, y + 5.5);
          
          y += 8;
          doc.setFont('helvetica', 'normal');
        }

        // Alternating background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, y, pageWidth - 30, 7.5, 'F');
        }

        doc.setTextColor(39, 39, 42);
        doc.text(t.date, 18, y + 5);
        doc.text(t.asset, 38, y + 5);

        // Lado
        if (t.side === 'Compra') doc.setTextColor(16, 185, 129);
        else doc.setTextColor(220, 38, 38);
        doc.text(t.side, 65, y + 5);

        // Strategy
        doc.setTextColor(39, 39, 42);
        const stratShort = t.strategy.length > 28 ? t.strategy.substring(0, 26) + '..' : t.strategy;
        doc.text(stratShort, 85, y + 5);

        // R Multiple
        if (t.rMultiple >= 0) doc.setTextColor(16, 185, 129);
        else doc.setTextColor(220, 38, 38);
        doc.text(`${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(1)} R`, 135, y + 5);

        // Result
        if (t.financialResult >= 0) doc.setTextColor(16, 185, 129);
        else doc.setTextColor(220, 38, 38);
        
        const prefixResult = t.financialResult >= 0 ? '+' : '';
        const symbolResult = t.currency === 'BRL' ? 'R$' : '$';
        doc.text(`${prefixResult}${symbolResult} ${t.financialResult.toLocaleString('pt-BR')}`, 165, y + 5);

        y += 7.5;
      });

      doc.save(`diario_trading_reporte_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback to window.print() if jsPDF encounters unexpected failure
      window.print();
    }
  };  return (
    <div id="trade-list-view" className="p-4 space-y-4 overflow-y-auto h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header and exports */}
      <div id="trade-list-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-white tracking-tight">Registro de Operaciones</h2>
          <p className="text-zinc-400 text-xs mt-0.5">Inspecciona, filtra y descarga el historial completo de transacciones.</p>
        </div>
        
        {/* Reports Download Panel */}
        <div className="flex items-center space-x-2 self-end md:self-auto">
          <button
            id="btn-export-csv"
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold px-3 py-1.5 rounded transition text-xs font-mono"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>EXCEL / CSV</span>
          </button>
          
          <button
            id="btn-print-report"
            onClick={exportToPDF}
            className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold px-3 py-1.5 rounded transition text-xs font-mono"
          >
            <Printer className="h-3.5 w-3.5 text-blue-400" />
            <span>DESCARGAR PDF</span>
          </button>
        </div>
      </div>

      {/* Searching & Filtering Panel */}
      <div id="filter-controls-panel" className="bg-zinc-900 border border-zinc-800 rounded p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por activo, estrategia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Platform Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider shrink-0">PLATAFORMA</span>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos</option>
            <option value="ProfitPRO">ProfitPRO (BRL)</option>
            <option value="MT5">MetaTrader 5 (USD)</option>
          </select>
        </div>

        {/* Side Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider shrink-0">SENTIDO</span>
          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value as any)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos</option>
            <option value="Compra">Compra</option>
            <option value="Venta">Venta</option>
          </select>
        </div>

        {/* Win/Loss Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider shrink-0">RESULTADO</span>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as any)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos</option>
            <option value="Ganancia">Ganancias (Profit)</option>
            <option value="Pérdida">Pérdidas (Loss)</option>
          </select>
        </div>

      </div>

      {/* Trades Table List */}
      <div id="trades-table-container" className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 text-[10px] font-mono tracking-wider">
                <th className="py-2.5 px-4">FECHA / HORA</th>
                <th className="py-2.5 px-4">PLATAFORMA</th>
                <th className="py-2.5 px-4">ACTIVO</th>
                <th className="py-2.5 px-4">OPERACIÓN</th>
                <th className="py-2.5 px-4">ESTRATEGIA / SETUP</th>
                <th className="py-2.5 px-4">MULT. R</th>
                <th className="py-2.5 px-4 text-right">RETORNO NAT.</th>
                <th className="py-2.5 px-4 text-right">RETORNO (BRL)</th>
                <th className="py-2.5 px-4 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {filteredTrades.map((t) => {
                const isExpanded = expandedTradeId === t.id;
                const resultBRL = t.currency === 'BRL' ? t.financialResult : t.financialResult * usdToBrlRate;
                return (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-zinc-950/60 transition group">
                      {/* Date & Time */}
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        <div className="text-white font-semibold">{t.date}</div>
                        <div className="text-zinc-500 mt-0.5">{t.time} ({t.timeframe})</div>
                      </td>

                      {/* Platform */}
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          t.platform === 'ProfitPRO' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' : 'bg-blue-950/20 text-blue-400 border border-blue-500/20'
                        }`}>
                          {t.platform}
                        </span>
                      </td>

                      {/* Asset & Type */}
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{t.asset}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{t.assetType}</div>
                      </td>

                      {/* Side / Size */}
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          t.side === 'Compra' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950/20 text-rose-400 border border-rose-500/20'
                        }`}>
                          {t.side}
                        </span>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1">
                          {t.size} {t.platform === 'ProfitPRO' ? 'Contratos' : 'Lotes'}
                        </div>
                      </td>

                      {/* Strategy */}
                      <td className="py-2.5 px-4">
                        <div className="text-zinc-200">{t.strategy}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{t.setup}</div>
                      </td>

                      {/* R Multiple */}
                      <td className="py-2.5 px-4 font-mono text-xs font-semibold">
                        <span className={t.rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.rMultiple >= 0 ? '+' : ''}{t.rMultiple.toFixed(1)} R
                        </span>
                      </td>

                      {/* Return Native */}
                      <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold">
                        <span className={t.financialResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.financialResult >= 0 ? '+' : ''}
                          {t.currency === 'BRL' ? 'R$' : '$'} {t.financialResult.toLocaleString(t.currency === 'BRL' ? 'pt-BR' : 'en-US')}
                        </span>
                      </td>

                      {/* Return BRL */}
                      <td className="py-2.5 px-4 text-right font-mono text-xs font-bold">
                        <span className={resultBRL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {resultBRL >= 0 ? '+' : ''}
                          R$ {resultBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            id={`btn-expand-${t.id}`}
                            onClick={() => toggleExpand(t.id)}
                            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
                            title="Detalles adicionales"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          
                          <button
                            id={`btn-edit-${t.id}`}
                            onClick={() => onEditTrade(t)}
                            className="p-1 text-zinc-400 hover:text-blue-400 rounded hover:bg-zinc-800 transition"
                            title="Editar trade"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            id={`btn-delete-${t.id}`}
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar el trade en ${t.asset}?`)) {
                                onDeleteTrade(t.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 transition"
                            title="Eliminar trade"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible details drawer */}
                    {isExpanded && (
                      <tr className="bg-zinc-950/60">
                        <td colSpan={9} className="py-4 px-6 border-b border-zinc-800">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-zinc-300">
                            
                            {/* Psychology & Context */}
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-white uppercase text-[9px] tracking-wider text-blue-400 flex items-center space-x-1">
                                <span>🧠 Análisis Psicológico</span>
                              </h4>
                              <div>
                                <span className="text-zinc-500 font-mono">Emoción inicial:</span> <span className="font-semibold">{t.emotionBefore}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-mono">Confianza / Estrés / Ansiedad:</span> <span className="font-mono font-bold text-zinc-200">{t.confidenceBefore} / {t.stressBefore} / {t.anxietyBefore}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-mono">Sentimiento posterior:</span> <span className="italic">"{t.feelAfter || 'N/A'}"</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-mono">Lección aprendida:</span> <span className="text-emerald-400 font-medium">"{t.learned || 'N/A'}"</span>
                              </div>
                            </div>

                            {/* Risk & Rules */}
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-white uppercase text-[9px] tracking-wider text-blue-400">
                                🛡️ Gestión & Confluencias
                              </h4>
                              <div>
                                <span className="text-zinc-500 font-mono">Capital Operacional:</span> <span className="font-mono">{t.currency === 'BRL' ? 'R$' : '$'} {t.capital.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-mono">Stop Loss / Take Profit:</span> <span className="font-mono text-zinc-200">{t.stopLoss} / {t.takeProfit} puntos</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-mono">Confirmaciones:</span>{' '}
                                <span className="text-zinc-300 font-medium text-[10px]">
                                  {t.confirmations && t.confirmations.length > 0 ? t.confirmations.join(', ') : 'Ninguna'}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-mono">Cambio utilizado:</span> <span className="font-mono text-zinc-400">1 USD = {t.exchangeRateUsed || usdToBrlRate} BRL</span>
                              </div>
                            </div>

                            {/* Evidences / Notes */}
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-white uppercase text-[9px] tracking-wider text-blue-400">
                                📊 Evidencia Técnica
                              </h4>
                              <div>
                                <span className="text-zinc-500 font-mono">Entrada:</span> <span className="text-zinc-300">"{t.entryReason}"</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-mono">Salida:</span> <span className="text-zinc-300">"{t.exitReason}"</span>
                              </div>
                              {t.images && t.images.length > 0 ? (
                                <div className="mt-1.5 flex space-x-1.5">
                                  {t.images.map((img, idx) => (
                                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="inline-block rounded overflow-hidden border border-zinc-800 h-8 w-12 group hover:border-blue-500">
                                      <img src={img} alt="chart evidence" className="w-full h-full object-cover group-hover:scale-105 transition" referrerPolicy="no-referrer" />
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[9px] text-zinc-500 italic mt-1">Sin captura gráfica adjuntada.</div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-mono text-xs">
                    No se encontraron operaciones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
