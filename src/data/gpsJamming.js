const JAMMING_ZONES = [
  { name: 'Eastern Mediterranean', lat: 34.5, lng: 34, radius: 4, severity: 'high' },
  { name: 'Crimea / Black Sea', lat: 44.5, lng: 34, radius: 3.5, severity: 'high' },
  { name: 'Kaliningrad / Baltic', lat: 55, lng: 20.5, radius: 3, severity: 'high' },
  { name: 'Persian Gulf', lat: 26.5, lng: 52, radius: 3, severity: 'high' },
  { name: 'Strait of Hormuz', lat: 26, lng: 56.5, radius: 2, severity: 'critical' },
  { name: 'Syria / Lebanon', lat: 35, lng: 37, radius: 2.5, severity: 'high' },
  { name: 'Northern Iraq', lat: 36.5, lng: 43, radius: 2, severity: 'medium' },
  { name: 'Israel region', lat: 31.5, lng: 34.8, radius: 1.5, severity: 'high' },
  { name: 'Eastern Ukraine', lat: 48, lng: 38, radius: 3, severity: 'high' },
  { name: 'Finland / Estonia border', lat: 59.5, lng: 27, radius: 2, severity: 'medium' },
  { name: 'Pakistan / India border', lat: 33, lng: 74, radius: 2, severity: 'medium' },
  { name: 'Myanmar', lat: 20, lng: 97, radius: 2, severity: 'low' },
  { name: 'South China Sea', lat: 16, lng: 114, radius: 3, severity: 'medium' },
  { name: 'North Korea', lat: 39, lng: 126, radius: 2, severity: 'high' },
  { name: 'Libya', lat: 32, lng: 15, radius: 2, severity: 'medium' },
  { name: 'Red Sea / Yemen', lat: 15, lng: 42, radius: 2.5, severity: 'high' },
]

const SEVERITY_COLORS = {
  critical: { color: '#ef4444', opacity: 0.35 },
  high: { color: '#f97316', opacity: 0.25 },
  medium: { color: '#eab308', opacity: 0.18 },
  low: { color: '#22c55e', opacity: 0.12 },
}

export function getJammingZones() {
  return JAMMING_ZONES.map((z) => ({
    ...z,
    ...SEVERITY_COLORS[z.severity],
  }))
}

export { SEVERITY_COLORS }
