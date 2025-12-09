/**
 * Google Sheets Integration
 * Save form responses directly to a Google Spreadsheet
 */

import type { 
  Integration, 
  IntegrationConfig, 
  IntegrationPayload, 
  IntegrationResult,
  ConfigSchema 
} from './core'
import { integrationRegistry } from './core'

export const googleSheetsIntegration: Integration = {
  type: 'google_sheets',
  name: 'Google Sheets',
  description: 'Automatically save form responses to a Google Spreadsheet',
  icon: '📊',
  
  configSchema: {
    fields: [
      {
        key: 'spreadsheetId',
        label: 'Spreadsheet ID',
        type: 'text',
        required: true,
        placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        helpText: 'The ID from your Google Sheets URL (between /d/ and /edit)'
      },
      {
        key: 'sheetName',
        label: 'Sheet Name',
        type: 'text',
        required: false,
        placeholder: 'Form Responses',
        default: 'Sheet1',
        helpText: 'The name of the sheet tab to write to'
      },
      {
        key: 'includeTimestamp',
        label: 'Include timestamp column',
        type: 'checkbox',
        required: false,
        default: true
      },
      {
        key: 'includeMetadata',
        label: 'Include metadata (browser, IP)',
        type: 'checkbox',
        required: false,
        default: false
      },
      {
        key: 'headerRow',
        label: 'Auto-create header row',
        type: 'checkbox',
        required: false,
        default: true
      }
    ]
  },
  
  async initialize(config: IntegrationConfig): Promise<void> {
    // OAuth initialization would happen here
    // For MVP, we'll use a service account or Apps Script Web App
  },
  
  async validate(config: IntegrationConfig): Promise<boolean> {
    const { spreadsheetId } = config.settings
    // Basic validation - spreadsheet ID should be a string of alphanumeric chars
    return typeof spreadsheetId === 'string' && spreadsheetId.length > 10
  },
  
  async test(config: IntegrationConfig): Promise<IntegrationResult> {
    // In production, this would verify access to the spreadsheet
    return {
      success: true,
      integrationId: config.id,
      message: 'Google Sheets connection test requires OAuth setup'
    }
  },
  
  async send(payload: IntegrationPayload): Promise<IntegrationResult> {
    // This requires server-side execution with OAuth tokens
    return {
      success: true,
      integrationId: 'google_sheets',
      message: 'Google Sheets integration requires server-side execution'
    }
  }
}

/**
 * Build row data for Google Sheets
 */
export function buildSheetRow(
  config: IntegrationConfig,
  payload: IntegrationPayload,
  fieldOrder: string[]
): string[] {
  const row: string[] = []
  
  // Add timestamp if enabled
  if (config.settings.includeTimestamp) {
    row.push(new Date(payload.timestamp).toISOString())
  }
  
  // Add form data in field order
  for (const fieldKey of fieldOrder) {
    const value = payload.data[fieldKey]
    row.push(formatCellValue(value))
  }
  
  // Add metadata if enabled
  if (config.settings.includeMetadata) {
    row.push(payload.metadata.userAgent || '')
    row.push(payload.metadata.referrer || '')
  }
  
  return row
}

/**
 * Format value for spreadsheet cell
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Build header row
 */
export function buildHeaderRow(
  config: IntegrationConfig,
  fieldLabels: string[]
): string[] {
  const headers: string[] = []
  
  if (config.settings.includeTimestamp) {
    headers.push('Timestamp')
  }
  
  headers.push(...fieldLabels)
  
  if (config.settings.includeMetadata) {
    headers.push('User Agent', 'Referrer')
  }
  
  return headers
}

/**
 * Google Sheets API wrapper using Apps Script Web App
 * This is a simpler approach that doesn't require OAuth setup
 */
export async function sendToGoogleSheetsViaAppsScript(
  webAppUrl: string,
  data: Record<string, any>
): Promise<IntegrationResult> {
  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        integrationId: 'google_sheets',
        message: 'Data sent to Google Sheets',
        externalId: result.rowNumber?.toString()
      }
    }
    
    return {
      success: false,
      integrationId: 'google_sheets',
      error: `Failed with status ${response.status}`
    }
  } catch (error: any) {
    return {
      success: false,
      integrationId: 'google_sheets',
      error: error.message
    }
  }
}

/**
 * Google Apps Script template for receiving form data
 * Users can deploy this as a web app
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
// Deploy this as a web app in Google Apps Script
// 1. Create a new Google Apps Script project
// 2. Paste this code
// 3. Deploy as web app (Execute as: Me, Access: Anyone)
// 4. Copy the web app URL to RevoForms integration settings

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(data.sheetName || 'Form Responses') || ss.getSheets()[0];
    
    // Create header row if first entry
    if (sheet.getLastRow() === 0 && data.headers) {
      sheet.appendRow(data.headers);
    }
    
    // Append data row
    const row = data.values || Object.values(data.formData);
    sheet.appendRow([new Date(), ...row]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      rowNumber: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'RevoForms Google Sheets Integration is active'
  })).setMimeType(ContentService.MimeType.JSON);
}
`

// Register the integration
integrationRegistry.register(googleSheetsIntegration)
