/**
 * War simulation runs on the Node + LangGraph server (six parallel hat LLM calls + finalize).
 * Configure Vite proxy to `/api` or set `VITE_WAR_API_URL` (e.g. http://localhost:3000).
 */
export { HAT_META } from './hatMeta.js'

function warApiUrl() {
  const base = import.meta.env.VITE_WAR_API_URL
  if (base) return `${String(base).replace(/\/$/, '')}/api/war-simulation`
  return '/api/war-simulation'
}

export async function simulateWar({ attacker, defender, allies, enemies, filters }) {
  const res = await fetch(warApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attacker, defender, allies, enemies, filters }),
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`War API invalid JSON (${res.status}): ${text.slice(0, 200)}`)
  }

  if (!res.ok) {
    throw new Error(data.error || `War API error ${res.status}`)
  }

  return data
}
