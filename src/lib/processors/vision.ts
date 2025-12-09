// ============================================
// VISION PROCESSOR
// Analyzes images using AI Vision models
// ============================================

import OpenAI from 'openai'
import { getAIProviders, getPrimaryProvider } from '../ai/providers'
import type { ExtractedField } from './pdf'

export interface VisionAnalysisResult {
  success: boolean
  formTitle: string
  description: string
  fields: ExtractedField[]
  layout: 'single-column' | 'two-column' | 'complex'
  suggestedTheme: string
  rawAnalysis: string
  error?: string
}

const VISION_PROMPT = `Analyze this form image and extract all form fields. Return a JSON response with:

{
  "formTitle": "Title of the form",
  "description": "Brief description of the form's purpose",
  "fields": [
    {
      "id": "unique_id",
      "name": "field_name",
      "type": "text|email|phone|textarea|select|radio|checkbox|date|signature|number",
      "label": "Human readable label",
      "required": true/false,
      "options": ["option1", "option2"] // for select/radio/checkbox
      "placeholder": "Placeholder text if visible"
    }
  ],
  "layout": "single-column|two-column|complex",
  "suggestedTheme": "modern-light|corporate|minimal|etc based on form style"
}

IMPORTANT RULES:
1. Detect ALL visible form fields including hidden labels
2. Infer field types from context (e.g., "Email" label = email type)
3. Mark fields with asterisk (*) as required
4. For dropdowns/radios, list visible options
5. Return ONLY valid JSON, no markdown or extra text`

export async function analyzeFormImage(
  imageBase64: string,
  mimeType: string = 'image/png'
): Promise<VisionAnalysisResult> {
  const providers = getAIProviders()
  const visionProvider = getPrimaryProvider(providers, 'vision')
  
  if (!visionProvider) {
    return {
      success: false,
      formTitle: '',
      description: '',
      fields: [],
      layout: 'single-column',
      suggestedTheme: 'modern-light',
      rawAnalysis: '',
      error: 'No vision provider configured'
    }
  }

  try {
    const client = new OpenAI({
      apiKey: visionProvider.apiKey,
      baseURL: visionProvider.baseURL,
    })

    // Build message based on provider
    let messages: any[] = []
    
    if (visionProvider.name === 'anthropic') {
      // Claude format
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: VISION_PROMPT }
        ]
      }]
    } else {
      // OpenAI/OpenRouter/Z.ai format
      messages = [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: VISION_PROMPT }
        ]
      }]
    }

    const response = await client.chat.completions.create({
      model: visionProvider.model,
      messages,
      max_tokens: 4096,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Parse JSON from response
    let parsed
    try {
      let cleaned = content.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
      parsed = JSON.parse(cleaned.trim())
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse vision response as JSON')
      }
    }

    return {
      success: true,
      formTitle: parsed.formTitle || 'Extracted Form',
      description: parsed.description || '',
      fields: (parsed.fields || []).map((f: any, i: number) => ({
        id: f.id || `field_${i}`,
        name: f.name || f.label?.toLowerCase().replace(/\s+/g, '_') || `field_${i}`,
        type: mapFieldType(f.type),
        label: f.label || `Field ${i + 1}`,
        required: f.required || false,
        options: f.options,
        page: 0
      })),
      layout: parsed.layout || 'single-column',
      suggestedTheme: parsed.suggestedTheme || 'modern-light',
      rawAnalysis: content
    }

  } catch (error: any) {
    console.error('Vision analysis error:', error)
    return {
      success: false,
      formTitle: '',
      description: '',
      fields: [],
      layout: 'single-column',
      suggestedTheme: 'modern-light',
      rawAnalysis: '',
      error: error.message || 'Vision analysis failed'
    }
  }
}

function mapFieldType(type: string): ExtractedField['type'] {
  const typeMap: Record<string, ExtractedField['type']> = {
    'text': 'text',
    'email': 'text',
    'phone': 'text',
    'tel': 'text',
    'textarea': 'text',
    'select': 'select',
    'dropdown': 'select',
    'radio': 'radio',
    'checkbox': 'checkbox',
    'date': 'date',
    'signature': 'signature',
    'number': 'text'
  }
  return typeMap[type?.toLowerCase()] || 'text'
}
