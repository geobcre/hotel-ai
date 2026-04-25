import Groq from 'groq-sdk'
import type { AgentResponse, Hotel, RecommendationResult, UserPreferences } from '@/types'
import { SYSTEM_PROMPT, buildPromptContext } from './conversationFlow'

// ─── Inicialización del cliente ───────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const CONVERSATION_MODEL = 'llama-3.3-70b-versatile'

// ─── Procesar mensaje del usuario ─────────────────────────────────────────────

export async function processUserMessage(
  userMessage: string,
  conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }>,
  currentStep: number,
  extractedData: Partial<UserPreferences>
): Promise<AgentResponse> {
  const contextPrompt = buildPromptContext(currentStep, extractedData)
  const fullMessage = `${contextPrompt}\n\nMensaje del usuario: ${userMessage}`

  // Convertir historial de formato Gemini a formato OpenAI/Groq
  // Gemini usa 'model' para el asistente; Groq espera 'assistant'
  const history = conversationHistory.map(m => ({
    role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: m.parts[0]?.text ?? '',
  }))

  const completion = await groq.chat.completions.create({
    model: CONVERSATION_MODEL,
    temperature: 0.7,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: fullMessage },
    ],
  })

  const text = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(text) as AgentResponse
  return parsed
}

// ─── Generar recomendación de hotel ───────────────────────────────────────────

interface LLMRecommendation {
  hotelId: string
  compatibilityScore: number
  reasons: string[]
  highlights: string[]
  disclaimer: string | null
}

export async function generateRecommendation(
  hotels: Hotel[],
  preferences: UserPreferences
): Promise<LLMRecommendation> {
  // Enviamos solo los campos necesarios para que el LLM elija — no el objeto completo
  const hotelsSummary = hotels.map(h => ({
    hotelId: h.hotelId,
    name: h.name,
    stars: h.stars,
    rating: h.rating,
    reviewCount: h.reviewCount,
    pricePerNight: h.pricePerNight,
    currency: h.currency,
    amenities: h.amenities,
  }))

  const prompt = `Eres un experto en recomendaciones de hoteles. Analiza los siguientes hoteles y selecciona el MEJOR para el usuario según sus preferencias.

## Preferencias del usuario:
- Ciudad: ${preferences.city}
- Fechas: ${preferences.checkIn} al ${preferences.checkOut}
- Huéspedes: ${preferences.guests}
- Presupuesto: ${preferences.budgetMin}-${preferences.budgetMax} ${preferences.currency} por noche
- Tipo de viaje: ${preferences.tripType}
- Amenidades deseadas: ${preferences.amenities.join(', ')}
${preferences.specialRequests ? `- Solicitudes especiales: ${preferences.specialRequests}` : ''}

## Hoteles disponibles:
${JSON.stringify(hotelsSummary, null, 2)}

## Instrucciones:
1. Selecciona el hotel con mayor compatibilidad con las preferencias del usuario
2. Asigna un puntaje de compatibilidad del 0 al 100
3. Proporciona 3-5 razones específicas por las que este hotel es ideal
4. Lista los aspectos destacados más importantes
5. Responde en español

IMPORTANTE: En "hotelId" pon el ID EXACTO del hotel elegido tal como aparece en la lista.

Responde con este JSON exacto:
{
  "hotelId": "id exacto del hotel elegido",
  "compatibilityScore": <0-100>,
  "reasons": ["razón 1", "razón 2", "razón 3"],
  "highlights": ["destacado 1", "destacado 2"],
  "disclaimer": null
}`

  const completion = await groq.chat.completions.create({
    model: CONVERSATION_MODEL,
    temperature: 0.5,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  const text = completion.choices[0].message.content ?? '{}'
  return JSON.parse(text) as LLMRecommendation
}
