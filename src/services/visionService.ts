/**
 * Vision Service - Flexible AI Vision Provider
 * Supports multiple providers: Z.ai, OpenRouter, OpenAI, etc.
 */

import type { VisionProvider, VisionAnalysisRequest, VisionAnalysisResponse } from '@/types/upload'

// Provider configurations
interface ProviderConfig {
  name: string
  apiKey: string
  baseUrl: string
  model: string
  supportsVision: boolean
}

class VisionService {
  private providers: Map<string, ProviderConfig> = new Map()
  private defaultProvider: string | null = null

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Z.ai Provider (check if vision is supported)
    if (process.env.ZAI_API_KEY) {
      this.providers.set('zai', {
        name: 'Z.ai',
        apiKey: process.env.ZAI_API_KEY,
        baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
        model: process.env.ZAI_VISION_MODEL || 'glm-4v-plus', // GLM-4V for vision
        supportsVision: true // Z.ai has GLM-4V models
      })
      this.defaultProvider = 'zai'
    }

    // OpenRouter Provider
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-3.5-sonnet',
        supportsVision: true
      })
      if (!this.defaultProvider) this.defaultProvider = 'openrouter'
    }

    // OpenAI Provider
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        supportsVision: true
      })
      if (!this.defaultProvider) this.defaultProvider = 'openai'
    }
  }

  /**
   * Get available vision providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, config]) => config.supportsVision)
      .map(([name]) => name)
  }

  /**
   * Analyze an image using AI vision
   */
  async analyze(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
    const providerName = request.provider || this.defaultProvider
    
    if (!providerName) {
      return {
        success: false,
        provider: 'none',
        error: 'No vision provider configured'
      }
    }

    const provider = this.providers.get(providerName)
    if (!provider) {
      return {
        success: false,
        provider: providerName,
        error: `Provider "${providerName}" not found`
      }
    }

    try {
      const result = await this.callProvider(provider, request.image, request.prompt)
      return {
        success: true,
        result,
        provider: providerName
      }
    } catch (error) {
      // Try fallback providers
      for (const [name, config] of this.providers.entries()) {
        if (name !== providerName && config.supportsVision) {
          try {
            const result = await this.callProvider(config, request.image, request.prompt)
            return {
              success: true,
              result,
              provider: name
            }
          } catch {
            continue
          }
        }
      }

      return {
        success: false,
        provider: providerName,
        error: error instanceof Error ? error.message : 'Vision analysis failed'
      }
    }
  }

  private async callProvider(
    provider: ProviderConfig,
    imageBase64: string,
    prompt: string
  ): Promise<string> {
    // Ensure image has proper data URL prefix
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/png;base64,${imageBase64}`

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]

    // Special handling for Z.ai
    if (provider.name === 'Z.ai') {
      return this.callZai(provider, imageUrl, prompt)
    }

    // Standard OpenAI-compatible API call
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        ...(provider.name === 'OpenRouter' && {
          'HTTP-Referer': 'https://revoforms.dev',
          'X-Title': 'RevoForms Vision'
        })
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Provider ${provider.name} error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private async callZai(
    provider: ProviderConfig,
    imageUrl: string,
    prompt: string
  ): Promise<string> {
    // Z.ai may have different API format for vision
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'Accept-Language': 'en-US,en'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: prompt }
            ]
          }
        ],
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Z.ai vision error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * Analyze a form image and extract field information
   */
  async analyzeForm(imageBase64: string): Promise<{
    success: boolean
    fields?: Array<{
      label: string
      type: string
      bounds?: { x: number; y: number; width: number; height: number }
      required?: boolean
      options?: string[]
    }>
    title?: string
    layout?: string
    error?: string
  }> {
    const prompt = `Analyze this form image and extract all form fields. Return a JSON object with:
{
  "title": "Form title if visible",
  "layout": "single-column" | "two-column" | "grid",
  "fields": [
    {
      "label": "Field label text",
      "type": "text|email|phone|number|textarea|select|radio|checkbox|date|signature|file",
      "required": true/false (look for * or "required" text),
      "options": ["option1", "option2"] (for select/radio/checkbox),
      "bounds": { "x": percentage, "y": percentage, "width": percentage, "height": percentage }
    }
  ]
}

Be thorough and extract ALL visible form fields. Return ONLY valid JSON, no markdown.`

    const response = await this.analyze({ image: imageBase64, prompt })
    
    if (!response.success) {
      return { success: false, error: response.error }
    }

    try {
      // Parse the JSON response
      let jsonStr = response.result || '{}'
      // Clean up potential markdown
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      }
      const parsed = JSON.parse(jsonStr.trim())
      
      return {
        success: true,
        title: parsed.title,
        layout: parsed.layout,
        fields: parsed.fields || []
      }
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse form analysis response'
      }
    }
  }
}

// Export singleton instance
export const visionService = new VisionService()
