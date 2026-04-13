import type { Express, Request, Response } from 'express'
import { z } from 'zod'
import type { AzureChatOpenAI } from '@langchain/openai'
import { runWarSimulation } from '../graph/warGraph.js'

const CountrySchema = z.object({
  name: z.string(),
  gdp: z.number(),
  militaryRank: z.number(),
  population: z.number(),
  nuclear: z.boolean().optional(),
  iso: z.string().optional(),
})

const BodySchema = z.object({
  attacker: CountrySchema,
  defender: CountrySchema,
  allies: z.array(CountrySchema),
  enemies: z.array(CountrySchema),
  filters: z.record(z.string(), z.boolean()),
})

export function registerWarSimulationRoute(app: Express, model: AzureChatOpenAI) {
  app.post('/api/war-simulation', async (req: Request, res: Response) => {
    const parsed = BodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: `Invalid body: ${parsed.error.message}` })
      return
    }
    try {
      const result = await runWarSimulation(model, parsed.data)
      res.json(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ error: msg })
    }
  })
}
