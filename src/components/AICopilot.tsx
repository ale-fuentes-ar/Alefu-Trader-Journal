import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  RefreshCw,
  BrainCircuit,
  MessageSquare,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PRESET_PROMPTS = [
  { text: '¿Cuál es mi mayor error recurrente?', icon: '❌' },
  { text: '¿Qué emociones afectan más mi rendimiento?', icon: '🧠' },
  { text: '¿Qué estrategia y setup funciona mejor para mí?', icon: '🚀' },
  { text: 'Analiza si estoy sobreoperando en el índice (WIN)', icon: '⚖️' }
];

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy tu **Copiloto de Trading con IA**, experto en psicotrading, análisis cuantitativo de portafolios y gestión del riesgo.

Analizaré todo tu diario operativo en **ProfitPRO** y **MetaTrader 5** en tiempo real. Puedo detectar sesgos cognitivos, calcular correlaciones emocionales, auditar tu ratio de Sharpe y sugerir ajustes.

Haz clic en una de las preguntas sugeridas o escribe tu propia consulta.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Custom API Key states
  const [customKey, setCustomKey] = useState<string>(() => localStorage.getItem('user_gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setErrorMsg(null);
    const newMsg: Message = { role: 'user', content: textToSend };
    const updatedHistory = [...messages, newMsg];
    
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedHistory.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
          })),
          customApiKey: customKey || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor de IA.');
      }

      setMessages([...updatedHistory, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con la IA de Gemini. Asegúrate de tener tu Secrets Key activada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-copilot-view" className="p-4 flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header */}
      <div id="ai-header" className="border-b border-zinc-800 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-500/10 rounded text-blue-400 border border-blue-500/20">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-sm text-white">Trader Copilot AI</h2>
            <p className="text-[10px] text-zinc-400">Consultoría psicotécnica integrada de trading con Gemini.</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <Sparkles className="h-2.5 w-2.5 animate-pulse" />
          <span>DATOS SINCRONIZADOS</span>
        </div>
      </div>

      {/* Main split layout: Chat & Tips */}
      <div id="ai-split-layout" className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-3 pt-3">
        
        {/* Chat area: 3 Cols */}
        <div className="lg:col-span-3 flex flex-col bg-zinc-900 rounded border border-zinc-800 overflow-hidden h-full">
          
          {/* Messages window */}
          <div id="ai-messages-window" className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className={`flex space-x-2.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`p-1.5 rounded text-white h-7.5 w-7.5 flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {m.role === 'user' ? <MessageSquare className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble content */}
                <div className={`p-3 rounded text-[11px] leading-relaxed border whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100 rounded-tr-none' 
                    : 'bg-zinc-950/30 border-zinc-850 text-zinc-200 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Pulsing loading state */}
            {loading && (
              <div className="flex space-x-2.5 max-w-[85%] animate-pulse">
                <div className="p-1.5 bg-blue-500/10 rounded text-blue-400 h-7.5 w-7.5 flex items-center justify-center border border-blue-500/20">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-3 rounded bg-zinc-950/20 border border-zinc-850 text-[11px] text-zinc-400 rounded-tl-none flex items-center space-x-1.5">
                  <span>Analizando métricas del diario...</span>
                  <div className="flex space-x-0.5">
                    <div className="h-1 w-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-1 w-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-1 w-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded flex items-start space-x-2 text-[11px] animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs">No se pudo llamar a Gemini API</span>
                  {errorMsg}
                  <span className="block mt-1.5 font-semibold text-[10px]">Cómo resolverlo:</span>
                  <p className="mt-0.5 text-zinc-300">
                    Abre el menú de <strong>Settings &gt; Secrets</strong> de AI Studio, agrega una nueva variable llamada <strong>GEMINI_API_KEY</strong> y coloca tu clave de API de Gemini.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/30">
            <div className="flex items-center space-x-1.5">
              <input
                id="ai-chat-input"
                type="text"
                placeholder="Pregunta sobre tu tasa de acierto, emociones, errores o estrategias..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                id="btn-send-ai-message"
                onClick={() => handleSendMessage(input)}
                disabled={loading}
                className="p-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold transition flex items-center justify-center shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Preset prompts and suggestions: 1 Col */}
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            
            {/* Custom API Key Config Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-zinc-400 flex items-center space-x-1">
                  <Key className="h-3 w-3 text-amber-500" />
                  <span>CLAVE API DE GEMINI</span>
                </span>
                {customKey ? (
                  <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>PERSONALIZADA</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-blue-400 font-mono font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    SISTEMA
                  </span>
                )}
              </div>
              
              <p className="text-[9px] text-zinc-500 leading-relaxed">
                Si la API por defecto está experimentando alta demanda (error 503), puedes guardar tu propia clave de Gemini de forma segura en este navegador.
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5 relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={customKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomKey(val);
                      localStorage.setItem('user_gemini_api_key', val);
                    }}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded pl-2.5 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                    title={showKey ? "Ocultar" : "Mostrar"}
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9px] text-zinc-500">
                  <a 
                    href="https://aistudio.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-amber-500 hover:underline transition font-semibold"
                  >
                    Obtener Clave Gratis ↗
                  </a>
                  {customKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomKey('');
                        localStorage.removeItem('user_gemini_api_key');
                      }}
                      className="text-rose-400 hover:text-rose-300 transition font-semibold font-mono cursor-pointer"
                    >
                      ELIMINAR
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 my-3"></div>

            <div className="space-y-3">
              <h3 className="font-sans font-bold text-xs text-zinc-300 flex items-center space-x-1">
                <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>Consultas Rápidas</span>
              </h3>
              
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Haz clic sobre cualquiera de las conjeturas psicológicas de abajo para alimentar instantáneamente al asistente con tu base de datos:
              </p>

              <div className="space-y-1.5 pt-1">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className="w-full text-left p-2.5 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 hover:border-blue-500/40 text-[11px] transition group flex items-start space-x-2"
                  >
                    <span className="text-xs shrink-0">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-zinc-300 font-medium group-hover:text-white leading-tight block">{p.text}</span>
                      <span className="text-[8px] text-zinc-500 font-mono mt-0.5 flex items-center space-x-1">
                        <span>Preguntar</span>
                        <ArrowRight className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-2 bg-blue-500/5 border border-blue-500/10 rounded text-[9px] text-zinc-400 font-mono text-center">
            Conectado a Gemini • Seguro para Enterprise
          </div>
        </div>

      </div>

    </div>
  );
}
