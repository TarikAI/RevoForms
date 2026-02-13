/**
 * Wix Integration API Route
 *
 * Generates iframe embed code and Velo (Corvid) integration
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { formId, formName, width = '100%', height = 'auto' } = await request.json()

    const iframeCode = generateWixIframeCode(formId, formName, width, height)
    const veloCode = generateWixVeloCode(formId)

    return NextResponse.json({
      success: true,
      iframeCode,
      veloCode,
      instructions: {
        iframe: 'Add HTML iframe element and paste this code',
        velo: 'Copy to your site\'s code in Wix Dashboard (Settings > Velo)',
      },
    })
  } catch (error) {
    console.error('[Wix Integration] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Wix code' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const formId = request.nextUrl.searchParams.get('formId') || 'your-form-id'
  const formName = request.nextUrl.searchParams.get('formName') || 'My Form'

  return NextResponse.json({
    iframeCode: generateWixIframeCode(formId, formName, '100%', 'auto'),
    veloCode: generateWixVeloCode(formId),
    documentation: 'https://docs.revoforms.com/integrations/wix',
  })
}

function generateWixIframeCode(formId: string, formName: string, width: string, height: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.dev'

  return `<iframe
  src="${baseUrl}/f/${formId}"
  title="${formName}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allow="camera; microphone"
  style="border: none; width: 100%; height: auto; min-height: 400px;"
></iframe>
<script>
  // Listen for resize events from the form
  window.addEventListener("message", (event) => {
    if (event.data.type === 'revoforms:resize') {
      const iframe = document.querySelector('iframe[title="${formName}"]');
      if (iframe) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>`
}

function generateWixVeloCode(formId: string): string {
  return `/**
 * RevoForms Integration for Wix Velo
 * Add this code in your site's Pages section or in a backend file
 */

// Frontend code (add to page's onReady):
\$w.onReady(function () {
  const formId = "${formId}";
  const formUrl = "https://revoforms.dev/f/" + formId;

  // Set iframe source
  \$w("#revoformsIframe").src = formUrl;

  // Listen for messages from the form
  window.addEventListener("message", (event) => {
    // Verify origin
    if (event.origin !== "https://revoforms.dev") return;

    switch (event.data.type) {
      case 'revoforms:resize':
        \$w("#revoformsIframe").height = event.data.height;
        break;

      case 'revoforms:submit':
        // Handle form submission
        console.log("Form submitted:", event.data);
        // You can trigger Wix actions here, like:
        // - Show success message
        // - Redirect user
        // - Update database
        // - Send email
        break;

      case 'revoforms:ready':
        console.log("RevoForms form loaded");
        break;
    }
  });
});

// Example: Handle form submission in Wix backend
// backend/revoforms.jsw
export function handleFormSubmission(data) {
  // Process form submission data
  const submission = {
    formId: data.formId,
    submissionId: data.submissionId,
    fields: data.fields,
    submittedAt: new Date(),
  };

  // Store in Wix collection or send to external service
  // Example: wixData.insert("FormSubmissions", submission);

  return submission;
}`
}
