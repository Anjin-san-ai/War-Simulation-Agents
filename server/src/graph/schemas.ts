import { z } from 'zod'
import { HAT_KEYS, type HatKey } from '../agents/hatPrompts.js'

export const HatKeyZ = z.enum(HAT_KEYS)

export const HatResultSchema = z.object({
  hat: HatKeyZ,
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  stats: z.record(z.string(), z.union([z.number(), z.string()])),
})

export const WarSimulationResultSchema = z.object({
  hats: z.array(HatResultSchema).length(6),
  consensus: z.string(),
  phases: z.array(
    z.object({
      name: z.string(),
      duration: z.string(),
      description: z.string(),
    }),
  ),
  risks: z.object({
    nuclearEscalation: z.number(),
    civilUnrest: z.number(),
    environmentalDamage: z.number(),
    cyberWarfare: z.number(),
    globalRecession: z.number(),
    refugeeCrisis: z.number(),
  }),
  winner: z.string(),
})

export type WarSimulationResult = z.infer<typeof WarSimulationResultSchema>
export type HatResult = z.infer<typeof HatResultSchema>

export function sortHatsByOrder(hats: HatResult[]): HatResult[] {
  const order = HAT_KEYS as readonly string[]
  return [...hats].sort((a, b) => order.indexOf(a.hat) - order.indexOf(b.hat))
}
