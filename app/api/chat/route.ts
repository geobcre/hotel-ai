import { NextResponse } from 'next/server'
import { processUserMessage } from '@/lib/groq'
import type { UserPreferences } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      message,
      conversationHistory = [],
      currentStep = 0,
      extractedData = {},
    } = body as {
      message: string
      conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }>
      currentStep: number
      extractedData: Partial<UserPreferences>
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El campo message es requerido.' },
        { status: 400 }
      )
    }

    const result = await processUserMessage(
      message,
      conversationHistory,
      currentStep,
      extractedData
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[/api/chat] Error:', error)
    return NextResponse.json(
      { error: 'Error procesando el mensaje. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
