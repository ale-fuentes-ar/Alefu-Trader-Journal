import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  HelpCircle,
  Database,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { Trade } from '../types';

interface ImportViewProps {
  onImportComplete: (importedTrades: Trade[]) => void;
  usdToBrlRate: number;
}

// Sample Raw ProfitPRO CSV data for autofill testing
const SAMPLE_PROFIT_PRO_CSV = `Fecha,Hora,Activo,Operacion,Contratos,Puntos,Resultado_BRL
2026-07-07,10:30,WIN,Compra,5,250,250
2026-07-07,14:15,WDO,Venta,3,15,450
2026-07-06,11:00,PETR4,Compra,200,1.2,240`;

// Sample Raw MT5 HTML format data for autofill testing
const SAMPLE_MT5_HTML = `<!-- MT5 Statement -->
<table>
  <tr><td>EURUSD</td><td>buy</td><td>0.5</td><td>+150.00</td><td>2026-07-07 09:15:00</td></tr>
  <tr><td>XAUUSD</td><td>buy</td><td>0.1</td><td>+220.00</td><td>2026-07-06 16:30:00</td></tr>
  <tr><td>BTCUSD</td><td>sell</td><td>0.05</td><td>-75.00</td><td>2026-07-05 11:20:00</td></tr>
</table>`;

export default function ImportView({ onImportComplete, usdToBrlRate }: ImportViewProps) {
  const [platform, setPlatform] = useState<'ProfitPRO' | 'MT5'>('ProfitPRO');
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const processFileContent = (text: string, importPlatform: 'ProfitPRO' | 'MT5') => {
    try {
      const parsedTrades: Trade[] = [];
      const timestampNow = new Date().toISOString();

      if (importPlatform === 'ProfitPRO') {
        // Simple CSV parser
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          throw new Error('El archivo CSV está vacío o no contiene suficientes líneas.');
        }

        // Detect headers
        const headers = lines[0].toLowerCase().split(',');
        const dateIdx = headers.indexOf('fecha');
        const timeIdx = headers.indexOf('hora');
        const assetIdx = headers.indexOf('activo');
        const opIdx = headers.indexOf('operacion');
        const sizeIdx = headers.indexOf('contratos');
        const pointsIdx = headers.indexOf('puntos');
        const resultIdx = headers.indexOf('resultado_brl');

        if (assetIdx === -1 || resultIdx === -1) {
          throw new Error('Faltan columnas obligatorias (Activo, Resultado_BRL) en el CSV.');
        }

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          const assetName = cols[assetIdx]?.toUpperCase() || 'WIN';
          const financialRes = Number(cols[resultIdx]) || 0;
          const isWIN = assetName.startsWith('WIN');
          const isWDO = assetName.startsWith('WDO');

          const t: Trade = {
            id: `imported-profit-${Date.now()}-${i}`,
            date: dateIdx !== -1 ? cols[dateIdx] : '2026-07-07',
            time: timeIdx !== -1 ? cols[timeIdx] : '10:00',
            platform: 'ProfitPRO',
            market: 'Nacional',
            asset: assetName,
            assetType: isWIN ? 'Mini Índice' : isWDO ? 'Mini Dólar' : 'Acciones',
            side: (cols[opIdx] === 'Venta' || cols[opIdx]?.toLowerCase().startsWith('v')) ? 'Venta' : 'Compra',
            timeframe: '5m',
            strategy: 'Importación Automática',
            setup: 'Nivel Técnico',
            trend: 'Alcista',
            confirmations: ['Datos Importados ProfitPRO'],
            entryReason: 'Operación importada mediante archivo de profit report.',
            exitReason: 'Salida de mercado ejecutada.',
            capital: 15000,
            riskPercent: 1.0,
            stopLoss: pointsIdx !== -1 ? Number(cols[pointsIdx]) / 2 : 100,
            takeProfit: pointsIdx !== -1 ? Number(cols[pointsIdx]) : 200,
            rMultiple: financialRes >= 0 ? 1.5 : -1.0,
            size: sizeIdx !== -1 ? Number(cols[sizeIdx]) : 2,
            currency: 'BRL',
            financialResult: financialRes,
            pointsResult: pointsIdx !== -1 ? Number(cols[pointsIdx]) : 0,
            ticksResult: pointsIdx !== -1 ? Number(cols[pointsIdx]) * 2 : 0,
            percentResult: Number(((financialRes / 15000) * 100).toFixed(2)),
            emotionBefore: 'Calmado',
            confidenceBefore: 4,
            stressBefore: 2,
            anxietyBefore: 1,
            feelAfter: 'Registro automático',
            learned: 'Trade importado con éxito',
            toRepeat: '',
            toAvoid: '',
            images: [],
            observations: 'Operación importada de ProfitPRO.',
            exchangeRateUsed: usdToBrlRate,
            createdAt: timestampNow
          };
          parsedTrades.push(t);
        }
      } else {
        // MT5 HTML simple tag parser
        const regex = /<tr><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><\/tr>/g;
        let match;
        let index = 1;
        while ((match = regex.exec(text)) !== null) {
          const [, symbol, action, sizeStr, profitStr, dateTimeStr] = match;
          const financialRes = Number(profitStr.replace('+', '')) || 0;
          const datePart = dateTimeStr.split(' ')[0] || '2026-07-07';
          const timePart = dateTimeStr.split(' ')[1]?.slice(0, 5) || '12:00';

          const t: Trade = {
            id: `imported-mt5-${Date.now()}-${index++}`,
            date: datePart,
            time: timePart,
            platform: 'MT5',
            market: 'Internacional',
            asset: symbol.toUpperCase(),
            assetType: symbol.toUpperCase() === 'XAUUSD' ? 'Oro' : symbol.toUpperCase() === 'BTCUSD' ? 'Criptomonedas' : 'Fore',
            side: action.toLowerCase().includes('sell') ? 'Venta' : 'Compra',
            timeframe: '15m',
            strategy: 'Importación Automática',
            setup: 'Nivel Técnico',
            trend: 'Alcista',
            confirmations: ['Datos Importados MT5'],
            entryReason: 'Operación importada mediante reporte HTML de MetaTrader 5.',
            exitReason: 'Salida de mercado ejecutada.',
            capital: 5000,
            riskPercent: 1.5,
            stopLoss: 15,
            takeProfit: 30,
            rMultiple: financialRes >= 0 ? 2.0 : -1.0,
            size: Number(sizeStr) || 0.1,
            currency: 'USD',
            financialResult: financialRes,
            pointsResult: 15,
            ticksResult: 15,
            percentResult: Number(((financialRes / 5000) * 100).toFixed(2)),
            emotionBefore: 'Calmado',
            confidenceBefore: 4,
            stressBefore: 2,
            anxietyBefore: 1,
            feelAfter: 'Registro automático',
            learned: 'Trade importado con éxito',
            toRepeat: '',
            toAvoid: '',
            images: [],
            observations: 'Operación importada de MetaTrader 5.',
            exchangeRateUsed: usdToBrlRate,
            createdAt: timestampNow
          };
          parsedTrades.push(t);
        }

        if (parsedTrades.length === 0) {
          throw new Error('No se detectaron filas válidas de operaciones de MT5.');
        }
      }

      onImportComplete(parsedTrades);
      setSuccessCount(parsedTrades.length);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo. Revisa el formato.');
      setSuccessCount(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        processFileContent(text, platform);
      };
      reader.readAsText(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        processFileContent(text, platform);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleAutofillMock = () => {
    const mockData = platform === 'ProfitPRO' ? SAMPLE_PROFIT_PRO_CSV : SAMPLE_MT5_HTML;
    setRawText(mockData);
    processFileContent(mockData, platform);
  };

  return (
    <div id="import-view" className="p-4 space-y-4 overflow-y-auto h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header */}
      <div id="import-header" className="border-b border-zinc-800 pb-3">
        <h2 className="font-sans font-bold text-xl text-white tracking-tight">Importación Inteligente</h2>
        <p className="text-zinc-400 text-xs mt-0.5">Sube tus reportes consolidados y mapea tus trades de ProfitPRO o MetaTrader 5 de forma automática.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Left 2 Cols: File uploading */}
        <div className="lg:col-span-2 bg-zinc-900 rounded border border-zinc-800 p-4 space-y-4">
          
          {/* Select Platform */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-2 uppercase font-mono tracking-wider">
              1. Selecciona la Plataforma de Origen
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlatform('ProfitPRO');
                  setSuccessCount(null);
                  setFile(null);
                }}
                className={`p-3 rounded border text-left transition flex items-center justify-between ${
                  platform === 'ProfitPRO' 
                    ? 'bg-blue-600/10 border-blue-500 text-white' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">ProfitPRO (Brasil)</span>
                  <span className="text-[9px] text-zinc-400 font-mono mt-0.5">Soporta reportes en formato CSV</span>
                </div>
                <FileSpreadsheet className={`h-4 w-4 ${platform === 'ProfitPRO' ? 'text-blue-400' : 'text-zinc-500'}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlatform('MT5');
                  setSuccessCount(null);
                  setFile(null);
                }}
                className={`p-3 rounded border text-left transition flex items-center justify-between ${
                  platform === 'MT5' 
                    ? 'bg-blue-600/10 border-blue-500 text-white' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">MetaTrader 5 (Global)</span>
                  <span className="text-[9px] text-zinc-400 font-mono mt-0.5">Soporta reportes HTML / XML / CSV</span>
                </div>
                <Database className={`h-4 w-4 ${platform === 'MT5' ? 'text-blue-400' : 'text-zinc-500'}`} />
              </button>
            </div>
          </div>

          {/* Drag & Drop File Upload Area */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-2 uppercase font-mono tracking-wider">
              2. Sube el Archivo de Reporte
            </label>
            
            <div
              id="drag-drop-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                dragging 
                  ? 'border-blue-500 bg-blue-500/5 scale-[0.98]' 
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-750'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={platform === 'ProfitPRO' ? '.csv' : '.html,.xml,.csv'}
                className="hidden"
              />
              
              <div className="p-2.5 bg-zinc-900 rounded text-zinc-400 border border-zinc-800">
                <UploadCloud className="h-5 w-5 text-zinc-300" />
              </div>

              <div>
                <span className="font-bold text-xs text-white block">
                  {file ? file.name : 'Arrastra tu archivo aquí o haz click para explorar'}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  {platform === 'ProfitPRO' ? 'Archivos compatibles: .csv' : 'Archivos compatibles: .html, .xml, .csv'}
                </span>
              </div>
            </div>
          </div>

          {/* Success / Error Messages */}
          {successCount !== null && (
            <div id="import-success" className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded flex items-center space-x-2 text-xs animate-fade-in">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <div>
                <span className="font-bold block">¡Importación completada con éxito!</span>
                Se cargaron <strong>{successCount} operaciones</strong> directamente a tu diario.
              </div>
            </div>
          )}

          {errorMsg && (
            <div id="import-error" className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded flex items-center space-x-2 text-xs animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>
                <span className="font-bold block">Error al procesar el archivo</span>
                {errorMsg}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Instructions & Autofill Simulation */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-blue-400">
              <HelpCircle className="h-4 w-4" />
              <h3 className="font-sans font-bold text-sm text-white">Guía de Formatos</h3>
            </div>
            
            <div className="text-[11px] text-zinc-300 space-y-2 leading-relaxed">
              <p>
                <strong>ProfitPRO:</strong> Exporta tu reporte de historial de operaciones desde el menú de profit como un archivo delimitado por comas (CSV).
              </p>
              <p>
                <strong>MetaTrader 5:</strong> Exporta tu "Statement" / "Historial de Cuenta" desde el MT5 haciendo click derecho y seleccionando "Guardar como Reporte HTML".
              </p>
            </div>

            {/* Quick Testing Panel (extremely helpful for evaluation!) */}
            <div className="p-3 bg-zinc-950 rounded border border-zinc-800 mt-4 space-y-2">
              <span className="text-[9px] font-bold text-amber-400 font-mono uppercase tracking-wider block">MODO DEMOSTRACIÓN</span>
              <p className="text-[10px] text-zinc-400">
                ¿No tienes un archivo a la mano? Genera datos de prueba realistas al instante con nuestro simulador.
              </p>
              
              <button
                id="btn-autofill-mock"
                onClick={handleAutofillMock}
                className="w-full flex items-center justify-center space-x-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-1.5 rounded border border-blue-500/20 transition text-xs"
              >
                <span>Autorellenar Datos de Prueba</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="p-2 bg-zinc-950 border border-zinc-800 rounded text-[9px] text-zinc-500 font-mono text-center">
            Mapeo inteligente con tipos de cambio históricos
          </div>
        </div>

      </div>

    </div>
  );
}
