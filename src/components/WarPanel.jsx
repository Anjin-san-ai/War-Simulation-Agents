import { useState } from 'react'
import { countries, getCountryByIso, formatGdp, formatPop } from '../data/countries'
import { HAT_META } from '../ai/warSimulation'

const SCENARIO_FILTERS = [
  { key: 'economic', label: 'Economic Impact' },
  { key: 'oil', label: 'Oil & Resources' },
  { key: 'tech', label: 'Tech Warfare' },
  { key: 'nuclear', label: 'Nuclear Tensions' },
  { key: 'civil', label: 'Civil Unrest' },
  { key: 'cyber', label: 'Cyber Warfare' },
]

const HAT_ORDER = ['white', 'red', 'black', 'yellow', 'green', 'blue']

export default function WarPanel({ selectedCountry, onSimulate, warResult, warLoading, onBack }) {
  const [defender, setDefender] = useState(null)
  const [allyIsos, setAllyIsos] = useState(selectedCountry?.defaultAllies || [])
  const [enemyIsos, setEnemyIsos] = useState(selectedCountry?.defaultEnemies || [])
  const [filters, setFilters] = useState({ economic: true, oil: false, tech: false, nuclear: false, civil: false, cyber: false })

  const otherCountries = countries.filter((c) => c.iso !== selectedCountry?.iso)

  const toggleIso = (iso, list, setter) => {
    setter(list.includes(iso) ? list.filter((i) => i !== iso) : [...list, iso])
  }

  const handleSimulate = () => {
    if (!defender) return
    const allies = allyIsos.map(getCountryByIso).filter(Boolean)
    const enemies = enemyIsos.map(getCountryByIso).filter(Boolean)
    onSimulate({ attacker: selectedCountry, defender, allies, enemies, filters })
  }

  return (
    <aside className={`side-panel war-panel ${warResult && !warResult.error ? 'war-panel-expanded' : ''}`}>
      <button className="war-back-btn" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        Back to Globe
      </button>

      <h2 className="war-heading">War Simulation</h2>

      <div className="war-country-card">
        <span className="war-flag">{selectedCountry.flag}</span>
        <div className="war-country-info">
          <span className="war-country-name">{selectedCountry.name}</span>
          <span className="war-country-stats">
            Pop: {formatPop(selectedCountry.population)} &middot; GDP: {formatGdp(selectedCountry.gdp)} &middot; Military #{selectedCountry.militaryRank}
            {selectedCountry.nuclear && <span className="war-nuke-badge">NUCLEAR</span>}
          </span>
        </div>
      </div>

      <div className="war-section">
        <h3 className="war-section-title">Select opponent</h3>
        <div className="war-country-grid">
          {otherCountries.slice(0, 15).map((c) => (
            <button key={c.iso} className={`war-chip ${defender?.iso === c.iso ? 'war-chip-enemy-active' : ''}`} onClick={() => setDefender(c)}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="war-section">
        <h3 className="war-section-title">Your allies</h3>
        <div className="war-country-grid">
          {otherCountries.filter((c) => c.iso !== defender?.iso).slice(0, 12).map((c) => (
            <button key={c.iso} className={`war-chip ${allyIsos.includes(c.iso) ? 'war-chip-ally-active' : ''}`} onClick={() => toggleIso(c.iso, allyIsos, setAllyIsos)}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="war-section">
        <h3 className="war-section-title">Opponent allies</h3>
        <div className="war-country-grid">
          {otherCountries.filter((c) => c.iso !== defender?.iso && !allyIsos.includes(c.iso)).slice(0, 12).map((c) => (
            <button key={c.iso} className={`war-chip ${enemyIsos.includes(c.iso) ? 'war-chip-enemy-active' : ''}`} onClick={() => toggleIso(c.iso, enemyIsos, setEnemyIsos)}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="war-section">
        <h3 className="war-section-title">Scenario focus</h3>
        <div className="war-filter-grid">
          {SCENARIO_FILTERS.map((f) => (
            <button key={f.key} className={`war-filter-btn ${filters[f.key] ? 'war-filter-active' : ''}`} onClick={() => setFilters((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <button className="war-simulate-btn" disabled={!defender || warLoading} onClick={handleSimulate}>
        {warLoading ? (
          <span className="war-loading"><span className="war-spinner" />Analyzing 6 perspectives...</span>
        ) : (
          'Simulate War (6 Thinking Hats)'
        )}
      </button>

      {warResult && !warResult.error && <SixHatsResults result={warResult} />}
      {warResult?.error && <div className="war-error">{warResult.error}</div>}
    </aside>
  )
}

function SixHatsResults({ result }) {
  return (
    <div className="war-results">
      {result.winner && (
        <div className="war-winner">
          <span className="war-winner-label">Likely Outcome</span>
          <span className="war-winner-value">{result.winner}</span>
        </div>
      )}

      {result.consensus && (
        <div className="hat-consensus">
          <h4 className="hat-consensus-title">Overall Consensus</h4>
          <p className="hat-consensus-text">{result.consensus}</p>
        </div>
      )}

      <h3 className="war-results-heading">6 Agent Analysis</h3>

      <div className="hat-agents-grid">
        {HAT_ORDER.map((hatKey, idx) => {
          const meta = HAT_META[hatKey]
          const hat = result.hats?.find((h) => h.hat === hatKey)
          if (!hat) return null
          return (
            <div
              key={hatKey}
              className="hat-agent-card"
              style={{
                borderLeftColor: meta.color,
                animationDelay: `${idx * 0.2}s`,
              }}
            >
              <div className="hat-agent-header">
                <span className="hat-agent-dot" style={{ background: meta.color }} />
                <span className="hat-agent-title" style={{ color: meta.color }}>{hat.title}</span>
                <span className="hat-agent-status">Agent {idx + 1}</span>
              </div>
              <p className="hat-agent-summary">{hat.summary}</p>
              <div className="hat-agent-points">
                {hat.keyPoints?.map((point, i) => (
                  <div key={i} className="hat-agent-point">
                    <span className="hat-agent-bullet" style={{ background: meta.color }} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              {hat.stats && (
                <div className="hat-agent-stats">
                  {Object.entries(hat.stats).map(([key, val]) => (
                    <div key={key} className="hat-agent-stat">
                      <span className="hat-agent-stat-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="hat-agent-stat-value" style={{ color: meta.color }}>
                        {typeof val === 'number' ? val.toLocaleString() : val}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {result.risks && (
        <div className="war-risks">
          <h4 className="war-risk-heading">Risk Assessment</h4>
          {Object.entries(result.risks).map(([key, val]) => (
            <div key={key} className="war-risk-row">
              <span className="war-risk-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <div className="war-risk-bar">
                <div className="war-risk-fill" style={{ width: `${val}%`, background: val > 60 ? '#ef4444' : val > 30 ? '#f59e0b' : '#22c55e' }} />
              </div>
              <span className="war-risk-pct">{val}%</span>
            </div>
          ))}
        </div>
      )}

      {result.phases?.length > 0 && (
        <div className="war-phases">
          <h4 className="war-risk-heading">Conflict Phases</h4>
          {result.phases.map((phase, i) => (
            <div key={i} className="war-phase">
              <div className="war-phase-marker">{i + 1}</div>
              <div className="war-phase-content">
                <span className="war-phase-name">{phase.name} <span className="war-phase-dur">{phase.duration}</span></span>
                <p className="war-phase-desc">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
