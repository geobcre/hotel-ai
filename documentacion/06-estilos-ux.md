# 06 — Estilos y UX

## Enfoque de estilos

Tailwind CSS como base. Clases utilitarias en los componentes JSX.
Para animaciones y casos especiales: CSS modules o `globals.css`.

---

## Paleta de colores

### Modo claro
| Uso | Color | Tailwind class |
|---|---|---|
| Fondo principal | `#F8F9FA` | `bg-gray-50` |
| Fondo tarjetas | `#FFFFFF` | `bg-white` |
| Burbuja usuario | `#4F46E5` | `bg-indigo-600` |
| Burbuja asistente | `#F3F4F6` | `bg-gray-100` |
| Texto principal | `#111827` | `text-gray-900` |
| Texto secundario | `#6B7280` | `text-gray-500` |
| Acento / botones | `#4F46E5` | `bg-indigo-600` |
| Badge compatibilidad | `#10B981` | `bg-emerald-500` |
| Borde | `#E5E7EB` | `border-gray-200` |

### Modo oscuro (dark:)
| Uso | Color | Tailwind class |
|---|---|---|
| Fondo principal | `#0F172A` | `dark:bg-slate-900` |
| Fondo tarjetas | `#1E293B` | `dark:bg-slate-800` |
| Burbuja usuario | `#6366F1` | `dark:bg-indigo-500` |
| Burbuja asistente | `#334155` | `dark:bg-slate-700` |
| Texto principal | `#F1F5F9` | `dark:text-slate-100` |
| Texto secundario | `#94A3B8` | `dark:text-slate-400` |
| Borde | `#334155` | `dark:border-slate-700` |

---

## Layout principal — `app/page.tsx`

```tsx
// Pantalla completa, centrada, max-width para desktop
<main className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
  <div className="w-full max-w-2xl h-[90vh] flex flex-col">
    <ChatWindow />
  </div>
</main>
```

---

## Clases Tailwind por componente

### ChatWindow
```
// Contenedor
"flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"

// Header
"flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"

// Área de mensajes
"flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth"

// Área de input
"px-4 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-3"

// Input de texto
"flex-1 rounded-xl border border-gray-300 dark:border-slate-600
 bg-gray-50 dark:bg-slate-700 px-4 py-3
 text-gray-900 dark:text-slate-100
 placeholder:text-gray-400 dark:placeholder:text-slate-400
 focus:outline-none focus:ring-2 focus:ring-indigo-500
 disabled:opacity-50"

// Botón enviar
"px-5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500
 text-white font-medium rounded-xl transition-colors
 disabled:opacity-40 disabled:cursor-not-allowed"
```

### MessageBubble
```
// Wrapper (usuario → derecha, asistente → izquierda)
"flex gap-3 items-end"
"flex gap-3 items-end flex-row-reverse"   ← usuario

// Burbuja asistente
"max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm
 bg-gray-100 dark:bg-slate-700
 text-gray-900 dark:text-slate-100 text-sm leading-relaxed"

// Burbuja usuario
"max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm
 bg-indigo-600 dark:bg-indigo-500
 text-white text-sm leading-relaxed"
```

### HotelCard
```
// Tarjeta completa
"mt-4 rounded-2xl overflow-hidden border border-gray-200
 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg"

// Imagen
"w-full h-48 object-cover"

// Cuerpo
"p-5 space-y-4"

// Badge compatibilidad
"inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900
 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-semibold"

// Precio
"text-2xl font-bold text-gray-900 dark:text-slate-100"

// Chip de amenidad
"px-3 py-1 bg-indigo-50 dark:bg-indigo-900
 text-indigo-600 dark:text-indigo-300
 rounded-full text-xs font-medium"

// Botón CTA
"w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white
 font-semibold rounded-xl transition-colors text-center block mt-4"
```

---

## Configuración Tailwind dark mode — `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',   // ← importante: dark mode por clase, no por sistema
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        bounce: 'bounce 1.2s infinite',
      }
    },
  },
  plugins: [],
}
export default config
```

---

## globals.css — estilos base

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Scrollbar personalizada */
.messages-area::-webkit-scrollbar {
  width: 4px;
}
.messages-area::-webkit-scrollbar-track {
  background: transparent;
}
.messages-area::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 2px;
}
.dark .messages-area::-webkit-scrollbar-thumb {
  background: #475569;
}

/* Typing indicator */
@keyframes bounce-dot {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%           { transform: translateY(-6px); opacity: 1; }
}
.typing-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: bounce-dot 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
```

---

## Responsive design

El diseño es mobile-first. Breakpoints clave:

| Breakpoint | Comportamiento |
|---|---|
| < 640px (mobile) | Chat ocupa toda la pantalla, padding reducido |
| 640px–1024px (tablet) | Chat centrado con max-w-2xl |
| > 1024px (desktop) | Igual que tablet, sin cambios mayores |

```tsx
// Ajuste de padding en mobile
<main className="min-h-screen bg-gray-50 dark:bg-slate-900
  flex items-center justify-center
  p-0 sm:p-4">       ← sin padding en mobile, con padding en sm+

<div className="w-full max-w-2xl
  h-screen sm:h-[90vh]  ← full height en mobile
  flex flex-col">
```

---

## Estados de UX

| Estado | Comportamiento visual |
|---|---|
| Cargando respuesta | Typing indicator animado en el chat |
| Input deshabilitado | Opacidad reducida + cursor `not-allowed` |
| Error de red | Mensaje de error como burbuja del asistente |
| Recomendación lista | HotelCard aparece con animación `fade-in` |
| Sin resultados | Mensaje del asistente sugiriendo ajustar criterios |

### Animación fade-in para HotelCard

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hotel-card-appear {
  animation: fade-in 0.4s ease-out;
}
```

---

## Tipografía

- **Font**: Inter (Google Fonts) o system-ui como fallback
- **Tamaños**: text-sm (14px) para burbujas, text-base (16px) para input, text-lg+ para títulos
- **Line-height**: `leading-relaxed` (1.625) en todo el contenido de chat

Agregar en `app/layout.tsx`:
```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```
