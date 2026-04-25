# 01 — Arquitectura del proyecto

## Decisiones técnicas clave

| Decisión | Elección | Razón |
|---|---|---|
| Framework | Next.js 15 App Router | API Routes integradas, sin servidor externo necesario |
| IA | Gemini Flash 2.0 | Gratuito, rápido, excelente para conversación |
| Hoteles | Booking.com via RapidAPI | Plan free suficiente, datos reales, fácil integración |
| Estilos | Tailwind CSS | Rapid prototyping, responsive por defecto |
| Deploy | Vercel | Nativo para Next.js, CI/CD automático con GitHub |

---

## Stack completo

```
Frontend (Next.js App Router)
├── app/page.tsx               → UI principal del chat
├── app/layout.tsx             → Layout global + ThemeProvider
├── app/api/chat/route.ts      → API Route: agente Gemini
└── app/api/hotels/route.ts    → API Route: búsqueda Booking

Componentes React
├── ChatWindow.tsx             → Contenedor principal del chat
├── MessageBubble.tsx          → Burbuja de mensaje (IA o usuario)
├── HotelCard.tsx              → Tarjeta de hotel recomendado
└── ThemeToggle.tsx            → Botón modo oscuro/claro

Lógica de negocio (lib/)
├── gemini.ts                  → Cliente Gemini + funciones del agente
├── booking.ts                 → Cliente Booking RapidAPI
└── conversationFlow.ts        → Estado y flujo de preguntas

Tipos TypeScript (types/)
└── index.ts                   → Todas las interfaces del proyecto
```

---

## Flujo de datos — request completo

```
1. Usuario escribe respuesta en ChatWindow
        ↓
2. ChatWindow hace POST a /api/chat
   body: { message, conversationHistory, currentStep }
        ↓
3. /api/chat llama a Gemini con:
   - System prompt del agente
   - Historial de conversación
   - Respuesta del usuario
        ↓
4. Gemini extrae el dato y genera siguiente pregunta
   response: { nextQuestion, extractedData, isComplete }
        ↓
5a. Si isComplete = false → devuelve nextQuestion al chat
5b. Si isComplete = true  → ChatWindow llama a /api/hotels
        ↓
6. /api/hotels llama a Booking RapidAPI con las preferencias
   response: Hotel[]
        ↓
7. /api/hotels envía hoteles a Gemini para análisis final
   response: RecommendationResult
        ↓
8. ChatWindow muestra HotelCard con recomendación
```

---

## API Routes — contratos

### POST /api/chat

**Request:**
```typescript
{
  message: string               // respuesta del usuario
  conversationHistory: Message[] // historial completo
  currentStep: number           // paso actual (0-6)
  extractedData: Partial<UserPreferences> // datos ya recopilados
}
```

**Response:**
```typescript
{
  reply: string                 // siguiente pregunta de Gemini
  extractedData: Partial<UserPreferences> // datos actualizados
  isComplete: boolean           // ¿ya tenemos todos los datos?
  currentStep: number           // nuevo paso
}
```

---

### POST /api/hotels

**Request:**
```typescript
{
  preferences: UserPreferences  // preferencias completas del usuario
}
```

**Response:**
```typescript
{
  recommendation: RecommendationResult // hotel recomendado + razones
  alternatives: Hotel[]         // otras opciones encontradas
}
```

---

## Variables de entorno

```env
# .env.local — nunca subir a GitHub

GEMINI_API_KEY=AIza...          # Google AI Studio
RAPIDAPI_KEY=10130058efm...     # RapidAPI dashboard
```

Acceso en el código:
```typescript
const apiKey = process.env.GEMINI_API_KEY   // solo en Server Components / API Routes
```

> ⚠️ Las API keys NUNCA van en componentes cliente (`'use client'`).
> Solo se acceden desde `app/api/` o `lib/`.

---

## Instalación desde cero

```bash
# 1. Crear proyecto
npx create-next-app@latest hotel-ai \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*"

cd hotel-ai

# 2. Instalar dependencias
npm install @google/generative-ai axios

# 3. Crear .env.local con las keys
# 4. Crear estructura de carpetas en src/
# 5. npm run dev → http://localhost:3000
```

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run lint         # ESLint
npm run type-check   # Verificar tipos TypeScript
```

---

## Consideraciones de seguridad

- Todas las llamadas a APIs externas van en `app/api/` (servidor), nunca en el cliente
- Las keys se cargan desde `.env.local`, nunca hardcodeadas
- `.env.local` está en `.gitignore` por defecto en Next.js
- Los errores de API no exponen detalles internos al cliente
