/**
 * HubSpot Integration API Route
 *
 * Creates contacts from form submissions
 */

import { NextRequest, NextResponse } from 'next/server'

interface HubSpotField {
  label: string
  value: any
  type: string
  hubspotProperty?: string
}

interface HubSpotIntegrationRequest {
  apiKey: string
  formName: string
  submissionId: string
  fields: HubSpotField[]
  fieldMapping?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body: HubSpotIntegrationRequest = await request.json()
    const { apiKey, formName, submissionId, fields, fieldMapping = {} } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Build contact properties
    const properties: Record<string, any> = {}

    // Standard HubSpot properties (auto-mapped)
    const standardMappings: Record<string, string> = {
      email: 'email',
      firstname: 'firstname',
      lastname: 'lastname',
      'first name': 'firstname',
      'last name': 'lastname',
      phone: 'phone',
      company: 'company',
      website: 'website',
      jobtitle: 'jobtitle',
      'job title': 'jobtitle',
    }

    for (const field of fields) {
      const propertyKey =
        fieldMapping[field.label] ||
        standardMappings[field.label.toLowerCase()] ||
        field.label.replace(/\s+/g, '').toLowerCase()

      properties[propertyKey] = formatHubSpotValue(field.value)
    }

    // Add metadata
    properties.revoforms_form_name = formName
    properties.revoforms_submission_id = submissionId

    // Create or update contact
    const email = properties.email
    const contactData: any = { properties }

    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts${email ? `/${email}` : ''}`,
      {
        method: email ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create HubSpot contact')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Successfully created HubSpot contact',
      contactId: result.id,
    })
  } catch (error) {
    console.error('[HubSpot Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create HubSpot contact',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function formatHubSpotValue(value: any): any {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value
  if (Array.isArray(value)) return value.join(', ')
  return String(value || '')
}
