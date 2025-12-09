/**
 * Interview AI API Route
 * Powers the "Forms That Talk Back" feature
 * Provides conversational assistance for form fillers
 */

import { NextRequest, NextResponse } from 'next/server'

// AI Provider configuration
const ZAI_API_KEY = process.env.ZAI_API_KEY
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4'
const ZAI_MODEL = process.env.ZAI_MODEL || 'GLM-4.6-128k-9B'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, systemContext, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build conversation for AI
    const systemPrompt = `${systemContext}

IMPORTANT GUIDELINES:
- Keep responses SHORT (2-3 sentences max)
- Be friendly and encouraging
- If asked about a specific field, explain what's needed
- If the user seems confused, offer to clarify
- Never reveal that you're an AI if not asked directly
- Act like a helpful human assistant

If you can suggest a value for a field based on context, include it in your response.
`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((msg: ConversationMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    let response: Response
    let aiMessage: string = ''

    // Try Z.ai first
    if (ZAI_API_KEY) {
      try {
        response = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ZAI_API_KEY}`,
            'Accept-Language': 'en-US,en'
          },
          body: JSON.stringify({
            model: ZAI_MODEL,
            messages,
            max_tokens: 300,
            temperature: 0.7
          })
        })

        if (response.ok) {
          const data = await response.json()
          aiMessage = data.choices[0]?.message?.content || "I'm here to help!"
        } else {
          throw new Error('Z.ai failed')
        }
      } catch {
        // Fall through to OpenRouter
      }
    }

    // Fallback to OpenRouter
    if (!aiMessage && OPENROUTER_API_KEY) {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://revoforms.dev',
          'X-Title': 'RevoForms Interview'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          max_tokens: 300,
          temperature: 0.7
        })
      })

      if (response.ok) {
        const data = await response.json()
        aiMessage = data.choices[0]?.message?.content || "I'm here to help!"
      }
    }

    // Default response if no AI available
    if (!aiMessage) {
      aiMessage = "I'm here to help you with this form. What would you like to know?"
    }

    // Check if response contains a value suggestion
    let suggestedValue: string | undefined
    const suggestionMatch = aiMessage.match(/\[SUGGEST:(.+?)\]/i)
    if (suggestionMatch) {
      suggestedValue = suggestionMatch[1].trim()
      aiMessage = aiMessage.replace(/\[SUGGEST:.+?\]/i, '').trim()
    }

    return NextResponse.json({
      message: aiMessage,
      suggestedValue
    })

  } catch (error) {
    console.error('[Interview AI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
