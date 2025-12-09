import { NextRequest, NextResponse } from 'next/server'

// n8n-specific integration endpoints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data, workflowId } = body

    switch (action) {
      case 'createWebhook':
        // Create a webhook for n8n workflow
        return await createWebhook(data)

      case 'updateWebhook':
        // Update existing webhook
        return await updateWebhook(data)

      case 'deleteWebhook':
        // Delete webhook
        return await deleteWebhook(data)

      case 'testWorkflow':
        // Test workflow with sample data
        return await testWorkflow(data)

      case 'triggerWorkflow':
        // Trigger n8n workflow
        return await triggerWorkflow(data)

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('n8n integration error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function createWebhook(data: any) {
  const { workflowId, formId, n8nUrl, events, filters } = data

  // Generate webhook URL
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/n8n/webhook/${workflowId}`

  // Register webhook with n8n
  const webhookData = {
    name: `RevoForms - ${formId}`,
    path: `/revoforms/${formId}`,
    method: 'POST',
    events: events || ['form_submission'],
    filters: filters || {},
    isActive: true
  }

  // In production, make API call to n8n instance
  const n8nResponse = await fetch(`${n8nUrl}/rest/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    },
    body: JSON.stringify(webhookData)
  })

  if (!n8nResponse.ok) {
    throw new Error('Failed to create n8n webhook')
  }

  const webhook = await n8nResponse.json()

  return NextResponse.json({
    success: true,
    webhook: {
      ...webhook,
      webhookUrl
    },
    message: 'n8n webhook created successfully'
  })
}

async function updateWebhook(data: any) {
  const { webhookId, n8nUrl, updates } = data

  const n8nResponse = await fetch(`${n8nUrl}/rest/webhooks/${webhookId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    },
    body: JSON.stringify(updates)
  })

  if (!n8nResponse.ok) {
    throw new Error('Failed to update n8n webhook')
  }

  return NextResponse.json({
    success: true,
    message: 'n8n webhook updated successfully'
  })
}

async function deleteWebhook(data: any) {
  const { webhookId, n8nUrl } = data

  const n8nResponse = await fetch(`${n8nUrl}/rest/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    }
  })

  if (!n8nResponse.ok) {
    throw new Error('Failed to delete n8n webhook')
  }

  return NextResponse.json({
    success: true,
    message: 'n8n webhook deleted successfully'
  })
}

async function testWorkflow(data: any) {
  const { workflowId, n8nUrl, testData } = data

  const testPayload = {
    workflowId,
    data: testData || {
      formId: 'test_form',
      submission: {
        name: 'Test User',
        email: 'test@example.com',
        timestamp: new Date().toISOString()
      }
    }
  }

  const n8nResponse = await fetch(`${n8nUrl}/rest/workflows/${workflowId}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    },
    body: JSON.stringify(testPayload)
  })

  const result = await n8nResponse.json()

  return NextResponse.json({
    success: n8nResponse.ok,
    result,
    message: n8nResponse.ok ? 'Workflow test completed successfully' : 'Workflow test failed'
  })
}

async function triggerWorkflow(data: any) {
  const { workflowId, n8nUrl, formData, formId } = data

  const triggerData = {
    workflowId,
    data: {
      formId,
      submittedAt: new Date().toISOString(),
      formData,
      source: 'revoforms'
    }
  }

  const n8nResponse = await fetch(`${n8nUrl}/rest/workflows/${workflowId}/activate/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
      'X-RevoForms-Trigger': 'form_submission'
    },
    body: JSON.stringify(triggerData)
  })

  const result = await n8nResponse.json()

  return NextResponse.json({
    success: n8nResponse.ok,
    executionId: result.executionId,
    message: n8nResponse.ok ? 'Workflow triggered successfully' : 'Failed to trigger workflow'
  })
}

// n8n webhook handler
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params
  const body = await request.json()

  // Log incoming webhook from n8n
  console.log(`n8n webhook received for workflow ${workflowId}:`, body)

  // Process the webhook data
  // In production, update your database or trigger other actions

  return NextResponse.json({
    success: true,
    message: 'Webhook processed successfully'
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const n8nUrl = searchParams.get('n8n_url')

  // Check n8n connection
  if (n8nUrl) {
    try {
      const response = await fetch(`${n8nUrl}/rest/`, {
        headers: {
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`
        }
      })

      if (response.ok) {
        const info = await response.json()
        return NextResponse.json({
          connected: true,
          version: info.version,
          instanceType: info.instanceType
        })
      }
    } catch (error) {
      console.error('n8n connection test failed:', error)
    }
  }

  return NextResponse.json({
    connected: false,
    message: 'Could not connect to n8n instance'
  })
}