# CLAUDE.md — Hotel AI Project

## ¿Qué es este proyecto?

Sistema de recomendación inteligente de hoteles mediante conversación guiada por IA.
El usuario responde preguntas progresivas, la IA recopila sus preferencias y recomienda
hoteles reales con una puntuación de compatibilidad personalizada.

**Proyecto académico** — Universidad Mariano Gálvez de Guatemala
Curso: Inteligencia Artificial | Estudiante: Claudia Geobana Estrada Ruano

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| IA conversacional | Google Gemini Flash 2.0 |
| API de hoteles | Booking.com via RapidAPI |
| Deploy | Vercel |

---

## Estructura de carpetas

```
hotel-ai/
├── CLAUDE.md                        ← Estás aquí
├── docs/
│   ├── 01-arquitectura.md
│   ├── 02-flujo-conversacional.md
│   ├── 03-gemini-api.md
│   ├── 04-booking-api.md
│   ├── 05-componentes-ui.md
│   ├── 06-estilos-ux.md
│   └── 07-tipos-typescript.md
├── src/
│   ├── app/
│   │   ├── page.tsx                 ← Página principal (chat)
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── chat/route.ts        ← Endpoint del agente Gemini
│   │       └── hotels/route.ts      ← Endpoint búsqueda Booking
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── HotelCard.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── gemini.ts               ← Cliente Gemini configurado
│   │   ├── booking.ts              ← Cliente Booking RapidAPI
│   │   └── conversationFlow.ts     ← Lógica de preguntas
│   └── types/
│       └── index.ts                ← Interfaces TypeScript
├── .env.local                       ← Keys (nunca subir a GitHub)
└── .gitignore
```

---

## Variables de entorno

```env
GEMINI_API_KEY=           # Google AI Studio → aistudio.google.com
RAPIDAPI_KEY=             # RapidAPI dashboard → booking-com15
```

---

## Convenciones de código

- **Componentes**: PascalCase → `ChatWindow.tsx`
- **Funciones/variables**: camelCase → `getUserPreferences()`
- **Archivos de utilidad**: kebab-case → `conversation-flow.ts`
- **Tipos e interfaces**: PascalCase con prefijo descriptivo → `UserPreferences`, `HotelResult`
- **Comentarios**: en español, claros y concisos
- **Manejo de errores**: siempre usar try/catch en llamadas a APIs externas
- **Async/Await**: preferido sobre .then()/.catch()

---

## Flujo general de la aplicación

```
Usuario abre la app
    ↓
Gemini hace la primera pregunta (ciudad)
    ↓
Usuario responde → Gemini extrae dato y hace siguiente pregunta
    ↓
(Repite 6-7 veces: ciudad, fechas, presupuesto, tipo de viaje, amenidades, huéspedes)
    ↓
Con todas las preferencias → llama a Booking API
    ↓
Gemini analiza resultados + preferencias del usuario
    ↓
Muestra recomendación con razones y puntuación de compatibilidad
```

---

## Archivos de contexto — leer antes de cada tarea

| Tarea | Leer primero |
|---|---|
| Modificar el agente de IA | `docs/03-gemini-api.md` + `docs/02-flujo-conversacional.md` |
| Modificar búsqueda de hoteles | `docs/04-booking-api.md` |
| Crear o editar componentes | `docs/05-componentes-ui.md` + `docs/06-estilos-ux.md` |
| Agregar tipos TypeScript | `docs/07-tipos-typescript.md` |
| Cambiar arquitectura | `docs/01-arquitectura.md` |

---

## Reglas importantes

1. **Nunca** hardcodear API keys en el código — siempre usar `process.env.NOMBRE_KEY`
2. **Nunca** hacer llamadas a APIs externas desde el cliente (solo desde `app/api/`)
3. **Siempre** tipar las respuestas de las APIs con las interfaces de `src/types/index.ts`
4. **Siempre** manejar el estado de carga (loading) y error en los componentes
5. El archivo `.env.local` **nunca** debe subirse a GitHub — verificar `.gitignore`

---

## Estado actual del proyecto

- [x] Arquitectura definida
- [x] Flujo conversacional diseñado
- [x] API keys obtenidas (Gemini + RapidAPI Booking)
- [ ] Setup Next.js
- [ ] Implementar agente Gemini
- [ ] Integrar Booking API
- [ ] Construir UI
- [ ] Deploy en Vercel
