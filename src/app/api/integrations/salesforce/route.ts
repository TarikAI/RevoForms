/**
 * Salesforce Integration API Route
 *
 * Creates leads and contacts from form submissions
 */

import { NextRequest, NextResponse } from 'next/server'

interface SalesforceField {
  label: string
  value: any
  type: string
  salesforceField?: string
}

interface SalesforceIntegrationRequest {
  instanceUrl: string
  accessToken: string
  objectApiName: string // 'Lead' or 'Contact'
  formName: string
  submissionId: string
  fields: SalesforceField[]
  fieldMapping?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body: SalesforceIntegrationRequest = await request.json()
    const {
      instanceUrl,
      accessToken,
      objectApiName,
      formName,
      submissionId,
      fields,
      fieldMapping = {},
    } = body

    if (!instanceUrl || !accessToken || !objectApiName) {
      return NextResponse.json(
        { error: 'Instance URL, access token, and object API name are required' },
        { status: 400 }
      )
    }

    // Build record data
    const data: Record<string, any> = {}

    // Standard Salesforce field mappings
    const standardMappings: Record<string, string> = {
      email: 'Email',
      firstname: 'FirstName',
      lastname: 'LastName',
      'first name': 'FirstName',
      'last name': 'LastName',
      phone: 'Phone',
      mobilephone: 'MobilePhone',
      company: 'Company',
      website: 'Website',
      title: 'Title',
      'job title': 'Title',
      street: 'Street',
      city: 'City',
      state: 'State',
      postalcode: 'PostalCode',
      'postal code': 'PostalCode',
      country: 'Country',
      description: 'Description',
      leadsource: 'LeadSource',
      'lead source': 'LeadSource',
    }

    for (const field of fields) {
      const fieldName =
        fieldMapping[field.label] ||
        standardMappings[field.label.toLowerCase()] ||
        field.label.replace(/\s+/g, '').charAt(0).toUpperCase() +
          field.label.replace(/\s+/g, '').slice(1)

      data[fieldName] = formatSalesforceValue(field.value, field.type)
    }

    // Add metadata
    data.RevoForms_Form_Name__c = formName
    data.RevoForms_Submission_ID__c = submissionId
    data.LeadSource = 'RevoForms'

    // Create record
    const response = await fetch(
      `${instanceUrl}/services/data/v56.0/sobjects/${objectApiName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error[0]?.message || 'Failed to create Salesforce record')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: `Successfully created Salesforce ${objectApiName}`,
      recordId: result.id,
    })
  } catch (error) {
    console.error('[Salesforce Integration] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create Salesforce record',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function formatSalesforceValue(value: any, fieldType: string): any {
  if (value === null || value === undefined) return null
  if (fieldType === 'checkbox') return Boolean(value)
  if (fieldType === 'number') return Number(value)
  if (fieldType === 'date') return value
  if (fieldType === 'email') return String(value)
  return String(value)
}
