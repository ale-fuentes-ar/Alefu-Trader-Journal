# Manual de Registro de Operaciones - Diario de Trading Profesional

Este manual detalla paso a paso cada uno de los campos disponibles en el formulario de registro de operaciones (Trades). Aquí comprenderás **qué** datos ingresar, **por qué** es vital registrarlos y **para qué** sirve cada métrica en la optimización de tu consistencia operativa.

El formulario está organizado en **6 secciones estratégicas** que conectan la parte técnica, la gestión de riesgo y la psicología del trader.

---

## 📋 Índice de Secciones
1. [Información General](#1-información-general)
2. [Configuración Técnica y Estrategia](#2-configuración-técnica-y-estrategia)
3. [Gestión de Riesgo](#3-gestión-de-riesgo)
4. [Resultados Financieros](#4-resultados-financieros)
5. [Psicología y Emociones](#5-psicología-y-emociones)
6. [Evidencias y Notas](#6-evidencias-y-notas)

---

## 1. Información General
Esta sección captura el contexto básico de cuándo, dónde y qué activo operaste. Permite segmentar tu base de datos para identificar en qué mercados o activos tienes mayor ventaja estadística.

### 📅 Fecha (`date`)
*   **Qué ingresar:** La fecha exacta en que se ejecutó la operación (Formato: `DD/MM/AAAA`).
*   **Por qué:** Para llevar una línea de tiempo cronológica y poder agrupar tus resultados por día, semana o mes.
*   **Para qué sirve:** Permite calcular estadísticas de rendimiento por día de la semana (por ejemplo, saber si los martes eres más rentable que los viernes) y alimenta la visualización de Calendario.

### ⏰ Hora (`time`)
*   **Qué ingresar:** La hora de entrada de la operación (Formato: `HH:MM`).
*   **Por qué:** El volumen y la volatilidad del mercado varían drásticamente según la sesión (Apertura de Nueva York, sesión de Londres, cierre, etc.).
*   **Para qué sirve:** Identifica tus horas de mayor efectividad. Muchos traders descubren que pierden dinero operando al mediodía o en las primeras/últimas horas de la sesión.

### 💻 Plataforma (`platform`)
*   **Qué ingresar:** Selecciona la plataforma utilizada: `ProfitPRO` o `MT5` (MetaTrader 5).
*   **Por qué:** Cada plataforma suele estar vinculada a mercados específicos (ProfitPRO para el mercado brasileño de futuros; MT5 para Forex, criptomonedas o índices internacionales).
*   **Para qué sirve:** Facilita la conciliación con tus cuentas reales y el análisis comparativo del rendimiento por plataforma.

### 🌐 Mercado (`market`)
*   **Qué ingresar:** `Nacional` (Mercado brasileño / B3) o `Internacional`.
*   **Por qué:** Permite separar activos denominados en Reales (BRL) de aquellos denominados en Dólares (USD).
*   **Para qué sirve:** El diario utiliza esta segmentación para aplicar tasas de conversión automática de divisas (USD a BRL) y consolidar tus ganancias totales en una sola moneda de reporte.

### 📈 Activo (`asset`)
*   **Qué ingresar:** El ticker o código del activo operado.
    *   *Ejemplos Nacionales:* `WIN` (Mini Índice Ibovespa), `WDO` (Mini Dólar), `PETR4`, `VALE3`.
    *   *Ejemplos Internacionales:* `EURUSD` (Euro/Dólar), `XAUUSD` (Oro), `BTCUSD` (Bitcoin), `SPX500` (S&P 500).
*   **Por qué:** Cada activo tiene su propio comportamiento, volatilidad, costo de spread y tamaño de tick.
*   **Para qué sirve:** Revela cuáles son tus activos más lucrativos y en cuáles deberías reducir tu exposición o refinar tu estrategia.

### 🏷️ Tipo de Activo (`assetType`)
*   **Qué ingresar:** La categoría del instrumento: `Mini Índice`, `Mini Dólar`, `Forex`, `Acciones`, `Oro/Metales`, `Criptomonedas`, `Commodities`.
*   **Por qué:** Facilita la organización macro del portafolio.
*   **Para qué sirve:** Proporciona gráficos circulares de distribución de operaciones y rentabilidad por clase de activo.

### 🔄 Lado / Dirección (`side`)
*   **Qué ingresar:** `Compra` (Long / Al alza) o `Venta` (Short / A la baja).
*   **Por qué:** El estado mental y la velocidad del mercado suelen ser diferentes al comprar (subidas escalonadas) que al vender (caídas rápidas).
*   **Para qué sirve:** Determina si tienes un sesgo psicológico u operativo. Muchos traders son altamente rentables en compras pero pierden consistentemente buscando posiciones cortas (ventas).

### ⏳ Timeframe / Temporalidad (`timeframe`)
*   **Qué ingresar:** El gráfico principal utilizado para tomar la decisión: `1m`, `5m`, `15m`, `1H`, `4H`, `Daily`, etc.
*   **Por qué:** El nivel de ruido en los precios y el tamaño de los stops varían sustancialmente entre el Scalping (temporalidades bajas) y el Swing Trading (temporalidades altas).
*   **Para qué sirve:** Permite saber en qué horizontes temporales tu lectura de mercado es realmente efectiva.

---

## 2. Configuración Técnica y Estrategia
Aquí registras el plano técnico que justifica el ingreso al mercado. Te ayuda a auditar si estás siguiendo tus reglas o simplemente improvisando (overtrading).

### 🛠️ Estrategia (`strategy`)
*   **Qué ingresar:** El nombre de la estrategia aplicada: `Pullback` (Retroceso), `Breakout` (Ruptura), `Fading` (Contratendencia), `Soporte/Resistencia`, `VWAP/Medias Móviles`.
*   **Por qué:** Debes tratar el trading como un negocio científico. Cada estrategia debe medirse por separado para evaluar su esperanza matemática positiva.
*   **Para qué sirve:** Desglosa tu tasa de acierto (Win Rate) y tu factor de beneficio (Profit Factor) por estrategia individual en la pestaña de "Estrategias". Te dirá con precisión cuál estrategia te da dinero y cuál debes descartar.

### 🎯 Setup Técnico (`setup`)
*   **Qué ingresar:** El patrón gráfico o gatillo específico de entrada.
    *   *Ejemplos:* `Pinbar`, `Engolfo (Bearish/Bullish)`, `Gatillo de Media Móvil`, `Ruptura de Canal`, `Doble Suelo / Doble Techo`.
*   **Por qué:** El gatillo es la confirmación micro que te da el "timing" preciso para colocar la orden.
*   **Para qué sirve:** Permite analizar el rendimiento por patrón de velas o estructura exacta para ver cuál tiene mayor probabilidad de éxito en tu rutina.

### 📉 Tendencia (`trend`)
*   **Qué ingresar:** La dirección del mercado en una temporalidad mayor: `Alcista`, `Bajista` o `Lateral`.
*   **Por qué:** Ir a favor de la tendencia principal (operar "pro-tendencia") generalmente ofrece un mayor ratio riesgo/beneficio que operar contratendencia.
*   **Para qué sirve:** Te muestra si tus pérdidas provienen de operar de forma imprudente contra tendencias fuertes o de comprar en mercados laterales sin dirección clara.

### ✅ Confirmaciones / Checklist (`confirmations`)
*   **Qué ingresar:** Una lista de verificación de las condiciones técnicas que se cumplieron antes de entrar.
    *   *Ejemplos:* `Precio en zona de valor`, `Divergencia en RSI`, `Volumen superior al promedio`, `Confluencia de Fibonnaci`.
*   **Por qué:** Protege tu capital contra impulsos emocionales. Te obliga a verificar de forma racional si el trade cumple los requisitos mínimos de tu plan de trading.
*   **Para qué sirve:** El sistema analiza si existe una relación directa entre el número de confirmaciones y el resultado financiero. Ayuda a responder: *¿Tengo mejores ganancias cuando espero a que se cumplan más de 3 confirmaciones?*

### 🚪 Motivos de Entrada y Salida (`entryReason` / `exitReason`)
*   **Qué ingresar:** 
    *   *Entrada:* Por qué decidiste ingresar en ese instante (ej: *"Ruptura confirmada con vela de volumen en el nivel de soporte"*).
    *   *Salida:* Por qué cerraste la operación (ej: *"Toque de Take Profit planificado"* o *"Salida anticipada por pérdida de momento en el RSI"*).
*   **Por qué:** Al documentar tus motivos, puedes verificar si respetaste tus objetivos o si saliste por miedo o codicia.
*   **Para qué sirve:** Expone patrones de salida prematura (cortar ganancias antes de tiempo) o salidas tardías (dejar que un trade ganador se convierta en perdedor).

---

## 3. Gestión de Riesgo
La gestión del dinero es el único factor que garantiza que sobrevivas a las rachas de pérdidas inevitables. Esta sección audita tu disciplina matemática.

### 💰 Capital Inicial (`capital`)
*   **Qué ingresar:** El saldo total de tu cuenta de trading al momento de iniciar la operación.
*   **Por qué:** Para poder calcular de manera precisa el impacto porcentual de cada trade en tu cuenta.
*   **Para qué sirve:** Es la base para medir el crecimiento compuesto de tu capital a lo largo del tiempo.

### ⚡ Riesgo Planificado % (`riskPercent`)
*   **Qué ingresar:** El porcentaje máximo de tu capital que estabas dispuesto a perder si tocaba el Stop Loss (ej: `1.0%`, `0.5%`, `2.0%`).
*   **Por qué:** Un trader profesional nunca opera sin saber exactamente cuánto va a perder en el peor escenario. Mantener este riesgo bajo y constante previene la bancarrota.
*   **Para qué sirve:** Permite evaluar tu consistencia en el tamaño de las posiciones. Si este número fluctúa descontroladamente (ej: arriesgar 1% en un trade y 10% en el siguiente), estás apostando, no haciendo trading profesional.

### 🛑 Stop Loss / Take Profit (`stopLoss` / `takeProfit`)
*   **Qué ingresar:** El nivel de precio o los puntos establecidos para limitar tu pérdida (Stop Loss) y para retirar tu ganancia (Take Profit).
*   **Por qué:** Define los límites lógicos de tu escenario operativo antes de que el ruido del mercado afecte tu juicio.
*   **Para qué sirve:** Sirve para auditar si mantuviste una relación adecuada de riesgo/recompensa inicial (Risk/Reward Ratio) y si modificaste tus órdenes de manera inapropiada durante la operación.

### 📊 Múltiplo R Realizado (`rMultiple`)
*   **Qué ingresar:** La cantidad de unidades de riesgo ganadas o perdidas en la operación real.
    *   *Ejemplo:* Si arriesgaste \$100 (tu unidad de riesgo 1R) y ganaste \$200, tu múltiplo R es `+2.0 R`. Si perdiste tu stop completo, tu múltiplo R es `-1.0 R`. Si saliste a mitad de camino con una pérdida controlada, puede ser `-0.5 R`.
*   **Por qué:** La métrica más importante de un trader profesional no es el dinero absoluto, sino el Múltiplo R. Un trader con un Win Rate de solo 40% pero que gana un promedio de `+2.5 R` por operación y pierde `-1.0 R` en las malas, será matemáticamente muy rentable en el largo plazo.
*   **Para qué sirve:** El sistema calcula la suma acumulada de R. Te permite evaluar tu rentabilidad pura desvinculada del tamaño de la cuenta o el apalancamiento.

### 🔢 Tamaño de la Posición (`size`)
*   **Qué ingresar:** La cantidad de contratos, lotes o acciones operadas.
    *   *Ejemplos:* `5 contratos` de WIN, `0.1 lotes` en EURUSD, `100 acciones` de PETR4.
*   **Por qué:** Documenta el volumen de mercado que controlabas.
*   **Para qué sirve:** Te ayuda a detectar si sufres del síndrome de sobre-apalancamiento (operar con más contratos de los que tu gestión de riesgo o tu psicología permiten tolerar).

---

## 4. Resultados Financieros
Esta sección captura la realidad numérica de la operación. Es la base cuantitativa para todos tus informes de ganancias y pérdidas.

### 💱 Moneda (`currency`)
*   **Qué ingresar:** `BRL` (Reales brasileños) o `USD` (Dólares estadounidenses).
*   **Por qué:** Permite operar de forma simultánea mercados locales (ProfitPRO/B3) e internacionales (MT5).
*   **Para qué sirve:** Permite la consolidación exacta de resultados utilizando el tipo de cambio del día de la operación.

### 💵 Resultado Financiero (`financialResult`)
*   **Qué ingresar:** El valor monetario neto ganado o perdido (usa signo negativo `-` para pérdidas).
*   **Por qué:** Registra el impacto económico directo en tu cuenta.
*   **Para qué sirve:** Alimenta las métricas de beneficio neto, factor de beneficio, promedio de trade ganador/perdedor y los gráficos de balance acumulado.

### 📏 Resultado en Puntos/Pips y Ticks (`pointsResult` / `ticksResult`)
*   **Qué ingresar:** El resultado de la operación expresado en la medida técnica del activo (ej: `+150 puntos` en el Mini Índice, `+15 pips` en EURUSD, `+30 ticks` en el dólar).
*   **Por qué:** El dinero ganado varía según el tamaño de tu posición, pero los puntos o pips acumulados reflejan la calidad técnica real de tu lectura de mercado.
*   **Para qué sirve:** Te ayuda a analizar si estás capturando movimientos de mercado consistentes, independientemente de si estás operando con 1 contrato o con 100.

### 📈 Retorno % Realizado (`percentResult`)
*   **Qué ingresar:** El porcentaje de retorno real obtenido sobre el capital inicial en este trade. Se calcula de forma automática en base al resultado y al capital, pero puedes ajustarlo.
*   **Por qué:** Normaliza tus ganancias para compararlas de forma justa con otros periodos de tiempo o inversiones tradicionales.
*   **Para qué sirve:** Grafica tu curva de rendimiento porcentual libre de la influencia del interés compuesto o retiros de capital.

---

## 5. Psicología y Emociones
El trading es un juego mental. El 90% de los traders fracasan por falta de disciplina emocional. Registrar tu estado mental te permite detectar sesgos destructivos.

### 🧠 Emoción Pre-Trade (`emotionBefore`)
*   **Qué ingresar:** Selecciona tu estado emocional predominante justo antes de hacer clic en entrar: `Calmado`, `Ansioso`, `Codicioso`, `Asustado`, `Impaciente`.
*   **Por qué:** Tus emociones nublan tu visión analítica. Entrar por codicia (querer ganar rápido) o impaciencia (entrar antes de que se confirme el setup) suele terminar en desastre.
*   **Para qué sirve:** Filtra tus estadísticas de rentabilidad por estado de ánimo. Te mostrará verdades incómodas pero valiosas, como: *"Tus trades iniciados con 'Impaciencia' tienen un 85% de tasa de pérdida"*. Esto te dará la disciplina necesaria para no operar cuando no estés `Calmado`.

### 📊 Niveles de 1 a 5 (`confidenceBefore` / `stressBefore` / `anxietyBefore`)
*   **Qué ingresar:** Califica del 1 (muy bajo) al 5 (muy alto) tus niveles de Confianza, Estrés y Ansiedad previos a la entrada.
*   **Por qué:** El estrés y la ansiedad deterioran tu capacidad de mantener la calma y te llevan a cometer errores operativos (mover el stop, cerrar antes, etc.).
*   **Para qué sirve:** Identifica correlaciones estadísticas. Si detectas que tus operaciones de alta confianza (nivel 5) realmente rinden mejor que las de baja confianza (nivel 1 o 2), aprenderás a ser más selectivo y operar solo tus mejores configuraciones.

### 📝 Post-Trade: Sentimiento, Aprendizaje, Qué Repetir y Qué Evitar
*   **Qué ingresar:** 
    *   *Sentimiento:* Cómo te sientes tras cerrar (ej: *"Satisfecho por seguir el plan, a pesar de la pérdida controlada"*).
    *   *Aprendizaje:* Qué lección te dejó el mercado (ej: *"No operar justo antes de noticias de alto impacto"*).
    *   *Qué Repetir:* Acciones correctas que ejecutaste (ej: *"Esperé pacientemente al pullback en la media de 20"*).
    *   *Qué Evitar:* Errores cometidos que no deben repetirse (ej: *"Aumenté la posición a mitad del trade por desesperación"*).
*   **Por qué:** El registro diario de lecciones aprendidas acelera drásticamente tu curva de aprendizaje. Convierte cada error costoso en una inversión educativa.
*   **Para qué sirve:** Alimenta el Asistente de IA (Copilot) de la aplicación, el cual leerá estas anotaciones y te dará consejos personalizados y conjeturas psicológicas de alta precisión basados en tus propias bitácoras.

---

## 6. Evidencias y Notas
Un trade sin captura de pantalla es un trade olvidado. La memoria humana es selectiva y tiende a recordar los aciertos y ocultar las fallas.

### 🖼️ Imágenes y Capturas (`images`)
*   **Qué ingresar:** Captura de pantalla del gráfico al momento de la entrada (con el gatillo y stop marcados) y/o al momento de la salida.
*   **Por qué:** Permite realizar revisiones visuales del mercado los fines de semana. Te ayuda a entrenar tu ojo para reconocer patrones válidos en cuestión de milisegundos.
*   **Para qué sirve:** Al expandir cualquier operación en tu lista de trades, podrás ver las imágenes asociadas de inmediato para recordar exactamente qué viste en el mercado en ese momento.

### 📝 Observaciones / Notas (`observations`)
*   **Qué ingresar:** Cualquier detalle adicional del mercado, noticias del día, eventos inesperados o pensamientos personales de la jornada.
*   **Por qué:** Captura los matices cualitativos que las métricas frías de números y precios no pueden reflejar.
*   **Para qué sirve:** Proporciona un contexto valioso durante tus auditorías semanales y mensuales de rendimiento.

---

### 💡 Consejo de Oro para la Consistencia:
El mejor diario de trading no es el que tiene más números, sino **el que se llena con absoluta honestidad**. Registrar una pérdida donde violaste tus reglas duele, pero es el único camino real para corregir tus fugas de capital y alcanzar el trading rentable de nivel profesional. ¡Buen trading!
