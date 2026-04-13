import { AzureChatOpenAI } from '@langchain/openai'

export function createAzureChat(): AzureChatOpenAI {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview'

  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      'Missing AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, or AZURE_OPENAI_DEPLOYMENT_NAME',
    )
  }

  return new AzureChatOpenAI({
    azureOpenAIApiKey: apiKey,
    azureOpenAIEndpoint: endpoint.replace(/\/$/, ''),
    azureOpenAIApiDeploymentName: deployment,
    azureOpenAIApiVersion: apiVersion,
    temperature: 0.75,
    maxTokens: 4096,
  })
}
