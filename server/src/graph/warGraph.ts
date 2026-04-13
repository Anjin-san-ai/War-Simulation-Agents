/**
 * LangGraph workflow: six parallel `task` agents (one per Thinking Hat) + one `finalize` task.
 * Uses the functional API (`entrypoint` + `task`) so all six hats run concurrently and merge before synthesis.
 */
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { AzureChatOpenAI } from '@langchain/openai'
import { entrypoint } from '@langchain/langgraph'
import { FINALIZE_SYSTEM, HAT_KEYS, hatSystemPrompt, type HatKey } from '../agents/hatPrompts.js'
import { buildScenarioString, type WarSimulationInput } from './scenario.js'
import {
  HatResultSchema,
  type HatResult,
  type WarSimulationResult,
  WarSimulationResultSchema,
  sortHatsByOrder,
} from './schemas.js'

function normalizePhases(raw: unknown): WarSimulationResult['phases'] {
  if (!Array.isArray(raw)) return []
  return raw.map((p) => {
    if (!p || typeof p !== 'object') return { name: '', duration: '', description: '' }
    const o = p as Record<string, unknown>
    return {
      name: String(o.name ?? ''),
      duration: String(o.duration ?? ''),
      description: String(o.description ?? ''),
    }
  })
}

function parseJsonContent(content: unknown): unknown {
  if (typeof content === 'string') return JSON.parse(content)
  if (Array.isArray(content)) {
    const text = content.map((c) => (typeof c === 'object' && c && 'text' in c ? (c as { text: string }).text : '')).join('')
    return JSON.parse(text || '{}')
  }
  return JSON.parse(JSON.stringify(content))
}

const JSON_FORMAT_OPTS = {
  response_format: { type: 'json_object' as const },
}

async function invokeHatJson(
  model: AzureChatOpenAI,
  hat: HatKey,
  scenario: string,
): Promise<HatResult> {
  const system = hatSystemPrompt(hat)
  const res = await model.invoke(
    [new SystemMessage(system), new HumanMessage(scenario)],
    JSON_FORMAT_OPTS,
  )
  const raw = parseJsonContent(res.content)
  const parsed = HatResultSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Invalid JSON from hat ${hat}: ${parsed.error.message}`)
  }
  if (parsed.data.hat !== hat) {
    return { ...parsed.data, hat }
  }
  return parsed.data
}

async function invokeFinalizeJson(
  model: AzureChatOpenAI,
  scenario: string,
  hats: HatResult[],
): Promise<Pick<WarSimulationResult, 'consensus' | 'phases' | 'risks' | 'winner'>> {
  const payload = JSON.stringify({ scenario, hats }, null, 0)
  const res = await model.invoke(
    [new SystemMessage(FINALIZE_SYSTEM), new HumanMessage(payload)],
    JSON_FORMAT_OPTS,
  )
  const raw = parseJsonContent(res.content) as Record<string, unknown>
  const risksRaw = raw.risks as Record<string, number> | undefined
  return {
    consensus: String(raw.consensus ?? ''),
    phases: Array.isArray(raw.phases) ? raw.phases : [],
    risks: {
      nuclearEscalation: Number(risksRaw?.nuclearEscalation ?? 0),
      civilUnrest: Number(risksRaw?.civilUnrest ?? 0),
      environmentalDamage: Number(risksRaw?.environmentalDamage ?? 0),
      cyberWarfare: Number(risksRaw?.cyberWarfare ?? 0),
      globalRecession: Number(risksRaw?.globalRecession ?? 0),
      refugeeCrisis: Number(risksRaw?.refugeeCrisis ?? 0),
    },
    winner: String(raw.winner ?? 'Stalemate'),
  }
}

/**
 * Six Thinking Hat “agents” run in parallel (Promise.all). Each calls Azure with a distinct system prompt.
 * Wrapped in a LangGraph `entrypoint` so the workflow is a single compiled graph you can trace or extend.
 */
export function createWarSimulationGraph(model: AzureChatOpenAI) {
  return entrypoint('war_six_hats_parallel', async (input: WarSimulationInput) => {
    const scenario = buildScenarioString(input)

    const hatResults = await Promise.all(
      HAT_KEYS.map((h: HatKey) => invokeHatJson(model, h, scenario)),
    )

    const sorted = sortHatsByOrder(hatResults)
    const finalParts = await invokeFinalizeJson(model, scenario, sorted)

    const merged: WarSimulationResult = {
      hats: sorted,
      consensus: finalParts.consensus,
      phases: normalizePhases(finalParts.phases),
      risks: finalParts.risks,
      winner: finalParts.winner,
    }

    const checked = WarSimulationResultSchema.safeParse(merged)
    if (!checked.success) {
      throw new Error(`Final validation failed: ${checked.error.message}`)
    }
    return checked.data
  })
}

export async function runWarSimulation(
  model: AzureChatOpenAI,
  input: WarSimulationInput,
): Promise<WarSimulationResult> {
  const graph = createWarSimulationGraph(model)
  const out = await graph.invoke(input)
  return out as WarSimulationResult
}
