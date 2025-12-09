/**
 * PDF Fill API
 * Fill PDF forms and download/display results
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPDFProvider } from '@/lib/providers/pdf-provider'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pdf, values, outputFormat = 'base64' } = body

    if (!pdf) {
      return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })
    }

    if (!values || typeof values !== 'object') {
      return NextResponse.json({ error: 'No form values provided' }, { status: 400 })
    }

    const pdfBuffer = Buffer.from(pdf, 'base64')
    const provider = getPDFProvider()
    const result = await provider.fillForm(pdfBuffer, values)

    if (!result.success || !result.pdf) {
      return NextResponse.json({ error: result.error || 'Failed to fill PDF' }, { status: 500 })
    }

    if (outputFormat === 'download') {
      return new NextResponse(result.pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="filled-form.pdf"',
        },
      })
    }

    return NextResponse.json({
      success: true,
      pdf: Buffer.from(result.pdf).toString('base64'),
      size: result.pdf.length,
    })

  } catch (error: any) {
    console.error('[PDF Fill] Error:', error)
    return NextResponse.json({ error: 'PDF filling failed', details: error.message }, { status: 500 })
  }
}
