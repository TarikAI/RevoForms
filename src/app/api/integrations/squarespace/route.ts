/**
 * Squarespace Integration API Route
 *
 * Generates embed code and code injection for Squarespace
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { formId, formName, trigger = 'manual', settings = {} } = await request.json()

    const embedCode = generateSquarespaceEmbedCode(formId, formName, settings)
    const popupCode = generateSquarespacePopupCode(formId, formName, trigger)

    return NextResponse.json({
      success: true,
      embedCode,
      popupCode,
      codeInjection: generateSquarespaceCodeInjection(formId, trigger),
      instructions: {
        embed: 'Add to any page using Code Block',
        popup: 'Add to Settings > Advanced > Code Injection for sitewide popup',
      },
    })
  } catch (error) {
    console.error('[Squarespace Integration] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Squarespace code' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const formId = request.nextUrl.searchParams.get('formId') || 'your-form-id'
  const formName = request.nextUrl.searchParams.get('formName') || 'My Form'

  return NextResponse.json({
    embedCode: generateSquarespaceEmbedCode(formId, formName),
    popupCode: generateSquarespacePopupCode(formId, formName, 'manual'),
    documentation: 'https://docs.revoforms.com/integrations/squarespace',
  })
}

function generateSquarespaceEmbedCode(formId: string, formName: string, settings: any = {}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.dev'

  return `<!-- RevoForms Embed: ${formName} -->
<div class="revoforms-embed" style="position: relative; width: 100%; max-width: ${settings.maxWidth || 600}px; margin: 0 auto;">
  <iframe
    src="${baseUrl}/f/${formId}"
    frameborder="0"
    scrolling="no"
    style="width: 100%; height: 500px; border: none; border-radius: 8px;"
    allow="camera; microphone"
    title="${formName}"
  ></iframe>
</div>

<script>
  (function() {
    const iframe = document.querySelector('.revoforms-embed iframe');
    if (iframe) {
      window.addEventListener('message', function(e) {
        if (e.data.type === 'revoforms:resize') {
          iframe.style.height = e.data.height + 'px';
        }
      });
    }
  })();
</script>`
}

function generateSquarespacePopupCode(formId: string, formName: string, trigger: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.dev'

  return `<!-- RevoForms Popup: ${formName} -->
<div id="revoforms-popup" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
  <div style="position: relative; width: 90%; max-width: 600px; background: white; border-radius: 12px; padding: 20px; max-height: 90vh; overflow: auto;">
    <button id="revoforms-close" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
    <iframe
      src="${baseUrl}/f/${formId}"
      frameborder="0"
      scrolling="no"
      style="width: 100%; height: 500px; border: none;"
      allow="camera; microphone"
      title="${formName}"
    ></iframe>
  </div>
</div>

<script>
  (function() {
    const popup = document.getElementById('revoforms-popup');
    const closeBtn = document.getElementById('revoforms-close');
    const iframe = popup.querySelector('iframe');

    closeBtn.addEventListener('click', function() {
      popup.style.display = 'none';
    });

    // Close on background click
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        popup.style.display = 'none';
      }
    });

    // Auto-resize iframe
    window.addEventListener('message', function(e) {
      if (e.data.type === 'revoforms:resize') {
        iframe.style.height = e.data.height + 'px';
      }
    });

    // Trigger logic
    ${getTriggerLogic(trigger)}
  })();
</script>

<style>
  #revoforms-popup {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  #revoforms-popup button:focus {
    outline: 2px solid #000;
    outline-offset: 2px;
  }
</style>`
}

function generateSquarespaceCodeInjection(formId: string, trigger: string): string {
  return `<!-- RevoForms Popup Trigger -->
<!-- Add to Settings > Advanced > Code Injection > HEADER -->
<script>
  // Configure your trigger here
  window.RevoFormsConfig = {
    formId: "${formId}",
    trigger: "${trigger}", // 'manual', 'delay', 'scroll', 'exit', 'click'
    delay: 5000, // for 'delay' trigger - milliseconds
    scrollDepth: 50, // for 'scroll' trigger - percentage
    buttonText: 'Open Form', // for 'click' trigger
  };
</script>

<!-- Add this script to FOOTER -->
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.dev'}/embed/squarespace.js"></script>`
}

function getTriggerLogic(trigger: string): string {
  switch (trigger) {
    case 'delay':
      return `setTimeout(function() {
      popup.style.display = 'flex';
    }, 5000);`

    case 'scroll':
      return `window.addEventListener('scroll', function() {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 50) {
        popup.style.display = 'flex';
      }
    }, { once: true });`

    case 'exit':
      return `document.addEventListener('mouseout', function(e) {
      if (e.clientY < 10) {
        popup.style.display = 'flex';
      }
    }, { once: true });`

    case 'click':
      return `// Add this to your button:
      // document.getElementById('your-button-id').addEventListener('click', function() {
      //   popup.style.display = 'flex';
      // });`

    default:
      return `// Manual trigger - use JavaScript to show: popup.style.display = 'flex';`
  }
}
