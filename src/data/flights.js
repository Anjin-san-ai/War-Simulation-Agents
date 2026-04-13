const OPENSKY_URL = 'https://opensky-network.org/api/states/all'
const POLL_INTERVAL = 15_000
const MAX_FLIGHTS = 300

export function parseFlights(raw) {
  if (!raw?.states) return []
  return raw.states
    .filter((s) => s[5] != null && s[6] != null)
    .slice(0, MAX_FLIGHTS)
    .map((s) => ({
      icao24: s[0],
      callsign: (s[1] || '').trim() || s[0].toUpperCase(),
      country: s[2],
      lng: s[5],
      lat: s[6],
      altitudeM: s[7] ?? s[13] ?? 0,
      velocity: s[9] ?? 0,
      heading: s[10] ?? 0,
      verticalRate: s[11] ?? 0,
      onGround: s[8],
    }))
}

export function createFlightPoller(onUpdate) {
  let timer = null
  let abortCtrl = null

  async function fetchFlights() {
    try {
      abortCtrl = new AbortController()
      const res = await fetch(OPENSKY_URL, { signal: abortCtrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      onUpdate(parseFlights(json), null)
    } catch (err) {
      if (err.name !== 'AbortError') onUpdate(null, err)
    }
  }

  return {
    start() { fetchFlights(); timer = setInterval(fetchFlights, POLL_INTERVAL) },
    stop() { clearInterval(timer); abortCtrl?.abort() },
  }
}
