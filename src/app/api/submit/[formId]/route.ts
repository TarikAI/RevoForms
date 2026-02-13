import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'

// Submission validation schema
const SubmissionSchema = z.object({
  data: z.record(z.any()),
  metadata: z.object({
    completionTime: z.number().optional(),
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
  }).optional(),
  isPartial: z.boolean().optional(),
  resumeToken: z.string().optional(),
})

interface SubmissionMetadata {
  submittedAt: string
  userAgent?: string
  referrer?: string
  completionTime?: number
  isPartial?: boolean
  ip?: string
  resumeToken?: string
}

// In-memory storage for server (will be replaced by database)
// This persists for the lifetime of the server process
const serverResponseStore = new Map<string, any[]>()
const serverAnalytics = new Map<string, { views: number; starts: number; completions: number }>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const headersList = await headers()

    // Get client information
    const userAgent = headersList.get('user-agent') || undefined
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : headersList.get('x-real-ip') || 'unknown'
    const referrer = headersList.get('referer') || undefined

    // Parse and validate request body
    const body = await request.json()
    const validatedData = SubmissionSchema.parse(body)

    // Generate submission ID
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create submission record
    const submission = {
      id: submissionId,
      formId,
      data: validatedData.data,
      metadata: {
        submittedAt: new Date().toISOString(),
        userAgent: validatedData.metadata?.userAgent || userAgent,
        referrer: validatedData.metadata?.referrer || referrer,
        completionTime: validatedData.metadata?.completionTime,
        isPartial: validatedData.isPartial || false,
        ip,
      } as SubmissionMetadata,
      status: validatedData.isPartial ? 'partial' : 'complete',
    }

    // Store in server memory
    const existingResponses = serverResponseStore.get(formId) || []
    
    // Handle resume token for partial submissions
    if (validatedData.resumeToken) {
      const partialIndex = existingResponses.findIndex(
        (r: any) => r.metadata.resumeToken === validatedData.resumeToken && r.status === 'partial'
      )
      if (partialIndex >= 0) {
        existingResponses[partialIndex] = {
          ...existingResponses[partialIndex],
          data: { ...existingResponses[partialIndex].data, ...validatedData.data },
          status: validatedData.isPartial ? 'partial' : 'complete',
          metadata: {
            ...existingResponses[partialIndex].metadata,
            submittedAt: new Date().toISOString(),
          }
        }
        serverResponseStore.set(formId, existingResponses)
        
        return NextResponse.json({
          success: true,
          submissionId: existingResponses[partialIndex].id,
          message: validatedData.isPartial ? 'Progress saved' : 'Form submitted successfully'
        })
      }
    }

    // Add resume token for partial submissions
    if (validatedData.isPartial) {
      ;(submission.metadata as SubmissionMetadata).resumeToken = `resume_${Math.random().toString(36).substr(2, 16)}`
    }

    existingResponses.push(submission)
    serverResponseStore.set(formId, existingResponses)

    // Update analytics
    const analytics = serverAnalytics.get(formId) || { views: 0, starts: 0, completions: 0 }
    if (validatedData.isPartial) {
      analytics.starts++
    } else {
      analytics.completions++
    }
    serverAnalytics.set(formId, analytics)

    // Process integrations asynchronously (webhooks, email, Google Sheets)
    processIntegrations(formId, submission).catch(console.error)

    // Return success response
    return NextResponse.json({
      success: true,
      submissionId,
      resumeToken: submission.metadata.resumeToken,
      message: validatedData.isPartial 
        ? 'Progress saved. Use resume token to continue later.' 
        : 'Form submitted successfully',
    })

  } catch (error) {
    console.error('Form submission error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid submission data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Your submission could not be processed. Please try again.',
      },
      { status: 500 }
    )
  }
}

// Get submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const includePartial = searchParams.get('includePartial') === 'true'

    // Get submissions
    let responses = serverResponseStore.get(formId) || []
    
    if (!includePartial) {
      responses = responses.filter((r: any) => r.status === 'complete')
    }

    // Sort by submission date (newest first)
    responses.sort((a: any, b: any) =>
      new Date(b.metadata.submittedAt).getTime() - new Date(a.metadata.submittedAt).getTime()
    )

    // Get analytics
    const analytics = serverAnalytics.get(formId) || { views: 0, starts: 0, completions: 0 }

    // Apply pagination
    const paginatedResponses = responses.slice(offset, offset + limit)

    // Sanitize responses (remove sensitive data)
    const sanitizedResponses = paginatedResponses.map(({ metadata, ...rest }: any) => ({
      ...rest,
      metadata: {
        submittedAt: metadata.submittedAt,
        completionTime: metadata.completionTime,
        isPartial: metadata.isPartial,
      }
    }))

    return NextResponse.json({
      success: true,
      responses: sanitizedResponses,
      analytics: {
        ...analytics,
        totalResponses: responses.length,
        conversionRate: analytics.starts > 0 
          ? Math.round((analytics.completions / analytics.starts) * 100) 
          : 0
      },
      pagination: {
        page,
        limit,
        total: responses.length,
        totalPages: Math.ceil(responses.length / limit),
      },
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// Process integrations asynchronously
async function processIntegrations(formId: string, submission: any) {
  try {
    // Get form configuration (in production, fetch from database)
    const formConfig = await getFormConfig(formId)

    // 1. Send webhook if configured
    if (formConfig.webhooks?.enabled && formConfig.webhooks?.url) {
      await sendWebhook(formConfig.webhooks.url, {
        event: 'form_submission',
        formId,
        submissionId: submission.id,
        data: submission.data,
        submittedAt: submission.metadata.submittedAt,
      })
    }

    // 2. Send email notification if configured
    if (formConfig.emailNotifications?.enabled && formConfig.emailNotifications?.recipients?.length > 0) {
      await sendEmailNotification(formConfig, submission)
    }

    // 3. Save to Google Sheets if configured
    if (formConfig.googleSheets?.enabled && formConfig.googleSheets?.spreadsheetId) {
      await saveToGoogleSheets(formConfig.googleSheets, submission)
    }

  } catch (error) {
    console.error('Error processing integrations:', error)
    // Don't fail the submission if integrations fail
  }
}

async function getFormConfig(formId: string) {
  // TODO: Fetch from database when Supabase is connected
  // For now, return default configuration
  return {
    id: formId,
    name: 'Form',
    webhooks: {
      enabled: false,
      url: null,
    },
    emailNotifications: {
      enabled: false,
      recipients: [],
    },
    googleSheets: {
      enabled: false,
      spreadsheetId: null,
      sheetName: null,
    },
  }
}

async function sendWebhook(url: string, data: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RevoForms-Webhook/1.0',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status}`)
    }
  } catch (error) {
    console.error('Webhook error:', error)
  }
}

async function sendEmailNotification(formConfig: any, submission: any) {
  try {
    // Format the submission data as HTML
    const dataRows = Object.entries(submission.data)
      .map(([key, value]) => `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${key}</td><td style="padding:8px;border:1px solid #ddd;">${value}</td></tr>`)
      .join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#06b6d4,#a855f7);padding:20px;border-radius:10px;text-align:center;">
          <h1 style="color:white;margin:0;">New Form Submission</h1>
          <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;">${formConfig.name}</p>
        </div>
        <div style="padding:20px;background:#f9f9f9;border-radius:10px;margin-top:20px;">
          <table style="width:100%;border-collapse:collapse;">
            ${dataRows}
          </table>
          <p style="color:#666;font-size:12px;margin-top:20px;">
            Submitted at: ${new Date(submission.metadata.submittedAt).toLocaleString()}<br>
            Submission ID: ${submission.id}
          </p>
        </div>
        <p style="text-align:center;color:#999;font-size:12px;margin-top:20px;">
          Powered by <a href="https://revoforms.dev" style="color:#06b6d4;">RevoForms</a>
        </p>
      </body>
      </html>
    `

    // Use the email API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        to: formConfig.emailNotifications.recipients,
        subject: `New submission: ${formConfig.name}`,
        html,
      }),
    })

    if (!response.ok) {
      console.error('Email notification failed')
    }
  } catch (error) {
    console.error('Email notification error:', error)
  }
}

async function saveToGoogleSheets(sheetsConfig: any, submission: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/google-sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        configId: sheetsConfig.configId,
        formId: submission.formId,
        submissionId: submission.id,
        formData: submission.data,
      }),
    })

    if (!response.ok) {
      console.error('Google Sheets save failed')
    }
  } catch (error) {
    console.error('Google Sheets error:', error)
  }
}
