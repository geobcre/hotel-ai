# 03 — Gemini API

## Datos de conexión

| Campo | Valor |
|---|---|
| Proveedor | Google AI Studio |
| Modelo | `gemini-2.0-flash` |
| SDK | `@google/generative-ai` |
| Key | `process.env.GEMINI_API_KEY` |
| Límite gratuito | 1,500 requests/día, 1M tokens/min |

---

## Instalación

```bash
npm install @google/generative-ai
```

---

## Cliente base — `src/lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta GEMINI_API_KEY en .env.local')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,        // creatividad moderada para conversación natural
    maxOutputTokens: 1024,   // suficiente para preguntas + JSON
    responseMimeType: 'application/json', // forzar respuesta en JSON
  }
})
```

---

## Función principal del agente — `processUserMessage`

```typescript
import { geminiModel } from './gemini'
import { AGENT_SYSTEM_PROMPT } from './conversationFlow'
import type { Message, UserPreferences, AgentResponse } from '@/types'

export async function processUserMessage(
  userMessage: string,
  conversationHistory: Message[],
  currentStep: number,
  extractedData: Partial<UserPreferences>
): Promise<AgentResponse> {

  // Construir historial en formato Gemini
  const history = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))

  // Iniciar chat con historial
  const chat = geminiModel.startChat({
    history,
    systemInstruction: AGENT_SYSTEM_PROMPT
  })

  // Enviar mensaje con contexto del paso actual
  const contextMessage = `
    Paso actual: ${currentStep}
    Datos ya recopilados: ${JSON.stringify(extractedData)}
    Mensaje del usuario: ${userMessage}
  `

  const result = await chat.sendMessage(contextMessage)
  const responseText = result.response.text()

  // Parsear respuesta JSON de Gemini
  const parsed: AgentResponse = JSON.parse(responseText)
  return parsed
}
```

---

## Función de recomendación final — `generateRecommendation`

```typescript
import { geminiModel } from './gemini'
import type { UserPreferences, Hotel, RecommendationResult } from '@/types'

export async function generateRecommendation(
  preferences: UserPreferences,
  hotels: Hotel[]
): Promise<RecommendationResult> {

  const prompt = `
    Eres un experto en viajes. Analiza estos hoteles y recomienda el mejor
    según las preferencias del usuario.

    PREFERENCIAS DEL USUARIO:
    ${JSON.stringify(preferences, null, 2)}

    HOTELES DISPONIBLES:
    ${JSON.stringify(hotels, null, 2)}

    Responde en JSON con esta estructura exacta:
    {
      "recommendedHotel": { ...el hotel recomendado completo... },
      "compatibilityScore": 85,
      "reasons": [
        "Razón 1 por qué es perfecto para este usuario",
        "Razón 2...",
        "Razón 3..."
      ],
      "highlights": ["Característica destacada 1", "Característica 2"],
      "disclaimer": "Nota opcional sobre el hotel"
    }
  `

  const result = await geminiModel.generateContent(prompt)
  const responseText = result.response.text()
  return JSON.parse(responseText) as RecommendationResult
}
```

---

## API Route — `src/app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { processUserMessage } from '@/lib/gemini'
import type { Message, UserPreferences } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      message,
      conversationHistory,
      currentStep,
      extractedData
    }: {
      message: string
      conversationHistory: Message[]
      currentStep: number
      extractedData: Partial<UserPreferences>
    } = body

    // Validación básica
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El campo message es requerido' },
        { status: 400 }
      )
    }

    const agentResponse = await processUserMessage(
      message,
      conversationHistory,
      currentStep,
      extractedData
    )

    return NextResponse.json(agentResponse)

  } catch (error) {
    console.error('Error en /api/chat:', error)
    return NextResponse.json(
      { error: 'Error procesando el mensaje' },
      { status: 500 }
    )
  }
}
```

---

## System prompt completo — `AGENT_SYSTEM_PROMPT`

```typescript
export const AGENT_SYSTEM_PROMPT = `
Eres un asistente amigable y experto en viajes que ayuda a encontrar el hotel perfecto.

Tu tarea es recopilar información del usuario mediante una conversación natural y progresiva.
Debes extraer los siguientes datos en este orden:
1. ciudad (city)
2. fechas de entrada y salida (checkIn, checkOut en formato YYYY-MM-DD)
3. número de huéspedes (guests)
4. presupuesto por noche (budgetMin, budgetMax, currency)
5. tipo de viaje (tripType: leisure | business | family | romantic)
6. amenidades deseadas (amenities: string[])
7. preferencias especiales (specialRequests: string, opcional)

REGLAS ESTRICTAS:
- Haz UNA sola pregunta a la vez
- Confirma brevemente lo que el usuario dijo antes de preguntar lo siguiente
- Sé cálido, natural y conversacional — nunca robótico ni formal en exceso
- Si el usuario da información vaga, pide clarificación amablemente
- Si el usuario da información de múltiples campos a la vez, extráela toda
- Responde SIEMPRE en el mismo idioma que usa el usuario
- Para las fechas, convierte siempre a formato YYYY-MM-DD
- Para el presupuesto, identifica la moneda (USD, EUR, GTQ, MXN, etc.)
- El campo specialRequests es opcional — si el usuario no quiere, ponlo como null

FORMATO DE RESPUESTA (JSON estricto, sin texto adicional):
{
  "reply": "tu respuesta conversacional al usuario",
  "extractedData": {
    "city": "...",
    "checkIn": "YYYY-MM-DD",
    "checkOut": "YYYY-MM-DD",
    "guests": 0,
    "budgetMin": 0,
    "budgetMax": 0,
    "currency": "USD",
    "tripType": "leisure",
    "amenities": [],
    "specialRequests": null
  },
  "isComplete": false,
  "nextStep": 0
}

Solo incluye en extractedData los campos que pudiste extraer del mensaje actual.
Cuando isComplete sea true, incluye TODOS los campos recopilados hasta ese momento.
`
```

---

## Configuración de temperatura según tarea

| Tarea | Temperature | Razón |
|---|---|---|
| Conversación con usuario | `0.7` | Natural pero coherente |
| Extracción de datos | `0.2` | Preciso, sin inventar datos |
| Recomendación final | `0.5` | Creativo pero fundamentado |

> Para la recomendación final, crear una instancia separada con `temperature: 0.5`

---

## Manejo de errores comunes

```typescript
// Error de cuota excedida
if (error.message.includes('429')) {
  return { error: 'Límite de requests alcanzado. Intenta en un momento.' }
}

// Error de API key inválida
if (error.message.includes('401') || error.message.includes('403')) {
  return { error: 'Error de autenticación con Gemini.' }
}

// Error de JSON malformado en respuesta
try {
  return JSON.parse(responseText)
} catch {
  // Si Gemini no devuelve JSON válido, extraer con regex como fallback
  const match = responseText.match(/\{[\s\S]*\}/)
  if (match) return JSON.parse(match[0])
  throw new Error('Respuesta de Gemini no es JSON válido')
}
```
