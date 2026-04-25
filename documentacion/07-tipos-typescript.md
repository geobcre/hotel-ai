# 07 — Tipos TypeScript

## Archivo principal — `src/types/index.ts`

Este es el único archivo de tipos del proyecto. Todos los componentes
y funciones importan desde aquí: `import type { ... } from '@/types'`

```typescript
// ============================================================
// MENSAJES DE CHAT
// ============================================================

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ============================================================
// PREFERENCIAS DEL USUARIO (recopiladas en la conversación)
// ============================================================

export type TripType = 'leisure' | 'business' | 'family' | 'romantic'

export interface UserPreferences {
  city: string                  // "Barcelona"
  checkIn: string               // "2025-08-15" (YYYY-MM-DD)
  checkOut: string              // "2025-08-20" (YYYY-MM-DD)
  guests: number                // 2
  budgetMin: number             // 80
  budgetMax: number             // 150
  currency: string              // "EUR"
  tripType: TripType            // "romantic"
  amenities: string[]           // ["spa", "restaurant"]
  specialRequests: string | null // "ubicación céntrica" | null
}

// ============================================================
// RESPUESTA DEL AGENTE GEMINI (/api/chat)
// ============================================================

export interface AgentResponse {
  reply: string                            // pregunta/respuesta para el usuario
  extractedData: Partial<UserPreferences>  // datos extraídos de este mensaje
  isComplete: boolean                      // true cuando tenemos todos los datos
  nextStep: number                         // paso siguiente (0-6)
}

// ============================================================
// HOTEL (datos de Booking API ya mapeados)
// ============================================================

export interface Hotel {
  hotelId: string               // ID único en Booking
  name: string                  // "Hotel Arts Barcelona"
  address: string               // dirección o nombre del barrio
  city: string                  // código de país o ciudad
  rating: number                // 9.2 (sobre 10)
  reviewCount: number           // 2847
  reviewLabel: string           // "Excepcional"
  pricePerNight: number         // 120
  currency: string              // "EUR"
  photoUrl: string              // URL de la imagen principal
  amenities: string[]           // ["Pool", "Spa", "Restaurant"]
  stars: number                 // 5 (estrellas del hotel)
  latitude: number              // 41.3825
  longitude: number             // 2.1769
  bookingUrl: string            // URL directa al hotel en Booking.com
}

// ============================================================
// RESULTADO DE RECOMENDACIÓN (generado por Gemini)
// ============================================================

export interface RecommendationResult {
  recommendedHotel: Hotel       // el hotel que Gemini eligió
  compatibilityScore: number    // 0-100 (qué tan bien se ajusta al usuario)
  reasons: string[]             // ["Tiene spa que pediste", "Precio dentro del presupuesto"]
  highlights: string[]          // ["Spa de lujo", "Vista al mar", "Desayuno incluido"]
  disclaimer: string | null     // nota opcional ("Precios pueden variar")
}

// ============================================================
// RESPUESTA DE /api/hotels
// ============================================================

export interface HotelsApiResponse {
  recommendation: RecommendationResult
  alternatives: Hotel[]         // otros 2-3 hoteles encontrados
}

// ============================================================
// ESTADO GLOBAL DE LA CONVERSACIÓN
// ============================================================

export interface ConversationState {
  currentStep: number                      // 0-6
  messages: Message[]                      // historial completo
  extractedData: Partial<UserPreferences>  // datos recopilados hasta ahora
  isComplete: boolean                      // true = listo para buscar hoteles
  isLoading: boolean                       // true = esperando respuesta de API
  error: string | null                     // mensaje de error si algo falló
}

// ============================================================
// PROPS DE COMPONENTES
// ============================================================

export interface MessageBubbleProps {
  message: Message
}

export interface HotelCardProps {
  recommendation: RecommendationResult
}

export interface ChatWindowProps {
  initialMessage?: string       // opcional: mensaje inicial personalizado
}
```

---

## Tipos de Booking API (raw) — solo referencia interna

Estos son los tipos de la respuesta cruda de Booking antes de mapear.
No se usan fuera de `src/lib/booking.ts`.

```typescript
// Solo para uso interno en booking.ts — no exportar

interface BookingDestination {
  dest_id: string
  search_type: string           // "city" | "hotel" | "region"
  name: string
  country: string
  region: string
}

interface BookingHotelRaw {
  hotel_id: number
  property: {
    name: string
    wishlistName: string
    countryCode: string
    reviewScore: number
    reviewCount: number
    reviewScoreWord: string
    photoUrls: string[]
    propertyClass: number       // estrellas
    latitude: number
    longitude: number
    amenities: Array<{ name: string }>
    priceBreakdown: {
      grossPrice: {
        value: number
        currency: string
      }
    }
  }
}
```

---

## Guía de uso — imports en cada archivo

```typescript
// En componentes
import type { Message, HotelCardProps, RecommendationResult } from '@/types'

// En API Routes
import type { UserPreferences, AgentResponse, Hotel } from '@/types'

// En lib/gemini.ts
import type { Message, UserPreferences, AgentResponse, RecommendationResult } from '@/types'

// En lib/booking.ts
import type { UserPreferences, Hotel } from '@/types'

// En lib/conversationFlow.ts
import type { ConversationState, UserPreferences } from '@/types'
```

---

## Reglas de tipado del proyecto

1. Usar `interface` para objetos, `type` para uniones y alias simples
2. Usar `Partial<UserPreferences>` mientras la conversación no está completa
3. Nunca usar `any` — si la respuesta de API es desconocida, tipar como `unknown` y validar
4. Las props de componentes siempre tienen su propia interface (`XxxProps`)
5. Todos los tipos se importan con `import type` (no `import`) para tree-shaking
