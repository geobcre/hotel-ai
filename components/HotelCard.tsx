import type { HotelCardProps } from '@/types'

export default function HotelCard({ result }: HotelCardProps) {
  const { recommendedHotel: hotel, compatibilityScore, reasons, highlights } = result

  return (
    <div className="fade-in-up mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
      {/* Imagen */}
      {hotel.photoUrl && (
        <div className="relative h-44 bg-[var(--surface-alt)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hotel.photoUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          {/* Badge de compatibilidad */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--badge-bg)] text-[var(--badge-text)] backdrop-blur-sm">
            {compatibilityScore}% compatible
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[var(--foreground)] leading-tight">{hotel.name}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{hotel.address}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-[var(--foreground)]">
              {hotel.currency} {hotel.pricePerNight.toLocaleString()}
            </div>
            <div className="text-xs text-[var(--text-muted)]">por noche</div>
          </div>
        </div>

        {/* Estrellas y rating */}
        <div className="flex items-center gap-3">
          {hotel.stars > 0 && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <svg key={i} className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
          )}
          {hotel.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--foreground)]">
                {hotel.rating.toFixed(1)}
              </span>
              {hotel.reviewLabel && (
                <span className="text-xs text-[var(--text-muted)]">{hotel.reviewLabel}</span>
              )}
              {hotel.reviewCount > 0 && (
                <span className="text-xs text-[var(--text-muted)]">
                  · {hotel.reviewCount.toLocaleString()} reseñas
                </span>
              )}
            </div>
          )}
        </div>

        {/* Razones */}
        {reasons.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Por qué es ideal para ti
            </p>
            <ul className="space-y-1">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                  <span className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 rounded-full bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center text-[9px] font-bold">✓</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-alt)]"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        {result.disclaimer && (
          <p className="text-xs text-[var(--text-muted)] italic border-t border-[var(--border)] pt-3">
            {result.disclaimer}
          </p>
        )}

        {/* CTA */}
        <a
          href={hotel.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 px-4 rounded-xl bg-[var(--accent)] text-[var(--user-bubble-text)] text-sm font-medium transition-opacity hover:opacity-80"
        >
          Ver en Booking.com →
        </a>
      </div>
    </div>
  )
}
