import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Form validation schema
const CreateFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  fields: z.array(z.any()).default([]),
  settings: z.record(z.any()).optional(),
  styling: z.record(z.any()).optional(),
})

// In-memory storage for server-side forms (will be replaced by Supabase)
const serverForms = new Map<string, any>()

/**
 * GET /api/forms
 * List all forms for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // TODO: Get user from session and filter by userId
    // For now, return all forms in memory

    let forms = Array.from(serverForms.values())

    // Filter by published status if specified
    if (published !== null) {
      forms = forms.filter(f => f.published === (published === 'true'))
    }

    // Sort by updatedAt descending
    forms.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - 
      new Date(a.updatedAt || a.createdAt).getTime()
    )

    // Paginate
    const paginatedForms = forms.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      forms: paginatedForms,
      total: forms.length,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < forms.length
      }
    })

  } catch (error: any) {
    console.error('Error listing forms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/forms
 * Create a new form
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = CreateFormSchema.parse(body)

    // Generate form ID
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create form object
    const form = {
      id: formId,
      ...validatedData,
      published: false,
      position: body.position || { x: 100, y: 100 },
      size: body.size || { width: 400 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // userId: session.user.id // TODO: Add when auth is ready
    }

    // Store in memory (TODO: Save to Supabase)
    serverForms.set(formId, form)

    return NextResponse.json({
      success: true,
      form,
      message: 'Form created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating form:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/forms
 * Bulk delete forms
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { formIds } = body

    if (!Array.isArray(formIds) || formIds.length === 0) {
      return NextResponse.json(
        { error: 'formIds array is required' },
        { status: 400 }
      )
    }

    // Delete forms from memory (TODO: Delete from Supabase)
    let deletedCount = 0
    formIds.forEach(id => {
      if (serverForms.delete(id)) {
        deletedCount++
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} form(s) deleted successfully`
    })

  } catch (error: any) {
    console.error('Error deleting forms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
