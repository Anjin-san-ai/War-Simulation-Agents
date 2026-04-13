const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
const AZURE_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
const API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2025-01-01-preview'

const WAR_SYSTEM_PROMPT = `You are a geopolitical war simulation engine that analyzes conflicts through Edward de Bono's Six Thinking Hats framework. Each hat provides a fundamentally different perspective on the same war scenario.

Return ONLY valid JSON with this exact structure:
{
  "hats": [
    {
      "hat": "white",
      "title": "Facts & Data",
      "summary": "2-3 sentences of pure factual analysis — numbers, verified capabilities, geography, logistics. No opinions or emotions.",
      "keyPoints": ["Factual point 1", "Factual point 2", "Factual point 3", "Factual point 4"],
      "stats": { "casualties": 45000, "gdpImpact": -6.2, "duration": "4-8 months", "costBillions": 320 }
    },
    {
      "hat": "red",
      "title": "Emotions & Human Cost",
      "summary": "2-3 sentences focused on emotional impact — civilian suffering, fear, morale, refugee trauma, public anger, national grief.",
      "keyPoints": ["Emotional/human point 1", "Point 2", "Point 3", "Point 4"],
      "stats": { "refugees": 2500000, "civilianCasualties": 18000, "moraleIndex": 35, "publicApproval": 42 }
    },
    {
      "hat": "black",
      "title": "Risks & Worst Case",
      "summary": "2-3 sentences on worst-case scenarios — escalation paths, nuclear risk, economic collapse, alliance fractures, unintended consequences.",
      "keyPoints": ["Risk point 1", "Point 2", "Point 3", "Point 4"],
      "stats": { "nuclearRisk": 18, "escalationRisk": 72, "economicCollapse": 45, "allianceFracture": 30 }
    },
    {
      "hat": "yellow",
      "title": "Optimism & Opportunities",
      "summary": "2-3 sentences on best-case outcomes — diplomatic breakthroughs, strategic gains, stronger alliances, deterrence established.",
      "keyPoints": ["Optimistic point 1", "Point 2", "Point 3", "Point 4"],
      "stats": { "peaceChance": 35, "deterrenceGain": 60, "allianceStrength": 75, "diplomaticLeverage": 55 }
    },
    {
      "hat": "green",
      "title": "Creative Alternatives",
      "summary": "2-3 sentences on unconventional paths — cyber-only warfare, economic siege, proxy conflicts, secret negotiations, technological disruption.",
      "keyPoints": ["Creative alternative 1", "Point 2", "Point 3", "Point 4"],
      "stats": { "cyberWarProbability": 80, "proxyConflict": 65, "economicWarfare": 70, "techDisruption": 55 }
    },
    {
      "hat": "blue",
      "title": "Strategic Overview",
      "summary": "2-3 sentences of meta-analysis — who controls the narrative, long-term geopolitical shifts, historical parallels, lessons learned.",
      "keyPoints": ["Strategic insight 1", "Point 2", "Point 3", "Point 4"],
      "stats": { "narrativeControl": 60, "geopoliticalShift": 75, "historicalPrecedent": "Similar to X conflict", "yearsToRecover": 8 }
    }
  ],
  "consensus": "2-3 paragraph synthesis combining all six perspectives into the most likely overall outcome.",
  "phases": [
    { "name": "Phase name", "duration": "e.g. Week 1-2", "description": "What happens in this phase" }
  ],
  "risks": {
    "nuclearEscalation": 15,
    "civilUnrest": 65,
    "environmentalDamage": 40,
    "cyberWarfare": 80,
    "globalRecession": 55,
    "refugeeCrisis": 70
  },
  "winner": "Country name or 'Stalemate' or 'Negotiated Peace'"
}

All percentage/index values are 0-100. GDP impacts are percentage changes (negative = decline). Be realistic and grounded in real geopolitical dynamics. Each hat MUST give a genuinely different perspective — not just rephrasing the same conclusion.`

function buildWarPrompt(attacker, defender, allies, enemies, filters) {
  const filterList = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ')

  return `Simulate a war scenario using Edward de Bono's Six Thinking Hats:

ATTACKER: ${attacker.name} (GDP: $${attacker.gdp}T, Military Rank: #${attacker.militaryRank}, Population: ${(attacker.population / 1e6).toFixed(0)}M, Nuclear: ${attacker.nuclear ? 'Yes' : 'No'})

DEFENDER: ${defender.name} (GDP: $${defender.gdp}T, Military Rank: #${defender.militaryRank}, Population: ${(defender.population / 1e6).toFixed(0)}M, Nuclear: ${defender.nuclear ? 'Yes' : 'No'})

ATTACKER ALLIES: ${allies.map((a) => a.name).join(', ') || 'None'}
DEFENDER ALLIES: ${enemies.map((e) => e.name).join(', ') || 'None'}

SCENARIO FOCUS: ${filterList || 'General warfare'}

Analyze this conflict through all 6 Thinking Hats. Each hat must provide a unique, genuinely different perspective. Include 3-5 conflict phases, risk percentages, and a consensus outcome.`
}

export async function simulateWar({ attacker, defender, allies, enemies, filters }) {
  if (!AZURE_ENDPOINT || !AZURE_KEY) {
    throw new Error('Azure OpenAI credentials not configured. Add VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_KEY to your .env file.')
  }

  const prompt = buildWarPrompt(attacker, defender, allies, enemies, filters)
  const url = `${AZURE_ENDPOINT}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': AZURE_KEY },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: WAR_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Azure OpenAI error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('No response from Azure OpenAI')

  return JSON.parse(content)
}

export const HAT_META = {
  white: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', label: 'Facts & Data', icon: 'W' },
  red: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'Emotions', icon: 'R' },
  black: { color: '#64748b', bg: 'rgba(30,41,59,0.4)', border: 'rgba(100,116,139,0.3)', label: 'Risks', icon: 'B' },
  yellow: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', label: 'Optimism', icon: 'Y' },
  green: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: 'Creative', icon: 'G' },
  blue: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', label: 'Strategy', icon: 'B' },
}
