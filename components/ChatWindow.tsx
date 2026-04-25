'use client'

import { useEffect, useRef, useState } from 'react'
import type { AgentResponse, HotelsApiResponse, Message, RecommendationResult, UserPreferences } from '@/types'
import { WELCOME_MESSAGE } from '@/lib/conversationFlow'
import MessageBubble from './MessageBubble'
import HotelCard from './HotelCard'
import ThemeToggle from './ThemeToggle'

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [extractedData, setExtractedData] = useState<Partial<UserPreferences>>({})
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Historial para Gemini (formato que espera la API)
  const geminiHistory = useRef<Array<{ role: string; parts: Array<{ text: string }> }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, recommendation])

  async function handleSend() {
    const text = inputValue.trim()
    if (!text || isLoading) return

    setInputValue('')
    setError(null)

    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Agregar al historial de Gemini
    geminiHistory.current.push({ role: 'user', parts: [{ text }] })

    try {
      // Llamar a /api/chat
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: geminiHistory.current.slice(0, -1), // sin el último (ya lo enviamos)
          currentStep,
          extractedData,
        }),
      })

      if (!chatRes.ok) {
        throw new Error('Error al procesar tu mensaje.')
      }

      const agentResponse: AgentResponse = await chatRes.json()

      // Actualizar estado
      const merged = { ...extractedData, ...agentResponse.extractedData }
      setExtractedData(merged)
      setCurrentStep(agentResponse.nextStep)

      const assistantMessage: Message = { role: 'assistant', content: agentResponse.reply }
      setMessages(prev => [...prev, assistantMessage])

      // Agregar respuesta del asistente al historial
      geminiHistory.current.push({
        role: 'model',
        parts: [{ text: agentResponse.reply }],
      })

      // Si la conversación está completa, buscar hoteles
      if (agentResponse.isComplete) {
        await fetchHotels(merged as UserPreferences)
      }
    } catch {
      setError('Hubo un error. Por favor intenta de nuevo.')
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, hubo un problema. ¿Puedes intentarlo de nuevo?' },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  async function fetchHotels(prefs: UserPreferences) {
    setIsLoading(true)
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '¡Perfecto! Estoy buscando los mejores hoteles para ti...' },
    ])

    try {
      const hotelsRes = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })

      if (!hotelsRes.ok) {
        const data = await hotelsRes.json()
        throw new Error(data.error ?? 'Error buscando hoteles.')
      }

      const { recommendation: rec }: HotelsApiResponse = await hotelsRes.json()
      setRecommendation(rec)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Encontré la opción perfecta para ti: **${rec.recommendedHotel.name}** con un ${rec.compatibilityScore}% de compatibilidad. ¡Aquí tienes los detalles!`,
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error buscando hoteles.'
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Lo siento, ${msg} Por favor intenta con otros criterios.` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }])
    setInputValue('')
    setIsLoading(false)
    setCurrentStep(0)
    setExtractedData({})
    setRecommendation(null)
    setError(null)
    geminiHistory.current = []
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--user-bubble-text)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--foreground)] leading-none">Hotel AI</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-none">Asistente de viajes</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Indicador de paso */}
          <span className="text-xs text-[var(--text-muted)] mr-2">
            {currentStep < 7 ? `Paso ${currentStep + 1}/7` : 'Completado'}
          </span>
          <button
            onClick={handleReset}
            title="Nueva búsqueda"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-alt)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
            </svg>
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="messages-area flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--surface-alt)] border border-[var(--border)] text-xs font-medium text-[var(--text-muted)]">
              AI
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--assistant-bubble)] border border-[var(--border)] flex items-center gap-1">
              <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
            </div>
          </div>
        )}

        {/* HotelCard */}
        {recommendation && (
          <div className="pl-10">
            <HotelCard result={recommendation} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--border)]">
        {error && (
          <p className="text-xs text-red-500 mb-2 px-1">{error}</p>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isLoading ? 'Esperando respuesta...' : 'Escribe tu mensaje...'}
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Enviar mensaje"
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--user-bubble-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-80"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
          Potenciado por Llama 3.3 70B (Groq) · Datos de Booking.com
        </p>
      </div>
    </div>
  )
}
