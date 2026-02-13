import { NextRequest, NextResponse } from 'next/server'

// Webhook endpoint for external integrations (Zapier, n8n, Make, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, integrationId, data, webhookUrl, headers: customHeaders } = body

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'Webhook URL is required' },
        { status: 400 }
      )
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RevoForms-Webhook/1.0',
      ...customHeaders
    }

    // Add form metadata
    const payload = {
      event: 'form_submission',
      formId,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        _meta: {
          submittedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
          ip: (() => {
            const headersList = request.headers
            return headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || 'unknown'
          })()
        }
      }
    }

    // Send webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`)
    }

    // Log the integration
    console.log(`Webhook sent to ${webhookUrl} for form ${formId}`)

    return NextResponse.json({
      success: true,
      message: 'Webhook sent successfully',
      status: response.status
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Webhook verification endpoint for Zapier
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const intent = searchParams.get('intent')

  if (intent === 'verify') {
    // Return a simple verification response
    return NextResponse.json({
      service: 'RevoForms',
      status: 'active',
      timestamp: new Date().toISOString(),
      capabilities: [
        'webhook_submissions',
        'custom_fields',
        'file_uploads',
        'conditional_logic',
        'payment_processing'
      ]
    })
  }

  return NextResponse.json({
    message: 'RevoForms Integration API',
    version: '1.0.0',
    endpoints: {
      webhook: '/api/integrations/webhook',
      zapier: '/api/integrations/zapier',
      n8n: '/api/integrations/n8n'
    }
  })
}