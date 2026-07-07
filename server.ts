import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { Trade, TradingGoal, ExchangeRate, TradeBackup, Strategy } from './src/types.js';

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
const STRATEGIES_FILE = path.join(DATA_DIR, 'strategies.json');

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

const DEFAULT_TRADES: Trade[] = [];

const DEFAULT_STRATEGIES: Strategy[] = [
  { id: 's1', name: 'Pullback VWAP', description: 'Entrada a favor de la tendencia tras un retroceso ordenado a la media VWAP diaria o de sesión.', defaultSetup: 'Gatillo en Media Móvil / Vela de rechazo' },
  { id: 's2', name: 'Rompimiento', description: 'Entrada de impulso cuando el precio supera una zona clave de soporte, resistencia o consolidación.', defaultSetup: 'Fallo de Máxima / Barra de ruptura con volumen' },
  { id: 's3', name: 'Soporte y Resistencia', description: 'Operación de reversión o rebote en niveles horizontales de soporte o resistencia macro.', defaultSetup: 'Pinbar o vela envolvente' },
  { id: 's4', name: 'Fading', description: 'Estrategia contraria para operar el agotamiento de un movimiento fuerte del mercado.', defaultSetup: 'Doble techo / divergencia oscilador' },
  { id: 's5', name: 'Tendencia de Canal', description: 'Operar los rebotes ordenados dentro de las bandas o límites de un canal de tendencia activo.', defaultSetup: 'Tercer toque en directriz' }
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
let strategiesList = readJsonFile<Strategy[]>(STRATEGIES_FILE, DEFAULT_STRATEGIES);

// API Routes
app.get('/api/trades', (req, res) => {
  tradesList = readJsonFile<Trade[]>(TRADES_FILE, DEFAULT_TRADES);
  res.json(tradesList);
});

app.get('/api/rate', (req, res) => {
  ratesList = readJsonFile<ExchangeRate[]>(EXCHANGE_FILE, DEFAULT_RATES);
  const latestRate = ratesList[0]?.rate || 5.65;
  res.json({ rate: latestRate });
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
  goalsList = readJsonFile<TradingGoal[]>(GOALS_FILE, DEFAULT_GOALS);
  res.json(goalsList);
});

app.post('/api/goals', (req, res) => {
  goalsList = req.body;
  writeJsonFile(GOALS_FILE, goalsList);
  res.json(goalsList);
});

// Exchange Rates API
app.get('/api/exchange-rates', (req, res) => {
  ratesList = readJsonFile<ExchangeRate[]>(EXCHANGE_FILE, DEFAULT_RATES);
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

// Strategies API
app.get('/api/strategies', (req, res) => {
  strategiesList = readJsonFile<Strategy[]>(STRATEGIES_FILE, DEFAULT_STRATEGIES);
  res.json(strategiesList);
});

app.post('/api/strategies', (req, res) => {
  const newStrategy: Strategy = req.body;
  if (!newStrategy.name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!newStrategy.id) {
    newStrategy.id = `s-${Date.now()}`;
  }
  newStrategy.createdAt = new Date().toISOString();
  strategiesList.push(newStrategy);
  writeJsonFile(STRATEGIES_FILE, strategiesList);
  res.status(201).json(newStrategy);
});

app.put('/api/strategies/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const index = strategiesList.findIndex(s => s.id === id);
  if (index !== -1) {
    strategiesList[index] = { ...strategiesList[index], ...updatedData };
    writeJsonFile(STRATEGIES_FILE, strategiesList);
    res.json(strategiesList[index]);
  } else {
    res.status(404).json({ error: 'Strategy not found' });
  }
});

app.delete('/api/strategies/:id', (req, res) => {
  const { id } = req.params;
  const index = strategiesList.findIndex(s => s.id === id);
  if (index !== -1) {
    const deleted = strategiesList.splice(index, 1);
    writeJsonFile(STRATEGIES_FILE, strategiesList);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: 'Strategy not found' });
  }
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

app.post(['/api/backups/create', '/api/backup'], (req, res) => {
  try {
    const backupName = `manual-backup-${Date.now()}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    fs.writeFileSync(backupPath, JSON.stringify(tradesList, null, 2), 'utf-8');
    res.json({ success: true, filename: backupName, file: backupName });
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
  const { messages, customApiKey } = req.body;
  
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ 
      error: 'La clave GEMINI_API_KEY no está configurada. Actívala en el panel de Secrets de AI Studio, o configúrala en la interfaz.' 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
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
