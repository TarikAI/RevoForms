/**
 * Image Editing API
 * Uses NanoBanana for handwriting, font matching, form filling on images
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getNanoBananaProvider, 
  isImageEditingAvailable,
  type ImageEditOperation 
} from '@/lib/providers/image-edit-provider'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, image, ...params } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Check if image editing is available
    if (!isImageEditingAvailable()) {
      return NextResponse.json({ 
        error: 'Image editing not configured',
        message: 'NanoBanana API key not set. Add NANOBANANA_API_KEY to environment.',
        available: false
      }, { status: 503 })
    }

    const provider = getNanoBananaProvider()

    switch (action) {
      case 'fill-field':
        return await handleFillField(provider, image, params)
      
      case 'add-text':
        return await handleAddText(provider, image, params)
      
      case 'add-signature':
        return await handleAddSignature(provider, image, params)
      
      case 'add-image':
        return await handleAddImage(provider, image, params)
      
      case 'batch-edit':
        return await handleBatchEdit(provider, image, params)
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[ImageEdit] Error:', error)
    return NextResponse.json({ error: 'Image editing failed', details: error.message }, { status: 500 })
  }
}

async function handleFillField(provider: any, image: string, params: any) {
  const { field, value, matchStyle, styleSourceRegion } = params
  if (!field || !value) {
    return NextResponse.json({ error: 'Missing field position or value' }, { status: 400 })
  }

  const result = await provider.fillFormField({
    image, field, value, matchStyle: matchStyle ?? true, styleSourceRegion,
  })

  return result.success 
    ? NextResponse.json({ success: true, image: result.image })
    : NextResponse.json({ error: result.error }, { status: 500 })
}

async function handleAddText(provider: any, image: string, params: any) {
  const { text, position, style, sourceRegion } = params
  if (!text || !position) {
    return NextResponse.json({ error: 'Missing text or position' }, { status: 400 })
  }

  const result = await provider.addHandwrittenText({
    image, text, position, style: style || 'printed', sourceRegion,
  })

  return result.success 
    ? NextResponse.json({ success: true, image: result.image })
    : NextResponse.json({ error: result.error }, { status: 500 })
}

async function handleAddSignature(provider: any, image: string, params: any) {
  const { name, position, style } = params
  if (!name || !position) {
    return NextResponse.json({ error: 'Missing name or position' }, { status: 400 })
  }

  const result = await provider.addSignature({
    image, name, position, style: style || 'cursive',
  })

  return result.success 
    ? NextResponse.json({ success: true, image: result.image })
    : NextResponse.json({ error: result.error }, { status: 500 })
}

async function handleAddImage(provider: any, image: string, params: any) {
  const { overlayImage, position, size } = params
  if (!overlayImage || !position || !size) {
    return NextResponse.json({ error: 'Missing overlay image, position, or size' }, { status: 400 })
  }

  const result = await provider.editImage({
    image,
    operations: [{
      type: 'add-image',
      config: { image: overlayImage, x: position.x, y: position.y, width: size.width, height: size.height }
    }]
  })

  return result.success 
    ? NextResponse.json({ success: true, image: result.image })
    : NextResponse.json({ error: result.error }, { status: 500 })
}

async function handleBatchEdit(provider: any, image: string, params: any) {
  const { operations } = params
  if (!operations || !Array.isArray(operations)) {
    return NextResponse.json({ error: 'Missing operations array' }, { status: 400 })
  }

  const result = await provider.editImage({ image, operations: operations as ImageEditOperation[] })

  return result.success 
    ? NextResponse.json({ success: true, image: result.image })
    : NextResponse.json({ error: result.error }, { status: 500 })
}

export async function GET() {
  return NextResponse.json({
    available: isImageEditingAvailable(),
    provider: 'nanobanana',
    capabilities: isImageEditingAvailable() ? getNanoBananaProvider().capabilities : [],
  })
}
