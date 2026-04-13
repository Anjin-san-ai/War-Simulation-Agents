const POLL_INTERVAL = 30_000

const CHOKEPOINTS = [
  { name: 'Strait of Hormuz', lamin: 25.5, lamax: 27.5, lomin: 55.5, lomax: 57 },
  { name: 'Suez Canal', lamin: 29, lamax: 32, lomin: 32, lomax: 34 },
  { name: 'South China Sea', lamin: 5, lamax: 20, lomin: 110, lomax: 120 },
  { name: 'Strait of Malacca', lamin: 0, lamax: 5, lomin: 99, lomax: 105 },
  { name: 'English Channel', lamin: 49, lamax: 52, lomin: -2, lomax: 2 },
  { name: 'Bab el-Mandeb', lamin: 12, lamax: 13.5, lomin: 42.5, lomax: 44 },
  { name: 'Taiwan Strait', lamin: 23, lamax: 26, lomin: 117, lomax: 121 },
  { name: 'Baltic Sea', lamin: 53, lamax: 60, lomin: 10, lomax: 25 },
]

const VESSEL_TYPES = {
  tanker: { color: '#f97316', label: 'Tanker' },
  cargo: { color: '#3b82f6', label: 'Cargo' },
  military: { color: '#ef4444', label: 'Military' },
  passenger: { color: '#22c55e', label: 'Passenger' },
  fishing: { color: '#8b5cf6', label: 'Fishing' },
  other: { color: '#64748b', label: 'Other' },
}

function generateSimulatedVessels() {
  const vessels = []
  let id = 0
  for (const cp of CHOKEPOINTS) {
    const count = 8 + Math.floor(Math.random() * 12)
    for (let i = 0; i < count; i++) {
      const lat = cp.lamin + Math.random() * (cp.lamax - cp.lamin)
      const lng = cp.lomin + Math.random() * (cp.lomax - cp.lomin)
      const types = Object.keys(VESSEL_TYPES)
      const typeWeights = [0.3, 0.35, 0.05, 0.1, 0.1, 0.1]
      let r = Math.random(), typeIdx = 0, acc = 0
      for (let t = 0; t < typeWeights.length; t++) { acc += typeWeights[t]; if (r < acc) { typeIdx = t; break } }
      const type = types[typeIdx]
      vessels.push({
        mmsi: `${200000000 + id}`,
        name: `${type.toUpperCase()}-${cp.name.split(' ')[0]}-${i + 1}`,
        type,
        lat,
        lng,
        heading: Math.random() * 360,
        speed: 5 + Math.random() * 15,
        flag: ['PA', 'LR', 'MH', 'HK', 'SG', 'GR', 'NO', 'JP'][Math.floor(Math.random() * 8)],
        destination: cp.name,
        chokepoint: cp.name,
      })
      id++
    }
  }
  return vessels
}

let cachedVessels = null
let lastUpdate = 0

export function createMaritimePoller(onUpdate) {
  let timer = null

  function poll() {
    const now = Date.now()
    if (!cachedVessels || now - lastUpdate > POLL_INTERVAL) {
      cachedVessels = generateSimulatedVessels()
      lastUpdate = now
    }
    onUpdate(cachedVessels, null)
  }

  return {
    start() { poll(); timer = setInterval(poll, POLL_INTERVAL) },
    stop() { clearInterval(timer) },
  }
}

export { VESSEL_TYPES, CHOKEPOINTS }
