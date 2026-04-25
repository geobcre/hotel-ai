# 04 — Booking.com API (via RapidAPI)

## Datos de conexión

| Campo | Valor |
|---|---|
| Proveedor | RapidAPI — DataCrawler |
| API | `booking-com15` |
| Base URL | `https://booking-com15.p.rapidapi.com` |
| Key header | `x-rapidapi-key` |
| Host header | `x-rapidapi-host: booking-com15.p.rapidapi.com` |
| Key | `process.env.RAPIDAPI_KEY` |
| Plan gratuito | ~500 requests/mes |

---

## Instalación

```bash
npm install axios
```

---

## Cliente base — `src/lib/booking.ts`

```typescript
import axios from 'axios'

if (!process.env.RAPIDAPI_KEY) {
  throw new Error('Falta RAPIDAPI_KEY en .env.local')
}

export const bookingClient = axios.create({
  baseURL: 'https://booking-com15.p.rapidapi.com/api/v1',
  headers: {
    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
    'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 segundos
})
```

---

## Flujo de búsqueda — 2 pasos obligatorios

La API de Booking requiere primero obtener el `dest_id` de la ciudad
y luego buscar hoteles con ese ID.

### Paso 1 — Buscar destination ID por nombre de ciudad

**Endpoint:** `GET /hotels/searchDestination`

```typescript
export async function searchDestination(cityName: string): Promise<string> {
  const response = await bookingClient.get('/hotels/searchDestination', {
    params: {
      query: cityName
    }
  })

  // El primer resultado suele ser la ciudad exacta
  const destinations = response.data.data
  if (!destinations || destinations.length === 0) {
    throw new Error(`No se encontró el destino: ${cityName}`)
  }

  // Buscar resultado tipo 'city' primero
  const cityResult = destinations.find((d: any) => d.search_type === 'city')
    ?? destinations[0]

  return cityResult.dest_id
}
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "dest_id": "-372490",
      "search_type": "city",
      "name": "Barcelona",
      "country": "Spain",
      "region": "Catalonia"
    }
  ]
}
```

---

### Paso 2 — Buscar hoteles con el destination ID

**Endpoint:** `GET /hotels/searchHotels`

```typescript
import type { UserPreferences, Hotel } from '@/types'

export async function searchHotels(
  destId: string,
  preferences: UserPreferences
): Promise<Hotel[]> {

  const response = await bookingClient.get('/hotels/searchHotels', {
    params: {
      dest_id: destId,
      search_type: 'city',
      arrival_date: preferences.checkIn,      // YYYY-MM-DD
      departure_date: preferences.checkOut,   // YYYY-MM-DD
      adults: preferences.guests,
      room_qty: 1,
      price_min: preferences.budgetMin,
      price_max: preferences.budgetMax,
      currency_code: preferences.currency,
      languagecode: 'es',
      sort_by: 'popularity',                  // popularity | class_asc | price_asc
      page_number: 0,
      units: 'metric'
    }
  })

  const hotels = response.data.data?.hotels ?? []
  return hotels.slice(0, 10).map(mapHotelResponse) // máximo 10 resultados
}
```

---

## Función completa — `findHotels`

Esta es la función que se llama desde la API Route, combina los 2 pasos:

```typescript
export async function findHotels(preferences: UserPreferences): Promise<Hotel[]> {
  try {
    // Paso 1: obtener dest_id
    const destId = await searchDestination(preferences.city)

    // Paso 2: buscar hoteles
    const hotels = await searchHotels(destId, preferences)

    if (hotels.length === 0) {
      throw new Error('No se encontraron hoteles con esos criterios')
    }

    return hotels

  } catch (error: any) {
    console.error('Error buscando hoteles:', error.message)
    throw error
  }
}
```

---

## Mapper — respuesta API → tipo `Hotel`

```typescript
function mapHotelResponse(raw: any): Hotel {
  return {
    hotelId: raw.hotel_id?.toString() ?? '',
    name: raw.property?.name ?? 'Sin nombre',
    address: raw.property?.wishlistName ?? '',
    city: raw.property?.countryCode ?? '',
    rating: raw.property?.reviewScore ?? 0,
    reviewCount: raw.property?.reviewCount ?? 0,
    reviewLabel: raw.property?.reviewScoreWord ?? '',
    pricePerNight: raw.property?.priceBreakdown?.grossPrice?.value ?? 0,
    currency: raw.property?.priceBreakdown?.grossPrice?.currency ?? 'USD',
    photoUrl: raw.property?.photoUrls?.[0] ?? '',
    amenities: raw.property?.amenities?.map((a: any) => a.name) ?? [],
    stars: raw.property?.propertyClass ?? 0,
    latitude: raw.property?.latitude ?? 0,
    longitude: raw.property?.longitude ?? 0,
    bookingUrl: `https://www.booking.com/hotel/${raw.property?.countryCode}/${raw.hotel_id}.html`
  }
}
```

---

## API Route — `src/app/api/hotels/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { findHotels } from '@/lib/booking'
import { generateRecommendation } from '@/lib/gemini'
import type { UserPreferences } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { preferences }: { preferences: UserPreferences } = await req.json()

    // Validar campos requeridos
    if (!preferences.city || !preferences.checkIn || !preferences.checkOut) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: city, checkIn, checkOut' },
        { status: 400 }
      )
    }

    // 1. Buscar hoteles en Booking
    const hotels = await findHotels(preferences)

    // 2. Gemini analiza y recomienda
    const recommendation = await generateRecommendation(preferences, hotels)

    return NextResponse.json({
      recommendation,
      alternatives: hotels.slice(1, 4) // las otras opciones
    })

  } catch (error: any) {
    console.error('Error en /api/hotels:', error.message)
    return NextResponse.json(
      { error: error.message ?? 'Error buscando hoteles' },
      { status: 500 }
    )
  }
}
```

---

## Parámetros importantes de la búsqueda

| Parámetro | Descripción | Ejemplo |
|---|---|---|
| `dest_id` | ID del destino (obtenido en paso 1) | `"-372490"` |
| `arrival_date` | Fecha de entrada | `"2025-08-15"` |
| `departure_date` | Fecha de salida | `"2025-08-20"` |
| `adults` | Número de adultos | `2` |
| `room_qty` | Cantidad de habitaciones | `1` |
| `price_min` | Precio mínimo por noche | `80` |
| `price_max` | Precio máximo por noche | `150` |
| `currency_code` | Moneda | `"EUR"` |
| `sort_by` | Ordenamiento | `"popularity"` |
| `languagecode` | Idioma de respuesta | `"es"` |

---

## Manejo de errores comunes

```typescript
// Sin resultados
if (hotels.length === 0) {
  // Sugerir ampliar el rango de presupuesto o cambiar fechas
  return { error: 'Sin resultados', suggestion: 'Prueba ampliar el presupuesto o cambiar fechas' }
}

// Error 429 — cuota excedida (plan free)
if (error.response?.status === 429) {
  return { error: 'Límite de búsquedas alcanzado por hoy' }
}

// Error 400 — parámetros inválidos
if (error.response?.status === 400) {
  console.error('Parámetros inválidos:', error.response.data)
  return { error: 'Parámetros de búsqueda inválidos' }
}

// Timeout
if (error.code === 'ECONNABORTED') {
  return { error: 'La búsqueda tardó demasiado. Intenta de nuevo.' }
}
```

---

## Tip: conservar requests del plan gratuito

Durante desarrollo, usar datos mock para no gastar el cupo de 500 req/mes:

```typescript
// src/lib/booking.ts
const USE_MOCK = process.env.NODE_ENV === 'development' && process.env.USE_MOCK === 'true'

export async function findHotels(preferences: UserPreferences): Promise<Hotel[]> {
  if (USE_MOCK) {
    return getMockHotels(preferences.city) // datos de prueba locales
  }
  // ... lógica real
}
```

Agregar al `.env.local`:
```env
USE_MOCK=true   # cambiar a false cuando quieras datos reales
```
