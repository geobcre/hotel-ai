# 02 — Flujo conversacional

## Visión general

El agente hace **7 preguntas progresivas** para recopilar las preferencias del usuario.
Cada respuesta es procesada por Gemini, que extrae el dato relevante y genera
la siguiente pregunta de forma natural y contextual.

---

## Las 7 preguntas — orden y datos que extraen

| Paso | Pregunta inicial | Dato que extrae | Tipo |
|---|---|---|---|
| 0 | ¿En qué ciudad buscas hotel? | `city` | `string` |
| 1 | ¿Qué fechas tienes en mente? | `checkIn`, `checkOut` | `string` (YYYY-MM-DD) |
| 2 | ¿Cuántas personas se hospedarán? | `guests` | `number` |
| 3 | ¿Cuál es tu presupuesto por noche? | `budgetMin`, `budgetMax`, `currency` | `number`, `string` |
| 4 | ¿Qué tipo de viaje es? | `tripType` | `'leisure' \| 'business' \| 'family' \| 'romantic'` |
| 5 | ¿Qué amenidades son importantes para ti? | `amenities` | `string[]` |
| 6 | ¿Alguna preferencia especial? (opcional) | `specialRequests` | `string` |

---

## Sistema de preguntas — comportamiento esperado

### Paso 0 — Ciudad
```
IA: "¡Hola! Soy tu asistente de viajes. ¿En qué ciudad o destino estás buscando hotel?"

Usuario: "Quiero ir a Barcelona"
IA extrae: { city: "Barcelona" }
IA responde: "¡Barcelona, excelente elección! ¿Ya tienes fechas definidas para tu viaje?"
```

### Paso 1 — Fechas
```
Usuario: "Del 15 al 20 de agosto"
IA extrae: { checkIn: "2025-08-15", checkOut: "2025-08-20" }
IA responde: "Perfecto, 5 noches en agosto. ¿Cuántas personas se hospedarán?"
```

### Paso 2 — Huéspedes
```
Usuario: "Somos 2 adultos"
IA extrae: { guests: 2 }
IA responde: "Anotado. ¿Cuál es tu presupuesto aproximado por noche? Puedes darme un rango."
```

### Paso 3 — Presupuesto
```
Usuario: "Entre 80 y 150 euros"
IA extrae: { budgetMin: 80, budgetMax: 150, currency: "EUR" }
IA responde: "Muy bien. ¿Es un viaje de placer, negocios, familiar o romántico?"
```

### Paso 4 — Tipo de viaje
```
Usuario: "Es un viaje romántico con mi pareja"
IA extrae: { tripType: "romantic" }
IA responde: "¡Qué especial! ¿Hay alguna amenidad que valoren especialmente? 
Por ejemplo: piscina, spa, desayuno incluido, vista al mar..."
```

### Paso 5 — Amenidades
```
Usuario: "Queremos spa y que tenga buen restaurante"
IA extrae: { amenities: ["spa", "restaurant"] }
IA responde: "Perfecto. ¿Tienen alguna preferencia especial o algo importante que deba considerar?"
```

### Paso 6 — Preferencias especiales (opcional)
```
Usuario: "Nos gustaría que sea céntrico"
IA extrae: { specialRequests: "ubicación céntrica" }
IA responde: "¡Entendido! Déjame buscar las mejores opciones para ustedes..."
→ isComplete: true → llama a Booking API
```

---

## System prompt para Gemini

Este es el prompt que se envía como instrucción al agente en cada llamada:

```
Eres un asistente amigable y experto en viajes que ayuda a encontrar el hotel perfecto.

Tu tarea es recopilar información del usuario mediante una conversación natural.
Debes extraer los siguientes datos en orden: ciudad, fechas, número de huéspedes,
presupuesto por noche, tipo de viaje, amenidades deseadas y preferencias especiales.

Reglas:
1. Haz UNA sola pregunta a la vez
2. Sé amigable, cálido y conversacional — no robótico
3. Confirma brevemente lo que el usuario dijo antes de preguntar lo siguiente
4. Si el usuario da información vaga, pide clarificación de forma amable
5. Si el usuario da información de más de un campo, extráela toda y avanza al siguiente paso pendiente
6. Responde SIEMPRE en el mismo idioma que usa el usuario
7. Para las fechas, conviértelas siempre al formato YYYY-MM-DD
8. Para el presupuesto, identifica la moneda (USD, EUR, GTQ, etc.)

Devuelve tu respuesta en el siguiente formato JSON:
{
  "reply": "tu respuesta conversacional al usuario",
  "extractedData": { ...datos extraídos de este mensaje... },
  "isComplete": false,
  "nextStep": número del siguiente paso pendiente
}
```

---

## Estado de la conversación — `ConversationState`

```typescript
interface ConversationState {
  currentStep: number                          // 0-6
  messages: Message[]                          // historial completo
  extractedData: Partial<UserPreferences>      // datos recopilados hasta ahora
  isComplete: boolean                          // true cuando los 7 pasos están listos
}
```

---

## Manejo de respuestas ambiguas

Gemini debe manejar estos casos de forma natural:

| Caso | Ejemplo del usuario | Comportamiento |
|---|---|---|
| Respuesta vaga | "no sé las fechas exactas" | Pedir rango aproximado o mes |
| Múltiples datos | "2 personas del 10 al 15 de julio" | Extraer ambos y avanzar 2 pasos |
| Fuera de tema | "¿cuál es la capital de Francia?" | Redirigir amablemente a la pregunta |
| Presupuesto sin moneda | "entre 100 y 200" | Inferir por ciudad o preguntar la moneda |
| Amenidades desconocidas | "quiero algo tranquilo" | Mapear a `quiet`, `adults-only` |

---

## Lógica en `conversationFlow.ts`

```typescript
// Pasos de la conversación en orden
export const CONVERSATION_STEPS = [
  'city',
  'dates',
  'guests',
  'budget',
  'tripType',
  'amenities',
  'specialRequests'
]

// Detecta qué campos faltan
export function getMissingFields(data: Partial<UserPreferences>): string[] {
  const required = ['city', 'checkIn', 'checkOut', 'guests', 'budgetMax', 'tripType']
  return required.filter(field => !data[field as keyof UserPreferences])
}

// Verifica si la conversación está completa
export function isConversationComplete(data: Partial<UserPreferences>): boolean {
  return getMissingFields(data).length === 0
}
```

---

## Mensaje de bienvenida (hardcoded, no viene de Gemini)

```typescript
export const WELCOME_MESSAGE = {
  role: 'assistant' as const,
  content: '¡Hola! 👋 Soy tu asistente de viajes inteligente. ' +
    'En pocos minutos te ayudaré a encontrar el hotel perfecto para ti. ' +
    '¿En qué ciudad o destino estás buscando hospedaje?'
}
```
