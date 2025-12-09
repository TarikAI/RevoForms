// Vision AI Provider Configuration
// Supports multiple vision models - Z.ai GLM-4V, OpenRouter GPT-4V, Claude Vision, etc.

export interface VisionProvider {
  name: string
  baseURL: string
  apiKey: string
  model: string
  supportsVision: boolean
}

export interface VisionAnalysisResult {
  success: boolean
  formStructure?: {
    title?: string
    description?: string
    fields: ExtractedField[]
    layout?: 'single-column' | 'two-column' | 'complex'
    styling?: {
      backgroundColor?: string
      primaryColor?: string
      fontFamily?: string
    }
  }
  rawText?: string
  confidence: number
  error?: string
}

export interface ExtractedField {
  label: string
  type: FieldTypeGuess
  required: boolean
  placeholder?: string
  options?: string[]
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
}

export type FieldTypeGuess = 
  | 'text' | 'email' | 'phone' | 'number' | 'date' | 'time'
  | 'textarea' | 'select' | 'radio' | 'checkbox' | 'signature'
  | 'file' | 'address' | 'name' | 'unknown'

// Get configured vision providers
export function getVisionProviders(): VisionProvider[] {
  const providers: VisionProvider[] = []

  // Z.ai GLM-4V (if available)
  if (process.env.ZAI_API_KEY) {
    providers.push({
      name: 'zai-vision',
      baseURL: process.env.ZAI_VISION_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
      model: process.env.ZAI_VISION_MODEL || 'glm-4v-plus',
      supportsVision: true,
    })
  }

  // OpenRouter (GPT-4 Vision, Claude Vision, etc.)
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: 'openrouter-vision',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_VISION_MODEL || 'openai/gpt-4o',
      supportsVision: true,
    })
  }

  // Direct OpenAI
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: 'openai-vision',
      baseURL: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o',
      supportsVision: true,
    })
  }

  // Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: 'claude-vision',
      baseURL: 'https://api.anthropic.com/v1',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-sonnet-4-20250514',
      supportsVision: true,
    })
  }

  return providers
}

// Vision analysis prompt for form extraction
export const VISION_FORM_ANALYSIS_PROMPT = `You are an expert form analyzer. Analyze this form image and extract its structure.

Return a JSON object with this exact structure:
{
  "title": "Form title if visible",
  "description": "Form description or purpose",
  "fields": [
    {
      "label": "Field label text",
      "type": "text|email|phone|number|date|time|textarea|select|radio|checkbox|signature|file|address|name|unknown",
      "required": true/false (look for * or "required" text),
      "placeholder": "Any placeholder text visible",
      "options": ["option1", "option2"] (for select/radio/checkbox only),
      "position": { "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100 } (percentage positions),
      "confidence": 0.0-1.0
    }
  ],
  "layout": "single-column|two-column|complex",
  "styling": {
    "backgroundColor": "#hex or color name",
    "primaryColor": "#hex for buttons/accents",
    "fontFamily": "detected font style"
  }
}

FIELD TYPE DETECTION RULES:
- Email: Contains "@" hint, "email" label
- Phone: Contains "phone", "tel", "mobile", phone format hints
- Date: Contains "date", "DOB", calendar icon, date format
- Textarea: Large multi-line input box
- Select: Dropdown arrow, "select", "choose"
- Radio: Circle options, single choice indicated
- Checkbox: Square boxes, multiple choice allowed
- Signature: "signature", "sign here", signature line
- Address: Multiple lines for street/city/zip
- Name: "name", "first name", "last name"

Be thorough - extract ALL visible fields. Return ONLY valid JSON.`
