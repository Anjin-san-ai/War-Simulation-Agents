import { useState, useCallback, useEffect, useRef } from 'react'
import Globe from './components/Globe'
import LayerPanel from './components/LayerPanel'
import WarPanel from './components/WarPanel'
import NewsTicker from './components/NewsTicker'
import { simulateWar } from './ai/warSimulation'
import { fetchRealSatellites } from './data/realSatellites'
import { createFlightPoller } from './data/flights'
import { createMaritimePoller } from './data/maritime'
import { getJammingZones } from './data/gpsJamming'
import { createEventPoller } from './data/conflictEvents'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [layers, setLayers] = useState({
    satellites: true, flights: false, maritime: true,
    gpsJamming: true, events: true, borders: true,
  })
  const [realSatData, setRealSatData] = useState([])
  const [flights, setFlights] = useState([])
  const [vessels, setVessels] = useState([])
  const [jammingZones] = useState(getJammingZones)
  const [events, setEvents] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  const [warMode, setWarMode] = useState(false)
  const [warZoomed, setWarZoomed] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [warResult, setWarResult] = useState(null)
  const [warLoading, setWarLoading] = useState(false)
  const [warParams, setWarParams] = useState(null)

  const flightPollerRef = useRef(null)
  const maritimePollerRef = useRef(null)
  const eventPollerRef = useRef(null)

  useEffect(() => {
    fetchRealSatellites().then(setRealSatData)
  }, [])

  useEffect(() => {
    const fp = createFlightPoller((data) => { if (data) setFlights(data) })
    fp.start()
    flightPollerRef.current = fp
    return () => fp.stop()
  }, [])

  useEffect(() => {
    const mp = createMaritimePoller((data) => { if (data) setVessels(data) })
    mp.start()
    maritimePollerRef.current = mp
    return () => mp.stop()
  }, [])

  useEffect(() => {
    const ep = createEventPoller((data) => { if (data) setEvents(data) })
    ep.start()
    eventPollerRef.current = ep
    return () => ep.stop()
  }, [])

  const toggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const [utc, setUtc] = useState(new Date().toISOString().slice(11, 19))
  useEffect(() => {
    const id = setInterval(() => setUtc(new Date().toISOString().slice(11, 19)), 1000)
    return () => clearInterval(id)
  }, [])

  const handleZoomChange = useCallback((isWarZoom) => { setWarZoomed(isWarZoom) }, [])
  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country); setWarMode(true); setWarResult(null); setSidebarOpen(true)
  }, [])
  const handleSimulate = useCallback(async (params) => {
    setWarLoading(true); setWarResult(null); setWarParams(params)
    try { setWarResult(await simulateWar(params)) }
    catch (err) { console.error('Simulation failed:', err); setWarResult({ error: err.message }) }
    finally { setWarLoading(false) }
  }, [])
  const handleWarBack = useCallback(() => { setWarMode(false); setSelectedCountry(null); setWarResult(null); setWarParams(null) }, [])

  const counts = {
    satellites: realSatData.length,
    flights: flights.length,
    maritime: vessels.length,
    gpsJamming: jammingZones.length,
    events: events.length,
  }

  const activeLayers = Object.entries(layers).filter(([, v]) => v).length

  const warOverlay = (warResult && !warResult.error && warParams) ? {
    attacker: warParams.attacker,
    defender: warParams.defender,
    allies: warParams.allies || [],
    enemies: warParams.enemies || [],
    risks: warResult.risks || {},
  } : null

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-left">
          <span className={`status-dot pulse ${warMode ? 'war-dot' : ''}`} />
          <h1 className="app-title">{warMode ? 'WAR SIMULATION' : 'WORLD COMMAND CENTER'}</h1>
        </div>
        <div className="top-bar-center">
          {warMode && selectedCountry ? (
            <span className="top-war-badge">{selectedCountry.flag} {selectedCountry.name}</span>
          ) : (
            <span className="top-intel-badge">
              {activeLayers} layers active &middot; {(realSatData.length + flights.length + vessels.length + events.length).toLocaleString()} objects
            </span>
          )}
        </div>
        <div className="top-bar-right">
          <span className="live-badge">LIVE</span>
          <span className="live-dot" />
          <span className="utc-time">{utc} UTC</span>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? <path d="M15 3h6v18h-6M9 3H3v18h6M15 12H9" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </header>

      <div className="content-row">
        <div className="globe-area">
          <div className="globe-hint">
            {warZoomed && !warMode ? (
              <span className="war-hint">Click a country to start war simulation</span>
            ) : (
              <span>Drag to rotate &middot; Scroll to zoom &middot; Click to inspect</span>
            )}
          </div>
          <Globe
            layers={layers}
            realSatData={realSatData}
            flights={flights}
            vessels={vessels}
            jammingZones={jammingZones}
            events={events}
            onZoomChange={handleZoomChange}
            onCountrySelect={handleCountrySelect}
            onItemSelect={setSelectedItem}
            warOverlay={warOverlay}
          />
        </div>

        {sidebarOpen && (
          warMode && selectedCountry ? (
            <WarPanel selectedCountry={selectedCountry} onSimulate={handleSimulate} warResult={warResult} warLoading={warLoading} onBack={handleWarBack} />
          ) : (
            <LayerPanel layers={layers} onToggleLayer={toggleLayer} counts={counts} selectedItem={selectedItem} onClearSelection={() => setSelectedItem(null)} events={events} onEventClick={(ev) => setSelectedItem({ type: 'Conflict Event', color: '#ef4444', name: ev.title, fields: [{ label: 'Source', value: ev.source }, { label: 'Category', value: ev.category }, { label: 'Intensity', value: `${ev.intensity}/5` }, { label: 'Time', value: new Date(ev.time).toLocaleString() }] })} />
          )
        )}
      </div>

      <NewsTicker events={events} onEventClick={(ev) => setSelectedItem({ type: 'Conflict Event', color: '#ef4444', name: ev.title, fields: [{ label: 'Source', value: ev.source }, { label: 'Category', value: ev.category }, { label: 'Intensity', value: `${ev.intensity}/5` }, { label: 'Time', value: new Date(ev.time).toLocaleString() }] })} />
    </div>
  )
}

export default App
