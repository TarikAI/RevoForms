import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { google } from 'googleapis'

// Google Sheets configuration schema
const SheetsConfigSchema = z.object({
  spreadsheetId: z.string().min(1, 'Spreadsheet ID is required'),
  sheetName: z.string().min(1, 'Sheet name is required'),
  credentials: z.object({
    client_email: z.string(),
    private_key: z.string(),
  }),
  headers: z.array(z.string()).optional(),
  appendMode: z.enum(['append', 'update']).default('append'),
})

// Mock Google Sheets configurations storage
const sheetsConfigs: Map<string, any> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'configure':
        return await configureGoogleSheets(data)
      case 'save':
        return await saveToSheet(data)
      case 'list':
        return await listSheets(data)
      case 'create':
        return await createSheet(data)
      case 'test':
        return await testSheetsConnection(data)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Google Sheets service error:', error)
    return NextResponse.json(
      { error: 'Google Sheets service error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Configure Google Sheets integration
async function configureGoogleSheets(data: any) {
  try {
    const validatedConfig = SheetsConfigSchema.parse(data)
    const configId = `sheets_${Date.now()}`

    // Store configuration
    sheetsConfigs.set(configId, {
      ...validatedConfig,
      id: configId,
      createdAt: new Date(),
    })

    // Test the connection
    const testResult = await testSheetsAccess(validatedConfig)

    return NextResponse.json({
      success: true,
      configId,
      testResult,
      message: 'Google Sheets configured successfully',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Google Sheets configuration',
          details: error.errors
        },
        { status: 400 }
      )
    }

    throw error
  }
}

// Save data to Google Sheets
async function saveToSheet(data: any) {
  try {
    const { configId, formData, formId, submissionId } = data

    const config = sheetsConfigs.get(configId)
    if (!config) {
      return NextResponse.json(
        { error: 'Google Sheets configuration not found' },
        { status: 404 }
      )
    }

    // Prepare data for Google Sheets
    const headers = config.headers || ['Timestamp', 'Form ID', 'Submission ID', ...Object.keys(formData)]
    const values = [
      new Date().toISOString(),
      formId,
      submissionId,
      ...Object.values(formData),
    ]

    // Get Google Sheets client
    const sheets = await getSheetsClient(config)

    // Check if sheet exists, create if it doesn't
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: `${config.sheetName}!A1:Z1`,
      })
    } catch (error) {
      // Sheet doesn't exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: config.sheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 50,
                  },
                },
              },
            },
          ],
        },
      })

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${config.sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      })
    }

    // Append data
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: `${config.sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    })

    return NextResponse.json({
      success: true,
      updates: result.data.updates,
      message: 'Data saved to Google Sheets successfully',
    })

  } catch (error) {
    console.error('Error saving to Google Sheets:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save to Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// List available sheets
async function listSheets(data: any) {
  try {
    const { configId } = data
    const config = sheetsConfigs.get(configId)

    if (!config) {
      return NextResponse.json(
        { error: 'Google Sheets configuration not found' },
        { status: 404 }
      )
    }

    const sheets = await getSheetsClient(config)
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
    })

    const sheetList = response.data.sheets?.map(sheet => ({
      name: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount,
    })) || []

    return NextResponse.json({
      success: true,
      sheets: sheetList,
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list sheets',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Create a new sheet
async function createSheet(data: any) {
  try {
    const { configId, sheetName, headers } = data
    const config = sheetsConfigs.get(configId)

    if (!config) {
      return NextResponse.json(
        { error: 'Google Sheets configuration not found' },
        { status: 404 }
      )
    }

    const sheets = await getSheetsClient(config)

    // Create new sheet
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 50,
                },
              },
            },
          },
        ],
      },
    })

    // Add headers if provided
    if (headers && headers.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      })
    }

    return NextResponse.json({
      success: true,
      sheetId: response.data.replies?.[0]?.addSheet?.properties?.sheetId,
      message: 'Sheet created successfully',
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create sheet',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Test Google Sheets connection
async function testSheetsConnection(data: any) {
  try {
    const config = data.configId ? sheetsConfigs.get(data.configId) : data

    if (!config) {
      return NextResponse.json(
        { error: 'Google Sheets configuration not found' },
        { status: 404 }
      )
    }

    const testResult = await testSheetsAccess(config)

    return NextResponse.json({
      success: true,
      testResult,
      message: 'Google Sheets connection test completed',
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get Google Sheets client
async function getSheetsClient(config: any) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.credentials.client_email,
      private_key: config.credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const authClient = await auth.getClient()
  return google.sheets({ version: 'v4', auth: authClient as any })
}

// Test access to Google Sheets
async function testSheetsAccess(config: any) {
  try {
    const sheets = await getSheetsClient(config)

    // Try to get spreadsheet info
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
      fields: 'properties.title,properties.locale',
    })

    // Try to access the specific sheet
    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${config.sheetName}!A1:Z1`,
    })

    return {
      connected: true,
      spreadsheetTitle: response.data.properties?.title,
      sheetExists: true,
      hasData: sheetResponse.data.values ? sheetResponse.data.values.length > 0 : false,
    }

  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
      sheetExists: false,
    }
  }
}

// OAuth flow for Google Sheets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'auth-url':
      return await getAuthUrl()
    case 'callback':
      return await handleAuthCallback(searchParams)
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function getAuthUrl() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-sheets?action=callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 }
    )
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/spreadsheets')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', Math.random().toString(36).substring(7))

  return NextResponse.json({
    success: true,
    authUrl: authUrl.toString(),
  })
}

async function handleAuthCallback(searchParams: URLSearchParams) {
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.json(
      { error: 'Authorization code not provided' },
      { status: 400 }
    )
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-sheets?action=callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenResponse.json()

  if (tokenResponse.ok) {
    // Store tokens securely (this is a mock implementation)
    // In production, store these in your database with proper encryption

    return NextResponse.json({
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
      message: 'Google Sheets authorization successful',
    })
  } else {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to exchange authorization code',
        details: tokens,
      },
      { status: 400 }
    )
  }
}