import { NextResponse } from 'next/server'
import { findHotels } from '@/lib/booking'
import { generateRecommendation } from '@/lib/groq'
import type { UserPreferences } from '@/types'

export async function POST(request: Request) {
  try {
    const preferences = await request.json() as UserPreferences

    if (!preferences.city || !preferences.checkIn || !preferences.checkOut) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: city, checkIn, checkOut.' },
        { status: 400 }
      )
    }

    const hotels = await findHotels(preferences)

    if (hotels.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron hoteles con los criterios especificados.' },
        { status: 404 }
      )
    }

    const llmResult = await generateRecommendation(hotels, preferences)

    // Resolver el hotel real por ID — el LLM solo elige, no construye el objeto
    const chosenHotel = hotels.find(h => h.hotelId === llmResult.hotelId) ?? hotels[0]
    const recommendation = {
      ...llmResult,
      recommendedHotel: chosenHotel,
    }

    const alternatives = hotels.filter(h => h.hotelId !== chosenHotel.hotelId)

    return NextResponse.json({
      recommendation,
      alternatives,
    })
  } catch (error) {
    console.error('[/api/hotels] Error:', error)
    const message = error instanceof Error ? error.message : 'Error buscando hoteles.'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
