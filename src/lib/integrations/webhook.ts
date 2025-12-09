/**
 * Webhook Integration
 * Send form data to any HTTP endpoint
 */

import type { 
  Integration, 
  IntegrationConfig, 
  IntegrationPayload, 
  IntegrationResult,
  ConfigSchema 
} from './core'
import { integrationRegistry } from './core'

export const webhookIntegration: Integration = {
  type: 'webhook',
  name: 'Webhook',
  description: 'Send form submissions to any HTTP endpoint',
  icon: '🔗',
  
  configSchema: {
    fields: [
      {
        key: 'url',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://your-server.com/webhook',
        helpText: 'The URL to send form data to'
      },
      {
        key: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        default: 'POST',
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' }
        ]
      },
      {
        key: 'headers',
        label: 'Custom Headers (JSON)',
        type: 'textarea',
        required: false,
        placeholder: '{"Authorization": "Bearer token"}',
        helpText: 'Optional custom headers in JSON format'
      },
      {
        key: 'secret',
        label: 'Webhook Secret',
        type: 'password',
        required: false,
        helpText: 'Optional secret for signature verification'
      },
      {
        key: 'retryOnFail',
        label: 'Retry on failure',
        type: 'checkbox',
        required: false,
        default: true
      }
    ]
  },
  
  async initialize(config: IntegrationConfig): Promise<void> {
    // Nothing to initialize for webhooks
  },
  
  async validate(config: IntegrationConfig): Promise<boolean> {
    const url = config.settings.url
    if (!url) return false
    
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
  
  async test(config: IntegrationConfig): Promise<IntegrationResult> {
    try {
      const response = await fetch(config.settings.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'RevoForms-Integration-Test'
        }
      })
      
      return {
        success: response.ok || response.status === 405, // 405 = method not allowed is OK for HEAD
        integrationId: config.id,
        message: `Webhook endpoint is reachable (status: ${response.status})`
      }
    } catch (error: any) {
      return {
        success: false,
        integrationId: config.id,
        error: `Failed to reach webhook: ${error.message}`
      }
    }
  },
  
  async send(payload: IntegrationPayload): Promise<IntegrationResult> {
    // This will be called from the server, getting config from somewhere
    // For now, return a placeholder
    return {
      success: true,
      integrationId: 'webhook',
      message: 'Webhook integration requires server-side execution'
    }
  }
}

/**
 * Server-side webhook sender
 * Call this from API routes
 */
export async function sendWebhook(
  config: IntegrationConfig,
  payload: IntegrationPayload,
  maxRetries: number = 3
): Promise<IntegrationResult> {
  const { url, method = 'POST', headers: headerJson, secret } = config.settings
  
  // Parse custom headers
  let customHeaders: Record<string, string> = {}
  if (headerJson) {
    try {
      customHeaders = JSON.parse(headerJson)
    } catch {
      // Invalid JSON, ignore
    }
  }
  
  // Build request body
  const body = JSON.stringify({
    event: payload.event,
    timestamp: payload.timestamp,
    form: {
      id: payload.formId,
      name: payload.formName
    },
    data: payload.data,
    metadata: payload.metadata
  })
  
  // Generate signature if secret is provided
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'RevoForms/1.0',
    'X-RevoForms-Event': payload.event,
    'X-RevoForms-Delivery': crypto.randomUUID(),
    ...customHeaders
  }
  
  if (secret) {
    // Create HMAC signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    headers['X-RevoForms-Signature'] = `sha256=${signatureHex}`
  }
  
  // Send with retry logic
  let lastError: Error | null = null
  const retryEnabled = config.settings.retryOnFail !== false
  const attempts = retryEnabled ? maxRetries : 1
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body
      })
      
      if (response.ok) {
        const responseData = await response.text()
        return {
          success: true,
          integrationId: config.id,
          message: `Webhook sent successfully (status: ${response.status})`,
          externalId: response.headers.get('X-Request-Id') || undefined
        }
      }
      
      // Non-OK response
      const errorText = await response.text()
      lastError = new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`)
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        break
      }
    } catch (error: any) {
      lastError = error
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < attempts) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  return {
    success: false,
    integrationId: config.id,
    error: lastError?.message || 'Unknown error'
  }
}

// Register the integration
integrationRegistry.register(webhookIntegration)
