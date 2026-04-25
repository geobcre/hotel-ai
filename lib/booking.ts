import type { Hotel, UserPreferences } from '@/types'

const BASE_URL = 'https://booking-com15.p.rapidapi.com/api/v1'

function getHeaders() {
  return {
    'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
    'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
    'Content-Type': 'application/json',
  }
}

// ─── Selección inteligente de destino ────────────────────────────────────────

interface DestResult {
  dest_id: string
  search_type: string
  name: string
}

function selectBestDestination(results: DestResult[], query: string): DestResult {
  const q = query.toLowerCase().trim()

  // 1. Match exacto del nombre
  const exact = results.find(r => r.name.toLowerCase() === q)
  if (exact) return exact

  // 2. El nombre empieza con el query
  const starts = results.find(r => r.name.toLowerCase().startsWith(q))
  if (starts) return starts

  // 3. Es tipo 'city' y contiene el query
  const city = results.find(r => r.search_type === 'city' && r.name.toLowerCase().includes(q))
  if (city) return city

  // 4. Cualquier resultado que contenga el query
  const contains = results.find(r => r.name.toLowerCase().includes(q))
  if (contains) return contains

  // 5. Fallback al primero
  return results[0]
}

// ─── Paso 1: Obtener dest_id por nombre de ciudad ─────────────────────────────

async function getDestinationId(city: string): Promise<{ destId: string; searchType: string }> {
  const url = new URL(`${BASE_URL}/hotels/searchDestination`)
  url.searchParams.set('query', city)

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Error buscando destino: ${response.status}`)
  }

  const data = await response.json()

  if (!data.data || data.data.length === 0) {
    throw new Error(`No se encontraron destinos para: ${city}`)
  }

  const dest = selectBestDestination(data.data as DestResult[], city)
  return {
    destId: dest.dest_id,
    searchType: dest.search_type,
  }
}

// ─── Paso 2: Buscar hoteles con los parámetros del usuario ───────────────────

async function searchHotels(
  destId: string,
  searchType: string,
  prefs: UserPreferences
): Promise<Hotel[]> {
  const url = new URL(`${BASE_URL}/hotels/searchHotels`)
  url.searchParams.set('dest_id', destId)
  url.searchParams.set('search_type', searchType)
  url.searchParams.set('arrival_date', prefs.checkIn)
  url.searchParams.set('departure_date', prefs.checkOut)
  url.searchParams.set('adults', prefs.guests.toString())
  url.searchParams.set('currency_code', 'USD')
  url.searchParams.set('page_number', '1')
  url.searchParams.set('limit', '10')
  url.searchParams.set('units', 'metric')

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
  })

  if (response.status === 429) {
    throw new Error('Límite de solicitudes de la API alcanzado. Intenta más tarde.')
  }

  if (response.status === 400) {
    throw new Error('Parámetros de búsqueda inválidos.')
  }

  if (!response.ok) {
    throw new Error(`Error en la búsqueda de hoteles: ${response.status}`)
  }

  const data = await response.json()

  if (!data.status || data.message?.code === '500') {
    throw new Error(`Error de la API de Booking: ${data.message?.message ?? JSON.stringify(data.message)}`)
  }

  if (!data.data?.hotels || data.data.hotels.length === 0) {
    throw new Error('No se encontraron hoteles con los criterios especificados.')
  }

  return data.data.hotels.map((raw: Record<string, unknown>) => mapHotel(raw, prefs))
}

// ─── Mapper: respuesta cruda → interfaz Hotel ─────────────────────────────────

function mapHotel(raw: Record<string, unknown>, prefs: UserPreferences): Hotel {
  const property = raw.property as Record<string, unknown>
  const priceBreakdown = raw.priceBreakdown as Record<string, unknown>
  const grossPrice = priceBreakdown?.grossPrice as Record<string, unknown>

  const hotelId = String(property?.id ?? raw.hotel_id ?? '')
  const hotelName = String(property?.name ?? '')
  const countryCode = String(property?.countryCode ?? 'xx').toLowerCase()
  const ufi = String(property?.ufi ?? '')

  // ss = nombre del hotel (filtra a ese hotel), dest_id = ufi de la ciudad (localización exacta)
  const params = new URLSearchParams({
    ss: hotelName,
    ...(ufi && { dest_id: ufi, dest_type: 'city' }),
    checkin: prefs.checkIn,
    checkout: prefs.checkOut,
    group_adults: String(prefs.guests),
    no_rooms: '1',
  })

  return {
    hotelId,
    name: hotelName,
    address: String(property?.wishlistName ?? hotelName),
    city: countryCode,
    rating: Number(property?.reviewScore ?? 0),
    reviewCount: Number(property?.reviewCount ?? 0),
    reviewLabel: String(property?.reviewScoreWord ?? ''),
    pricePerNight: Number(grossPrice?.value ?? 0),
    currency: String(grossPrice?.currency ?? 'USD'),
    photoUrl: String(Array.isArray(property?.photoUrls) ? property.photoUrls[0] : ''),
    amenities: [],
    stars: Number(property?.propertyClass ?? 0),
    latitude: Number(property?.latitude ?? 0),
    longitude: Number(property?.longitude ?? 0),
    bookingUrl: `https://www.booking.com/searchresults.html?${params.toString()}`,
  }
}

// ─── Función principal exportada ─────────────────────────────────────────────

export async function findHotels(prefs: UserPreferences): Promise<Hotel[]> {
  const { destId, searchType } = await getDestinationId(prefs.city)
  const hotels = await searchHotels(destId, searchType, prefs)
  return hotels
}
