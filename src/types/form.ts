// Form field types - comprehensive list
export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'richtext'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'file_upload'  // Enhanced file upload with drag & drop
  | 'rating'
  | 'range'
  | 'signature'
  | 'matrix'  // Matrix/table field
  | 'daterange'  // Date range picker
  | 'color'
  | 'url'
  | 'password'
  | 'hidden'
  | 'divider'
  | 'heading'
  | 'paragraph'
  | 'html'
  | 'pagebreak'
  | 'country'
  | 'address'
  | 'name'
  | 'currency'
  | 'payment'  // Stripe payment field
  | 'calculation'  // Auto-calculation field

export interface FormFieldOption {
  label: string
  value: string
}

export type FormFieldOptions = (string | FormFieldOption)[]

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  message?: string
  allowedTypes?: string[]  // For file uploads
  maxFileSize?: number     // In MB
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: FormFieldOptions
  validation?: FieldValidation
  helpText?: string
  defaultValue?: string | number | boolean
  width?: 'full' | 'half' | 'third' | 'quarter' | 'custom'
  columnSpan?: number        // Number of columns to span (1-12)
  rowSpan?: number          // Number of rows to span
  conditionalLogic?: {
    enabled: boolean
    action: 'show' | 'hide'
    rules: {
      field: string
      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
      value: string
    }[]
    logic: 'and' | 'or'
  }
  // Type-specific properties
  rows?: number              // textarea
  maxStars?: number          // rating
  step?: number              // number, range
  accept?: string            // file, file_upload
  multiple?: boolean         // file, file_upload, select
  dateFormat?: string        // date
  timeFormat?: '12h' | '24h' // time
  currency?: string          // currency
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4'  // heading
  content?: string           // paragraph, html
  // File upload specific
  maxFileSize?: number       // in MB
  maxFiles?: number          // for multiple uploads
  storageProvider?: 'local' | 's3' | 'gcs' | 'cloudinary' | 'uploadcare'
  showPreview?: boolean      // show image preview
  dragDrop?: boolean         // enable drag & drop
  // Payment specific
  paymentType?: 'fixed' | 'variable' | 'subscription'
  amount?: number            // for fixed payments
  currency?: string          // payment currency
  billingInterval?: 'month' | 'year'  // for subscriptions
  // Matrix specific
  rows?: { id: string; label: string; required?: boolean }[]
  columns?: { id: string; label: string; value?: any; description?: string }[]
  matrixType?: 'radio' | 'checkbox' | 'rating' | 'text'
  allowMultiple?: boolean    // Allow multiple selections per row
  icons?: string[]          // For rating matrix
  // Date range specific
  showTime?: boolean        // Include time selection
  minDate?: string          // Minimum selectable date
  maxDate?: string          // Maximum selectable date
  format?: string           // Date format
  allowSameDate?: boolean   // Allow start and end to be same day
  defaultRange?: number     // Default range in days
  presets?: Array<{        // Quick selection presets
    label: string
    type: 'days' | 'weeks' | 'months' | 'years' | 'custom'
    value?: number
    start?: string
    end?: string
  }>
}

export interface FormSettings {
  submitButtonText: string
  successMessage: string
  redirectUrl?: string
  collectEmails: boolean
  limitResponses?: number
  closedMessage?: string
  multiStep?: boolean
  showProgressBar?: boolean
  saveProgress?: boolean
  // Layout settings
  layout?: {
    type: 'single' | 'multi-column' | 'grid'
    columns?: number         // Number of columns (1-12)
    gap?: string            // Gap between columns
    responsive?: {         // Responsive breakpoints
      mobile: number       // Columns on mobile
      tablet: number       // Columns on tablet
      desktop: number      // Columns on desktop
    }
    breakpoints?: {
      mobile: string       // Mobile breakpoint
      tablet: string       // Tablet breakpoint
    }
  }
  notification?: {
    enabled: boolean
    email: string
    subject?: string
  }
}

// Theme presets
export type ThemePreset = 
  | 'modern-dark'
  | 'modern-light'
  | 'minimal'
  | 'bold'
  | 'corporate'
  | 'playful'
  | 'glassmorphism'
  | 'neon'
  | 'nature'
  | 'ocean'
  | 'sunset'
  | 'custom'

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  error: string
  success: string
  accent: string
}

export interface FormStyling {
  theme: ThemePreset
  colors: ThemeColors
  fontFamily: string
  fontSize: {
    label: string
    input: string
    button: string
    heading: string
  }
  spacing: {
    fieldGap: string
    padding: string
  }
  borderRadius: {
    input: string
    button: string
    form: string
  }
  shadows: boolean
  animation: boolean
  customCSS?: string
}

export interface Form {
  id: string
  name: string
  description?: string
  fields: FormField[]
  settings: FormSettings
  styling: FormStyling
  createdAt: Date
  updatedAt: Date
}

export interface CanvasForm extends Form {
  position: { x: number; y: number }
  size?: { width: number; height: number | 'auto' }
}

// Export configuration
export type ExportPlatform = 
  | 'html'
  | 'react'
  | 'vue'
  | 'wordpress-gravity'
  | 'wordpress-wpforms'
  | 'wordpress-contact7'
  | 'wordpress-ninja'
  | 'wordpress-formidable'
  | 'elementor'
  | 'bricks'
  | 'json'

export interface ExportConfig {
  platform: ExportPlatform
  includeStyles: boolean
  includeValidation: boolean
  responsive: boolean
  customClassName?: string
}

// Default theme configurations
export const THEME_PRESETS: Record<ThemePreset, Omit<FormStyling, 'theme' | 'customCSS'>> = {
  'modern-dark': {
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#0f0f1a',
      surface: '#1a1a2e',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#27273a',
      error: '#ef4444',
      success: '#22c55e',
      accent: '#06b6d4'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '12px', button: '12px', form: '16px' },
    shadows: true,
    animation: true
  },
  'modern-light': {
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0',
      error: '#ef4444',
      success: '#22c55e',
      accent: '#06b6d4'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '12px', button: '12px', form: '16px' },
    shadows: true,
    animation: true
  },
  'minimal': {
    colors: {
      primary: '#18181b',
      secondary: '#3f3f46',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#18181b',
      textMuted: '#71717a',
      border: '#e4e4e7',
      error: '#dc2626',
      success: '#16a34a',
      accent: '#18181b'
    },
    fontFamily: 'system-ui, sans-serif',
    fontSize: { label: '13px', input: '15px', button: '15px', heading: '22px' },
    spacing: { fieldGap: '16px', padding: '20px' },
    borderRadius: { input: '6px', button: '6px', form: '8px' },
    shadows: false,
    animation: false
  },
  'bold': {
    colors: {
      primary: '#dc2626',
      secondary: '#f97316',
      background: '#18181b',
      surface: '#27272a',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#3f3f46',
      error: '#fbbf24',
      success: '#4ade80',
      accent: '#f97316'
    },
    fontFamily: 'Poppins, system-ui, sans-serif',
    fontSize: { label: '15px', input: '17px', button: '17px', heading: '28px' },
    spacing: { fieldGap: '24px', padding: '32px' },
    borderRadius: { input: '16px', button: '16px', form: '24px' },
    shadows: true,
    animation: true
  },
  'corporate': {
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#cbd5e1',
      error: '#dc2626',
      success: '#059669',
      accent: '#0284c7'
    },
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '18px', padding: '24px' },
    borderRadius: { input: '4px', button: '4px', form: '8px' },
    shadows: true,
    animation: false
  },
  'playful': {
    colors: {
      primary: '#ec4899',
      secondary: '#a855f7',
      background: '#fdf4ff',
      surface: '#ffffff',
      text: '#581c87',
      textMuted: '#9333ea',
      border: '#f0abfc',
      error: '#e11d48',
      success: '#10b981',
      accent: '#f472b6'
    },
    fontFamily: 'Nunito, Comic Sans MS, sans-serif',
    fontSize: { label: '15px', input: '16px', button: '17px', heading: '26px' },
    spacing: { fieldGap: '22px', padding: '28px' },
    borderRadius: { input: '20px', button: '24px', form: '24px' },
    shadows: true,
    animation: true
  },
  'glassmorphism': {
    colors: {
      primary: '#06b6d4',
      secondary: '#a855f7',
      background: 'rgba(15, 15, 26, 0.8)',
      surface: 'rgba(255, 255, 255, 0.05)',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(255, 255, 255, 0.1)',
      error: '#f87171',
      success: '#4ade80',
      accent: '#a855f7'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '12px', button: '12px', form: '20px' },
    shadows: true,
    animation: true
  },
  'neon': {
    colors: {
      primary: '#00ff88',
      secondary: '#00d4ff',
      background: '#0a0a0a',
      surface: '#111111',
      text: '#ffffff',
      textMuted: '#888888',
      border: '#00ff8833',
      error: '#ff3366',
      success: '#00ff88',
      accent: '#ff00ff'
    },
    fontFamily: 'Orbitron, monospace',
    fontSize: { label: '13px', input: '15px', button: '16px', heading: '26px' },
    spacing: { fieldGap: '20px', padding: '28px' },
    borderRadius: { input: '8px', button: '8px', form: '12px' },
    shadows: true,
    animation: true
  },
  'nature': {
    colors: {
      primary: '#22c55e',
      secondary: '#84cc16',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#14532d',
      textMuted: '#166534',
      border: '#bbf7d0',
      error: '#dc2626',
      success: '#15803d',
      accent: '#a3e635'
    },
    fontFamily: 'Lato, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '10px', button: '10px', form: '16px' },
    shadows: true,
    animation: true
  },
  'ocean': {
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0c4a6e',
      textMuted: '#0369a1',
      border: '#bae6fd',
      error: '#e11d48',
      success: '#059669',
      accent: '#38bdf8'
    },
    fontFamily: 'Open Sans, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '12px', button: '12px', form: '16px' },
    shadows: true,
    animation: true
  },
  'sunset': {
    colors: {
      primary: '#f97316',
      secondary: '#ef4444',
      background: '#fffbeb',
      surface: '#ffffff',
      text: '#78350f',
      textMuted: '#b45309',
      border: '#fed7aa',
      error: '#dc2626',
      success: '#16a34a',
      accent: '#fbbf24'
    },
    fontFamily: 'Montserrat, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '10px', button: '10px', form: '14px' },
    shadows: true,
    animation: true
  },
  'custom': {
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0',
      error: '#ef4444',
      success: '#22c55e',
      accent: '#06b6d4'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '12px', button: '12px', form: '16px' },
    shadows: true,
    animation: true
  }
}

// Helper to get default styling
export function getDefaultStyling(theme: ThemePreset = 'glassmorphism'): FormStyling {
  return {
    theme,
    ...THEME_PRESETS[theme]
  }
}
