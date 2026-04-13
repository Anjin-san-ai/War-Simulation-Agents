/** Mirrors client war scenario text (see project `src/ai/warSimulation.js` history) for all hat agents. */

export type CountryPayload = {
  name: string
  gdp: number
  militaryRank: number
  population: number
  nuclear?: boolean
  iso?: string
}

export type WarSimulationInput = {
  attacker: CountryPayload
  defender: CountryPayload
  allies: CountryPayload[]
  enemies: CountryPayload[]
  filters: Record<string, boolean>
}

export function buildScenarioString(input: WarSimulationInput): string {
  const filterList = Object.entries(input.filters)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ')

  const { attacker, defender, allies, enemies } = input

  return `Simulate a war scenario (Six Thinking Hats — your hat role is in the system message):

ATTACKER: ${attacker.name} (GDP: $${attacker.gdp}T, Military Rank: #${attacker.militaryRank}, Population: ${(attacker.population / 1e6).toFixed(0)}M, Nuclear: ${attacker.nuclear ? 'Yes' : 'No'})

DEFENDER: ${defender.name} (GDP: $${defender.gdp}T, Military Rank: #${defender.militaryRank}, Population: ${(defender.population / 1e6).toFixed(0)}M, Nuclear: ${defender.nuclear ? 'Yes' : 'No'})

ATTACKER ALLIES: ${allies.map((a) => a.name).join(', ') || 'None'}
DEFENDER ALLIES: ${enemies.map((e) => e.name).join(', ') || 'None'}

SCENARIO FOCUS: ${filterList || 'General warfare'}

Respond only with the JSON object for your hat as specified in the system message.`
}
