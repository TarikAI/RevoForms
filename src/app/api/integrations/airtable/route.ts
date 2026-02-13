/**
 * Airtable Integration API Route
 *
 * Adds form submissions to Airtable bases
 */

import { NextRequest, NextResponse } from 'next/server'

interface AirtableField {
  label: string
  value: any
  type: string
  airtableColumnId?: string
}

interface AirtableIntegrationRequest {
  apiKey: string
  baseId: string
  tableId: string
  formName: string
  submissionId: string
  submittedAt: string
  fields: AirtableField[]
  fieldMapping?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body: AirtableIntegrationRequest = await request.json()
    const {
      apiKey,
      baseId,
      tableId,
      formName,
      submissionId,
      submittedAt,
      fields,
      fieldMapping = {},
    } = body

    if (!apiKey || !baseId || !tableId) {
      return NextResponse.json(
        { error: 'API key, base ID, and table ID are required' },
        { status: 400 }
      )
    }

    // Get table schema
    const tableResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    if (!tableResponse.ok) {
      throw new Error('Failed to fetch Airtable table schema')
    }

    const { tables } = await tableResponse.json()
    const table = tables.find((t: any) => t.id === tableId || t.name === tableId)

    if (!table) {
      throw new Error('Table not found')
    }

    // Build record data
    const fieldsData: Record<string, any> = {}

    // Add metadata
    fieldsData['Form Name'] = formName
    fieldsData['Submission ID'] = submissionId
    fieldsData['Submitted At'] = submittedAt

    // Map form fields
    for (const field of fields) {
      const columnId = fieldMapping[field.label] || findColumnByName(table.fields, field.label)
      if (columnId) {
        const columnSchema = table.fields.find((f: any) => f.id === columnId || f.name === columnId)
        fieldsData[columnId] = formatAirtableValue(field.type, field.value, columnSchema)
      }
    }

    // Create record
    const createResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${table.id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: fieldsData,
            },
          ],
        }),
      }
    )

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.error?.message || 'Failed to create Airtable record')
    }

    const result = await createResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Successfully added to Airtable',
      recordId: result.records[0].id,
    })
  } catch (error) {
    console.error('[Airtable Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to add to Airtable',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get('apiKey')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const basesResponse = await fetch('https://api.airtable.com/v0/meta/bases', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!basesResponse.ok) {
      throw new Error('Failed to fetch Airtable bases')
    }

    const { bases } = await basesResponse.json()

    return NextResponse.json({ bases })
  } catch (error) {
    console.error('[Airtable Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch bases',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function formatAirtableValue(fieldType: string, value: any, columnSchema: any): any {
  const columnType = columnSchema?.type

  switch (columnType) {
    case 'singleLineText':
    case 'multilineText':
      return String(value || '')

    case 'number':
      return Number(value) || 0

    case 'percent':
      return (Number(value) || 0) / 100

    case 'currency':
      return Number(value) || 0

    case 'singleSelect':
      return value || null

    case 'multipleSelects':
      return Array.isArray(value) ? value : [value].filter(Boolean)

    case 'checkbox':
      return Boolean(value)

    case 'date':
      return value || null

    case 'dateTime':
      return value || null

    case 'url':
      return value || null

    case 'email':
      return value || null

    case 'phone':
      return value || null

    case 'multipleRecordLinks':
      return Array.isArray(value) ? value : []

    case 'multipleAttachments':
      if (typeof value === 'object' && value.url) {
        return [{ url: value.url, filename: value.name || 'file' }]
      }
      return []

    default:
      return value
  }
}

function findColumnByName(fields: any[], label: string): string | null {
  const normalizedLabel = label.toLowerCase().trim()

  const exact = fields.find((f) => f.name.toLowerCase() === normalizedLabel)
  if (exact) return exact.name

  const fuzzy = fields.find((f) =>
    f.name.toLowerCase().includes(normalizedLabel) ||
    normalizedLabel.includes(f.name.toLowerCase())
  )
  return fuzzy?.name || null
}
