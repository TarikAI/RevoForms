/**
 * Response Collection API
 * Handles form submissions, partial saves, and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// In-memory storage (replace with database in production)
// For MVP, we'll use localStorage on client + optional Google Sheets
const responseStore = new Map<string, FormResponse[]>()

export interface FormResponse {
  id: string
  formId: string
  data: Record<string, any>
  metadata: {
    submittedAt: Date
    userAgent: string
    referrer?: string
    ip?: string
    completionTime?: number // seconds
    isPartial: boolean
    resumeToken?: string
  }
  status: 'complete' | 'partial' | 'spam'
  analytics: {
    fieldTimes?: Record<string, number> // time spent on each field
    dropoffField?: string // last field before abandon
  }
}

export interface FormAnalytics {
  formId: string
  totalViews: number
  totalStarts: number
  totalCompletions: number
  totalAbandons: number
  averageCompletionTime: number
  fieldDropoffs: Record<string, number>
  conversionRate: number
}

// POST - Submit a response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, data, isPartial, resumeToken, fieldTimes, dropoffField } = body

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    // Check for duplicate submissions
    const existingResponses = responseStore.get(formId) || []
    
    // If resuming a partial submission
    if (resumeToken) {
      const partialIndex = existingResponses.findIndex(
        r => r.metadata.resumeToken === resumeToken && r.status === 'partial'
      )
      if (partialIndex >= 0) {
        existingResponses[partialIndex] = {
          ...existingResponses[partialIndex],
          data: { ...existingResponses[partialIndex].data, ...data },
          status: isPartial ? 'partial' : 'complete',
          metadata: {
            ...existingResponses[partialIndex].metadata,
            submittedAt: new Date(),
            isPartial: !!isPartial
          }
        }
        responseStore.set(formId, existingResponses)
        
        return NextResponse.json({
          success: true,
          responseId: existingResponses[partialIndex].id,
          resumeToken,
          message: isPartial ? 'Progress saved' : 'Form submitted successfully'
        })
      }
    }

    // Create new response
    const responseId = nanoid()
    const newResumeToken = isPartial ? nanoid(16) : undefined

    const newResponse: FormResponse = {
      id: responseId,
      formId,
      data,
      metadata: {
        submittedAt: new Date(),
        userAgent: request.headers.get('user-agent') || 'unknown',
        referrer: request.headers.get('referer') || undefined,
        isPartial: !!isPartial,
        resumeToken: newResumeToken
      },
      status: isPartial ? 'partial' : 'complete',
      analytics: {
        fieldTimes,
        dropoffField
      }
    }

    existingResponses.push(newResponse)
    responseStore.set(formId, existingResponses)

    return NextResponse.json({
      success: true,
      responseId,
      resumeToken: newResumeToken,
      message: isPartial ? 'Progress saved. Use resume token to continue later.' : 'Form submitted successfully'
    })

  } catch (error: any) {
    console.error('[Responses API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Retrieve responses for a form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const includePartial = searchParams.get('includePartial') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    let responses = responseStore.get(formId) || []
    
    if (!includePartial) {
      responses = responses.filter(r => r.status === 'complete')
    }

    // Calculate analytics
    const analytics: FormAnalytics = {
      formId,
      totalViews: responses.length + Math.floor(responses.length * 1.5), // Estimate
      totalStarts: responses.length,
      totalCompletions: responses.filter(r => r.status === 'complete').length,
      totalAbandons: responses.filter(r => r.status === 'partial').length,
      averageCompletionTime: calculateAverageTime(responses),
      fieldDropoffs: calculateFieldDropoffs(responses),
      conversionRate: responses.length > 0 
        ? (responses.filter(r => r.status === 'complete').length / responses.length) * 100 
        : 0
    }

    // Paginate
    const paginatedResponses = responses.slice(offset, offset + limit)

    return NextResponse.json({
      responses: paginatedResponses,
      total: responses.length,
      analytics,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < responses.length
      }
    })

  } catch (error: any) {
    console.error('[Responses API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function calculateAverageTime(responses: FormResponse[]): number {
  const completedWithTime = responses.filter(
    r => r.status === 'complete' && r.metadata.completionTime
  )
  if (completedWithTime.length === 0) return 0
  
  const totalTime = completedWithTime.reduce(
    (sum, r) => sum + (r.metadata.completionTime || 0), 0
  )
  return Math.round(totalTime / completedWithTime.length)
}

function calculateFieldDropoffs(responses: FormResponse[]): Record<string, number> {
  const dropoffs: Record<string, number> = {}
  
  responses
    .filter(r => r.status === 'partial' && r.analytics.dropoffField)
    .forEach(r => {
      const field = r.analytics.dropoffField!
      dropoffs[field] = (dropoffs[field] || 0) + 1
    })
  
  return dropoffs
}
