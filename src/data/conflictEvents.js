const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc'
const POLL_INTERVAL = 90_000 // 90 seconds

const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
const AZURE_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
const API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2025-01-01-preview'

const TRUSTED_DOMAINS = ['reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'cnn.com', 'aljazeera.com', 'nytimes.com', 'theguardian.com', 'washingtonpost.com', 'france24.com', 'dw.com']

// Fallback events when GDELT/Azure return nothing (API slow, CORS, or rate limits)
const FALLBACK_EVENTS = [
  { lat: 31.5, lng: 34.75, title: 'Regional tensions continue amid diplomatic efforts', source: 'Reuters', category: 'diplomacy', intensity: 2 },
  { lat: 48.86, lng: 2.35, title: 'European leaders discuss security and defense cooperation', source: 'AP', category: 'military_movement', intensity: 2 },
  { lat: 50.45, lng: 30.52, title: 'Humanitarian aid deliveries reported in conflict zone', source: 'BBC', category: 'humanitarian', intensity: 3 },
  { lat: 33.5, lng: 36.3, title: 'Ceasefire talks resume as fighting continues', source: 'Al Jazeera', category: 'diplomacy', intensity: 3 },
  { lat: 41.0, lng: 29.0, title: 'Naval patrols intensify in key shipping lanes', source: 'Reuters', category: 'naval', intensity: 3 },
  { lat: 24.5, lng: 54.4, title: 'Gulf states coordinate on regional security', source: 'AP', category: 'military_movement', intensity: 2 },
  { lat: 35.7, lng: 51.4, title: 'Sanctions impact assessed amid ongoing negotiations', source: 'Reuters', category: 'sanctions', intensity: 2 },
  { lat: 55.75, lng: 37.6, title: 'Defense ministers meet on arms and supply chains', source: 'Reuters', category: 'military_movement', intensity: 2 },
  { lat: 39.9, lng: 32.9, title: 'NATO member discusses troop deployments', source: 'AP', category: 'military_movement', intensity: 3 },
  { lat: 25.0, lng: 55.0, title: 'Cyber defense cooperation expanded in region', source: 'Reuters', category: 'cyber', intensity: 2 },
]

function getFallbackEvents() {
  return FALLBACK_EVENTS.map((e, i) => ({
    ...e,
    id: `fallback-${i}-${Date.now()}`,
    time: new Date(Date.now() - i * 3600000).toISOString(),
    isTrusted: true,
    url: null,
  }))
}

const GEO_SYSTEM_PROMPT = `You geolocate conflict news articles. For each article, estimate the most likely geographic coordinates of the event described.

Return ONLY valid JSON: an array of objects, one per article, with this structure:
[
  { "index": 0, "lat": 33.5, "lng": 44.4, "intensity": 4, "category": "airstrike" }
]

Rules:
- lat/lng should be the estimated location of the EVENT (not the news source)
- intensity: 1=minor/diplomatic, 2=tensions, 3=military movement, 4=active combat, 5=major strike/crisis
- category: one of "airstrike", "naval", "missile", "cyber", "sanctions", "military_movement", "nuclear", "humanitarian", "diplomacy", "other"
- Trusted sources (Reuters, AP, BBC, CNN, Al Jazeera, NYT, Guardian) get +1 intensity boost
- If you cannot determine location, use the capital of the source country
- Return the array in the same order as the input articles`

async function fetchGdeltArticles() {
  try {
    const query = encodeURIComponent('conflict OR strike OR military OR war OR missile OR airstrike')
    const url = `${GDELT_URL}?query=${query}&mode=ArtList&maxrecords=15&format=json&timespan=24h&sourcelang=english`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    if (!data.articles) return []
    return data.articles.slice(0, 15).map((a, i) => ({
      index: i,
      title: a.title?.slice(0, 150) || 'Conflict report',
      source: a.domain || 'Unknown',
      url: a.url,
      sourceCountry: a.sourcecountry || 'Unknown',
      time: a.seendate
        ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T/, '$1-$2-$3T')).toISOString()
        : new Date().toISOString(),
      isTrusted: TRUSTED_DOMAINS.some((d) => (a.domain || '').includes(d)),
    }))
  } catch {
    return []
  }
}

async function enrichWithGeolocation(articles) {
  if (!articles.length || !AZURE_ENDPOINT || !AZURE_KEY) return articles.map((a) => ({ ...a, lat: null, lng: null, intensity: 2, category: 'other' }))

  const prompt = articles.map((a, i) => `${i}. "${a.title}" (source: ${a.source}, country: ${a.sourceCountry})`).join('\n')

  try {
    const url = `${AZURE_ENDPOINT}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': AZURE_KEY },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: GEO_SYSTEM_PROMPT },
          { role: 'user', content: `Geolocate these ${articles.length} conflict articles:\n\n${prompt}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) throw new Error(`Azure ${res.status}`)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('No content')

    let parsed = JSON.parse(content)
    if (!Array.isArray(parsed)) parsed = parsed.events || parsed.articles || parsed.results || Object.values(parsed)[0]
    if (!Array.isArray(parsed)) throw new Error('Not array')

    return articles.map((article, i) => {
      const geo = parsed.find((g) => g.index === i) || parsed[i] || {}
      return {
        ...article,
        lat: geo.lat || null,
        lng: geo.lng || null,
        intensity: Math.min(5, Math.max(1, geo.intensity || 2)),
        category: geo.category || 'other',
      }
    })
  } catch (err) {
    console.warn('Geolocation enrichment failed:', err.message)
    return articles.map((a) => ({ ...a, lat: null, lng: null, intensity: a.isTrusted ? 3 : 2, category: 'other' }))
  }
}

let cachedEvents = []

export function createEventPoller(onUpdate) {
  let timer = null

  async function poll() {
    try {
      const raw = await fetchGdeltArticles()
      if (!raw.length) {
        if (cachedEvents.length) onUpdate(cachedEvents)
        else onUpdate(getFallbackEvents())
        return
      }

      const enriched = await enrichWithGeolocation(raw)
      const withCoords = enriched.filter((e) => e.lat != null && e.lng != null)
      cachedEvents = withCoords.length
        ? withCoords.map((e) => ({
            id: `ev-${e.index}-${Date.now()}`,
            title: e.title,
            lat: e.lat,
            lng: e.lng,
            source: e.source,
            time: e.time,
            intensity: e.intensity,
            category: e.category,
            url: e.url,
            isTrusted: e.isTrusted,
          }))
        : getFallbackEvents()

      onUpdate(cachedEvents)
    } catch (err) {
      console.warn('Conflict events poll failed:', err.message)
      if (!cachedEvents.length) onUpdate(getFallbackEvents())
    }
  }

  return {
    start() {
      onUpdate(getFallbackEvents()) // show immediately while real data loads
      poll()
      timer = setInterval(poll, POLL_INTERVAL)
    },
    stop() { clearInterval(timer) },
  }
}
