import { NextRequest, NextResponse } from 'next/server'

// Zapier-specific integration endpoints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data, zapId } = body

    switch (action) {
      case 'subscribe':
        // Subscribe to form submissions
        return await handleSubscription(data)

      case 'unsubscribe':
        // Unsubscribe from form submissions
        return await handleUnsubscription(data)

      case 'test':
        // Test the Zapier connection
        return await handleTest(data)

      case 'trigger':
        // Trigger a Zap manually
        return await handleTrigger(data)

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Zapier integration error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleSubscription(data: any) {
  const { targetUrl, formId, fields, filters } = data

  // Store subscription (in production, use database)
  const subscription = {
    id: `zap_${Date.now()}`,
    service: 'zapier',
    targetUrl,
    formId,
    fields: fields || [],
    filters: filters || {},
    createdAt: new Date().toISOString(),
    active: true
  }

  // In production, save to database
  console.log('Zapier subscription created:', subscription)

  return NextResponse.json({
    success: true,
    subscription,
    message: 'Successfully subscribed to form submissions'
  })
}

async function handleUnsubscription(data: any) {
  const { subscriptionId } = data

  // Remove subscription (in production, update database)
  console.log(`Zapier subscription ${subscriptionId} deactivated`)

  return NextResponse.json({
    success: true,
    message: 'Successfully unsubscribed from form submissions'
  })
}

async function handleTest(data: any) {
  const { targetUrl } = data

  // Send test payload
  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    formId: 'test_form',
    data: {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test submission from RevoForms'
    }
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RevoForms-Event': 'test'
    },
    body: JSON.stringify(testPayload)
  })

  return NextResponse.json({
    success: response.ok,
    status: response.status,
    message: response.ok ? 'Test webhook sent successfully' : 'Test webhook failed'
  })
}

async function handleTrigger(data: any) {
  const { formId, formData, zapId } = data

  // Find active Zapier subscriptions for this form
  // In production, query database
  const subscriptions = [] // Would fetch from DB

  // Send to all matching subscriptions
  const results = await Promise.allSettled(
    subscriptions.map(async (sub: any) => {
      const payload = {
        event: 'form_submission',
        formId,
        zapId,
        timestamp: new Date().toISOString(),
        data: formData
      }

      return fetch(sub.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RevoForms-Event': 'form_submission',
          'X-RevoForms-Zap-Id': zapId
        },
        body: JSON.stringify(payload)
      })
    })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({
    success: true,
    triggered: successful,
    failed,
    total: subscriptions.length
  })
}

// Zapier authentication endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (code) {
    // Handle OAuth callback from Zapier
    // Exchange code for access token
    // In production, store tokens securely
    return NextResponse.json({
      success: true,
      message: 'Zapier authentication successful'
    })
  }

  // Return auth URL for initiating OAuth flow
  const authUrl = `https://zapier.com/oauth/authorize?client_id=${process.env.ZAPIER_CLIENT_ID}&response_type=code&scope=triggers:read,actions:write&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zapier`)}`

  return NextResponse.json({
    authUrl,
    message: 'Use this URL to authenticate with Zapier'
  })
}