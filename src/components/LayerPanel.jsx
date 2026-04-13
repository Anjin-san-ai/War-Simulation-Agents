import { SAT_CATEGORIES } from '../data/realSatellites'
import { VESSEL_TYPES } from '../data/maritime'

const LAYERS = [
  { key: 'satellites', label: 'Satellites', color: '#a855f7', icon: 'S' },
  { key: 'flights', label: 'Flights (ADS-B)', color: '#ff6b35', icon: 'F' },
  { key: 'maritime', label: 'Maritime (AIS)', color: '#3b82f6', icon: 'M' },
  { key: 'gpsJamming', label: 'GPS Jamming', color: '#eab308', icon: 'G' },
  { key: 'events', label: 'Conflict Events', color: '#ef4444', icon: 'E' },
  { key: 'borders', label: 'Country Borders', color: '#ffffff', icon: 'B' },
]

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60000) return 'now'
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`
  return `${Math.floor(ms / 86400000)}d`
}

export default function LayerPanel({
  layers, onToggleLayer, counts,
  selectedItem, onClearSelection, events, onEventClick,
}) {
  return (
    <aside className="side-panel layer-panel">
      <h2 className="panel-heading" style={{ color: '#a855f7' }}>Intelligence Layers</h2>

      <div className="layer-toggles">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            className={`layer-toggle-row ${layers[l.key] ? 'layer-on' : 'layer-off'}`}
            onClick={() => onToggleLayer(l.key)}
          >
            <span className="layer-indicator" style={{ background: layers[l.key] ? l.color : '#334155' }} />
            <span className="layer-label">{l.label}</span>
            {counts[l.key] != null && (
              <span className="layer-count">{counts[l.key].toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>

      {selectedItem ? (
        <div className="detail-card">
          <div className="detail-header">
            <span className="detail-type" style={{ color: selectedItem.color }}>{selectedItem.type}</span>
            <button className="detail-close" onClick={onClearSelection}>x</button>
          </div>
          <span className="detail-name">{selectedItem.name}</span>
          {selectedItem.fields && (
            <div className="detail-fields">
              {selectedItem.fields.map((f, i) => (
                <div key={i} className="detail-field-row">
                  <span className="detail-field-label">{f.label}</span>
                  <span className="detail-field-value">{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="detail-card detail-empty">
          <span className="empty-hint">Click any object on the globe to inspect</span>
        </div>
      )}

      {events?.length > 0 && (
        <div className="intel-section">
          <h3 className="filter-heading" style={{ color: '#ef4444' }}>Latest Intel</h3>
          <div className="intel-list">
            {[...events].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5).map((ev) => (
              <button key={ev.id} className="intel-item" onClick={() => onEventClick?.(ev)}>
                <span className="intel-severity" data-intensity={ev.intensity} />
                <div className="intel-content">
                  <span className="intel-headline">{ev.title.length > 60 ? ev.title.slice(0, 57) + '...' : ev.title}</span>
                  <span className="intel-meta">{ev.source} &middot; {timeAgo(ev.time)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="layer-legend-section">
        <h3 className="filter-heading">Satellite Types</h3>
        <div className="layer-legend-grid">
          {Object.entries(SAT_CATEGORIES).filter(([k]) => k !== 'starlink').map(([key, cat]) => (
            <div key={key} className="layer-legend-item">
              <span className="legend-dot" style={{ background: cat.color }} />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="layer-legend-section">
        <h3 className="filter-heading">Vessel Types</h3>
        <div className="layer-legend-grid">
          {Object.entries(VESSEL_TYPES).map(([key, vt]) => (
            <div key={key} className="layer-legend-item">
              <span className="legend-dot" style={{ background: vt.color }} />
              <span>{vt.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
