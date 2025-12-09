/**
 * Email Integration
 * Send email notifications for form submissions
 */

import type { 
  Integration, 
  IntegrationConfig, 
  IntegrationPayload, 
  IntegrationResult 
} from './core'
import { integrationRegistry } from './core'

export const emailIntegration: Integration = {
  type: 'email',
  name: 'Email Notifications',
  description: 'Receive email notifications when forms are submitted',
  icon: '📧',
  
  configSchema: {
    fields: [
      {
        key: 'recipients',
        label: 'Recipient Emails',
        type: 'text',
        required: true,
        placeholder: 'email@example.com, another@example.com',
        helpText: 'Comma-separated list of email addresses'
      },
      {
        key: 'subject',
        label: 'Email Subject',
        type: 'text',
        required: false,
        default: 'New Form Submission: {{formName}}',
        helpText: 'Use {{formName}} and {{responseId}} as placeholders'
      },
      {
        key: 'includeAllFields',
        label: 'Include all form fields in email',
        type: 'checkbox',
        required: false,
        default: true
      },
      {
        key: 'replyTo',
        label: 'Reply-To Email',
        type: 'text',
        required: false,
        placeholder: 'Use {{email}} to use submitter\'s email',
        helpText: 'Optional reply-to address'
      },
      {
        key: 'sendConfirmation',
        label: 'Send confirmation to submitter',
        type: 'checkbox',
        required: false,
        default: false,
        helpText: 'Requires an email field in the form'
      }
    ]
  },
  
  async initialize(config: IntegrationConfig): Promise<void> {
    // Nothing to initialize
  },
  
  async validate(config: IntegrationConfig): Promise<boolean> {
    const { recipients } = config.settings
    if (!recipients) return false
    
    const emails = recipients.split(',').map((e: string) => e.trim())
    return emails.every((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  },
  
  async test(config: IntegrationConfig): Promise<IntegrationResult> {
    const isValid = await this.validate(config)
    return {
      success: isValid,
      integrationId: config.id,
      message: isValid 
        ? 'Email configuration is valid'
        : 'Invalid email addresses in recipients list'
    }
  },
  
  async send(payload: IntegrationPayload): Promise<IntegrationResult> {
    return {
      success: true,
      integrationId: 'email',
      message: 'Email integration requires server-side execution with SMTP'
    }
  }
}

/**
 * Generate email HTML template
 */
export function generateEmailHTML(
  config: IntegrationConfig,
  payload: IntegrationPayload
): string {
  const { formName, data, metadata } = payload
  
  const fieldRows = Object.entries(data)
    .map(([key, value]) => `
      <tr>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #666; font-weight: 500;">
          ${formatFieldLabel(key)}
        </td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #333;">
          ${formatFieldValue(value)}
        </td>
      </tr>
    `)
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Form Submission</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Form Submission</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${formName}</p>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      ${fieldRows}
    </table>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
      <p style="margin: 5px 0;">Submitted: ${new Date(payload.timestamp).toLocaleString()}</p>
      ${metadata.completionTime ? `<p style="margin: 5px 0;">Completion time: ${metadata.completionTime}s</p>` : ''}
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Powered by <a href="https://revoforms.dev" style="color: #06b6d4; text-decoration: none;">RevoForms</a></p>
  </div>
</body>
</html>
`
}

/**
 * Generate plain text email
 */
export function generateEmailText(
  config: IntegrationConfig,
  payload: IntegrationPayload
): string {
  const { formName, data, metadata } = payload
  
  let text = `New Form Submission: ${formName}\n`
  text += '='.repeat(50) + '\n\n'
  
  for (const [key, value] of Object.entries(data)) {
    text += `${formatFieldLabel(key)}: ${formatFieldValue(value)}\n`
  }
  
  text += '\n' + '-'.repeat(50) + '\n'
  text += `Submitted: ${new Date(payload.timestamp).toLocaleString()}\n`
  if (metadata.completionTime) {
    text += `Completion time: ${metadata.completionTime}s\n`
  }
  
  text += '\n--\nPowered by RevoForms (https://revoforms.dev)'
  
  return text
}

/**
 * Generate confirmation email for submitter
 */
export function generateConfirmationHTML(
  formName: string,
  submitterName?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">✓ Submission Received</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Hi${submitterName ? ` ${submitterName}` : ''},</p>
    <p>Thank you for your submission to <strong>${formName}</strong>. We have received your response and will be in touch if needed.</p>
    <p>Best regards,<br>The Team</p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Powered by <a href="https://revoforms.dev" style="color: #06b6d4;">RevoForms</a></p>
  </div>
</body>
</html>
`
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

function formatFieldValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

// Register the integration
integrationRegistry.register(emailIntegration)
