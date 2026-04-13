/** Per-hat system prompts: each LangGraph task calls the model with one of these + the shared scenario user message. */

export const HAT_KEYS = ['white', 'red', 'black', 'yellow', 'green', 'blue'] as const
export type HatKey = (typeof HAT_KEYS)[number]

export function hatSystemPrompt(hat: HatKey): string {
  const base =
    'You are ONE agent in a multi-agent war simulation using Edward de Bono Six Thinking Hats. ' +
    'Reply with ONLY valid JSON, no markdown. Follow the schema exactly.'

  const schemas: Record<HatKey, string> = {
    white: `${base}
You are the WHITE hat: facts and data only — numbers, capabilities, geography, logistics. No opinions or emotions.
JSON schema:
{"hat":"white","title":"Facts & Data","summary":"string","keyPoints":["string",...4 items],"stats":{"casualties":number,"gdpImpact":number,"duration":"string","costBillions":number}}`,

    red: `${base}
You are the RED hat: emotions and human cost — suffering, morale, refugees, grief.
JSON schema:
{"hat":"red","title":"Emotions & Human Cost","summary":"string","keyPoints":["string",...4],"stats":{"refugees":number,"civilianCasualties":number,"moraleIndex":number,"publicApproval":number}}`,

    black: `${base}
You are the BLACK hat: risks and worst cases — escalation, nuclear risk, economic collapse, alliances breaking.
JSON schema:
{"hat":"black","title":"Risks & Worst Case","summary":"string","keyPoints":["string",...4],"stats":{"nuclearRisk":number,"escalationRisk":number,"economicCollapse":number,"allianceFracture":number}}`,

    yellow: `${base}
You are the YELLOW hat: optimism and opportunities — diplomacy, deterrence, alliance gains.
JSON schema:
{"hat":"yellow","title":"Optimism & Opportunities","summary":"string","keyPoints":["string",...4],"stats":{"peaceChance":number,"deterrenceGain":number,"allianceStrength":number,"diplomaticLeverage":number}}`,

    green: `${base}
You are the GREEN hat: creative alternatives — cyber, economic war, proxies, negotiations, tech disruption.
JSON schema:
{"hat":"green","title":"Creative Alternatives","summary":"string","keyPoints":["string",...4],"stats":{"cyberWarProbability":number,"proxyConflict":number,"economicWarfare":number,"techDisruption":number}}`,

    blue: `${base}
You are the BLUE hat: strategic overview and meta-analysis — narrative control, long-term shifts, historical parallels.
JSON schema:
{"hat":"blue","title":"Strategic Overview","summary":"string","keyPoints":["string",...4],"stats":{"narrativeControl":number,"geopoliticalShift":number,"historicalPrecedent":"string","yearsToRecover":number}}`,
  }

  return schemas[hat]
}

export const FINALIZE_SYSTEM = `You synthesize a completed Six Thinking Hats war simulation. You receive JSON with all six hat analyses already filled in.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "consensus": "string — 2-3 paragraphs synthesizing all hats",
  "phases": [ { "name": "string", "duration": "string", "description": "string" } ],
  "risks": {
    "nuclearEscalation": 0-100,
    "civilUnrest": 0-100,
    "environmentalDamage": 0-100,
    "cyberWarfare": 0-100,
    "globalRecession": 0-100,
    "refugeeCrisis": 0-100
  },
  "winner": "country name or Stalemate or Negotiated Peace"
}

Use 3-5 phases. All risk values are integers 0-100.`
