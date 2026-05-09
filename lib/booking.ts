import type { Hotel, UserPreferences } from '@/types'
import { HOTELS_GUATEMALA } from '@/data/hotels'

// ─── Filtro local (reemplaza RapidAPI) ───────────────────────────────────────

// Variaciones de nombre de ciudad → nombre canónico en el dataset
const CITY_ALIASES: Record<string, string> = {
  'guatemala':            'Guatemala',
  'guatemala city':       'Guatemala',
  'ciudad de guatemala':  'Guatemala',
  'antigua':              'Antigua Guatemala',
  'antigua guatemala':    'Antigua Guatemala',
  'atitlan':              'Lago Atitlán',
  'atitlán':              'Lago Atitlán',
  'lago atitlan':         'Lago Atitlán',
  'lago atitlán':         'Lago Atitlán',
  'panajachel':           'Lago Atitlán',
  'san pedro':            'Lago Atitlán',
  'quetzaltenango':       'Quetzaltenango',
  'xela':                 'Quetzaltenango',
  'xelaju':               'Quetzaltenango',
}

function resolveCity(input: string): string {
  const normalized = input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes para comparar
    .replace(/[̀-ͯ]/g, '')

  // Buscar en aliases (también normalizado)
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    const aliasNorm = alias.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (normalized === aliasNorm || normalized.includes(aliasNorm)) {
      return canonical
    }
  }

  // Si no hay alias, capitalizar y devolver tal cual
  return input.trim()
}

// Amenidades relevantes por tipo de viaje
const AMENITIES_BY_TRIP_TYPE: Record<string, string[]> = {
  business: ['business center', 'meeting rooms', 'WiFi', 'gym'],
  family:   ['kids area', 'pool', 'restaurant', 'parking'],
  romantic: ['spa', 'pool', 'bar', 'room service', 'garden', 'lake view'],
  leisure:  ['pool', 'spa', 'restaurant', 'gym', 'lake view'],
}

export async function findHotels(prefs: UserPreferences): Promise<Hotel[]> {
  const canonicalCity = resolveCity(prefs.city)
  let results = HOTELS_GUATEMALA.filter(
    h => h.city.toLowerCase() === canonicalCity.toLowerCase()
  )

  // Si la ciudad no tiene hoteles en el dataset, devolver todos
  if (results.length === 0) {
    results = [...HOTELS_GUATEMALA]
  }

  // Filtrar por presupuesto máximo
  if (prefs.budgetMax > 0) {
    const porPresupuesto = results.filter(h => h.pricePerNight <= prefs.budgetMax)
    // Solo aplicar el filtro si queda al menos un resultado
    if (porPresupuesto.length > 0) results = porPresupuesto
  }

  // Ordenar por afinidad con el tipo de viaje
  if (prefs.tripType && AMENITIES_BY_TRIP_TYPE[prefs.tripType]) {
    const preferred = AMENITIES_BY_TRIP_TYPE[prefs.tripType]
    results.sort((a, b) => {
      const scoreA = a.amenities.filter(am => preferred.includes(am)).length
      const scoreB = b.amenities.filter(am => preferred.includes(am)).length
      return scoreB - scoreA
    })
  }

  return results
}

// ─── Código RapidAPI (comentado, conservado para referencia) ─────────────────

// import type { Hotel, UserPreferences } from '@/types'
//
// const BASE_URL = 'https://booking-com15.p.rapidapi.com/api/v1'
//
// function getHeaders() {
//   return {
//     'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
//     'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
//     'Content-Type': 'application/json',
//   }
// }
//
// interface DestResult {
//   dest_id: string
//   search_type: string
//   name: string
// }
//
// function selectBestDestination(results: DestResult[], query: string): DestResult {
//   const q = query.toLowerCase().trim()
//   const exact = results.find(r => r.name.toLowerCase() === q)
//   if (exact) return exact
//   const starts = results.find(r => r.name.toLowerCase().startsWith(q))
//   if (starts) return starts
//   const city = results.find(r => r.search_type === 'city' && r.name.toLowerCase().includes(q))
//   if (city) return city
//   const contains = results.find(r => r.name.toLowerCase().includes(q))
//   if (contains) return contains
//   return results[0]
// }
//
// async function getDestinationId(city: string): Promise<{ destId: string; searchType: string }> {
//   const url = new URL(`${BASE_URL}/hotels/searchDestination`)
//   url.searchParams.set('query', city)
//   const response = await fetch(url.toString(), { headers: getHeaders() })
//   if (!response.ok) throw new Error(`Error buscando destino: ${response.status}`)
//   const data = await response.json()
//   if (!data.data || data.data.length === 0) throw new Error(`No se encontraron destinos para: ${city}`)
//   const dest = selectBestDestination(data.data as DestResult[], city)
//   return { destId: dest.dest_id, searchType: dest.search_type }
// }
//
// async function searchHotels(destId: string, searchType: string, prefs: UserPreferences): Promise<Hotel[]> {
//   const url = new URL(`${BASE_URL}/hotels/searchHotels`)
//   url.searchParams.set('dest_id', destId)
//   url.searchParams.set('search_type', searchType)
//   url.searchParams.set('arrival_date', prefs.checkIn)
//   url.searchParams.set('departure_date', prefs.checkOut)
//   url.searchParams.set('adults', prefs.guests.toString())
//   url.searchParams.set('currency_code', 'USD')
//   url.searchParams.set('page_number', '1')
//   url.searchParams.set('limit', '10')
//   url.searchParams.set('units', 'metric')
//   const response = await fetch(url.toString(), { headers: getHeaders() })
//   if (response.status === 429) throw new Error('Límite de solicitudes de la API alcanzado.')
//   if (response.status === 400) throw new Error('Parámetros de búsqueda inválidos.')
//   if (!response.ok) throw new Error(`Error en la búsqueda de hoteles: ${response.status}`)
//   const data = await response.json()
//   if (!data.status || data.message?.code === '500') throw new Error(`Error de Booking: ${data.message?.message}`)
//   if (!data.data?.hotels || data.data.hotels.length === 0) throw new Error('No se encontraron hoteles.')
//   return data.data.hotels.map((raw: Record<string, unknown>) => mapHotel(raw, prefs))
// }
//
// function mapHotel(raw: Record<string, unknown>, prefs: UserPreferences): Hotel {
//   const property = raw.property as Record<string, unknown>
//   const priceBreakdown = raw.priceBreakdown as Record<string, unknown>
//   const grossPrice = priceBreakdown?.grossPrice as Record<string, unknown>
//   const hotelId = String(property?.id ?? raw.hotel_id ?? '')
//   const hotelName = String(property?.name ?? '')
//   const countryCode = String(property?.countryCode ?? 'xx').toLowerCase()
//   const ufi = String(property?.ufi ?? '')
//   const params = new URLSearchParams({
//     ss: hotelName,
//     ...(ufi && { dest_id: ufi, dest_type: 'city' }),
//     checkin: prefs.checkIn,
//     checkout: prefs.checkOut,
//     group_adults: String(prefs.guests),
//     no_rooms: '1',
//   })
//   return {
//     hotelId,
//     name: hotelName,
//     address: String(property?.wishlistName ?? hotelName),
//     city: countryCode,
//     rating: Number(property?.reviewScore ?? 0),
//     reviewCount: Number(property?.reviewCount ?? 0),
//     reviewLabel: String(property?.reviewScoreWord ?? ''),
//     pricePerNight: Number(grossPrice?.value ?? 0),
//     currency: String(grossPrice?.currency ?? 'USD'),
//     photoUrl: String(Array.isArray(property?.photoUrls) ? property.photoUrls[0] : ''),
//     amenities: [],
//     stars: Number(property?.propertyClass ?? 0),
//     latitude: Number(property?.latitude ?? 0),
//     longitude: Number(property?.longitude ?? 0),
//     bookingUrl: `https://www.booking.com/searchresults.html?${params.toString()}`,
//   }
// }
//
// export async function findHotels(prefs: UserPreferences): Promise<Hotel[]> {
//   const { destId, searchType } = await getDestinationId(prefs.city)
//   const hotels = await searchHotels(destId, searchType, prefs)
//   return hotels
// }
