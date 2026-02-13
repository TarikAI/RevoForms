import { NextRequest, NextResponse } from 'next/server'

// In-memory analytics storage (will be replaced by Supabase)
const analyticsStore = new Map<string, {
  formId: string
  views: number
  starts: number
  completions: number
  fieldDropoffs: Record<string, number>
  averageCompletionTime: number
  lastUpdated: string
}>()

/**
 * GET /api/analytics
 * Get analytics for a form or all forms
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, all

    if (formId) {
      // Get analytics for specific form
      const analytics = analyticsStore.get(formId) || createEmptyAnalytics(formId)
      
      return NextResponse.json({
        success: true,
        analytics: {
          ...analytics,
          conversionRate: analytics.starts > 0 
            ? Math.round((analytics.completions / analytics.starts) * 100) 
            : 0,
          abandonmentRate: analytics.starts > 0
            ? Math.round(((analytics.starts - analytics.completions) / analytics.starts) * 100)
            : 0
        }
      })
    }

    // Get analytics for all forms
    const allAnalytics = Array.from(analyticsStore.values()).map(a => ({
      ...a,
      conversionRate: a.starts > 0 
        ? Math.round((a.completions / a.starts) * 100) 
        : 0
    }))

    // Calculate totals
    const totals = {
      totalViews: allAnalytics.reduce((sum, a) => sum + a.views, 0),
      totalStarts: allAnalytics.reduce((sum, a) => sum + a.starts, 0),
      totalCompletions: allAnalytics.reduce((sum, a) => sum + a.completions, 0),
      averageConversionRate: allAnalytics.length > 0
        ? Math.round(allAnalytics.reduce((sum, a) => sum + a.conversionRate, 0) / allAnalytics.length)
        : 0
    }

    return NextResponse.json({
      success: true,
      analytics: allAnalytics,
      totals,
      period
    })

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics
 * Track an analytics event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, event, data } = body

    if (!formId || !event) {
      return NextResponse.json(
        { error: 'formId and event are required' },
        { status: 400 }
      )
    }

    // Get or create analytics for form
    let analytics = analyticsStore.get(formId)
    if (!analytics) {
      analytics = createEmptyAnalytics(formId)
    }

    // Update based on event type
    switch (event) {
      case 'view':
        analytics.views++
        break
      case 'start':
        analytics.starts++
        break
      case 'complete':
        analytics.completions++
        if (data?.completionTime) {
          // Update average completion time
          const totalTime = analytics.averageCompletionTime * (analytics.completions - 1) + data.completionTime
          analytics.averageCompletionTime = Math.round(totalTime / analytics.completions)
        }
        break
      case 'dropoff':
        if (data?.fieldId) {
          analytics.fieldDropoffs[data.fieldId] = (analytics.fieldDropoffs[data.fieldId] || 0) + 1
        }
        break
    }

    analytics.lastUpdated = new Date().toISOString()
    analyticsStore.set(formId, analytics)

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    })

  } catch (error: any) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function createEmptyAnalytics(formId: string) {
  return {
    formId,
    views: 0,
    starts: 0,
    completions: 0,
    fieldDropoffs: {} as Record<string, number>,
    averageCompletionTime: 0,
    lastUpdated: new Date().toISOString()
  }
}
