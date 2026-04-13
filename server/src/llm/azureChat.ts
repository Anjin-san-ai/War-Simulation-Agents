import { AzureChatOpenAI } from '@langchain/openai'

function azureEnv() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.VITE_AZURE_OPENAI_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.VITE_AZURE_OPENAI_ENDPOINT
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.VITE_AZURE_OPENAI_DEPLOYMENT
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION ||
    process.env.VITE_AZURE_OPENAI_API_VERSION ||
    '2024-12-01-preview'
  return { apiKey, endpoint, deployment, apiVersion }
}

export function createAzureChat(): AzureChatOpenAI {
  const { apiKey, endpoint, deployment, apiVersion } = azureEnv()

  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      'Missing Azure credentials: set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME (or VITE_AZURE_OPENAI_KEY / ENDPOINT / DEPLOYMENT in repo-root .env)',
    )
  }

  const endpointNorm = endpoint.replace(/\/$/, '')

  return new AzureChatOpenAI({
    azureOpenAIApiKey: apiKey,
    azureOpenAIEndpoint: endpointNorm,
    azureOpenAIApiDeploymentName: deployment,
    azureOpenAIApiVersion: apiVersion,
    model: deployment,
    temperature: 0.75,
    maxTokens: 4096,
  })
}
