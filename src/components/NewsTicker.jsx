const CATEGORY_COLORS = {
  airstrike: '#ef4444',
  missile: '#ef4444',
  nuclear: '#dc2626',
  naval: '#3b82f6',
  cyber: '#a855f7',
  military_movement: '#f97316',
  sanctions: '#eab308',
  humanitarian: '#22c55e',
  diplomacy: '#06b6d4',
  other: '#64748b',
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60000) return 'just now'
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`
  return `${Math.floor(ms / 86400000)}d ago`
}

export default function NewsTicker({ events, onEventClick }) {
  const sorted = events?.length
    ? [...events].sort((a, b) => new Date(b.time) - new Date(a.time))
    : []

  return (
    <div className="news-ticker">
      <div className="ticker-label">
        <span className="ticker-live-dot" />
        INTEL
      </div>
      <div className="ticker-track">
        <div className={`ticker-scroll ${sorted.length ? '' : 'ticker-scroll-empty'}`}>
          {sorted.length ? sorted.map((ev) => (
            <button
              key={ev.id}
              className="ticker-item"
              onClick={() => onEventClick?.(ev)}
              title={ev.title}
            >
              <span
                className="ticker-severity"
                style={{ background: CATEGORY_COLORS[ev.category] || '#64748b' }}
              />
              <span className="ticker-headline">
                {ev.isTrusted && <span className="ticker-trusted">V</span>}
                {ev.title.length > 80 ? ev.title.slice(0, 77) + '...' : ev.title}
              </span>
              <span className="ticker-meta">
                {ev.source} &middot; {timeAgo(ev.time)}
              </span>
            </button>
          )) : (
            <span className="ticker-placeholder">Waiting for intel updates…</span>
          )}
          {sorted.length ? sorted.map((ev) => (
            <button
              key={`dup-${ev.id}`}
              className="ticker-item"
              onClick={() => onEventClick?.(ev)}
              aria-hidden="true"
            >
              <span
                className="ticker-severity"
                style={{ background: CATEGORY_COLORS[ev.category] || '#64748b' }}
              />
              <span className="ticker-headline">
                {ev.isTrusted && <span className="ticker-trusted">V</span>}
                {ev.title.length > 80 ? ev.title.slice(0, 77) + '...' : ev.title}
              </span>
              <span className="ticker-meta">
                {ev.source} &middot; {timeAgo(ev.time)}
              </span>
            </button>
          )) : null}
        </div>
      </div>
    </div>
  )
}
