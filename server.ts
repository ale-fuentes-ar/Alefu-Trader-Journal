import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { Trade, TradingGoal, ExchangeRate, TradeBackup } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');
const EXCHANGE_FILE = path.join(DATA_DIR, 'exchange_rates.json');

// Ensure dirs exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Initial/Seed Data
const DEFAULT_RATES: ExchangeRate[] = [
  { rate: 5.62, date: '2026-07-07' },
  { rate: 5.60, date: '2026-07-06' },
  { rate: 5.58, date: '2026-07-05' },
  { rate: 5.57, date: '2026-07-04' },
  { rate: 5.55, date: '2026-07-03' },
  { rate: 5.56, date: '2026-07-02' },
  { rate: 5.54, date: '2026-07-01' },
];

const DEFAULT_GOALS: TradingGoal[] = [
  { period: 'diaria', targetBRL: 500, lossLimitBRL: 300, targetUSD: 100, lossLimitUSD: 60 },
  { period: 'semanal', targetBRL: 2500, lossLimitBRL: 1200, targetUSD: 500, lossLimitUSD: 250 },
  { period: 'mensual', targetBRL: 10000, lossLimitBRL: 4000, targetUSD: 2000, lossLimitUSD: 900 },
  { period: 'anual', targetBRL: 120000, lossLimitBRL: 30000, targetUSD: 24000, lossLimitUSD: 6000 }
];

const DEFAULT_TRADES: Trade[] = [
  {
    id: 't1',
    date: '2026-07-01',
    time: '09:15',
    platform: 'ProfitPRO',
    market: 'Nacional',
    asset: 'WIN',
    assetType: 'Mini Índice',
    side: 'Compra',
    timeframe: '5m',
    strategy: 'Pullback VWAP',
    setup: 'Gatillo en Media Móvil',
    trend: 'Alcista',
    confirmations: ['Volumen comprador', 'Rechazo en VWAP', 'RSI sobrevendido'],
    entryReason: 'Retroceso saludable a la VWAP diaria con incremento de volumen comprador en el soporte.',
    exitReason: 'Alcanzó el primer objetivo en la resistencia técnica del canal ascendente.',
    capital: 15000,
    riskPercent: 1.5,
    stopLoss: 150, // points
    takeProfit: 300, // points
    rMultiple: 2.0,
    size: 5, // contrats
    currency: 'BRL',
    financialResult: 300, // +300 BRL
    pointsResult: 300,
    ticksResult: 60,
    percentResult: 2.0,
    emotionBefore: 'Calmado',
    confidenceBefore: 4,
    stressBefore: 2,
    anxietyBefore: 1,
    feelAfter: 'Ejecución perfecta del plan. Salida en el target exacto.',
    learned: 'La paciencia para esperar el retroceso a VWAP paga bien.',
    toRepeat: 'Esperar confirmación de volumen antes de disparar.',
    toAvoid: 'Mover el stop-loss a break-even demasiado rápido.',
    images: [],
    observations: 'Operación muy limpia. ProfitPRO ejecutó las órdenes de inmediato.',
    exchangeRateUsed: 5.54,
    createdAt: new Date('2026-07-01T09:30:00.000Z').toISOString()
  },
  {
    id: 't2',
    date: '2026-07-02',
    time: '10:45',
    platform: 'ProfitPRO',
    market: 'Nacional',
    asset: 'WDO',
    assetType: 'Mini Dólar',
    side: 'Venta',
    timeframe: '2m',
    strategy: 'Rompimiento',
    setup: 'Fallo de Máxima',
    trend: 'Bajista',
    confirmations: ['Fallo de romper máximo previo', 'Velas de absorción', 'Flujo vendedor'],
    entryReason: 'Falso rompimiento del máximo del día anterior con fuerte absorción institucional.',
    exitReason: 'Stop loss alcanzado por mechazo de volatilidad antes de que el precio cayera.',
    capital: 15300,
    riskPercent: 1.3,
    stopLoss: 10, // points
    takeProfit: 20, // points
    rMultiple: -1.0,
    size: 2, // contracts
    currency: 'BRL',
    financialResult: -200, // -200 BRL
    pointsResult: -10,
    ticksResult: -20,
    percentResult: -1.3,
    emotionBefore: 'Ansioso',
    confidenceBefore: 3,
    stressBefore: 4,
    anxietyBefore: 4,
    feelAfter: 'Frustración porque la dirección final fue la correcta pero me sacó el Stop Loss.',
    learned: 'El mercado del dólar es muy volátil en la mañana; necesito stops un poco más holgados.',
    toRepeat: 'Identificar correctamente el falso rompimiento.',
    toAvoid: 'Apalancarme de más en horarios de alta volatilidad.',
    images: [],
    observations: 'Sentí presión por recuperar una pérdida pequeña anterior en otra pantalla.',
    exchangeRateUsed: 5.56,
    createdAt: new Date('2026-07-02T11:00:00.000Z').toISOString()
  },
  {
    id: 't3',
    date: '2026-07-03',
    time: '08:30',
    platform: 'MT5',
    market: 'Internacional',
    asset: 'EURUSD',
    assetType: 'Forex',
    side: 'Compra',
    timeframe: '15m',
    strategy: 'Soporte/Resistencia',
    setup: 'Pinbar en Soporte Semanal',
    trend: 'Lateral',
    confirmations: ['Soporte semanal fuerte', 'Pinbar alcista perfecta', 'Divergencia alcista MACD'],
    entryReason: 'Rechazo evidente en el nivel clave diario de 1.08200 con formación de pinbar.',
    exitReason: 'Cierre manual al final de la sesión de NY antes del fin de semana.',
    capital: 5000, // USD
    riskPercent: 2.0,
    stopLoss: 15, // pips
    takeProfit: 45, // pips
    rMultiple: 1.8,
    size: 0.5, // lots
    currency: 'USD',
    financialResult: 90, // +90 USD
    pointsResult: 18,
    ticksResult: 18,
    percentResult: 1.8,
    emotionBefore: 'Calmado',
    confidenceBefore: 5,
    stressBefore: 1,
    anxietyBefore: 1,
    feelAfter: 'Satisfecho, mantuve la calma durante la fase de lateralización.',
    learned: 'Respetar los soportes macro da operaciones con alta probabilidad.',
    toRepeat: 'Operar solo cuando haya confluencia de factores macro.',
    toAvoid: 'Sobreanalizar gráficos de 1 minuto durante la operación.',
    images: [],
    observations: 'MT5 funcionó excelente. Spread bajo de 0.2 pips.',
    exchangeRateUsed: 5.55,
    createdAt: new Date('2026-07-03T16:00:00.000Z').toISOString()
  },
  {
    id: 't4',
    date: '2026-07-05',
    time: '21:15',
    platform: 'MT5',
    market: 'Internacional',
    asset: 'XAUUSD',
    assetType: 'Oro',
    side: 'Compra',
    timeframe: '1H',
    strategy: 'Tendencia de Canal',
    setup: 'Tercer Toque en Directriz',
    trend: 'Alcista',
    confirmations: ['Línea de tendencia alcista intacta', 'Patrón envolvente en H1', 'Estructura Market Structure Shift'],
    entryReason: 'Tercer toque en la directriz de tendencia alcista principal en confluencia con el bloque de órdenes de H4.',
    exitReason: 'Alcanzó el Take Profit automático establecido en la resistencia mensual.',
    capital: 5090, // USD
    riskPercent: 2.0,
    stopLoss: 100, // points
    takeProfit: 300, // points
    rMultiple: 3.0,
    size: 0.1, // lots
    currency: 'USD',
    financialResult: 300, // +300 USD
    pointsResult: 300,
    ticksResult: 3000,
    percentResult: 5.89,
    emotionBefore: 'Calmado',
    confidenceBefore: 5,
    stressBefore: 2,
    anxietyBefore: 2,
    feelAfter: 'Excelente ratio riesgo/beneficio. Dejar correr dio frutos.',
    learned: 'Las operaciones en marcos de tiempo altos (H1/H4) requieren menos microgestión y pagan más.',
    toRepeat: 'Colocar órdenes límite en zonas de bloques de órdenes institucionales.',
    toAvoid: 'Cerrar manualmente la operación por miedo antes del target.',
    images: [],
    observations: 'Operación iniciada durante la apertura de la sesión asiática.',
    exchangeRateUsed: 5.58,
    createdAt: new Date('2026-07-05T23:30:00.000Z').toISOString()
  },
  {
    id: 't5',
    date: '2026-07-06',
    time: '11:30',
    platform: 'MT5',
    market: 'Internacional',
    asset: 'BTCUSD',
    assetType: 'Criptomonedas',
    side: 'Venta',
    timeframe: '15m',
    strategy: 'Fading',
    setup: 'Doble Techo',
    trend: 'Bajista',
    confirmations: ['Doble techo en zona de resistencia psicológica', 'Pérdida de fuerza en volumen comprador', 'Sobrecompra extrema'],
    entryReason: 'Intento fallido de romper la resistencia de los $68,000 con formación de doble techo.',
    exitReason: 'Stop loss ejecutado de forma automática por un rápido "short squeeze" de fin de rango.',
    capital: 5390, // USD
    riskPercent: 1.5,
    stopLoss: 1600, // points
    takeProfit: 3200, // points
    rMultiple: -1.0,
    size: 0.05, // lots
    currency: 'USD',
    financialResult: -80, // -80 USD
    pointsResult: -1600,
    ticksResult: -1600,
    percentResult: -1.48,
    emotionBefore: 'Impaciente',
    confidenceBefore: 3,
    stressBefore: 3,
    anxietyBefore: 4,
    feelAfter: 'Molesto por entrar tarde al movimiento motivado por FOMO.',
    learned: 'No operar cripto en rangos estrechos sin confirmación clara en temporalidades mayores.',
    toRepeat: 'Respetar el tamaño de la posición calculado.',
    toAvoid: 'Entrar a mercado cuando el precio ya se ha alejado del stop ideal.',
    images: [],
    observations: 'Estaba cansado después de una sesión larga en el mercado brasileño.',
    exchangeRateUsed: 5.60,
    createdAt: new Date('2026-07-06T12:00:00.000Z').toISOString()
  },
  {
    id: 't6',
    date: '2026-07-06',
    time: '14:30',
    platform: 'ProfitPRO',
    market: 'Nacional',
    asset: 'VALE3',
    assetType: 'Acciones',
    side: 'Compra',
    timeframe: '15m',
    strategy: 'Soporte/Resistencia',
    setup: 'Pullback en Zona de Resistencia Rota',
    trend: 'Alcista',
    confirmations: ['Resistencia previa rota convertida en soporte', 'Cruce de medias móviles alcistas', 'Entrada de flujo de capital extranjero'],
    entryReason: 'VALE3 rompe con fuerza el nivel de 62.50 BRL, retrocede a testear el nivel y muestra gatillo alcista en la media de 20.',
    exitReason: 'Cierre de mercado brasileño regular.',
    capital: 15100, // BRL
    riskPercent: 1.0,
    stopLoss: 0.50, // BRL per share
    takeProfit: 1.50, // BRL per share
    rMultiple: 2.2,
    size: 300, // actions
    currency: 'BRL',
    financialResult: 330, // +330 BRL
    pointsResult: 1.10,
    ticksResult: 110,
    percentResult: 2.18,
    emotionBefore: 'Calmado',
    confidenceBefore: 4,
    stressBefore: 1,
    anxietyBefore: 2,
    feelAfter: 'Excelente ejecución. Las acciones son mucho más tranquilas que los futuros.',
    learned: 'Operar acciones permite una mejor gestión psicológica comparada con la presión del mini índice.',
    toRepeat: 'Diversificar capital en acciones de alta liquidez como VALE3 y PETR4.',
    toAvoid: 'Ignorar el spread en las primeras horas de apertura.',
    images: [],
    observations: 'VALE3 acompañó la fuerte subida del mineral de hierro en China.',
    exchangeRateUsed: 5.60,
    createdAt: new Date('2026-07-06T15:00:00.000Z').toISOString()
  },
  {
    id: 't7',
    date: '2026-07-07',
    time: '09:05',
    platform: 'ProfitPRO',
    market: 'Nacional',
    asset: 'WIN',
    assetType: 'Mini Índice',
    side: 'Compra',
    timeframe: '5m',
    strategy: 'Pullback VWAP',
    setup: 'Gatillo en Media Móvil',
    trend: 'Alcista',
    confirmations: ['Apertura con Gap Alcista', 'VWAP inclinada positivamente', 'Media de 20 periodos apuntando arriba'],
    entryReason: 'Retroceso rápido para cerrar el gap de apertura, rebotando milimétricamente en la VWAP diaria.',
    exitReason: 'Cierre en el objetivo intradía del 1% de variación diaria del índice.',
    capital: 15430, // BRL
    riskPercent: 1.5,
    stopLoss: 120, // points
    takeProfit: 360, // points
    rMultiple: 3.0,
    size: 5, // contracts
    currency: 'BRL',
    financialResult: 360, // +360 BRL
    pointsResult: 360,
    ticksResult: 72,
    percentResult: 2.33,
    emotionBefore: 'Calmado',
    confidenceBefore: 5,
    stressBefore: 2,
    anxietyBefore: 1,
    feelAfter: 'Estupenda forma de empezar el día. Ejecutado sin ninguna duda.',
    learned: 'Los trades tempranos a favor de la tendencia dominante del gap son altamente rentables si se entra en la zona correcta.',
    toRepeat: 'Usar la VWAP de la sesión anterior como nivel magnético de soporte.',
    toAvoid: 'Operar en el primer minuto exacto de apertura (esperar al menos 5 minutos).',
    images: [],
    observations: 'Sesión muy fluida.',
    exchangeRateUsed: 5.62,
    createdAt: new Date('2026-07-07T09:20:00.000Z').toISOString()
  }
];

// Load / Save Helpers
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    // Automatic backup
    createAutomaticBackup();
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

function createAutomaticBackup() {
  try {
    if (!fs.existsSync(TRADES_FILE)) return;
    const trades = JSON.parse(fs.readFileSync(TRADES_FILE, 'utf-8'));
    const backupName = `auto-backup-${Date.now()}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    fs.writeFileSync(backupPath, JSON.stringify(trades, null, 2), 'utf-8');
    
    // Maintain maximum 10 backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('auto-backup-'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => a.time - b.time);
      
    while (files.length > 10) {
      const oldest = files.shift();
      if (oldest) {
        fs.unlinkSync(path.join(BACKUP_DIR, oldest.name));
      }
    }
  } catch (err) {
    console.error('Error creating auto-backup:', err);
  }
}

// Initial seed loading
let tradesList = readJsonFile<Trade[]>(TRADES_FILE, DEFAULT_TRADES);
let goalsList = readJsonFile<TradingGoal[]>(GOALS_FILE, DEFAULT_GOALS);
let ratesList = readJsonFile<ExchangeRate[]>(EXCHANGE_FILE, DEFAULT_RATES);

// API Routes
app.get('/api/trades', (req, res) => {
  res.json(tradesList);
});

app.post('/api/trades', (req, res) => {
  const newTrade: Trade = req.body;
  if (!newTrade.id) {
    newTrade.id = `t-${Date.now()}`;
  }
  newTrade.createdAt = new Date().toISOString();
  tradesList.unshift(newTrade);
  writeJsonFile(TRADES_FILE, tradesList);
  res.status(201).json(newTrade);
});

app.put('/api/trades/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const index = tradesList.findIndex(t => t.id === id);
  if (index !== -1) {
    tradesList[index] = { ...tradesList[index], ...updatedData };
    writeJsonFile(TRADES_FILE, tradesList);
    res.json(tradesList[index]);
  } else {
    res.status(404).json({ error: 'Trade not found' });
  }
});

app.delete('/api/trades/:id', (req, res) => {
  const { id } = req.params;
  const index = tradesList.findIndex(t => t.id === id);
  if (index !== -1) {
    const deleted = tradesList.splice(index, 1);
    writeJsonFile(TRADES_FILE, tradesList);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: 'Trade not found' });
  }
});

app.delete('/api/trades', (req, res) => {
  tradesList = [];
  writeJsonFile(TRADES_FILE, tradesList);
  res.json({ message: 'All trades deleted successfully' });
});

// Goals API
app.get('/api/goals', (req, res) => {
  res.json(goalsList);
});

app.post('/api/goals', (req, res) => {
  goalsList = req.body;
  writeJsonFile(GOALS_FILE, goalsList);
  res.json(goalsList);
});

// Exchange Rates API
app.get('/api/exchange-rates', (req, res) => {
  res.json(ratesList);
});

app.post('/api/exchange-rates', (req, res) => {
  const newRate: ExchangeRate = req.body;
  // If exists on same date, update it, otherwise unshift
  const existingIndex = ratesList.findIndex(r => r.date === newRate.date);
  if (existingIndex !== -1) {
    ratesList[existingIndex].rate = newRate.rate;
  } else {
    ratesList.unshift(newRate);
  }
  writeJsonFile(EXCHANGE_FILE, ratesList);
  res.json(ratesList);
});

// Backups API
app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR).map(file => {
      const stat = fs.statSync(path.join(BACKUP_DIR, file));
      let count = 0;
      try {
        const content = fs.readFileSync(path.join(BACKUP_DIR, file), 'utf-8');
        const parsed = JSON.parse(content);
        count = Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {}
      
      return {
        filename: file,
        timestamp: stat.mtime.toISOString(),
        tradeCount: count,
        sizeBytes: stat.size,
        description: file.startsWith('auto-') ? 'Copia de seguridad automática' : 'Copia de seguridad manual'
      };
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read backups' });
  }
});

app.post('/api/backups/create', (req, res) => {
  try {
    const backupName = `manual-backup-${Date.now()}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    fs.writeFileSync(backupPath, JSON.stringify(tradesList, null, 2), 'utf-8');
    res.json({ success: true, filename: backupName });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create manual backup' });
  }
});

app.post('/api/backups/restore', (req, res) => {
  const { filename } = req.body;
  try {
    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    const content = fs.readFileSync(backupPath, 'utf-8');
    tradesList = JSON.parse(content);
    writeJsonFile(TRADES_FILE, tradesList);
    res.json({ success: true, count: tradesList.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// AI Copilot Endpoint using GoogleGenAI
app.post('/api/ai/chat', async (req, res) => {
  const { messages } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ 
      error: 'La clave GEMINI_API_KEY no está configurada. Actívala en el panel de Secrets de AI Studio.' 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Provide the trade log and goals to Gemini as direct contextual guidance
    const contextPrompt = `
Eres un Psicólogo de Trading de Élite, Científico de Datos Financieros y Consultor de Gestión de Riesgo para la plataforma "Trader Journal Pro".
Analizarás el diario de trading del usuario que opera en ProfitPRO (Brasil, en BRL, Mini Índice, Mini Dólar, Acciones, etc.) y MT5 (Internacional, en USD, Forex, Oro, Cripto, etc.).

A continuación tienes todos los datos actuales del trader en formato JSON:

--- METAS DEL TRADER ---
${JSON.stringify(goalsList, null, 2)}

--- HISTORIAL DE TRADES ---
${JSON.stringify(tradesList.map(t => ({
  date: t.date,
  time: t.time,
  platform: t.platform,
  asset: t.asset,
  side: t.side,
  strategy: t.strategy,
  setup: t.setup,
  trend: t.trend,
  financialResult: t.financialResult,
  currency: t.currency,
  pointsResult: t.pointsResult,
  rMultiple: t.rMultiple,
  emotionBefore: t.emotionBefore,
  confidenceBefore: t.confidenceBefore,
  stressBefore: t.stressBefore,
  anxietyBefore: t.anxietyBefore,
  feelAfter: t.feelAfter,
  learned: t.learned,
  toAvoid: t.toAvoid,
  toRepeat: t.toRepeat,
  observations: t.observations
})), null, 2)}

Tu misión es responder preguntas del trader como:
1. "¿Cuál es mi mayor error?"
2. "¿Qué estrategia funciona mejor?"
3. "¿Estoy sobreoperando?"
4. "¿Cuál es mi horario más rentable?"
5. "¿Cuál activo me genera más pérdidas?"
6. "¿Qué emociones afectan mi rendimiento?"

Reglas de respuesta:
- Habla en español, de forma muy profesional, objetiva y empática.
- Realiza cálculos reales basados en los trades provistos (por ejemplo, calcula la tasa de acierto (Win Rate), el Profit Factor, la relación de pérdidas con respecto a las emociones como la Ansiedad o Impaciencia).
- Ofrece recomendaciones accionables y constructivas específicas basadas en su historial.
- Sé claro, directo y estructurado con markdown. Utiliza negritas, listas ordenadas y tablas para que sea extremadamente legible.
`;

    const chatHistory = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Generate content using the recommended 'gemini-3.5-flash' model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { role: 'user', parts: [{ text: contextPrompt }] },
        ...chatHistory
      ]
    });

    res.json({ response: response.text });
  } catch (err: any) {
    console.error('Error calling Gemini API:', err);
    res.status(500).json({ error: err.message || 'Error al procesar la solicitud de IA' });
  }
});

// Start Server & Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
