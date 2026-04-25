// Tipos centralizados para Hotel AI
// Seguir siempre estas interfaces — nunca usar `any`

// ─── Mensajes de chat ─────────────────────────────────────────────────────────

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Preferencias del usuario (se llenan progresivamente) ────────────────────

export interface UserPreferences {
  city: string
  checkIn: string          // formato YYYY-MM-DD
  checkOut: string         // formato YYYY-MM-DD
  guests: number
  budgetMin: number
  budgetMax: number
  currency: string         // ej: 'USD', 'EUR', 'GTQ'
  tripType: 'leisure' | 'business' | 'family' | 'romantic'
  amenities: string[]
  specialRequests?: string
}

// ─── Respuesta del agente Gemini (/api/chat) ─────────────────────────────────

export interface AgentResponse {
  reply: string
  extractedData: Partial<UserPreferences>
  isComplete: boolean
  nextStep: number
}

// ─── Hotel mapeado desde Booking.com ─────────────────────────────────────────

export interface Hotel {
  hotelId: string
  name: string
  address: string
  city: string
  rating: number           // 0-10
  reviewCount: number
  reviewLabel: string
  pricePerNight: number
  currency: string
  photoUrl: string
  amenities: string[]
  stars: number            // 1-5
  latitude?: number
  longitude?: number
  bookingUrl: string
}

// ─── Recomendación generada por Gemini ───────────────────────────────────────

export interface RecommendationResult {
  recommendedHotel: Hotel
  compatibilityScore: number  // 0-100
  reasons: string[]
  highlights: string[]
  disclaimer: string | null
}

// ─── Respuesta de /api/hotels ─────────────────────────────────────────────────

export interface HotelsApiResponse {
  recommendation: RecommendationResult
  alternatives: Hotel[]
}

// ─── Estado de la conversación ────────────────────────────────────────────────

export interface ConversationState {
  currentStep: number
  messages: Message[]
  extractedData: Partial<UserPreferences>
  isComplete: boolean
  isLoading: boolean
  error: string | null
}

// ─── Props de componentes ─────────────────────────────────────────────────────

export interface MessageBubbleProps {
  message: Message
}

export interface HotelCardProps {
  result: RecommendationResult
}

export interface ChatWindowProps {
  className?: string
}
