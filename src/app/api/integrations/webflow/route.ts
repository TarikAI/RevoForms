/**
 * Webflow Integration API Route
 *
 * Generates embed code for Webflow and adds items to CMS collections
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { formId, formName, width = '100%', height = 'auto' } = await request.json()

    const embedCode = generateWebflowEmbedCode(formId, formName, width, height)

    return NextResponse.json({
      success: true,
      embedCode,
      instructions: {
        method1: 'Copy and paste this code into an HTML Embed element in Webflow',
        method2: 'Add to Custom Code in Site Settings for sitewide availability',
      },
    })
  } catch (error) {
    console.error('[Webflow Integration] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Webflow embed code' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const formId = request.nextUrl.searchParams.get('formId') || 'your-form-id'
  const formName = request.nextUrl.searchParams.get('formName') || 'My Form'

  return NextResponse.json({
    embedCode: generateWebflowEmbedCode(formId, formName),
    documentation: 'https://docs.revoforms.com/integrations/webflow',
  })
}

function generateWebflowEmbedCode(
  formId: string,
  formName: string,
  width: string = '100%',
  height: string = 'auto'
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.dev'

  return `<!-- RevoForms Embed: ${formName} -->
<div class="revoforms-container" style="width: ${width}; height: ${height};">
  <iframe
    src="${baseUrl}/f/${formId}"
    frameborder="0"
    scrolling="no"
    style="width: 100%; height: 100%; border: none;"
    allow="camera; microphone"
    title="${formName}"
  ></iframe>
</div>

<!-- Optional: Add responsive resize script -->
<script>
  (function() {
    const iframe = document.currentScript.previousElementSibling.querySelector('iframe');
    if (iframe) {
      // Auto-resize iframe based on content
      window.addEventListener('message', function(e) {
        if (e.data.type === 'revoforms:resize') {
          iframe.style.height = e.data.height + 'px';
        }
      });
    }
  })();
</script>

<!-- Style adjustments -->
<style>
  .revoforms-container {
    position: relative;
    overflow: hidden;
  }
</style>`
}
