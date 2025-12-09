/**
 * Advanced Form Generation System v2
 * Generates sophisticated multi-column, sectioned layouts
 */

export interface FormSection {
  id: string
  title?: string
  description?: string
  layout: 'single' | 'two-column' | 'three-column' | 'card' | 'wizard-step'
  backgroundColor?: string
  borderStyle?: 'none' | 'subtle' | 'solid' | 'gradient'
  fields: SectionField[]
  order: number
  collapsible?: boolean
  collapsed?: boolean
  icon?: string
  conditions?: SectionCondition[]
}

export interface SectionField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  helpText?: string
  validation?: FieldValidation
  column?: 1 | 2 | 3 // For multi-column layouts
  width?: 'quarter' | 'third' | 'half' | 'two-thirds' | 'three-quarters' | 'full'
  conditionalLogic?: ConditionalLogic
  options?: string[] // For select, radio, checkbox
  min?: number
  max?: number
  step?: number
  accept?: string // For file inputs
  rows?: number // For textarea
  prefix?: string // e.g., "$" for currency
  suffix?: string // e.g., "kg" for weight
}

export type FieldType = 
  | 'text' | 'email' | 'phone' | 'number' | 'currency'
  | 'date' | 'time' | 'datetime' | 'daterange'
  | 'select' | 'multiselect' | 'radio' | 'checkbox'
  | 'textarea' | 'richtext'
  | 'file' | 'image' | 'signature'
  | 'rating' | 'slider' | 'toggle'
  | 'address' | 'name' | 'country' | 'state'
  | 'divider' | 'heading' | 'paragraph' | 'html'

export interface FieldValidation {
  pattern?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  customMessage?: string
}

export interface ConditionalLogic {
  action: 'show' | 'hide' | 'require' | 'unrequire'
  operator: 'is' | 'is_not' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  targetField: string
  value?: string | number | boolean
}

export interface SectionCondition {
  action: 'show' | 'hide'
  rules: ConditionalLogic[]
  logicType: 'all' | 'any'
}

export interface AdvancedFormStructure {
  id: string
  name: string
  description: string
  sections: FormSection[]
  style: FormStyle
  settings: FormSettings
  metadata: FormMetadata
}

export interface FormStyle {
  theme: 'modern' | 'classic' | 'minimal' | 'glassmorphism' | 'corporate' | 'playful'
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  spacing: 'compact' | 'comfortable' | 'spacious'
  shadowStyle: 'none' | 'subtle' | 'medium' | 'dramatic'
  animation: 'none' | 'subtle' | 'smooth' | 'playful'
}

export interface FormSettings {
  submitButtonText: string
  submitButtonStyle: 'solid' | 'gradient' | 'outline'
  showProgressBar: boolean
  showFieldCount: boolean
  allowPartialSubmission: boolean
  confirmBeforeSubmit: boolean
  successMessage: string
  redirectUrl?: string
  notifyEmail?: string
  duplicatePrevention: 'none' | 'email' | 'ip' | 'fingerprint'
  responseLimit?: number
  startDate?: string
  endDate?: string
  requireLogin: boolean
}

export interface FormMetadata {
  createdAt: Date
  updatedAt: Date
  version: number
  tags: string[]
  category: string
  estimatedTime: number // in minutes
}

/**
 * Generate the AI prompt for sophisticated form layouts
 */
export function generateAdvancedFormPrompt(userRequest: string): string {
  return `You are an expert form designer creating a sophisticated, professional form layout.

USER REQUEST: ${userRequest}

Generate a JSON form structure with these requirements:

1. **SECTIONS**: Organize fields into logical sections (personal info, contact details, preferences, etc.)
2. **LAYOUT**: Use multi-column layouts where appropriate:
   - Contact info: Two columns (name + email side by side)
   - Address: Two columns (city + state, zip + country)
   - Preferences: Can be cards or toggles
3. **SMART FIELD TYPES**: Use appropriate types:
   - Names → 'name' type (splits into first/last automatically)
   - Emails → 'email' type with validation
   - Phones → 'phone' type with formatting
   - Dates → 'date' type with date picker
   - Long text → 'textarea' with appropriate rows
   - Yes/No → 'toggle' type
   - Rating → 'rating' type (1-5 stars)
   - Selections → 'select' or 'radio' depending on options count
4. **VISUAL HIERARCHY**: 
   - Use headings and dividers to separate sections
   - Add helpful descriptions and placeholders
   - Include help text for complex fields
5. **VALIDATION**: Add appropriate validation rules

Return ONLY valid JSON matching this structure:
{
  "name": "Form Title",
  "description": "Brief description",
  "sections": [
    {
      "id": "section_1",
      "title": "Section Title",
      "description": "Optional section description",
      "layout": "two-column",
      "fields": [
        {
          "id": "field_1",
          "type": "text",
          "label": "Field Label",
          "placeholder": "Placeholder text",
          "required": true,
          "column": 1,
          "width": "half"
        }
      ]
    }
  ],
  "style": {
    "theme": "glassmorphism",
    "primaryColor": "#06b6d4",
    "secondaryColor": "#a855f7",
    "borderRadius": "lg"
  },
  "settings": {
    "submitButtonText": "Submit",
    "showProgressBar": true
  }
}

Focus on creating a PROFESSIONAL, WELL-ORGANIZED layout that looks like it was designed by a UX expert.`
}

/**
 * Convert advanced form structure to the existing FormState structure
 */
export function convertToFormState(advanced: AdvancedFormStructure) {
  const fields: any[] = []
  let yPosition = 40
  
  for (const section of advanced.sections) {
    // Add section header
    if (section.title) {
      fields.push({
        id: `heading_${section.id}`,
        type: 'divider',
        label: section.title,
        required: false,
        position: { x: 20, y: yPosition },
        description: section.description || ''
      })
      yPosition += 50
    }
    
    // Calculate columns based on layout
    const columnCount = section.layout === 'three-column' ? 3 : 
                        section.layout === 'two-column' ? 2 : 1
    const columnWidth = (380 - 20) / columnCount // 380 = form width - padding
    
    let currentColumn = 0
    let rowStartY = yPosition
    let maxRowHeight = 0
    
    for (const field of section.fields) {
      const col = field.column ? field.column - 1 : currentColumn
      const xPos = 20 + (col * columnWidth)
      const fieldHeight = field.type === 'textarea' ? 100 : 60
      
      fields.push({
        id: field.id,
        type: mapFieldType(field.type),
        label: field.label,
        placeholder: field.placeholder || '',
        required: field.required,
        position: { x: xPos, y: rowStartY },
        helpText: field.helpText,
        options: field.options,
        validation: field.validation
      })
      
      maxRowHeight = Math.max(maxRowHeight, fieldHeight)
      currentColumn++
      
      // Move to next row if column is full
      if (currentColumn >= columnCount) {
        currentColumn = 0
        rowStartY += maxRowHeight + 15
        maxRowHeight = 0
      }
    }
    
    yPosition = rowStartY + maxRowHeight + 30
  }
  
  return {
    id: advanced.id,
    name: advanced.name,
    description: advanced.description,
    fields,
    style: {
      backgroundColor: advanced.style.backgroundColor || 'rgba(13, 13, 26, 0.85)',
      borderColor: advanced.style.primaryColor || '#06b6d4',
      textColor: advanced.style.textColor || '#ffffff',
      accentColor: advanced.style.accentColor || '#a855f7',
      fontFamily: advanced.style.fontFamily || "'Inter', sans-serif",
      borderRadius: advanced.style.borderRadius === 'full' ? '9999px' : '16px',
      formWidth: 420,
      formHeight: Math.max(500, yPosition + 80)
    }
  }
}

function mapFieldType(advancedType: FieldType): string {
  const mapping: Record<string, string> = {
    'name': 'text',
    'currency': 'number',
    'datetime': 'date',
    'daterange': 'date',
    'multiselect': 'select',
    'richtext': 'textarea',
    'image': 'file',
    'rating': 'text',
    'slider': 'number',
    'toggle': 'checkbox',
    'address': 'textarea',
    'country': 'select',
    'state': 'select',
    'heading': 'divider',
    'paragraph': 'divider',
    'html': 'divider'
  }
  return mapping[advancedType] || advancedType
}

/**
 * Example form templates with sophisticated layouts
 */
export const ADVANCED_TEMPLATES = {
  contactForm: {
    name: 'Professional Contact Form',
    sections: [
      {
        id: 'personal',
        title: 'Your Information',
        layout: 'two-column' as const,
        fields: [
          { id: 'firstName', type: 'text' as const, label: 'First Name', required: true, column: 1 as const, width: 'half' as const },
          { id: 'lastName', type: 'text' as const, label: 'Last Name', required: true, column: 2 as const, width: 'half' as const },
          { id: 'email', type: 'email' as const, label: 'Email Address', required: true, column: 1 as const, width: 'half' as const },
          { id: 'phone', type: 'phone' as const, label: 'Phone Number', required: false, column: 2 as const, width: 'half' as const }
        ]
      },
      {
        id: 'message',
        title: 'Your Message',
        layout: 'single' as const,
        fields: [
          { id: 'subject', type: 'text' as const, label: 'Subject', required: true, width: 'full' as const },
          { id: 'message', type: 'textarea' as const, label: 'Message', required: true, width: 'full' as const, rows: 5 }
        ]
      }
    ]
  },
  
  jobApplication: {
    name: 'Job Application Form',
    sections: [
      {
        id: 'personal',
        title: 'Personal Information',
        layout: 'two-column' as const,
        fields: [
          { id: 'fullName', type: 'text' as const, label: 'Full Name', required: true, column: 1 as const, width: 'half' as const },
          { id: 'email', type: 'email' as const, label: 'Email', required: true, column: 2 as const, width: 'half' as const },
          { id: 'phone', type: 'phone' as const, label: 'Phone', required: true, column: 1 as const, width: 'half' as const },
          { id: 'location', type: 'text' as const, label: 'Location', required: false, column: 2 as const, width: 'half' as const }
        ]
      },
      {
        id: 'professional',
        title: 'Professional Background',
        layout: 'single' as const,
        fields: [
          { id: 'position', type: 'text' as const, label: 'Position Applied For', required: true, width: 'full' as const },
          { id: 'experience', type: 'select' as const, label: 'Years of Experience', required: true, options: ['0-2', '3-5', '6-10', '10+'] },
          { id: 'resume', type: 'file' as const, label: 'Resume/CV', required: true, accept: '.pdf,.doc,.docx' },
          { id: 'coverLetter', type: 'textarea' as const, label: 'Cover Letter', required: false, rows: 6 }
        ]
      }
    ]
  },
  
  eventRegistration: {
    name: 'Event Registration',
    sections: [
      {
        id: 'attendee',
        title: 'Attendee Details',
        layout: 'two-column' as const,
        fields: [
          { id: 'name', type: 'text' as const, label: 'Full Name', required: true, column: 1 as const },
          { id: 'email', type: 'email' as const, label: 'Email', required: true, column: 2 as const },
          { id: 'company', type: 'text' as const, label: 'Company/Organization', required: false, column: 1 as const },
          { id: 'title', type: 'text' as const, label: 'Job Title', required: false, column: 2 as const }
        ]
      },
      {
        id: 'preferences',
        title: 'Event Preferences',
        layout: 'single' as const,
        fields: [
          { id: 'sessions', type: 'checkbox' as const, label: 'Select Sessions', required: true, 
            options: ['Keynote', 'Workshop A', 'Workshop B', 'Networking Lunch', 'Panel Discussion'] },
          { id: 'dietary', type: 'select' as const, label: 'Dietary Requirements', required: false,
            options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Other'] },
          { id: 'special', type: 'textarea' as const, label: 'Special Requirements', required: false, rows: 3 }
        ]
      }
    ]
  }
}
