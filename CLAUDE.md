@AGENTS.md

# Hotel AI — Contexto del proyecto

Sistema de recomendación de hoteles con IA conversacional. Proyecto universitario (Universidad Mariano Gálvez de Guatemala) de Claudia Geobana Estrada Ruano.

El sistema guía al usuario en 7 preguntas para recopilar preferencias, busca hoteles reales en Booking.com y genera una recomendación personalizada con IA.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS v4 (sin config, usa `@import "tailwindcss"`) |
| IA conversacional | Groq — modelo `llama-3.3-70b-versatile` |
| Hoteles | Booking.com via RapidAPI (`booking-com15`) |
| Deploy | Vercel |

## Estructura de archivos clave

```
app/
  api/
    chat/route.ts       ← POST /api/chat — procesa mensaje con Groq
    hotels/route.ts     ← POST /api/hotels — busca hoteles + genera recomendación
  globals.css           ← Dark mode por clase (.dark), animaciones bounce-dot
  layout.tsx
  page.tsx

components/
  ChatWindow.tsx        ← Componente principal (Client), maneja todo el estado
  MessageBubble.tsx     ← Burbujas de chat (usuario vs asistente)
  HotelCard.tsx         ← Tarjeta de recomendación final
  ThemeToggle.tsx       ← Toggle dark/light (persiste en localStorage)

lib/
  gemini.ts             ← Cliente Groq: processUserMessage + generateRecommendation
  booking.ts            ← Cliente Booking.com: findHotels + selectBestDestination
  conversationFlow.ts   ← SYSTEM_PROMPT, WELCOME_MESSAGE, buildPromptContext

types/
  index.ts              ← Todas las interfaces TypeScript (fuente única de verdad)
```

## Variables de entorno (.env.local)

```
GROQ_API_KEY      ← API key de console.groq.com
RAPIDAPI_KEY      ← API key de rapidapi.com (booking-com15)
```

Nunca se commitean. Solo se acceden desde server-side (`lib/` y `app/api/`).

## Flujo de datos

```
Usuario escribe → ChatWindow
  → POST /api/chat → lib/gemini.ts (Groq) → AgentResponse
  → cuando isComplete=true → POST /api/hotels
    → lib/booking.ts (Booking.com) → Hotel[]
    → lib/gemini.ts (Groq) → elige hotelId
    → route resuelve hotel real por ID → RecommendationResult
  → HotelCard
```

## Reglas de trabajo

1. **Preguntar antes de cambiar** — nunca modificar código sin confirmar primero con el usuario qué se quiere hacer.
2. **Un archivo a la vez** — avisar qué archivo se va a modificar antes de hacerlo. No hacer cambios en varios archivos sin avisarlo.
3. **Ramas de git para features** — cada feature nueva va en su propia rama. Nunca trabajar directo en `main`.
4. **No agregar complejidad innecesaria** — sin abstracciones prematuras, sin manejo de errores para casos imposibles, sin features no pedidas.
5. **TypeScript estricto** — nunca usar `any`. Usar `unknown` y validar en los bordes del sistema.
6. **APIs solo server-side** — nunca llamar a Groq, Booking.com ni exponer API keys desde el cliente.

## Convenciones de código

- Componentes: PascalCase
- Funciones y variables: camelCase
- Archivos de utilidad: kebab-case
- Comentarios: español, solo cuando el "por qué" no es obvio
- Siempre `try/catch` en llamadas a APIs externas
- `async/await` sobre `.then()/.catch()`
