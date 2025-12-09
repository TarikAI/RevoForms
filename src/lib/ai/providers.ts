// ============================================
// AI PROVIDER CONFIGURATION
// Supports multiple providers with automatic fallback
// ============================================

export interface AIProviderConfig {
  name: string
  apiKey: string
  baseURL: string
  model: string
  supportsVision: boolean
  visionModel?: string
}

export interface AIProviders {
  text: AIProviderConfig[]
  vision: AIProviderConfig[]
  image: AIProviderConfig[]
}

export function getAIProviders(): AIProviders {
  const providers: AIProviders = { text: [], vision: [], image: [] }

  // Z.ai (Zhipu GLM) - Primary
  if (process.env.ZAI_API_KEY) {
    providers.text.push({
      name: 'zai',
      apiKey: process.env.ZAI_API_KEY,
      baseURL: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
      model: process.env.ZAI_MODEL || 'glm-4.6',
      supportsVision: true,
      visionModel: process.env.ZAI_VISION_MODEL || 'glm-4v-plus'
    })
  }

  // OpenRouter - Fallback
  if (process.env.OPENROUTER_API_KEY) {
    providers.text.push({
      name: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1:free',
      supportsVision: true,
      visionModel: process.env.OPENROUTER_VISION_MODEL || 'openai/gpt-4o'
    })
  }

  // OpenAI - Optional
  if (process.env.OPENAI_API_KEY) {
    providers.text.push({
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      supportsVision: true,
      visionModel: 'gpt-4o'
    })
  }

  // Anthropic Claude - Optional
  if (process.env.ANTHROPIC_API_KEY) {
    providers.text.push({
      name: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: 'https://api.anthropic.com/v1',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      supportsVision: true,
      visionModel: 'claude-3-5-sonnet-20241022'
    })
  }

  // Vision providers from text providers
  providers.vision = providers.text
    .filter(p => p.supportsVision)
    .map(p => ({ ...p, model: p.visionModel || p.model }))

  // NanoBanana - Image editing
  if (process.env.NANOBANANA_API_KEY) {
    providers.image.push({
      name: 'nanobanana',
      apiKey: process.env.NANOBANANA_API_KEY,
      baseURL: process.env.NANOBANANA_BASE_URL || 'https://api.nanobanana.com/v1',
      model: 'default',
      supportsVision: false
    })
  }

  return providers
}

export function getPrimaryProvider(
  providers: AIProviders, 
  category: 'text' | 'vision' | 'image'
): AIProviderConfig | null {
  return providers[category][0] || null
}

export function hasCapability(providers: AIProviders, capability: 'text' | 'vision' | 'image'): boolean {
  return providers[capability].length > 0
}
