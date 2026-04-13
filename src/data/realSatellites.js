import * as satellite from 'satellite.js'

/**
 * CelesTrak limits heavy downloads (e.g. GROUP=active) and often returns HTTP 403.
 * Smaller groups + merge: https://celestrak.org/NORAD/documentation/gp-data-formats.php
 */
const CELESTRAK_GROUP_URLS = [
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json',
]

const MAX_SATS = 800

const SAT_CATEGORIES = {
  spy: { match: /KH-11|KEYHOLE|USA[ -]?\d{3}|NROL|LACROSSE|ONYX|TOPAZ|MISTY/, color: '#ef4444', label: 'Military Recon' },
  russianRecon: { match: /BARS-M|KONDOR|PERSONA|RESURS-P|KOSMOS 25/, color: '#f97316', label: 'Russian Recon' },
  chineseRecon: { match: /GAOFEN|YAOGAN|JILIN|ZIYUAN/, color: '#eab308', label: 'Chinese ISR' },
  sar: { match: /CAPELLA|ICEYE|UMBRA|COSMO-SKYMED|RADARSAT|SAR/, color: '#a855f7', label: 'SAR Radar' },
  gps: { match: /GPS|NAVSTAR/, color: '#f59e0b', label: 'GPS' },
  starlink: { match: /STARLINK/, color: '#64748b', label: 'Starlink' },
  weather: { match: /GOES|METEOSAT|NOAA|HIMAWARI|JPSS|SUOMI/, color: '#06b6d4', label: 'Weather' },
  comms: { match: /INTELSAT|SES|TELESAT|IRIDIUM|GLOBALSTAR|ORBCOMM/, color: '#22c55e', label: 'Comms' },
  science: {
    match: /ISS|HUBBLE|JAMES WEBB|TERRA|AQUA|LANDSAT|CSS|TIANHE|WENTIAN|NAUKA|POISK/,
    color: '#3b82f6',
    label: 'Science',
  },
}

function categorizeSat(name) {
  const upper = name.toUpperCase()
  for (const [key, cat] of Object.entries(SAT_CATEGORIES)) {
    if (cat.match.test(upper)) return key
  }
  return null
}

function priorityScore(name) {
  const upper = name.toUpperCase()
  if (/KH-11|KEYHOLE|BARS-M|GAOFEN/.test(upper)) return 100
  if (/ISS|HUBBLE|GPS|NAVSTAR|CSS|TIANHE/.test(upper)) return 90
  if (/CAPELLA|ICEYE|GOES|METEOSAT/.test(upper)) return 80
  if (/IRIDIUM|INTELSAT/.test(upper)) return 50
  if (/STARLINK/.test(upper)) return 5
  return 20
}

/** If all CelesTrak requests fail — ISS + GPS + Starlink GP records (epochs drift over time). */
const FALLBACK_GP_JSON = [
  { OBJECT_NAME: 'ISS (ZARYA)', OBJECT_ID: '1998-067A', EPOCH: '2026-04-07T13:17:06.254304', MEAN_MOTION: 15.48817814, ECCENTRICITY: 0.00063325, INCLINATION: 51.6328, RA_OF_ASC_NODE: 289.6501, ARG_OF_PERICENTER: 284.4831, MEAN_ANOMALY: 75.5455, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U', NORAD_CAT_ID: 25544, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 56080, BSTAR: 0.00013586947, MEAN_MOTION_DOT: 6.997e-5, MEAN_MOTION_DDOT: 0 },
  { OBJECT_NAME: 'GPS BIIR-2  (PRN 13)', OBJECT_ID: '1997-035A', EPOCH: '2026-04-06T21:42:43.524288', MEAN_MOTION: 2.00564024, ECCENTRICITY: 0.0099056, INCLINATION: 55.9557, RA_OF_ASC_NODE: 101.3604, ARG_OF_PERICENTER: 56.1405, MEAN_ANOMALY: 304.8189, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U', NORAD_CAT_ID: 24876, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 21052, BSTAR: 0, MEAN_MOTION_DOT: 2.2e-7, MEAN_MOTION_DDOT: 0 },
  { OBJECT_NAME: 'GPS BIIR-5  (PRN 22)', OBJECT_ID: '2000-040A', EPOCH: '2026-04-06T17:39:28.882080', MEAN_MOTION: 2.00569374, ECCENTRICITY: 0.01221069, INCLINATION: 54.8671, RA_OF_ASC_NODE: 217.9989, ARG_OF_PERICENTER: 302.5066, MEAN_ANOMALY: 230.3827, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U', NORAD_CAT_ID: 26407, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 18851, BSTAR: 0, MEAN_MOTION_DOT: 7.0e-8, MEAN_MOTION_DDOT: 0 },
  { OBJECT_NAME: 'STARLINK-1008', OBJECT_ID: '2019-074B', EPOCH: '2026-04-07T03:28:23.808000', MEAN_MOTION: 15.34101796, ECCENTRICITY: 0.00032323, INCLINATION: 53.1559, RA_OF_ASC_NODE: 46.1506, ARG_OF_PERICENTER: 126.1394, MEAN_ANOMALY: 233.9908, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U', NORAD_CAT_ID: 44714, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 35323, BSTAR: 0.0027708276, MEAN_MOTION_DOT: 0.0009353, MEAN_MOTION_DDOT: 0 },
  { OBJECT_NAME: 'STARLINK-1012', OBJECT_ID: '2019-074F', EPOCH: '2026-04-07T03:21:29.987424', MEAN_MOTION: 15.33319626, ECCENTRICITY: 0.0003482, INCLINATION: 53.1597, RA_OF_ASC_NODE: 46.3997, ARG_OF_PERICENTER: 123.0381, MEAN_ANOMALY: 237.0956, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U', NORAD_CAT_ID: 44718, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 35322, BSTAR: 0.0027607715, MEAN_MOTION_DOT: 0.00090877, MEAN_MOTION_DDOT: 0 },
  { OBJECT_NAME: 'STARLINK-1017', OBJECT_ID: '2019-074L', EPOCH: '2026-04-07T05:45:57.535200', MEAN_MOTION: 15.26993739, ECCENTRICITY: 0.00035055, INCLINATION: 53.0516, RA_OF_ASC_NODE: 39.4729, ARG_OF_PERICENTER: 128.5023, MEAN_ANOMALY: 231.629, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U', NORAD_CAT_ID: 44723, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 35332, BSTAR: 0.0029347856, MEAN_MOTION_DOT: 0.00079303, MEAN_MOTION_DDOT: 0 },
]

let cachedSatData = null

async function fetchMergedGpJson() {
  const seen = new Set()
  const merged = []

  for (const url of CELESTRAK_GROUP_URLS) {
    try {
      const res = await fetch(url)
      const group = url.match(/GROUP=([^&]+)/)?.[1] ?? 'unknown'
      if (!res.ok) {
        console.warn(`CelesTrak ${group}: HTTP ${res.status}`)
        continue
      }
      const batch = await res.json()
      if (!Array.isArray(batch)) continue
      for (const s of batch) {
        const id = s.NORAD_CAT_ID
        if (id == null || seen.has(id)) continue
        seen.add(id)
        merged.push(s)
      }
    } catch (e) {
      console.warn('CelesTrak fetch failed:', e.message)
    }
    if (merged.length >= MAX_SATS * 3) break
  }

  return merged
}

function buildSatelliteList(raw) {
  const categorized = raw
    .map((s) => ({ ...s, category: categorizeSat(s.OBJECT_NAME), priority: priorityScore(s.OBJECT_NAME) }))
    .filter((s) => s.category !== null)

  categorized.sort((a, b) => b.priority - a.priority)

  const starlinkCount = 100
  let starlinkAdded = 0
  const result = []
  for (const s of categorized) {
    if (s.category === 'starlink') {
      if (starlinkAdded >= starlinkCount) continue
      starlinkAdded++
    }
    result.push(s)
    if (result.length >= MAX_SATS) break
  }

  return result.map((s) => {
    const satrec = satellite.json2satrec(s)
    return {
      name: s.OBJECT_NAME,
      noradId: s.NORAD_CAT_ID,
      category: s.category,
      satrec,
    }
  })
}

export async function fetchRealSatellites() {
  if (cachedSatData?.length) return cachedSatData

  let raw = await fetchMergedGpJson()

  if (!raw.length) {
    console.warn('CelesTrak returned no data; using embedded GP fallback.')
    raw = FALLBACK_GP_JSON
  }

  try {
    cachedSatData = buildSatelliteList(raw)
    if (!cachedSatData.length) {
      console.warn('No categorized satellites; using embedded GP fallback.')
      cachedSatData = buildSatelliteList(FALLBACK_GP_JSON)
    }
    return cachedSatData
  } catch (err) {
    console.error('Failed to parse satellite data:', err)
    try {
      cachedSatData = buildSatelliteList(FALLBACK_GP_JSON)
      return cachedSatData
    } catch {
      return []
    }
  }
}

export function propagateSatellite(sat, date) {
  const posVel = satellite.propagate(sat.satrec, date)
  if (!posVel.position || typeof posVel.position === 'boolean') return null

  const gmst = satellite.gstime(date)
  const geo = satellite.eciToGeodetic(posVel.position, gmst)

  const lat = satellite.degreesLat(geo.latitude)
  const lng = satellite.degreesLong(geo.longitude)
  const altKm = geo.height

  const vel = posVel.velocity
  const speed = vel ? Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2) : 0

  const logRadius = 1 + Math.log1p(altKm / 200) * 0.18
  return { lat, lng, altKm, speed, orbitRadius: logRadius }
}

export function computeOrbitPath(sat, now, steps = 80) {
  const points = []
  const periodMin = (2 * Math.PI) / sat.satrec.no
  const stepMin = periodMin / steps

  for (let i = 0; i <= steps; i++) {
    const t = new Date(now.getTime() + i * stepMin * 60000)
    const pos = propagateSatellite(sat, t)
    if (pos) points.push(pos)
  }
  return points
}

export { SAT_CATEGORIES }
