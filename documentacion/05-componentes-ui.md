# 05 — Componentes UI

## Árbol de componentes

```
app/page.tsx
└── ChatWindow.tsx
    ├── ThemeToggle.tsx
    ├── MessageBubble.tsx (× N mensajes)
    └── HotelCard.tsx (solo al final)
```

---

## ChatWindow.tsx — contenedor principal

Es el componente raíz de toda la experiencia. Maneja el estado global de la conversación.

**Estado interno:**
```typescript
const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
const [inputValue, setInputValue] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [currentStep, setCurrentStep] = useState(0)
const [extractedData, setExtractedData] = useState<Partial<UserPreferences>>({})
const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
const messagesEndRef = useRef<HTMLDivElement>(null)
```

**Responsabilidades:**
- Renderizar la lista de mensajes
- Manejar el input del usuario y el envío
- Llamar a `/api/chat` con cada mensaje
- Cuando `isComplete = true`, llamar a `/api/hotels`
- Mostrar estado de carga (typing indicator)
- Auto-scroll al último mensaje
- Pasar el tema oscuro/claro desde localStorage

**Estructura JSX:**
```tsx
<div className="chat-container">
  <header>
    <h1>Hotel AI</h1>
    <ThemeToggle />
  </header>

  <div className="messages-area" ref={messagesEndRef}>
    {messages.map((msg, i) => (
      <MessageBubble key={i} message={msg} />
    ))}
    {isLoading && <TypingIndicator />}
    {recommendation && <HotelCard recommendation={recommendation} />}
  </div>

  <div className="input-area">
    <input
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleSend()}
      placeholder="Escribe tu respuesta..."
      disabled={isLoading || !!recommendation}
    />
    <button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
      Enviar
    </button>
  </div>
</div>
```

**Función handleSend:**
```typescript
async function handleSend() {
  if (!inputValue.trim() || isLoading) return

  const userMessage: Message = { role: 'user', content: inputValue }
  setMessages(prev => [...prev, userMessage])
  setInputValue('')
  setIsLoading(true)

  try {
    // Llamar al agente
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: inputValue,
        conversationHistory: messages,
        currentStep,
        extractedData
      })
    })
    const data = await res.json()

    // Agregar respuesta del agente
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    setExtractedData(prev => ({ ...prev, ...data.extractedData }))
    setCurrentStep(data.nextStep)

    // Si la conversación terminó, buscar hoteles
    if (data.isComplete) {
      const hotelsRes = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { ...extractedData, ...data.extractedData } })
      })
      const hotelsData = await hotelsRes.json()
      setRecommendation(hotelsData.recommendation)
    }

  } catch (error) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Hubo un error. Por favor intenta de nuevo.'
    }])
  } finally {
    setIsLoading(false)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
}
```

---

## MessageBubble.tsx — burbuja de mensaje

Muestra un mensaje del chat. El estilo cambia según si es del usuario o del asistente.

**Props:**
```typescript
interface MessageBubbleProps {
  message: Message // { role: 'user' | 'assistant', content: string }
}
```

**Comportamiento:**
- `role === 'assistant'` → burbuja a la izquierda, color de fondo neutro
- `role === 'user'` → burbuja a la derecha, color de fondo primario
- Mostrar avatar o ícono según el rol
- Soporte para saltos de línea en el contenido

**Estructura JSX:**
```tsx
<div className={`message-bubble ${message.role}`}>
  {message.role === 'assistant' && (
    <div className="avatar">🤖</div>
  )}
  <div className="bubble-content">
    <p>{message.content}</p>
  </div>
  {message.role === 'user' && (
    <div className="avatar">👤</div>
  )}
</div>
```

---

## HotelCard.tsx — tarjeta de recomendación

Se muestra al final de la conversación con el hotel recomendado.

**Props:**
```typescript
interface HotelCardProps {
  recommendation: RecommendationResult
}
```

**Secciones de la tarjeta:**
1. Foto del hotel (si existe `photoUrl`)
2. Nombre y estrellas
3. Puntuación de compatibilidad (badge prominente)
4. Precio por noche
5. Rating de Booking + cantidad de reseñas
6. Lista de razones por las que es el ideal
7. Amenidades destacadas (chips/pills)
8. Botón "Ver en Booking.com" → abre en nueva pestaña

**Estructura JSX:**
```tsx
<div className="hotel-card">
  {hotel.photoUrl && (
    <img src={hotel.photoUrl} alt={hotel.name} className="hotel-photo" />
  )}

  <div className="hotel-header">
    <h2>{hotel.name}</h2>
    <span className="stars">{'⭐'.repeat(hotel.stars)}</span>
  </div>

  <div className="compatibility-badge">
    <span className="score">{recommendation.compatibilityScore}%</span>
    <span className="label">compatible contigo</span>
  </div>

  <div className="price">
    <span className="amount">{hotel.currency} {hotel.pricePerNight}</span>
    <span className="per-night">por noche</span>
  </div>

  <div className="rating">
    <span>{hotel.rating}/10</span>
    <span>{hotel.reviewLabel}</span>
    <span>({hotel.reviewCount} reseñas)</span>
  </div>

  <ul className="reasons">
    {recommendation.reasons.map((reason, i) => (
      <li key={i}>✓ {reason}</li>
    ))}
  </ul>

  <div className="amenities">
    {recommendation.highlights.map((h, i) => (
      <span key={i} className="chip">{h}</span>
    ))}
  </div>

  <a
    href={hotel.bookingUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="cta-button"
  >
    Ver en Booking.com →
  </a>
</div>
```

---

## ThemeToggle.tsx — modo oscuro/claro

**Comportamiento:**
- Lee el tema actual desde `localStorage` al montar
- Aplica clase `dark` al `<html>` para Tailwind dark mode
- Persiste la preferencia en `localStorage`
- Muestra ícono de sol (☀️) en modo oscuro y luna (🌙) en modo claro

```typescript
'use client'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved === 'dark' || (!saved && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle} aria-label="Cambiar tema">
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
```

---

## TypingIndicator — componente inline (sin archivo propio)

Mostrar mientras `isLoading = true`. Va dentro de `ChatWindow.tsx`:

```tsx
function TypingIndicator() {
  return (
    <div className="message-bubble assistant">
      <div className="avatar">🤖</div>
      <div className="bubble-content typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
```

CSS de la animación (3 puntos que suben y bajan):
```css
.typing span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: bounce 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40%           { transform: translateY(-8px); }
}
```

---

## Directiva `'use client'`

| Componente | ¿Necesita `'use client'`? | Razón |
|---|---|---|
| `ChatWindow.tsx` | ✅ Sí | Usa useState, fetch, eventos |
| `MessageBubble.tsx` | ❌ No | Solo renderiza props |
| `HotelCard.tsx` | ❌ No | Solo renderiza props |
| `ThemeToggle.tsx` | ✅ Sí | Usa localStorage, eventos |
