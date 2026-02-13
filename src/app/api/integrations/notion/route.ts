/**
 * Notion Integration API Route
 *
 * Adds form submissions to Notion databases
 * Supports field mapping and auto-detection of database properties
 */

import { NextRequest, NextResponse } from 'next/server'

interface NotionField {
  label: string
  value: any
  type: string
  notionPropertyId?: string
  notionPropertyType?: string
}

interface NotionIntegrationRequest {
  apiKey: string
  databaseId: string
  formName: string
  submissionId: string
  submittedAt: string
  fields: NotionField[]
  fieldMapping?: Record<string, string> // form field label -> Notion property ID
}

/**
 * Create a new page in Notion database
 */
export async function POST(request: NextRequest) {
  try {
    const body: NotionIntegrationRequest = await request.json()
    const {
      apiKey,
      databaseId,
      formName,
      submissionId,
      submittedAt,
      fields,
      fieldMapping = {},
    } = body

    if (!apiKey || !databaseId) {
      return NextResponse.json(
        { error: 'API key and database ID are required' },
        { status: 400 }
      )
    }

    // First, get the database schema to understand properties
    const databaseResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      }
    )

    if (!databaseResponse.ok) {
      const error = await databaseResponse.json()
      throw new Error(error.message || 'Failed to fetch Notion database')
    }

    const database = await databaseResponse.json()
    const properties = database.properties || {}

    // Build properties object for the new page
    const pageProperties: Record<string, any> = {}

    // Add metadata fields
    if (properties['Form Name']) {
      pageProperties['Form Name'] = formatNotionValue('title', formName, properties['Form Name'])
    }
    if (properties['Submission ID']) {
      pageProperties['Submission ID'] = formatNotionValue('rich_text', submissionId, properties['Submission ID'])
    }
    if (properties['Submitted At']) {
      pageProperties['Submitted At'] = formatNotionValue('date', submittedAt, properties['Submitted At'])
    }

    // Map form fields to Notion properties
    for (const field of fields) {
      const propertyId = fieldMapping[field.label] || findPropertyByLabel(properties, field.label)

      if (propertyId && properties[propertyId]) {
        const property = properties[propertyId]
        pageProperties[propertyId] = formatNotionValue(field.type, field.value, property)
      }
    }

    // Create the page
    const createResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: {
          type: 'database_id',
          database_id: databaseId,
        },
        properties: pageProperties,
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.message || 'Failed to create Notion page')
    }

    const page = await createResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Successfully added to Notion',
      pageId: page.id,
      pageUrl: page.url,
    })
  } catch (error) {
    console.error('[Notion Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to add to Notion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * List available databases
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get('apiKey')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Search for databases
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          value: 'database',
          property: 'object',
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Notion databases')
    }

    const data = await response.json()

    const databases = data.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || 'Untitled',
      description: db.description?.[0]?.plain_text || '',
    }))

    return NextResponse.json({
      databases,
    })
  } catch (error) {
    console.error('[Notion Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch databases',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get database properties for field mapping
 */
export async function PUT(request: NextRequest) {
  try {
    const { apiKey, databaseId } = await request.json()

    if (!apiKey || !databaseId) {
      return NextResponse.json(
        { error: 'API key and database ID are required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch database properties')
    }

    const database = await response.json()
    const properties = []

    for (const [key, prop] of Object.entries(database.properties || {})) {
      const propAny = prop as any
      properties.push({
        id: propAny.id,
        name: key,
        type: propAny.type,
        [propAny.type]: propAny[propAny.type],
      })
    }

    return NextResponse.json({
      databaseId,
      title: database.title?.[0]?.plain_text || 'Untitled',
      properties,
    })
  } catch (error) {
    console.error('[Notion Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch database properties',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Format value based on Notion property type
 */
function formatNotionValue(fieldType: string, value: any, property: any): any {
  const propType = property.type

  switch (propType) {
    case 'title':
      if (typeof value === 'string') {
        return {
          title: [
            {
              text: {
                content: value.substring(0, 2000), // Notion limit
              },
            },
          ],
        }
      }
      return { title: [] }

    case 'rich_text':
      if (typeof value === 'string') {
        return {
          rich_text: [
            {
              text: {
                content: value.substring(0, 2000),
              },
            },
          ],
        }
      }
      return { rich_text: [] }

    case 'number':
      const num = Number(value)
      return { number: isNaN(num) ? null : num }

    case 'select':
      if (property.select?.options && typeof value === 'string') {
        // Check if option exists
        const option = property.select.options.find((opt: any) =>
          opt.name.toLowerCase() === value.toLowerCase()
        )
        if (option) {
          return { select: { id: option.id } }
        }
        // Try to create new select option (will fail if not allowed)
        return { select: { name: value.substring(0, 100) } }
      }
      return {}

    case 'multi_select':
      const values = Array.isArray(value) ? value : [value]
      return {
        multi_select: values
          .filter((v: any) => v)
          .map((v: string) => ({
            name: String(v).substring(0, 100),
          })),
      }

    case 'checkbox':
      return {
        checkbox: Boolean(value) && value !== 'false' && value !== '0',
      }

    case 'date':
      if (value) {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return { date: { start: date.toISOString() } }
        }
      }
      return {}

    case 'email':
      if (typeof value === 'string' && value.includes('@')) {
        return { email: value }
      }
      return {}

    case 'phone':
      if (typeof value === 'string') {
        return { phone_number: value }
      }
      return {}

    case 'url':
      if (typeof value === 'string') {
        return { url: value }
      }
      return {}

    case 'files':
      if (typeof value === 'object' && value.url) {
        return {
          files: [
            {
              name: value.name || 'File',
              external: { url: value.url },
            },
          ],
        }
      }
      return {}

    default:
      // For unsupported types, try to convert to text
      if (typeof value === 'string') {
        return { rich_text: [{ text: { content: value } }] }
      }
      return {}
  }
}

/**
 * Find property ID by label (fuzzy matching)
 */
function findPropertyByLabel(properties: any, label: string): string | null {
  const normalizedLabel = label.toLowerCase().trim()

  // Exact match first
  for (const [key, prop] of Object.entries(properties)) {
    if (key.toLowerCase() === normalizedLabel) {
      return (prop as any).id
    }
  }

  // Fuzzy match (contains)
  for (const [key, prop] of Object.entries(properties)) {
    if (
      key.toLowerCase().includes(normalizedLabel) ||
      normalizedLabel.includes(key.toLowerCase())
    ) {
      return (prop as any).id
    }
  }

  return null
}
