/**
 * Storage Abstraction Layer
 * Currently uses localStorage, ready to switch to Supabase
 * 
 * Usage:
 * - import { storage } from '@/lib/storage'
 * - storage.forms.getAll()
 * - storage.responses.save(formId, data)
 */

// Check if we're on the server
const isServer = typeof window === 'undefined'

// Storage keys
const STORAGE_KEYS = {
  FORMS: 'revoforms-forms',
  RESPONSES: 'revoforms-responses',
  ANALYTICS: 'revoforms-analytics',
  INTEGRATIONS: 'revoforms-integrations',
  USER: 'revoforms-user',
}

// Types
export interface StoredForm {
  id: string
  name: string
  description?: string
  fields: any[]
  styling?: any
  settings?: any
  position: { x: number; y: number }
  size?: { width: number }
  published: boolean
  createdAt: string
  updatedAt: string
  userId?: string
}

export interface StoredResponse {
  id: string
  formId: string
  data: Record<string, any>
  metadata: {
    submittedAt: string
    userAgent?: string
    referrer?: string
    completionTime?: number
    isPartial: boolean
  }
  status: 'complete' | 'partial' | 'spam'
}

export interface StoredAnalytics {
  formId: string
  views: number
  starts: number
  completions: number
  lastUpdated: string
}

// Helper to safely parse JSON
function safeParseJSON<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}

// LocalStorage implementation
class LocalStorageProvider {
  private getItem(key: string): string | null {
    if (isServer) return null
    return localStorage.getItem(key)
  }

  private setItem(key: string, value: string): void {
    if (isServer) return
    localStorage.setItem(key, value)
  }

  private removeItem(key: string): void {
    if (isServer) return
    localStorage.removeItem(key)
  }

  // Forms
  getForms(): StoredForm[] {
    const data = this.getItem(STORAGE_KEYS.FORMS)
    const parsed = safeParseJSON<{ forms: StoredForm[] }>(data, { forms: [] })
    return parsed.forms || []
  }

  getFormById(id: string): StoredForm | null {
    const forms = this.getForms()
    return forms.find(f => f.id === id) || null
  }

  saveForm(form: StoredForm): void {
    const forms = this.getForms()
    const index = forms.findIndex(f => f.id === form.id)
    if (index >= 0) {
      forms[index] = { ...form, updatedAt: new Date().toISOString() }
    } else {
      forms.push({ ...form, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    this.setItem(STORAGE_KEYS.FORMS, JSON.stringify({ forms }))
  }

  deleteForm(id: string): void {
    const forms = this.getForms().filter(f => f.id !== id)
    this.setItem(STORAGE_KEYS.FORMS, JSON.stringify({ forms }))
  }

  publishForm(id: string, published: boolean): void {
    const form = this.getFormById(id)
    if (form) {
      this.saveForm({ ...form, published })
    }
  }

  // Responses
  getResponses(formId?: string): StoredResponse[] {
    const data = this.getItem(STORAGE_KEYS.RESPONSES)
    const parsed = safeParseJSON<{ responses: StoredResponse[] }>(data, { responses: [] })
    const responses = parsed.responses || []
    if (formId) {
      return responses.filter(r => r.formId === formId)
    }
    return responses
  }

  saveResponse(response: Omit<StoredResponse, 'id'>): string {
    const responses = this.getResponses()
    const id = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newResponse: StoredResponse = {
      ...response,
      id,
      metadata: {
        ...response.metadata,
        submittedAt: new Date().toISOString()
      }
    }
    responses.push(newResponse)
    this.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify({ responses }))
    
    // Update analytics
    this.incrementAnalytics(response.formId, response.status === 'complete' ? 'completions' : 'starts')
    
    return id
  }

  deleteResponse(id: string): void {
    const responses = this.getResponses().filter(r => r.id !== id)
    this.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify({ responses }))
  }

  clearResponses(formId: string): void {
    const responses = this.getResponses().filter(r => r.formId !== formId)
    this.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify({ responses }))
  }

  // Analytics
  getAnalytics(formId: string): StoredAnalytics {
    const data = this.getItem(STORAGE_KEYS.ANALYTICS)
    const parsed = safeParseJSON<{ analytics: Record<string, StoredAnalytics> }>(data, { analytics: {} })
    return parsed.analytics[formId] || {
      formId,
      views: 0,
      starts: 0,
      completions: 0,
      lastUpdated: new Date().toISOString()
    }
  }

  incrementAnalytics(formId: string, field: 'views' | 'starts' | 'completions'): void {
    const data = this.getItem(STORAGE_KEYS.ANALYTICS)
    const parsed = safeParseJSON<{ analytics: Record<string, StoredAnalytics> }>(data, { analytics: {} })
    
    if (!parsed.analytics[formId]) {
      parsed.analytics[formId] = {
        formId,
        views: 0,
        starts: 0,
        completions: 0,
        lastUpdated: new Date().toISOString()
      }
    }
    
    parsed.analytics[formId][field]++
    parsed.analytics[formId].lastUpdated = new Date().toISOString()
    
    this.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(parsed))
  }

  getAllAnalytics(): StoredAnalytics[] {
    const data = this.getItem(STORAGE_KEYS.ANALYTICS)
    const parsed = safeParseJSON<{ analytics: Record<string, StoredAnalytics> }>(data, { analytics: {} })
    return Object.values(parsed.analytics)
  }

  // Integrations
  getIntegrations(formId: string): any[] {
    const data = this.getItem(STORAGE_KEYS.INTEGRATIONS)
    const parsed = safeParseJSON<{ integrations: any[] }>(data, { integrations: [] })
    return (parsed.integrations || []).filter((i: any) => i.formId === formId)
  }

  saveIntegration(integration: any): void {
    const data = this.getItem(STORAGE_KEYS.INTEGRATIONS)
    const parsed = safeParseJSON<{ integrations: any[] }>(data, { integrations: [] })
    const integrations = parsed.integrations || []
    
    const index = integrations.findIndex((i: any) => i.id === integration.id)
    if (index >= 0) {
      integrations[index] = integration
    } else {
      integrations.push({ ...integration, id: integration.id || `int_${Date.now()}` })
    }
    
    this.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify({ integrations }))
  }

  deleteIntegration(id: string): void {
    const data = this.getItem(STORAGE_KEYS.INTEGRATIONS)
    const parsed = safeParseJSON<{ integrations: any[] }>(data, { integrations: [] })
    const integrations = (parsed.integrations || []).filter((i: any) => i.id !== id)
    this.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify({ integrations }))
  }
}

// Supabase implementation (placeholder for future)
class SupabaseProvider {
  private supabase: any = null

  constructor() {
    // Will be initialized when Supabase is configured
  }

  get isConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  // Placeholder methods - will implement when Supabase is ready
  async getForms(): Promise<StoredForm[]> {
    // TODO: Implement with Supabase
    return []
  }

  async saveForm(form: StoredForm): Promise<void> {
    // TODO: Implement with Supabase
  }

  async getResponses(formId?: string): Promise<StoredResponse[]> {
    // TODO: Implement with Supabase
    return []
  }

  async saveResponse(response: Omit<StoredResponse, 'id'>): Promise<string> {
    // TODO: Implement with Supabase
    return ''
  }
}

// Export singleton instance
const localStorageProvider = new LocalStorageProvider()
const supabaseProvider = new SupabaseProvider()

// Use Supabase if configured, otherwise localStorage
export const storage = {
  forms: {
    getAll: () => localStorageProvider.getForms(),
    getById: (id: string) => localStorageProvider.getFormById(id),
    save: (form: StoredForm) => localStorageProvider.saveForm(form),
    delete: (id: string) => localStorageProvider.deleteForm(id),
    publish: (id: string, published: boolean) => localStorageProvider.publishForm(id, published),
  },
  responses: {
    getAll: (formId?: string) => localStorageProvider.getResponses(formId),
    save: (response: Omit<StoredResponse, 'id'>) => localStorageProvider.saveResponse(response),
    delete: (id: string) => localStorageProvider.deleteResponse(id),
    clear: (formId: string) => localStorageProvider.clearResponses(formId),
  },
  analytics: {
    get: (formId: string) => localStorageProvider.getAnalytics(formId),
    getAll: () => localStorageProvider.getAllAnalytics(),
    increment: (formId: string, field: 'views' | 'starts' | 'completions') => 
      localStorageProvider.incrementAnalytics(formId, field),
  },
  integrations: {
    getAll: (formId: string) => localStorageProvider.getIntegrations(formId),
    save: (integration: any) => localStorageProvider.saveIntegration(integration),
    delete: (id: string) => localStorageProvider.deleteIntegration(id),
  },
  // Check if using Supabase
  isUsingSupabase: () => supabaseProvider.isConfigured,
}

export default storage
