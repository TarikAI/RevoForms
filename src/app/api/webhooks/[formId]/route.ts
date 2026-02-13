import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Webhook configuration schema
const WebhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.enum(['form_submission', 'form_update', 'form_delete'])).default(['form_submission']),
  secret: z.string().min(8, 'Webhook secret must be at least 8 characters').optional(),
  active: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
})

// Mock webhook storage - replace with database
const webhooks: Map<string, any[]> = new Map()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const formWebhooks = webhooks.get(formId) || []

    // Return sanitized webhook configs (without secrets)
    const sanitizedWebhooks = formWebhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      headers: webhook.headers,
      createdAt: webhook.createdAt,
      lastTriggered: webhook.lastTriggered,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
    }))

    return NextResponse.json({
      success: true,
      webhooks: sanitizedWebhooks,
    })

  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const body = await request.json()
    const validatedData = WebhookSchema.parse(body)

    // Generate webhook ID and secret if not provided
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const secret = validatedData.secret || generateWebhookSecret()

    const webhook = {
      id: webhookId,
      formId,
      ...validatedData,
      secret,
      createdAt: new Date(),
      lastTriggered: null,
      successCount: 0,
      failureCount: 0,
    }

    // Store webhook (mock implementation)
    if (!webhooks.has(formId)) {
      webhooks.set(formId, [])
    }
    webhooks.get(formId)!.push(webhook)

    // Test webhook with a ping event
    await testWebhook(webhook)

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
      },
      message: 'Webhook created successfully',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook configuration',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('id')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = WebhookSchema.partial().parse(body)

    // Update webhook (mock implementation)
    const formWebhooks = webhooks.get(formId) || []
    const webhookIndex = formWebhooks.findIndex(w => w.id === webhookId)

    if (webhookIndex === -1) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }

    const updatedWebhook = {
      ...formWebhooks[webhookIndex],
      ...validatedData,
      updatedAt: new Date(),
    }

    formWebhooks[webhookIndex] = updatedWebhook
    webhooks.set(formId, formWebhooks)

    return NextResponse.json({
      success: true,
      webhook: {
        id: updatedWebhook.id,
        url: updatedWebhook.url,
        events: updatedWebhook.events,
        active: updatedWebhook.active,
      },
      message: 'Webhook updated successfully',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook configuration',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error updating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('id')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    // Delete webhook (mock implementation)
    const formWebhooks = webhooks.get(formId) || []
    const webhookIndex = formWebhooks.findIndex(w => w.id === webhookId)

    if (webhookIndex === -1) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }

    formWebhooks.splice(webhookIndex, 1)
    webhooks.set(formId, formWebhooks)

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    })

  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}

// Test webhook endpoint
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('id')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    // Find webhook
    const formWebhooks = webhooks.get(formId) || []
    const webhook = formWebhooks.find(w => w.id === webhookId)

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }

    // Test webhook
    const testResult = await testWebhook(webhook)

    return NextResponse.json({
      success: true,
      testResult,
      message: 'Webhook test completed',
    })

  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

async function testWebhook(webhook: any): Promise<any> {
  try {
    const payload = {
      event: 'ping',
      timestamp: new Date().toISOString(),
      formId: webhook.formId,
      webhookId: webhook.id,
      message: 'This is a test ping from RevoForms',
    }

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'RevoForms-Webhook/1.0',
      'X-RevoForms-Signature': generateSignature(JSON.stringify(payload), webhook.secret),
      ...webhook.headers,
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const success = response.ok

    // Update webhook stats
    const formWebhooks = webhooks.get(webhook.formId) || []
    const webhookIndex = formWebhooks.findIndex(w => w.id === webhook.id)
    if (webhookIndex !== -1) {
      formWebhooks[webhookIndex].lastTriggered = new Date()
      if (success) {
        formWebhooks[webhookIndex].successCount++
      } else {
        formWebhooks[webhookIndex].failureCount++
      }
    }

    return {
      success,
      status: response.status,
      statusText: response.statusText,
      responseTime: Date.now(),
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto')
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}