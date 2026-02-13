/**
 * Slack Integration API Route
 *
 * Sends form submissions to Slack channels with rich formatting
 */

import { NextRequest, NextResponse } from 'next/server'

interface SlackField {
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file' | 'url'
  label: string
  value: any
  required?: boolean
}

interface SlackIntegrationRequest {
  webhookUrl: string
  formName: string
  formId: string
  submissionId: string
  submittedAt: string
  fields: SlackField[]
  message?: string
  channel?: string
  username?: string
  iconEmoji?: string
}

interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  fields?: Array<{
    type: string
    text: string
    emoji?: boolean
  }>
  accessory?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: SlackIntegrationRequest = await request.json()
    const {
      webhookUrl,
      formName,
      formId,
      submissionId,
      submittedAt,
      fields,
      message,
      channel,
      username = 'RevoForms',
      iconEmoji = ':page_facing_up:',
    } = body

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Slack webhook URL is required' },
        { status: 400 }
      )
    }

    // Build rich message with blocks
    const blocks: SlackBlock[] = []

    // Header with form name
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📋 New Form Submission: ${formName}`,
        emoji: true,
      },
    })

    // Custom message if provided
    if (message) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      })
    }

    // Submission details
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Form ID:*\n${formId}`,
        },
        {
          type: 'mrkdwn',
          text: `*Submission ID:*\n${submissionId}`,
        },
        {
          type: 'mrkdwn',
          text: `*Submitted:*\n${new Date(submittedAt).toLocaleString()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Total Fields:*\n${fields.length}`,
        },
      ],
    })

    // Divider
    blocks.push({ type: 'divider' })

    // Form fields
    for (const field of fields) {
      const fieldText = formatFieldValue(field)

      if (field.type === 'file' && field.value) {
        // Handle file uploads differently
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${field.label}*${field.required ? ' (Required)' : ''}`,
          },
          accessory: field.value.url ? {
            type: 'image',
            image_url: field.value.url,
            alt_text: field.label,
          } : undefined,
        })
      } else {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${field.label}*${field.required ? ' (Required)' : ''}\n${fieldText}`,
          },
        })
      }
    }

    // Divider
    blocks.push({ type: 'divider' })

    // View submission button (placeholder URL)
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `View full submission: ${process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.dev'}/forms/${formId}/submissions/${submissionId}`,
      },
    })

    // Send to Slack
    const slackPayload = {
      channel,
      username,
      icon_emoji: iconEmoji,
      blocks,
      text: `New submission for ${formName}`, // Fallback text for notifications
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Slack API error: ${errorText}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully sent to Slack',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Slack Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send to Slack',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Format field value for Slack display
 */
function formatFieldValue(field: SlackField): string {
  const { type, value } = field

  if (value === null || value === undefined || value === '') {
    return '_Empty_'
  }

  switch (type) {
    case 'checkbox':
      return value ? '✅ Yes' : '❌ No'

    case 'select':
      return `• ${value}`

    case 'email':
      return `<mailto:${value}|${value}>`

    case 'url':
      return `<${value}|${value.replace(/^https?:\/\//, '')}>`

    case 'date':
      return `📅 ${value}`

    case 'file':
      if (typeof value === 'object' && value.name) {
        return `📎 ${value.name} (${value.size || 'unknown size'})`
      }
      return '📎 File uploaded'

    case 'textarea':
      // Truncate long text
      const text = String(value)
      return text.length > 300 ? `${text.substring(0, 300)}...` : text

    case 'number':
      return `🔢 ${value}`

    default:
      return String(value)
  }
}

/**
 * Test connection endpoint
 */
export async function PUT(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      )
    }

    // Send test message
    const testPayload = {
      username: 'RevoForms',
      icon_emoji: ':white_check_mark:',
      text: '✅ Your Slack integration is working! This is a test message from RevoForms.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Integration Test Successful* ✅\n\nYour Slack webhook is configured correctly and form submissions will be sent to this channel.',
          },
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    if (!response.ok) {
      throw new Error(`Slack responded with ${response.status}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully',
    })
  } catch (error) {
    console.error('[Slack Integration] Test error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
