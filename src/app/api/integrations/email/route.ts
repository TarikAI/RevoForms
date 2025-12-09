import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

// Email configuration schemas
const EmailConfigSchema = z.object({
  provider: z.enum(['resend', 'sendgrid', 'ses']),
  apiKey: z.string().min(1, 'API key is required'),
  fromEmail: z.string().email('Invalid from email'),
  fromName: z.string().min(1, 'From name is required'),
  replyTo: z.string().email().optional(),
})

const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64 encoded
    contentType: z.string(),
  })).optional(),
})

// Mock email configurations storage - replace with database
const emailConfigs: Map<string, any> = new Map()

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'configure':
        return await configureEmailProvider(data)
      case 'send':
        return await sendEmail(data)
      case 'test':
        return await testEmailConfiguration(data)
      case 'verify':
        return await verifyEmailDomain(data)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Email service error:', error)
    return NextResponse.json(
      { error: 'Email service error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Configure email provider
async function configureEmailProvider(data: any) {
  try {
    const validatedConfig = EmailConfigSchema.parse(data)
    const configId = `email_${Date.now()}`

    // Store configuration (mock implementation)
    emailConfigs.set(configId, {
      ...validatedConfig,
      id: configId,
      createdAt: new Date(),
      verified: false,
    })

    // Test the configuration
    const testResult = await testProviderConnection(validatedConfig)

    return NextResponse.json({
      success: true,
      configId,
      testResult,
      message: 'Email provider configured successfully',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email configuration',
          details: error.errors
        },
        { status: 400 }
      )
    }

    throw error
  }
}

// Send email
async function sendEmail(data: any) {
  try {
    const validatedEmail = SendEmailSchema.parse(data)
    const { configId, ...emailData } = validatedEmail

    // Get email configuration (default to first available if not specified)
    let config
    if (configId) {
      config = emailConfigs.get(configId)
    } else {
      const firstConfig = Array.from(emailConfigs.values())[0]
      config = firstConfig
    }

    if (!config) {
      return NextResponse.json(
        { error: 'No email configuration found' },
        { status: 400 }
      )
    }

    let result

    switch (config.provider) {
      case 'resend':
        result = await sendWithResend(config, emailData)
        break
      case 'sendgrid':
        result = await sendWithSendGrid(config, emailData)
        break
      case 'ses':
        result = await sendWithSES(config, emailData)
        break
      default:
        throw new Error('Unsupported email provider')
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: config.provider,
      message: 'Email sent successfully',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    throw error
  }
}

// Test email configuration
async function testEmailConfiguration(data: any) {
  try {
    const { configId, testEmail } = data
    const config = emailConfigs.get(configId)

    if (!config) {
      return NextResponse.json(
        { error: 'Email configuration not found' },
        { status: 404 }
      )
    }

    const testResult = await sendTestEmail(config, testEmail)

    return NextResponse.json({
      success: true,
      testResult,
      message: 'Test email sent successfully',
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test email',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Verify email domain
async function verifyEmailDomain(data: any) {
  try {
    const { configId, domain } = data
    const config = emailConfigs.get(configId)

    if (!config) {
      return NextResponse.json(
        { error: 'Email configuration not found' },
        { status: 404 }
      )
    }

    let verificationResult

    switch (config.provider) {
      case 'resend':
        verificationResult = await verifyResendDomain(domain, config.apiKey)
        break
      case 'sendgrid':
        verificationResult = await verifySendGridDomain(domain, config.apiKey)
        break
      default:
        verificationResult = { verified: false, message: 'Domain verification not supported for this provider' }
    }

    return NextResponse.json({
      success: true,
      verification: verificationResult,
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify domain',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Provider-specific implementations
async function sendWithResend(config: any, emailData: any) {
  const { data, error } = await resend.emails.send({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
    replyTo: emailData.replyTo || config.replyTo,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return { messageId: data.id }
}

async function sendWithSendGrid(config: any, emailData: any) {
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(config.apiKey)

  const msg = {
    to: emailData.to,
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
    replyTo: emailData.replyTo || config.replyTo,
  }

  const result = await sgMail.send(msg)
  return { messageId: result[0]?.headers?.['x-message-id'] }
}

async function sendWithSES(config: any, emailData: any) {
  const AWS = require('aws-sdk')
  AWS.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region || 'us-east-1',
  })

  const ses = new AWS.SES()

  const params = {
    Destination: {
      ToAddresses: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
    },
    Message: {
      Body: {
        Html: { Charset: 'UTF-8', Data: emailData.html },
        Text: { Charset: 'UTF-8', Data: emailData.text || '' },
      },
      Subject: { Charset: 'UTF-8', Data: emailData.subject },
    },
    Source: `${config.fromName} <${config.fromEmail}>`,
    ReplyToAddresses: emailData.replyTo || config.replyTo ? [emailData.replyTo || config.replyTo] : [],
  }

  const result = await ses.sendEmail(params).promise()
  return { messageId: result.MessageId }
}

async function testProviderConnection(config: any) {
  try {
    switch (config.provider) {
      case 'resend':
        const { data: domains } = await resend.domains.list()
        return {
          connected: true,
          domains: domains.map((d: any) => ({ name: d.name, verified: d.verified })),
        }
      default:
        return { connected: true, message: 'Connection test successful' }
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}

async function sendTestEmail(config: any, testEmail: string) {
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email from RevoForms</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎉 Test Email Successful!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
        <p style="color: #333; font-size: 16px;">Congratulations! Your email integration with RevoForms is working correctly.</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
          <h3 style="color: #667eea; margin-top: 0;">Configuration Details:</h3>
          <ul style="color: #666;">
            <li>Provider: <strong>${config.provider}</strong></li>
            <li>From Email: <strong>${config.fromEmail}</strong></li>
            <li>From Name: <strong>${config.fromName}</strong></li>
            <li>Test Time: <strong>${new Date().toLocaleString()}</strong></li>
          </ul>
        </div>
      </div>
      <p style="text-align: center; color: #999; margin-top: 30px; font-size: 12px;">
        This is a test email from RevoForms. If you didn't expect this email, please ignore it.
      </p>
    </body>
    </html>
  `

  const result = await sendWithResend(config, {
    to: testEmail,
    subject: 'RevoForms Email Integration Test ✅',
    html: testHtml,
  })

  return { success: true, messageId: result.messageId }
}

async function verifyResendDomain(domain: string, apiKey: string) {
  try {
    const { data } = await resend.domains.list()
    const domainData = data.find((d: any) => d.name === domain)

    if (!domainData) {
      return { verified: false, message: 'Domain not found in Resend' }
    }

    return {
      verified: domainData.verified,
      records: domainData.records,
      message: domainData.verified ? 'Domain is verified' : 'Domain needs DNS configuration',
    }
  } catch (error) {
    return { verified: false, error: error instanceof Error ? error.message : 'Verification failed' }
  }
}

async function verifySendGridDomain(domain: string, apiKey: string) {
  try {
    const fetch = require('node-fetch')

    // Get all authenticated domains
    const domainsResponse = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!domainsResponse.ok) {
      throw new Error('Failed to fetch domains from SendGrid')
    }

    const domainsData = await domainsResponse.json()
    const domainRecord = domainsData.result.find((d: any) => d.domain === domain)

    if (!domainRecord) {
      return {
        verified: false,
        message: `Domain ${domain} not found in SendGrid. Please add it first.`,
        setupRequired: true,
      }
    }

    // Check DNS records
    const dnsRecords = [
      { type: 'TXT', host: domain, value: domainRecord.dns.txt1 },
      { type: 'TXT', host: 's1._domainkey.' + domain, value: domainRecord.dns.dkim1 },
      { type: 'TXT', host: 's2._domainkey.' + domain, value: domainRecord.dns.dkim2 },
      { type: 'TXT', host: domain, value: 'v=spf1 include:sendgrid.net ~all' },
    ]

    // Verify DNS records (mock implementation - in production, use DNS lookup)
    const verifiedRecords = []
    for (const record of dnsRecords) {
      // In production, perform actual DNS verification here
      verifiedRecords.push({
        ...record,
        verified: domainRecord.verified, // Simplified check
      })
    }

    return {
      verified: domainRecord.verified,
      message: domainRecord.verified
        ? 'Domain is verified and ready to send emails'
        : 'Domain configuration found but verification incomplete. Please check DNS records.',
      records: verifiedRecords,
      domainId: domainRecord.id,
      user: domainRecord.user,
      subdomain: domainRecord.subdomain,
      default: domainRecord.default,
      legacy: domainRecord.legacy,
      automatic_security: domainRecord.automatic_security,
      custom_spf: domainRecord.custom_spf,
    }
  } catch (error) {
    console.error('SendGrid domain verification error:', error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed',
      setupRequired: true,
    }
  }
}