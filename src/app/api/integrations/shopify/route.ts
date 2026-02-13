/**
 * Shopify Integration API Route
 *
 * Generates Liquid snippets for Shopify themes
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { formId, formName, settings = {} } = await request.json()

    const liquidSnippet = generateShopifyLiquid(formId, formName, settings)

    return NextResponse.json({
      success: true,
      liquidSnippet,
      themeSchema: generateShopifySchema(),
      instructions: {
        step1: 'Create a new snippet in Shopify: snippets/revoforms.liquid',
        step2: 'Paste the Liquid code into the snippet',
        step3: 'Add {% render "revoforms" %} to any template',
        step4: 'Customize settings in the theme customizer',
      },
    })
  } catch (error) {
    console.error('[Shopify Integration] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Shopify code' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const formId = request.nextUrl.searchParams.get('formId') || 'your-form-id'
  const formName = request.nextUrl.searchParams.get('formName') || 'My Form'

  return NextResponse.json({
    liquidSnippet: generateShopifyLiquid(formId, formName),
    documentation: 'https://docs.revoforms.com/integrations/shopify',
  })
}

function generateShopifyLiquid(formId: string, formName: string, settings: any = {}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.dev'

  return `{% comment %}
  RevoForms Embed: ${formName}
  Form ID: ${formId}
{% endcomment %}

<div class="revoforms-wrapper" style="text-align: {{ section.settings.alignment }}; margin: {{ section.settings.margin }}px 0;">
  <div class="revoforms-container" style="max-width: {{ section.settings.max_width }}px; margin: 0 auto;">
    <iframe
      src="${baseUrl}/f/${formId}"
      frameborder="0"
      scrolling="no"
      style="width: 100%; min-height: 400px; border: none; border-radius: {{ section.settings.border_radius }}px;"
      allow="camera; microphone"
      title="${formName}"
      data-revoforms
    ></iframe>
  </div>
</div>

<script>
  (function() {
    const iframe = document.querySelector('[data-revoforms]');
    if (iframe) {
      window.addEventListener('message', function(e) {
        if (e.data.type === 'revoforms:resize') {
          iframe.style.height = e.data.height + 'px';
        }
      });
    }
  })();
</script>

{% schema %}
${generateShopifySchema()}
{% endschema %}

{% stylesheet %}
.revoforms-wrapper {
  clear: both;
}

.revoforms-container iframe {
  display: block;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
{% endstylesheet %}`
}

function generateShopifySchema(): string {
  return `{
  "name": "RevoForms Embed",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "form_id",
      "label": "Form ID",
      "default": "your-form-id"
    },
    {
      "type": "text",
      "id": "form_name",
      "label": "Form Name",
      "default": "My Form"
    },
    {
      "type": "range",
      "id": "max_width",
      "min": 300,
      "max": 1200,
      "step": 50,
      "unit": "px",
      "label": "Max Width",
      "default": 600
    },
    {
      "type": "range",
      "id": "border_radius",
      "min": 0,
      "max": 30,
      "step": 1,
      "unit": "px",
      "label": "Border Radius",
      "default": 8
    },
    {
      "type": "range",
      "id": "margin",
      "min": 0,
      "max": 100,
      "step": 5,
      "unit": "px",
      "label": "Margin",
      "default": 20
    },
    {
      "type": "select",
      "id": "alignment",
      "label": "Alignment",
      "options": [
        { "value": "left", "label": "Left" },
        { "value": "center", "label": "Center" },
        { "value": "right", "label": "Right" }
      ],
      "default": "center"
    }
  ]
}`
}
