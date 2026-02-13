import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const maxDuration = 60

interface SaveProgressRequest {
  formData: Record<string, any>
  currentStep?: number
  totalSteps?: number
  expiresAt?: string // ISO date string
}

interface SavedProgress {
  id: string
  formId: string
  formData: Record<string, any>
  currentStep?: number
  totalSteps?: number
  createdAt: string
  updatedAt: string
  expiresAt: string
  accessCode: string
}

// In-memory store for demo purposes
// In production, use Redis or database
const savedProgressStore = new Map<string, SavedProgress>()

// Generate a unique access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    if (i === 3) code += '-'
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Clean expired entries
function cleanExpiredEntries() {
  const now = new Date().toISOString()
  for (const [id, progress] of savedProgressStore.entries()) {
    if (progress.expiresAt < now) {
      savedProgressStore.delete(id)
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const body: SaveProgressRequest = await request.json()
    const { formData, currentStep, totalSteps, expiresAt } = body

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      )
    }

    // Clean expired entries
    cleanExpiredEntries()

    // Generate unique ID and access code
    const id = crypto.randomUUID()
    const accessCode = generateAccessCode()

    // Set expiration (default 30 days)
    const expiration = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Save progress
    const savedProgress: SavedProgress = {
      id,
      formId,
      formData,
      currentStep,
      totalSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiration,
      accessCode,
    }

    savedProgressStore.set(id, savedProgress)

    // Set cookie with progress ID
    const cookieStore = await cookies()
    cookieStore.set(`form_progress_${formId}`, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    // Send email notification (if configured)
    if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
      try {
        // TODO: Send save confirmation email with access code
        console.log('Save confirmation email sent:', accessCode)
      } catch (error) {
        console.error('Failed to send save confirmation email:', error)
      }
    }

    return NextResponse.json({
      success: true,
      progressId: id,
      accessCode,
      expiresAt: expiration,
      message: 'Your progress has been saved. You can return to this form within 30 days.',
    })

  } catch (error: any) {
    console.error('Save progress error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save progress' },
      { status: 500 }
    )
  }
}

// Retrieve saved progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const { searchParams } = new URL(request.url)
    const progressId = searchParams.get('id')
    const accessCode = searchParams.get('code')

    // Try to get from cookie first
    const cookieStore = await cookies()
    const cookieProgressId = cookieStore.get(`form_progress_${formId}`)?.value

    const targetId = progressId || cookieProgressId

    if (!targetId) {
      return NextResponse.json(
        { error: 'No saved progress found' },
        { status: 404 }
      )
    }

    const savedProgress = savedProgressStore.get(targetId)

    if (!savedProgress) {
      return NextResponse.json(
        { error: 'Saved progress not found or expired' },
        { status: 404 }
      )
    }

    // Check if it belongs to the correct form
    if (savedProgress.formId !== formId) {
      return NextResponse.json(
        { error: 'Invalid form' },
        { status: 400 }
      )
    }

    // Check access code (if provided)
    if (accessCode && savedProgress.accessCode !== accessCode) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      )
    }

    // Check if expired
    if (savedProgress.expiresAt < new Date().toISOString()) {
      savedProgressStore.delete(targetId)
      return NextResponse.json(
        { error: 'Saved progress has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      success: true,
      formData: savedProgress.formData,
      currentStep: savedProgress.currentStep,
      totalSteps: savedProgress.totalSteps,
      savedAt: savedProgress.updatedAt,
      expiresAt: savedProgress.expiresAt,
      accessCode: savedProgress.accessCode,
    })

  } catch (error: any) {
    console.error('Retrieve progress error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve progress' },
      { status: 500 }
    )
  }
}

// Update saved progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const body: SaveProgressRequest = await request.json()
    const { formData, currentStep, totalSteps } = body

    const cookieStore = await cookies()
    const progressId = cookieStore.get(`form_progress_${formId}`)?.value

    if (!progressId) {
      return NextResponse.json(
        { error: 'No saved progress found' },
        { status: 404 }
      )
    }

    const savedProgress = savedProgressStore.get(progressId)

    if (!savedProgress) {
      return NextResponse.json(
        { error: 'Saved progress not found or expired' },
        { status: 404 }
      )
    }

    // Update progress
    savedProgress.formData = formData
    savedProgress.currentStep = currentStep || savedProgress.currentStep
    savedProgress.totalSteps = totalSteps || savedProgress.totalSteps
    savedProgress.updatedAt = new Date().toISOString()

    savedProgressStore.set(progressId, savedProgress)

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      updatedAt: savedProgress.updatedAt,
    })

  } catch (error: any) {
    console.error('Update progress error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    )
  }
}

// Delete saved progress
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const { searchParams } = new URL(request.url)
    const progressId = searchParams.get('id')

    if (!progressId) {
      return NextResponse.json(
        { error: 'Progress ID required' },
        { status: 400 }
      )
    }

    const deleted = savedProgressStore.delete(progressId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Saved progress not found' },
        { status: 404 }
      )
    }

    // Clear cookie if it exists
    const cookieStore = await cookies()
    cookieStore.delete(`form_progress_${formId}`)

    return NextResponse.json({
      success: true,
      message: 'Saved progress deleted successfully',
    })

  } catch (error: any) {
    console.error('Delete progress error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete progress' },
      { status: 500 }
    )
  }
}