/**
 * AI Provider Configuration
 * Supports multiple AI providers for text generation and vision
 * Configurable to use Z.ai, OpenRouter, OpenAI, Anthropic, etc.
 */

import OpenAI from 'openai'

export type AICapability = 'text' | 'vision' | 'embedding' | 'function-calling'

export interface AIProviderConfig {
  name: string
  client: OpenAI
  models: {
    text?: string
    vision?: string
    embedding?: string
  }
  capabilities: AICapability[]
  priority: number
}

export interface AIProviderOptions {
  apiKey: string
  baseURL: string
  models?: {
    text?: string
    vision?: string
  }
  headers?: Record<string, string>
}

// Provider factory functions
export function createZaiProvider(options: Partial<AIProviderOptions> = {}): AIProviderConfig | null {
  const apiKey = options.apiKey || process.env.ZAI_API_KEY
  if (!apiKey) return null

  return {
    name: 'zai',
    client: new OpenAI({
      apiKey,
      baseURL: options.baseURL || process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
      defaultHeaders: { 'Accept-Language': 'en-US,en', ...options.headers },
    }),
    models: {
      text: options.models?.text || process.env.ZAI_MODEL || 'glm-4.6',
      vision: options.models?.vision || process.env.ZAI_VISION_MODEL || 'glm-4v-plus',
    },
    capabilities: ['text', 'vision', 'function-calling'],
    priority: 1,
  }
}

export function createOpenRouterProvider(options: Partial<AIProviderOptions> = {}): AIProviderConfig | null {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  return {
    name: 'openrouter',
    client: new OpenAI({
      apiKey,
      baseURL: options.baseURL || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://revoforms.dev',
        'X-Title': 'RevoForms AI',
        ...options.headers,
      },
    }),
    models: {
      text: options.models?.text || process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1:free',
      vision: options.models?.vision || process.env.OPENROUTER_VISION_MODEL || 'openai/gpt-4o-mini',
    },
    capabilities: ['text', 'vision', 'function-calling'],
    priority: 2,
  }
}

export function createOpenAIProvider(options: Partial<AIProviderOptions> = {}): AIProviderConfig | null {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY
  if (!apiKey) return null

  return {
    name: 'openai',
    client: new OpenAI({ apiKey }),
    models: {
      text: options.models?.text || 'gpt-4o-mini',
      vision: options.models?.vision || 'gpt-4o',
    },
    capabilities: ['text', 'vision', 'embedding', 'function-calling'],
    priority: 3,
  }
}

export function createAnthropicProvider(options: Partial<AIProviderOptions> = {}): AIProviderConfig | null {
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  return {
    name: 'anthropic',
    client: new OpenAI({
      apiKey,
      baseURL: 'https://api.anthropic.com/v1',
      defaultHeaders: { 'anthropic-version': '2023-06-01' },
    }),
    models: {
      text: options.models?.text || 'claude-3-haiku-20240307',
      vision: options.models?.vision || 'claude-3-sonnet-20240229',
    },
    capabilities: ['text', 'vision'],
    priority: 4,
  }
}

// Get all configured providers sorted by priority
export function getAIProviders(capability: AICapability = 'text'): AIProviderConfig[] {
  const providers: (AIProviderConfig | null)[] = [
    createZaiProvider(),
    createOpenRouterProvider(),
    createOpenAIProvider(),
    createAnthropicProvider(),
  ]

  return providers
    .filter((p): p is AIProviderConfig => p !== null && p.capabilities.includes(capability))
    .sort((a, b) => a.priority - b.priority)
}

// AI completion with automatic fallback
export async function aiComplete(options: {
  messages: { role: 'system' | 'user' | 'assistant'; content: string | any[] }[]
  capability?: AICapability
  maxTokens?: number
  temperature?: number
}): Promise<{ content: string; provider: string }> {
  const { messages, capability = 'text', maxTokens = 2048, temperature = 0.7 } = options
  const providers = getAIProviders(capability)

  if (providers.length === 0) {
    throw new Error(`No AI providers configured for capability: ${capability}`)
  }

  let lastError: Error | null = null

  for (const provider of providers) {
    try {
      const model = capability === 'vision' ? provider.models.vision : provider.models.text
      if (!model) continue

      const completion = await provider.client.chat.completions.create({
        model,
        messages: messages as any,
        max_tokens: maxTokens,
        temperature,
      })

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('Empty response')

      return { content, provider: provider.name }

    } catch (error: any) {
      lastError = error
      continue
    }
  }

  throw lastError || new Error('All AI providers failed')
}

// Vision-specific completion for image analysis
export async function aiVisionAnalyze(options: {
  image: string | Buffer  // Base64 string or Buffer
  prompt: string
  systemPrompt?: string
}): Promise<{ content: string; provider: string }> {
  const { image, prompt, systemPrompt } = options
  
  // Convert Buffer to base64 if needed
  const imageBase64 = Buffer.isBuffer(image) ? image.toString('base64') : image
  const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`

  const messages: any[] = []
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: imageUrl } },
      { type: 'text', text: prompt }
    ]
  })

  return aiComplete({ messages, capability: 'vision' })
}
