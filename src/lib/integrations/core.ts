/**
 * RevoForms Integration Architecture
 * MCP-inspired modular integration system
 */

export type IntegrationType = 
  | 'google_sheets' 
  | 'airtable' 
  | 'notion'
  | 'webhook'
  | 'zapier'
  | 'n8n'
  | 'slack'
  | 'discord'
  | 'email'
  | 'stripe'

export type IntegrationEvent = 
  | 'form.submission'
  | 'form.partial'
  | 'form.abandoned'
  | 'form.viewed'
  | 'form.started'
  | 'response.updated'
  | 'response.deleted'

export interface IntegrationConfig {
  id: string
  type: IntegrationType
  name: string
  enabled: boolean
  formId: string
  credentials?: Record<string, string>
  settings: Record<string, any>
  events: IntegrationEvent[]
  createdAt: Date
  updatedAt: Date
  lastSyncAt?: Date
  errorCount: number
  lastError?: string
}

export interface IntegrationPayload {
  event: IntegrationEvent
  timestamp: Date
  formId: string
  formName: string
  data: Record<string, any>
  metadata: {
    responseId?: string
    userAgent?: string
    ip?: string
    referrer?: string
    completionTime?: number
  }
}

export interface IntegrationResult {
  success: boolean
  integrationId: string
  message?: string
  externalId?: string // ID in the external system
  error?: string
}

/**
 * Base Integration Interface
 * All integrations must implement this
 */
export interface Integration {
  type: IntegrationType
  name: string
  description: string
  icon: string
  configSchema: ConfigSchema
  
  // Lifecycle methods
  initialize(config: IntegrationConfig): Promise<void>
  validate(config: IntegrationConfig): Promise<boolean>
  test(config: IntegrationConfig): Promise<IntegrationResult>
  
  // Core methods
  send(payload: IntegrationPayload): Promise<IntegrationResult>
  
  // Optional methods
  getExternalData?(config: IntegrationConfig): Promise<any>
  sync?(config: IntegrationConfig): Promise<IntegrationResult>
}

export interface ConfigSchema {
  fields: ConfigField[]
}

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'url' | 'select' | 'checkbox' | 'textarea'
  required: boolean
  placeholder?: string
  helpText?: string
  options?: { value: string; label: string }[]
  default?: any
}

/**
 * Integration Registry
 */
class IntegrationRegistry {
  private integrations: Map<IntegrationType, Integration> = new Map()
  
  register(integration: Integration) {
    this.integrations.set(integration.type, integration)
  }
  
  get(type: IntegrationType): Integration | undefined {
    return this.integrations.get(type)
  }
  
  getAll(): Integration[] {
    return Array.from(this.integrations.values())
  }
  
  getAvailable(): { type: IntegrationType; name: string; description: string; icon: string }[] {
    return this.getAll().map(i => ({
      type: i.type,
      name: i.name,
      description: i.description,
      icon: i.icon
    }))
  }
}

export const integrationRegistry = new IntegrationRegistry()

/**
 * Integration Manager
 * Handles sending events to all configured integrations
 */
export class IntegrationManager {
  private configs: Map<string, IntegrationConfig> = new Map()
  
  addConfig(config: IntegrationConfig) {
    this.configs.set(config.id, config)
  }
  
  removeConfig(configId: string) {
    this.configs.delete(configId)
  }
  
  getConfigsForForm(formId: string): IntegrationConfig[] {
    return Array.from(this.configs.values()).filter(c => c.formId === formId && c.enabled)
  }
  
  async sendEvent(formId: string, payload: IntegrationPayload): Promise<IntegrationResult[]> {
    const configs = this.getConfigsForForm(formId)
    const results: IntegrationResult[] = []
    
    for (const config of configs) {
      // Check if this config is subscribed to this event
      if (!config.events.includes(payload.event)) continue
      
      const integration = integrationRegistry.get(config.type)
      if (!integration) {
        results.push({
          success: false,
          integrationId: config.id,
          error: `Integration type ${config.type} not found`
        })
        continue
      }
      
      try {
        const result = await integration.send(payload)
        results.push({ ...result, integrationId: config.id })
        
        // Update last sync time
        config.lastSyncAt = new Date()
        if (!result.success) {
          config.errorCount++
          config.lastError = result.error
        }
      } catch (error: any) {
        config.errorCount++
        config.lastError = error.message
        results.push({
          success: false,
          integrationId: config.id,
          error: error.message
        })
      }
    }
    
    return results
  }
}

export const integrationManager = new IntegrationManager()
