import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'

// Validation schema for form submission
const SubmitFormSchema = z.object({
  data: z.record(z.any()),
  submittedAt: z.string().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  referrer: z.string().optional(),
})

// Database schema placeholder - replace with actual DB implementation
interface FormSubmission {
  id: string
  formId: string
  data: Record<string, any>
  submittedAt: Date
  userAgent?: string
  ip?: string
  referrer?: string
}

// Mock database - replace with real database (Drizzle ORM)
const submissions: FormSubmission[] = []

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const headersList = headers()

    // Get client information
    const userAgent = headersList.get('user-agent') || undefined
    const ip = headersList.get('x-forwarded-for') ||
              headersList.get('x-real-ip') ||
              request.ip ||
              undefined
    const referrer = headersList.get('referer') || undefined

    // Parse and validate request body
    const body = await request.json()
    const validatedData = SubmitFormSchema.parse({
      ...body,
      userAgent,
      ip,
      referrer,
    })

    // Create submission record
    const submission: FormSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formId,
      data: validatedData.data,
      submittedAt: new Date(validatedData.submittedAt || Date.now()),
      userAgent: validatedData.userAgent,
      ip: validatedData.ip,
      referrer: validatedData.referrer,
    }

    // Save to database (mock for now)
    submissions.push(submission)

    // Trigger webhook if configured
    await triggerWebhook(formId, submission)

    // Send email notifications if configured
    await sendEmailNotifications(formId, submission)

    // Save to Google Sheets if configured
    await saveToGoogleSheets(formId, submission)

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Form submitted successfully',
    })

  } catch (error) {
    console.error('Form submission error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid submission data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params

    // Get submissions for the form (mock implementation)
    const formSubmissions = submissions.filter(s => s.formId === formId)

    // Return submissions with sanitized data
    const sanitizedSubmissions = formSubmissions.map(({ ip, ...submission }) => submission)

    return NextResponse.json({
      success: true,
      submissions: sanitizedSubmissions,
      count: sanitizedSubmissions.length,
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Webhook integration
async function triggerWebhook(formId: string, submission: FormSubmission) {
  try {
    // Get webhook URL from database (mock implementation)
    const webhookUrl = `https://api.revoforms.com/webhook/${formId}`

    // Skip if no webhook configured
    if (!webhookUrl || webhookUrl.includes('form-id')) {
      return
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RevoForms-Webhook/1.0',
      },
      body: JSON.stringify({
        event: 'form_submission',
        formId,
        submissionId: submission.id,
        data: submission.data,
        submittedAt: submission.submittedAt.toISOString(),
      }),
    })

    if (!response.ok) {
      console.error('Webhook delivery failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Error triggering webhook:', error)
  }
}

// Email notification integration
async function sendEmailNotifications(formId: string, submission: FormSubmission) {
  try {
    // Get email configuration from database (mock implementation)
    const emailConfig = {
      enabled: true,
      recipients: ['admin@example.com'],
      subject: `New Form Submission: ${formId}`,
      from: 'noreply@revoforms.com',
    }

    if (!emailConfig.enabled || !emailConfig.recipients.length) {
      return
    }

    // Integrate with email service (Resend, SendGrid, etc.)
    const emailData = {
      from: emailConfig.from,
      to: emailConfig.recipients,
      subject: emailConfig.subject,
      html: generateEmailHtml(submission),
    }

    // Mock email sending - replace with actual email service

  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

// Google Sheets integration
async function saveToGoogleSheets(formId: string, submission: FormSubmission) {
  try {
    // Get Google Sheets configuration from database (mock implementation)
    const sheetsConfig = {
      enabled: false, // Would be true if configured
      spreadsheetId: 'your-spreadsheet-id',
      sheetName: 'Form Submissions',
    }

    if (!sheetsConfig.enabled) {
      return
    }

    // Prepare row data for Google Sheets
    const headers = ['Submission ID', 'Submitted At', ...Object.keys(submission.data)]
    const values = [
      submission.id,
      submission.submittedAt.toISOString(),
      ...Object.values(submission.data),
    ]

    // Mock Google Sheets API call - replace with actual implementation

  } catch (error) {
    console.error('Error saving to Google Sheets:', error)
  }
}

// Generate HTML for email notification
function generateEmailHtml(submission: FormSubmission): string {
  const dataRows = Object.entries(submission.data)
    .map(([key, value]) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
      </tr>
    `)
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Form Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Form Submission</h2>
      <p style="color: #666;">
        A new form has been submitted on ${submission.submittedAt.toLocaleString()}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Field</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Value</th>
          </tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
      <p style="margin-top: 20px; color: #999; font-size: 12px;">
        Submission ID: ${submission.id}
      </p>
    </body>
    </html>
  `
}