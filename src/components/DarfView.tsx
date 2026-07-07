import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Info, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { Trade } from '../types';
import { jsPDF } from 'jspdf';

interface DarfViewProps {
  trades: Trade[];
  usdToBrlRate: number;
}

export default function DarfView({ trades, usdToBrlRate }: DarfViewProps) {
  // Extract available years and months from trades
  const years = useMemo(() => {
    const list = trades.map(t => new Date(t.date).getFullYear());
    const unique = Array.from(new Set(list)).sort((a, b) => b - a);
    return unique.length > 0 ? unique : [new Date().getFullYear()];
  }, [trades]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (trades.length > 0) {
      return new Date(trades[0].date).getFullYear();
    }
    return new Date().getFullYear();
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (trades.length > 0) {
      return new Date(trades[0].date).getMonth() + 1; // 1-12
    }
    return new Date().getMonth() + 1;
  });

  // Manual input fields for customization (saved in localStorage or state)
  const [priorLossesDayTrade, setPriorLossesDayTrade] = useState<number>(() => {
    const saved = localStorage.getItem(`darf_prior_losses_dt_${selectedYear}`);
    return saved ? Number(saved) : 0;
  });

  const [priorLossesSwingTrade, setPriorLossesSwingTrade] = useState<number>(() => {
    const saved = localStorage.getItem(`darf_prior_losses_st_${selectedYear}`);
    return saved ? Number(saved) : 0;
  });

  // State to track paid DARFs by key "YEAR-MONTH"
  const [payments, setPayments] = useState<Record<string, { paid: boolean; paidAt?: string; reference?: string }>>(() => {
    const saved = localStorage.getItem('darf_payments_records');
    return saved ? JSON.parse(saved) : {};
  });

  const [manualIrrfDayTrade, setManualIrrfDayTrade] = useState<string>('');
  const [manualIrrfSwingTrade, setManualIrrfSwingTrade] = useState<string>('');
  const [stockSalesUnder20k, setStockSalesUnder20k] = useState<boolean>(true);

  // Manual overrides for trade classifications: tradeId -> 'DayTrade' | 'SwingTrade'
  const [tradeOverrides, setTradeOverrides] = useState<Record<string, 'DayTrade' | 'SwingTrade'>>({});

  // State for pending DARF from previous years (manual start balance)
  const [priorPendingDarf, setPriorPendingDarf] = useState<number>(() => {
    const saved = localStorage.getItem(`darf_prior_pending_darf_${selectedYear}`);
    return saved ? Number(saved) : 0;
  });

  // Dynamic carry-forward calculation for accumulated losses AND pending DARF from previous months of the same year
  const autoAccumulated = useMemo(() => {
    let dtAccumulatedLoss = priorLossesDayTrade; // Start with user-defined starting base loss
    let stAccumulatedLoss = priorLossesSwingTrade; // Start with user-defined starting base loss
    let pendingDarfAccumulated = priorPendingDarf; // Start with user-defined starting pending DARF

    // Process month-by-month for previous months of the selected year
    for (let m = 1; m < selectedMonth; m++) {
      // Get all trades of selected year in month m
      const mTrades = trades.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === m;
      });

      let mDtProfit = 0;
      let mDtLoss = 0;
      let mStProfit = 0;
      let mStLoss = 0;

      mTrades.forEach(t => {
        let autoClass: 'DayTrade' | 'SwingTrade' = 'DayTrade';
        const assetUpper = t.asset.toUpperCase();
        const isFutures = assetUpper.startsWith('WIN') || assetUpper.startsWith('WDO');
        const isShortTimeframe = ['1m', '2m', '5m', '15m', '30m', '1H'].includes(t.timeframe);

        if (t.platform === 'ProfitPRO' || isFutures || isShortTimeframe) {
          autoClass = 'DayTrade';
        } else {
          autoClass = 'SwingTrade';
        }

        const finalClass = tradeOverrides[t.id] || autoClass;
        const valInBRL = t.currency === 'BRL' ? t.financialResult : t.financialResult * usdToBrlRate;

        if (finalClass === 'DayTrade') {
          if (valInBRL > 0) mDtProfit += valInBRL;
          else mDtLoss += Math.abs(valInBRL);
        } else {
          if (valInBRL > 0) mStProfit += valInBRL;
          else mStLoss += Math.abs(valInBRL);
        }
      });

      const mDtNet = mDtProfit - mDtLoss;
      const mStNet = mStProfit - mStLoss;

      // Calculate taxes for month m
      const mDtAfterPrior = mDtNet > 0 ? Math.max(0, mDtNet - dtAccumulatedLoss) : 0;
      const mStAfterPrior = mStNet > 0 ? Math.max(0, mStNet - stAccumulatedLoss) : 0;
      
      const mDtTaxDue = mDtAfterPrior > 0 ? mDtAfterPrior * 0.20 : 0;
      const mIsStExempt = stockSalesUnder20k && mTrades.some(t => {
        const finalClass = tradeOverrides[t.id] || (t.platform === 'ProfitPRO' || t.asset.toUpperCase().startsWith('WIN') || t.asset.toUpperCase().startsWith('WDO') ? 'DayTrade' : 'SwingTrade');
        return finalClass === 'SwingTrade' && t.assetType === 'Acciones';
      });
      const mStTaxDue = mStAfterPrior > 0 && !mIsStExempt ? mStAfterPrior * 0.15 : 0;
      
      const mTotalTaxBeforeIrrf = mDtTaxDue + mStTaxDue;
      
      // We use estimated IRRF for past months calculation dynamically
      const mIrrfDT = mDtProfit > 0 ? mDtProfit * 0.01 : 0;
      const mIrrfST = mStProfit > 0 ? mStProfit * 0.00005 : 0;
      const mTotalIrrf = mIrrfDT + mIrrfST;

      let mFinalDarf = Math.max(0, mTotalTaxBeforeIrrf - mTotalIrrf);
      
      // Add previously pending DARF to this month's DARF
      mFinalDarf += pendingDarfAccumulated;

      const isPaid = payments[`${selectedYear}-${m}`]?.paid;

      if (!isPaid) {
        // If not paid (or couldn't be paid because it was < 10), it accumulates
        pendingDarfAccumulated = mFinalDarf;
      } else {
        // If paid, pending DARF resets to 0
        pendingDarfAccumulated = 0;
      }

      // Update carry forward for Day Trade: losses accumulate, profits offset them
      if (mDtNet < 0) {
        dtAccumulatedLoss += Math.abs(mDtNet);
      } else {
        dtAccumulatedLoss = Math.max(0, dtAccumulatedLoss - mDtNet);
      }

      // Update carry forward for Swing Trade: losses accumulate, profits offset them
      if (mStNet < 0) {
        stAccumulatedLoss += Math.abs(mStNet);
      } else {
        stAccumulatedLoss = Math.max(0, stAccumulatedLoss - mStNet);
      }
    }

    return {
      dayTrade: dtAccumulatedLoss,
      swingTrade: stAccumulatedLoss,
      pendingDarf: pendingDarfAccumulated
    };
  }, [trades, selectedYear, selectedMonth, priorLossesDayTrade, priorLossesSwingTrade, priorPendingDarf, tradeOverrides, usdToBrlRate, payments, stockSalesUnder20k]);

  // Reset or update values when year/month changes
  const handleSavePriorLosses = (type: 'DT' | 'ST' | 'DARF', value: number) => {
    if (type === 'DT') {
      setPriorLossesDayTrade(value);
      localStorage.setItem(`darf_prior_losses_dt_${selectedYear}`, String(value));
    } else if (type === 'ST') {
      setPriorLossesSwingTrade(value);
      localStorage.setItem(`darf_prior_losses_st_${selectedYear}`, String(value));
    } else {
      setPriorPendingDarf(value);
      localStorage.setItem(`darf_prior_pending_darf_${selectedYear}`, String(value));
    }
  };

  // Filter trades for the selected month and year
  const monthlyTrades = useMemo(() => {
    return trades.filter(t => {
      const d = new Date(t.date);
      // Ensure local timezone dates are handled cleanly
      const localYear = d.getFullYear();
      const localMonth = d.getMonth() + 1;
      return localYear === selectedYear && localMonth === selectedMonth;
    });
  }, [trades, selectedYear, selectedMonth]);

  // Classified trades list
  const classifiedTrades = useMemo(() => {
    return monthlyTrades.map(t => {
      // Automatic classification:
      // ProfitPRO or short timeframe or WIN/WDO asset is highly likely Day Trade.
      // Otherwise, could be Swing Trade.
      let autoClassification: 'DayTrade' | 'SwingTrade' = 'DayTrade';
      
      const assetUpper = t.asset.toUpperCase();
      const isFutures = assetUpper.startsWith('WIN') || assetUpper.startsWith('WDO');
      const isShortTimeframe = ['1m', '2m', '5m', '15m', '30m', '1H'].includes(t.timeframe);

      if (t.platform === 'ProfitPRO' || isFutures || isShortTimeframe) {
        autoClassification = 'DayTrade';
      } else {
        autoClassification = 'SwingTrade';
      }

      // Apply manual override if exists
      const finalClassification = tradeOverrides[t.id] || autoClassification;

      // Result in BRL (convert if in USD)
      const valueInBRL = t.currency === 'BRL' ? t.financialResult : t.financialResult * usdToBrlRate;

      return {
        ...t,
        classification: finalClassification,
        valueInBRL
      };
    });
  }, [monthlyTrades, tradeOverrides, usdToBrlRate]);

  // Group calculations
  const summary = useMemo(() => {
    let dtProfit = 0;
    let dtLoss = 0;
    let stProfit = 0;
    let stLoss = 0;

    let dtProfitableDaysTotal = 0;

    classifiedTrades.forEach(t => {
      if (t.classification === 'DayTrade') {
        if (t.valueInBRL > 0) {
          dtProfit += t.valueInBRL;
          dtProfitableDaysTotal += t.valueInBRL;
        } else {
          dtLoss += Math.abs(t.valueInBRL);
        }
      } else {
        // Swing Trade
        if (t.valueInBRL > 0) {
          stProfit += t.valueInBRL;
        } else {
          stLoss += Math.abs(t.valueInBRL);
        }
      }
    });

    const dtNet = dtProfit - dtLoss;
    const stNet = stProfit - stLoss;

    // Automatic IRRF estimation
    // Day trade: 1% on net profitable results of the day (we approximate here based on profitable trades)
    const estimatedIrrfDT = dtProfit > 0 ? dtProfit * 0.01 : 0;
    // Swing trade: 0.005% of sales value (hard to calculate without full position volume, we default to 0 or small fraction)
    const estimatedIrrfST = stProfit > 0 ? stProfit * 0.00005 : 0;

    return {
      dtProfit,
      dtLoss,
      dtNet,
      stProfit,
      stLoss,
      stNet,
      estimatedIrrfDT,
      estimatedIrrfST
    };
  }, [classifiedTrades]);

  // Actual IRRF to use
  const irrfDayTrade = manualIrrfDayTrade !== '' ? Number(manualIrrfDayTrade) : summary.estimatedIrrfDT;
  const irrfSwingTrade = manualIrrfSwingTrade !== '' ? Number(manualIrrfSwingTrade) : summary.estimatedIrrfST;

  // Final Calculations after offsets
  // Day Trade Calculations using automatic dynamic loss carry-forward
  const dtAfterPriorOffset = summary.dtNet > 0 
    ? Math.max(0, summary.dtNet - autoAccumulated.dayTrade) 
    : summary.dtNet;
  
  const dtTaxDue = dtAfterPriorOffset > 0 ? dtAfterPriorOffset * 0.20 : 0;

  // Swing Trade Calculations using automatic dynamic loss carry-forward
  // Check if Swing Trade is exempt (Ações sales under 20k, but let's apply simply if checked and assetType is Acciones)
  const isStExempt = stockSalesUnder20k && classifiedTrades.some(t => t.classification === 'SwingTrade' && t.assetType === 'Acciones');
  
  const stAfterPriorOffset = summary.stNet > 0
    ? Math.max(0, summary.stNet - autoAccumulated.swingTrade)
    : summary.stNet;

  const stTaxDue = stAfterPriorOffset > 0 && !isStExempt ? stAfterPriorOffset * 0.15 : 0;

  // Total Calculations
  const totalTaxBeforeIrrf = dtTaxDue + stTaxDue;
  const totalIrrf = irrfDayTrade + irrfSwingTrade;
  const currentMonthDarfValue = Math.max(0, totalTaxBeforeIrrf - totalIrrf);
  
  // Final DARF to pay includes pending DARF from previous months
  const finalDarfValue = currentMonthDarfValue + autoAccumulated.pendingDarf;

  const monthsList = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const toggleTradeClassification = (tradeId: string, current: 'DayTrade' | 'SwingTrade') => {
    setTradeOverrides(prev => ({
      ...prev,
      [tradeId]: current === 'DayTrade' ? 'SwingTrade' : 'DayTrade'
    }));
  };

  // Export PDF Report function
  const handleExportDarfPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top Header bar
      doc.setFillColor(24, 24, 27); // Zinc-900
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('MEMORIAL DE CÁLCULO DE DARF', 15, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // Zinc-400
      const monthLabel = monthsList.find(m => m.value === selectedMonth)?.label || '';
      doc.text(`Período de Apuración: ${monthLabel} de ${selectedYear}  |  Emitido el: ${new Date().toLocaleDateString()}`, 15, 23);
      doc.text(`Moneda de Referencia: Reales Brasileños (BRL)  |  Tasa USD/BRL: R$ ${usdToBrlRate.toFixed(2)}`, 15, 28);

      let y = 45;

      // Card for final value
      doc.setFillColor(239, 246, 255); // Blue-50
      doc.setDrawColor(191, 219, 254); // Blue-200
      doc.rect(15, y, pageWidth - 30, 20, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138); // Blue-900
      doc.text('VALOR TOTAL A PAGAR (DARF)', 20, y + 7);
      
      doc.setFontSize(14);
      doc.setTextColor(29, 78, 216); // Blue-700
      doc.text(`R$ ${finalDarfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y + 15);

      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138);
      const isUnderLimit = finalDarfValue < 10 && finalDarfValue > 0;
      doc.text(
        isUnderLimit 
          ? '* Monto inferior a R$ 10,00. No emitir DARF; acumular para el mes siguiente.'
          : '* Código de Receta de Pago: 6015 (IRPF - Ganancia de capital en operaciones de bolsa)',
        110, 
        y + 12
      );

      y += 28;

      // Day Trade Table Section
      doc.setTextColor(24, 24, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. OPERACIONES DE DAY TRADE (Impuesto del 20%)', 15, y);
      y += 5;

      doc.setDrawColor(228, 228, 231); // zinc-200
      doc.line(15, y, pageWidth - 15, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      
      const drawRow = (label: string, value: string, isBold = false) => {
        if (isBold) doc.setFont('helvetica', 'bold');
        doc.text(label, 20, y);
        doc.text(value, 150, y, { align: 'right' });
        y += 6;
        doc.setFont('helvetica', 'normal');
      };

      drawRow('(+) Ganancia bruta mensual en Day Trade:', `R$ ${summary.dtProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(-) Pérdida bruta mensual en Day Trade:', `R$ ${summary.dtLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(=) Resultado Neto del Mes:', `R$ ${summary.dtNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, true);
      drawRow('(-) Pérdidas acumuladas de meses anteriores:', `R$ ${priorLossesDayTrade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(=) Base de cálculo imponible:', `R$ ${Math.max(0, dtAfterPriorOffset).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, true);
      drawRow('(=) Impuesto calculado (20%):', `R$ ${dtTaxDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, true);

      y += 5;

      // Swing Trade Table Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. OPERACIONES DE SWING TRADE / COMÚN (Impuesto del 15%)', 15, y);
      y += 5;

      doc.line(15, y, pageWidth - 15, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      drawRow('(+) Ganancia bruta mensual en Swing Trade:', `R$ ${summary.stProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(-) Pérdida bruta mensual en Swing Trade:', `R$ ${summary.stLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(=) Resultado Neto del Mes:', `R$ ${summary.stNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, true);
      drawRow('(-) Pérdidas acumuladas de meses anteriores:', `R$ ${priorLossesSwingTrade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(=) Base de cálculo imponible:', `R$ ${Math.max(0, stAfterPriorOffset).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, true);
      
      const stExemptText = isStExempt ? 'EXENTO (Ventas < R$ 20.000)' : `R$ ${stTaxDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      drawRow('(=) Impuesto calculado (15%):', stExemptText, true);

      y += 5;

      // Summary / Deductions Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. CONCILIACIÓN DE RETENCIONES Y DARF FINAL', 15, y);
      y += 5;

      doc.line(15, y, pageWidth - 15, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      const totalCalculatedTax = dtTaxDue + stTaxDue;
      drawRow('(+) Total de impuesto bruto calculado:', `R$ ${totalCalculatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, true);
      drawRow('(-) Retención en la fuente (IRRF Dedo-Duro) Day Trade:', `R$ ${irrfDayTrade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(-) Retención en la fuente (IRRF Dedo-Duro) Swing Trade:', `R$ ${irrfSwingTrade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      drawRow('(=) Valor final neto de DARF a pagar:', `R$ ${finalDarfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, true);

      y += 10;

      // Informative Footer / instructions
      doc.setFillColor(244, 244, 245); // zinc-100
      doc.rect(15, y, pageWidth - 30, 25, 'F');
      
      doc.setTextColor(63, 63, 70); // zinc-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Instrucciones para el pago de DARF:', 18, y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('1. Acceda al portal SICALC de la Receita Federal o al home banking de su banco de preferencia.', 18, y + 10);
      doc.text('2. Utilice el código de receta "6015" para personas físicas.', 18, y + 14);
      doc.text(`3. Fecha límite de pago: ${new Date(selectedYear, selectedMonth, 0).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} (Último día hábil del mes siguiente).`, 18, y + 18);

      doc.save(`Calculo_DARF_${selectedYear}_${selectedMonth}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  return (
    <div id="darf-view" className="p-4 space-y-4 overflow-y-auto h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display font-bold text-lg text-zinc-100 uppercase tracking-tight">Cálculo de Impuesto DARF (Brasil)</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Apuración mensual de resultados, compensación de pérdidas e impuesto de renta de bolsa (Sicalc 6015).
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 bg-zinc-900 p-1.5 rounded border border-zinc-800 self-start">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500"
          >
            {monthsList.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <button
            onClick={handleExportDarfPDF}
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Warning if no trades exist for selected month */}
      {classifiedTrades.length === 0 && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded flex items-start space-x-3 text-zinc-300">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-zinc-200 font-mono">Sin operaciones registradas</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              No tienes operaciones registradas en el mes de {monthsList.find(m => m.value === selectedMonth)?.label} de {selectedYear}. Puedes registrar nuevas operaciones desde el menú lateral o importar un reporte de ProfitPRO para visualizar el cálculo del impuesto mensual.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Calculation Breakdown (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-zinc-900/40 p-4 rounded border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase">
                <span>Resultado Day Trade</span>
                <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold border border-red-500/20">20% Tax</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className={`text-lg font-mono font-bold ${summary.dtNet >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  R$ {summary.dtNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {summary.dtNet > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                )}
              </div>
              <div className="mt-2 text-[10px] text-zinc-500 font-mono flex justify-between">
                <span>Ganancias: R$ {summary.dtProfit.toFixed(0)}</span>
                <span>Pérdidas: R$ {summary.dtLoss.toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-4 rounded border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase">
                <span>Resultado Swing Trade</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-500/20">15% Tax</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className={`text-lg font-mono font-bold ${summary.stNet >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  R$ {summary.stNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {summary.stNet > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                )}
              </div>
              <div className="mt-2 text-[10px] text-zinc-500 font-mono flex justify-between">
                <span>Ganancias: R$ {summary.stProfit.toFixed(0)}</span>
                <span>Pérdidas: R$ {summary.stLoss.toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded border border-emerald-900/50 bg-gradient-to-br from-emerald-950/20 to-zinc-900 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase">
                <span>Valor Final DARF</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-500/30">Net Due</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-zinc-100">
                  R$ {finalDarfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <FileText className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                {finalDarfValue === 0 ? (
                  <span className="text-zinc-400 flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 inline" />
                    <span>Sin impuesto pendiente</span>
                  </span>
                ) : finalDarfValue < 10 ? (
                  <span className="text-amber-400">DARF &lt; R$ 10,00: Acumular para el mes siguiente</span>
                ) : (
                  <span className="text-emerald-400 font-bold">Listo para pagar (Sicalc 6015)</span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-zinc-900/60 rounded border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-zinc-200 tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>ESTADO DE PAGO DE ESTE MES</span>
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                payments[`${selectedYear}-${selectedMonth}`]?.paid 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {payments[`${selectedYear}-${selectedMonth}`]?.paid ? 'PAGADO' : 'PENDIENTE'}
              </span>
            </div>

            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Registra si ya realizaste el pago de este DARF (R$ {finalDarfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) para mantener tu historial al día.
                </p>
                {payments[`${selectedYear}-${selectedMonth}`]?.paid && (
                  <div className="text-[10px] text-zinc-400 font-mono space-y-0.5 mt-2">
                    <p>📅 Fecha de Pago: <span className="text-zinc-200">{payments[`${selectedYear}-${selectedMonth}`]?.paidAt || 'No ingresada'}</span></p>
                    {payments[`${selectedYear}-${selectedMonth}`]?.reference && (
                      <p>🔑 Comprobante/Ref: <span className="text-zinc-200">{payments[`${selectedYear}-${selectedMonth}`]?.reference}</span></p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                {payments[`${selectedYear}-${selectedMonth}`]?.paid ? (
                  <button
                    onClick={() => {
                      const updated = { ...payments };
                      delete updated[`${selectedYear}-${selectedMonth}`];
                      setPayments(updated);
                      localStorage.setItem('darf_payments_records', JSON.stringify(updated));
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded transition cursor-pointer"
                  >
                    Remover Registro de Pago
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="date"
                        id="payment-date-input"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        id="payment-ref-input"
                        placeholder="Ref. o Código Banco"
                        className="bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-650 text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-emerald-500 w-36"
                      />
                      <button
                        onClick={() => {
                          const dateEl = document.getElementById('payment-date-input') as HTMLInputElement | null;
                          const refEl = document.getElementById('payment-ref-input') as HTMLInputElement | null;
                          const paidAt = dateEl?.value || new Date().toISOString().split('T')[0];
                          const reference = refEl?.value || '';
                          
                          const updated = {
                            ...payments,
                            [`${selectedYear}-${selectedMonth}`]: {
                              paid: true,
                              paidAt,
                              reference
                            }
                          };
                          setPayments(updated);
                          localStorage.setItem('darf_payments_records', JSON.stringify(updated));
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition cursor-pointer text-center whitespace-nowrap"
                      >
                        Marcar como Pagado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Step-by-Step Calculation */}
          <div className="bg-zinc-900/60 rounded border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-zinc-200 tracking-wider">PASO A PASO DEL CÁLCULO</h3>
              <Sliders className="h-4 w-4 text-zinc-500" />
            </div>

            <div className="p-4 space-y-6">
              
              {/* Day Trade Step */}
              <div>
                <h4 className="text-xs font-bold text-zinc-300 font-mono flex items-center space-x-1.5 pb-2 border-b border-zinc-800/50">
                  <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] rounded mr-1">PASO 1</span>
                  <span>Operaciones Day Trade</span>
                </h4>
                
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">Net Operativo Mensual (Profits - Losses):</span>
                    <span className={summary.dtNet >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
                      R$ {summary.dtNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 font-mono">
                    <span className="text-zinc-400 flex items-center space-x-1.5">
                      <span>Pérdidas de años anteriores / manual (R$):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Pérdidas netas acumuladas de años anteriores que traes como saldo inicial al año actual" />
                    </span>
                    <input 
                      type="number"
                      value={priorLossesDayTrade || ''}
                      onChange={(e) => handleSavePriorLosses('DT', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-32 bg-zinc-950 border border-zinc-800 text-zinc-100 text-right text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex justify-between font-mono text-zinc-400">
                    <span className="flex items-center space-x-1.5">
                      <span>Pérdidas acumuladas año actual (automático):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Calculado automáticamente escaneando los meses anteriores del año en busca de resultados negativos" />
                    </span>
                    <span>
                      R$ {Math.max(0, autoAccumulated.dayTrade - priorLossesDayTrade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono text-zinc-350 font-bold bg-zinc-950/40 p-1.5 rounded border border-zinc-850">
                    <span>(=) Total de Pérdidas a Compensar:</span>
                    <span className="text-red-400 font-mono">
                      R$ {autoAccumulated.dayTrade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono border-t border-zinc-800/40 pt-2 font-bold">
                    <span className="text-zinc-300">(=) Base de Cálculo Imponible Day Trade:</span>
                    <span className="text-zinc-200">
                      R$ {Math.max(0, dtAfterPriorOffset).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono font-bold text-red-400">
                    <span>(=) Alícuota Impuesto Day Trade (20%):</span>
                    <span>
                      R$ {dtTaxDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Swing Trade Step */}
              <div>
                <h4 className="text-xs font-bold text-zinc-300 font-mono flex items-center space-x-1.5 pb-2 border-b border-zinc-800/50">
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded mr-1">PASO 2</span>
                  <span>Operaciones Swing Trade</span>
                </h4>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">Net Operativo Mensual Swing Trade:</span>
                    <span className={summary.stNet >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
                      R$ {summary.stNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 font-mono">
                    <span className="text-zinc-400 flex items-center space-x-1.5">
                      <span>Pérdidas de años anteriores / manual (R$):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Pérdidas netas acumuladas de años anteriores que traes como saldo inicial al año actual" />
                    </span>
                    <input 
                      type="number"
                      value={priorLossesSwingTrade || ''}
                      onChange={(e) => handleSavePriorLosses('ST', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-32 bg-zinc-950 border border-zinc-800 text-zinc-100 text-right text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-between font-mono text-zinc-400">
                    <span className="flex items-center space-x-1.5">
                      <span>Pérdidas acumuladas año actual (automático):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Calculado automáticamente escaneando los meses anteriores del año en busca de resultados negativos" />
                    </span>
                    <span>
                      R$ {Math.max(0, autoAccumulated.swingTrade - priorLossesSwingTrade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono text-zinc-350 font-bold bg-zinc-950/40 p-1.5 rounded border border-zinc-850">
                    <span>(=) Total de Pérdidas a Compensar:</span>
                    <span className="text-blue-400 font-mono">
                      R$ {autoAccumulated.swingTrade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono">
                    <span className="text-zinc-400 flex items-center space-x-1.5">
                      <span>Eximir ventas de acciones menores a R$ 20.000:</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="De acuerdo con la legislación brasileña, las ventas de acciones comunes por valor de menos de R$ 20k mensuales están exentas de impuesto sobre la ganancia." />
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stockSalesUnder20k}
                        onChange={(e) => setStockSalesUnder20k(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:after:border-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex justify-between font-mono border-t border-zinc-800/40 pt-2 font-bold">
                    <span className="text-zinc-300">(=) Base de Cálculo Imponible Swing Trade:</span>
                    <span className="text-zinc-200">
                      R$ {Math.max(0, stAfterPriorOffset).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono font-bold text-blue-400">
                    <span>(=) Alícuota Impuesto Swing Trade (15%):</span>
                    <span>
                      {isStExempt ? (
                        <span className="text-zinc-500 text-[10px] italic">Exento de Ley</span>
                      ) : (
                        `R$ ${stTaxDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions and Final Tax Step */}
              <div className="pt-2 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-300 font-mono flex items-center space-x-1.5 pb-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded mr-1">PASO 3</span>
                  <span>Impuesto Retenido (IRRF Dedo-Duro) &amp; Compensaciones</span>
                </h4>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">(=) Impuesto Bruto Consolidado:</span>
                    <span className="text-zinc-100 font-bold">
                      R$ {totalTaxBeforeIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 font-mono">
                    <span className="text-zinc-400 flex items-center space-x-1.5">
                      <span>(-) IRRF Retenido en la Fuente - Day Trade (R$):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Imposto retido na fonte pela corretora (1% de los días con lucro)" />
                    </span>
                    <input 
                      type="number"
                      value={manualIrrfDayTrade}
                      onChange={(e) => setManualIrrfDayTrade(e.target.value)}
                      placeholder={summary.estimatedIrrfDT.toFixed(2)}
                      className="w-32 bg-zinc-950 border border-zinc-800 text-zinc-100 text-right text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 font-mono">
                    <span className="text-zinc-400 flex items-center space-x-1.5">
                      <span>(-) IRRF Retenido en la Fuente - Swing Trade (R$):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Imposto retido na fonte pela corretora (0.005% de las ventas de swing trade)" />
                    </span>
                    <input 
                      type="number"
                      value={manualIrrfSwingTrade}
                      onChange={(e) => setManualIrrfSwingTrade(e.target.value)}
                      placeholder={summary.estimatedIrrfST.toFixed(2)}
                      className="w-32 bg-zinc-950 border border-zinc-800 text-zinc-100 text-right text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-between font-mono pt-3 font-bold text-zinc-300">
                    <span>(=) DARF Mensual (antes de postergados):</span>
                    <span>
                      R$ {currentMonthDarfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 font-mono pt-1">
                    <span className="text-zinc-400 flex items-center space-x-1.5">
                      <span>(+) DARF pendiente años anteriores / manual (R$):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Saldo de DARFs no pagados de años anteriores" />
                    </span>
                    <input 
                      type="number"
                      value={priorPendingDarf || ''}
                      onChange={(e) => handleSavePriorLosses('DARF', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-32 bg-zinc-950 border border-zinc-800 text-zinc-100 text-right text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div className="flex justify-between font-mono text-zinc-400">
                    <span className="flex items-center space-x-1.5">
                      <span>(+) DARF acumulado de meses anteriores (automático):</span>
                      <HelpCircle className="h-3 w-3 text-zinc-500" title="Suma de DARFs de meses anteriores del año que fueron menores a R$ 10,00 o no fueron marcados como pagados." />
                    </span>
                    <span>
                      R$ {Math.max(0, autoAccumulated.pendingDarf - priorPendingDarf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono pt-3 border-t border-zinc-800 font-bold text-emerald-400 text-sm">
                    <span>(=) VALOR TOTAL DARF A PAGAR:</span>
                    <span>
                      R$ {finalDarfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Legilative Helper & Month's trade list for overriding (1/3 width) */}
        <div className="space-y-4">
          
          {/* Legislative Info card */}
          <div className="bg-zinc-900/60 p-4 rounded border border-zinc-800">
            <h3 className="text-xs font-bold font-mono text-zinc-200 tracking-wider flex items-center space-x-1.5 mb-3">
              <Info className="h-4 w-4 text-emerald-400" />
              <span>DIRETRICES LEGALES BRASIL</span>
            </h3>

            <div className="space-y-3.5 text-xs text-zinc-400 leading-relaxed">
              <div>
                <span className="text-zinc-200 font-bold font-mono">Código Receita Sicalc:</span>
                <p className="mt-0.5">Utilice el código <span className="text-emerald-400 font-bold font-mono">6015</span> (IRPF - Ganhos de capital em operações de bolsa) al rellenar el formulario en el portal oficial de la Receita Federal.</p>
              </div>

              <div>
                <span className="text-zinc-200 font-bold font-mono">Regla de Mínimo R$ 10,00:</span>
                <p className="mt-0.5">Si el impuesto calculado es inferior a R$ 10,00, el DARF no puede ser emitido este mes. Debe ser sumado e ingresado al impuesto del mes siguiente en el que la suma total supere este umbral.</p>
              </div>

              <div>
                <span className="text-zinc-200 font-bold font-mono font-bold">Límite de Pago:</span>
                <p className="mt-0.5">El pago del DARF mensual debe realizarse antes del <span className="text-zinc-200 font-bold">último día hábil del mes siguiente</span> a la apuración. Los retrasos conllevan multas automáticas.</p>
              </div>
              
              <div>
                <span className="text-zinc-200 font-bold font-mono font-bold">Compensación de Pérdidas:</span>
                <p className="mt-0.5">Solo puede compensar pérdidas de la misma modalidad (Day trade compensa solo day trade, Swing trade compensa solo swing trade).</p>
              </div>
            </div>
          </div>

          {/* Month's classified trades override manager */}
          <div className="bg-zinc-900/60 rounded border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <h3 className="text-xs font-bold font-mono text-zinc-200 tracking-wider">MODALIDAD DE OPERACIONES ({classifiedTrades.length})</h3>
              <span className="text-[10px] text-zinc-500 font-mono">Haz clic para cambiar entre Day Trade y Swing Trade</span>
            </div>

            <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
              {classifiedTrades.map(t => {
                const isProfit = t.valueInBRL >= 0;
                return (
                  <div key={t.id} className="p-3 flex items-center justify-between hover:bg-zinc-900/40 transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-mono font-bold text-zinc-200">{t.asset}</span>
                        <span className={`text-[10px] font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {isProfit ? '+' : ''}R$ {t.valueInBRL.toFixed(0)}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono block">{t.date} | {t.timeframe} | {t.platform}</span>
                    </div>

                    <button
                      onClick={() => toggleTradeClassification(t.id, t.classification)}
                      className={`text-[9px] font-bold font-mono px-2 py-1 rounded border cursor-pointer transition-all ${
                        t.classification === 'DayTrade'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                      }`}
                    >
                      {t.classification === 'DayTrade' ? 'Day Trade' : 'Swing Trade'}
                    </button>
                  </div>
                );
              })}

              {classifiedTrades.length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                  Sin operaciones este mes
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
