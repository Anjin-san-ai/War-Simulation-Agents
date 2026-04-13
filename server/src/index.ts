import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import type { AzureChatOpenAI } from '@langchain/openai'
import { createAzureChat } from './llm/azureChat.js'
import { registerWarSimulationRoute } from './routes/warSimulation.js'

const port = Number(process.env.PORT) || 3000

let model: AzureChatOpenAI | undefined
try {
  model = createAzureChat()
} catch (e) {
  console.warn('Azure OpenAI not configured:', e instanceof Error ? e.message : e)
}

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, azure: Boolean(model) })
})

if (model) {
  registerWarSimulationRoute(app, model)
} else {
  app.post('/api/war-simulation', (_req, res) => {
    res.status(503).json({
      error:
        'Server missing AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, or AZURE_OPENAI_DEPLOYMENT_NAME. Copy server/.env.example to server/.env.',
    })
  })
}

app.listen(port, () => {
  console.log(`World Command Center API listening on http://localhost:${port}`)
})
