import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// ============ AI PROVIDER CONFIGURATION ============
interface AIProvider {
  name: string
  client: OpenAI
  model: string
}

function getProviders(): AIProvider[] {
  const providers: AIProvider[] = []

  // PRIMARY: Z.ai (Zhipu GLM-4.6)
  if (process.env.ZAI_API_KEY) {
    providers.push({
      name: 'zai',
      client: new OpenAI({
        apiKey: process.env.ZAI_API_KEY,
        baseURL: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
        defaultHeaders: { 'Accept-Language': 'en-US,en' },
      }),
      model: process.env.ZAI_MODEL || 'glm-4.6',
    })
  }

  // FALLBACK: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: 'openrouter',
      client: new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        defaultHeaders: { 'HTTP-Referer': 'https://revoforms.dev', 'X-Title': 'RevoForms AI' },
      }),
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1:free',
    })
  }

  return providers
}

// ============ COMPREHENSIVE SYSTEM PROMPT ============
const SYSTEM_PROMPT = `You are RevoForms AI - an expert form builder assistant. You can CREATE new forms, EDIT existing forms, FILL forms with user profile data, and EXPLAIN filled form data.

RESPONSE FORMAT - Always respond with valid JSON only (NO markdown, NO code blocks):
{
  "message": "Your conversational response",
  "action": {
    "type": "create_form" | "update_form" | "add_fields" | "remove_fields" | "update_field" | "update_styling" | "fill_form" | "none",
    "payload": { ... }
  },
  "suggestions": ["suggestion 1", "suggestion 2"]
}

ACTION TYPES:

1. CREATE_FORM - Create a new form
{
  "type": "create_form",
  "payload": {
    "name": "Form Name",
    "description": "Description",
    "fields": [...],
    "settings": { "submitButtonText": "Submit", "successMessage": "Thanks!" },
    "styling": { "theme": "glassmorphism", "colors": {...} }
  }
}

2. UPDATE_FORM - Update form properties (name, description, settings)
{
  "type": "update_form",
  "payload": {
    "formId": "CURRENT_FORM_ID",
    "updates": { "name": "New Name", "description": "New description", "settings": {...} }
  }
}

3. ADD_FIELDS - Add new fields to existing form
{
  "type": "add_fields",
  "payload": {
    "formId": "CURRENT_FORM_ID",
    "fields": [{ "id": "f_new", "type": "phone", "label": "Phone", "required": true }],
    "position": "end" | "start" | number
  }
}

4. REMOVE_FIELDS - Remove fields from form
{
  "type": "remove_fields",
  "payload": {
    "formId": "CURRENT_FORM_ID",
    "fieldIds": ["field_id_1"] or null,
    "fieldLabels": ["Email", "Phone"] // Use this if user refers to fields by name
  }
}

5. UPDATE_FIELD - Modify a specific field
{
  "type": "update_field",
  "payload": {
    "formId": "CURRENT_FORM_ID",
    "fieldId": "field_id" or null,
    "fieldLabel": "Field Name", // Use this if user refers by label
    "updates": { "label": "New Label", "required": false, "placeholder": "..." }
  }
}

6. UPDATE_STYLING - Change form appearance
{
  "type": "update_styling",
  "payload": {
    "formId": "CURRENT_FORM_ID",
    "styling": {
      "theme": "sunset",
      "colors": { "primary": "#f97316", "secondary": "#ef4444", ... }
    }
  }
}

7. FILL_FORM - Fill form fields with user's profile data
{
  "type": "fill_form",
  "payload": {
    "formId": "CURRENT_FORM_ID",
    "fieldValues": {
      "field_id_or_label": "value from profile",
      ...
    }
  }
}

FIELD TYPES: text, email, phone, number, url, password, textarea, select, multiselect, radio, checkbox, date, time, datetime, file, file_upload, rating, range, signature, matrix, daterange, country, address, name, currency, payment, divider, heading, paragraph, html, pagebreak

THEME PRESETS: modern-dark, modern-light, minimal, bold, corporate, playful, glassmorphism, neon, nature, ocean, sunset, custom

CONTEXT RULES:
- If user has a form selected, EDIT IT by default (don't create new unless asked)
- Use "CURRENT_FORM_ID" as placeholder - it will be replaced with actual ID
- Match field labels case-insensitively when user refers to fields
- For styling requests like "make it red", use update_styling action
- When user asks to "fill", "auto-fill", "use my profile", or "fill with my info", use fill_form action
- Match profile data to form fields intelligently (e.g., "First Name" field matches profile.personal.firstName)

FILL_FORM MATCHING RULES:
- Match field labels to profile fields case-insensitively
- "First Name", "Given Name" → personal.firstName
- "Last Name", "Family Name", "Surname" → personal.lastName  
- "Full Name", "Name" → personal.firstName + " " + personal.lastName
- "Email", "Email Address" → personal.email
- "Phone", "Mobile", "Tel" → personal.phone
- "Date of Birth", "DOB", "Birthday" → personal.dateOfBirth
- "Address", "Street" → address.street
- "City" → address.city
- "State", "Province" → address.state
- "Zip", "Postal Code" → address.postalCode
- "Country" → address.country
- "Job Title", "Position" → professional.jobTitle
- "Company", "Organization" → professional.company
- "LinkedIn" → professional.linkedIn
- "Website" → professional.website

FORM EXPLANATION RULES:
When user asks "who filled this form", "explain this form", "tell me about the person", "what does the form say":
- Analyze the filled field values in the form
- Create a natural language summary of the person who filled it
- Include insights about their profession, location, interests based on the data
- Be conversational and helpful
- Use action type "none" since you're just explaining, not modifying anything
- If form has filled data, analyze and describe the person
- If form has no filled data, explain what the form is for and its purpose

EXAMPLES:
- "Add a phone field" → add_fields with phone field
- "Remove the email field" → remove_fields with fieldLabels: ["email"]
- "Make name optional" → update_field with required: false
- "Change theme to neon" → update_styling with theme: "neon"
- "Fill with my profile" → fill_form with mapped profile values
- "Use my info to fill this" → fill_form with mapped profile values
- "Auto-fill from my profile" → fill_form with mapped profile values
- "Create a survey" → create_form (new form)

CRITICAL: Return ONLY valid JSON. No markdown. Use "CURRENT_FORM_ID" for formId when editing.`

// ============ DEMO RESPONSES ============
const DEMO_RESPONSES: Record<string, any> = {
  contact: {
    message: "I've created a professional contact form! 🎉",
    action: {
      type: "create_form",
      payload: {
        name: "Contact Us",
        description: "Get in touch with us",
        fields: [
          { id: "f1", type: "text", label: "Full Name", placeholder: "John Doe", required: true },
          { id: "f2", type: "email", label: "Email", placeholder: "john@example.com", required: true },
          { id: "f3", type: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", required: false },
          { id: "f4", type: "select", label: "Subject", required: true, options: ["General", "Support", "Sales"] },
          { id: "f5", type: "textarea", label: "Message", placeholder: "How can we help?", required: true }
        ],
        settings: { submitButtonText: "Send Message", successMessage: "Thank you! We'll respond soon." }
      }
    },
    suggestions: ["Add file upload", "Change to dark theme", "Make it multi-step"]
  },
  survey: {
    message: "Here's a customer satisfaction survey! ⭐",
    action: {
      type: "create_form",
      payload: {
        name: "Customer Survey",
        description: "Help us improve",
        fields: [
          { id: "s1", type: "rating", label: "Overall Satisfaction", required: true, maxStars: 5 },
          { id: "s2", type: "radio", label: "Would you recommend us?", required: true, options: ["Definitely", "Probably", "Not Sure", "No"] },
          { id: "s3", type: "checkbox", label: "What did you like?", options: ["Quality", "Price", "Service", "Speed"] },
          { id: "s4", type: "textarea", label: "Comments", placeholder: "Your feedback...", required: false }
        ],
        settings: { submitButtonText: "Submit Feedback", successMessage: "Thanks for your feedback!" }
      }
    },
    suggestions: ["Add NPS score", "Include demographics", "Change colors"]
  },
  registration: {
    message: "I've created an event registration form! 📅",
    action: {
      type: "create_form",
      payload: {
        name: "Event Registration",
        description: "Register for our upcoming event",
        fields: [
          { id: "r1", type: "text", label: "Full Name", placeholder: "John Doe", required: true },
          { id: "r2", type: "email", label: "Email", placeholder: "john@example.com", required: true },
          { id: "r3", type: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", required: true },
          { id: "r4", type: "daterange", label: "Attendance Dates", required: true, allowSameDate: true, presets: [{ label: "Full Event", type: "days", value: 3 }, { label: "Weekend Only", type: "custom", start: "2024-03-15", end: "2024-03-17" }] },
          { id: "r5", type: "matrix", label: "Session Preferences", required: true, matrixType: "checkbox", allowMultiple: true, rows: [{ id: "m1", label: "Day 1 Sessions" }, { id: "m2", label: "Day 2 Sessions" }, { id: "m3", label: "Workshops" }], columns: [{ id: "c1", label: "Morning" }, { id: "c2", label: "Afternoon" }, { id: "c3", label: "Evening" }] },
          { id: "r6", type: "signature", label: "Terms Agreement", required: true },
          { id: "r7", type: "payment", label: "Registration Fee", required: true, paymentType: "fixed", amount: 99, currency: "usd" }
        ],
        settings: { submitButtonText: "Register Now", successMessage: "Registration successful! Check your email for confirmation." }
      }
    },
    suggestions: ["Add dietary restrictions", "Change to multi-column layout", "Add group discounts"]
  },
  default: {
    message: "I've created a form for you! ✨",
    action: {
      type: "create_form",
      payload: {
        name: "New Form",
        description: "",
        fields: [
          { id: "d1", type: "text", label: "Name", placeholder: "Your name", required: true },
          { id: "d2", type: "email", label: "Email", placeholder: "your@email.com", required: true },
          { id: "d3", type: "textarea", label: "Message", placeholder: "Your message...", required: false }
        ],
        settings: { submitButtonText: "Submit", successMessage: "Thank you!" }
      }
    },
    suggestions: ["Add more fields", "Change theme", "Add file upload"]
  }
}

function detectFormType(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes("contact")) return "contact"
  if (lower.includes("survey") || lower.includes("feedback")) return "survey"
  if (lower.includes("registration") || lower.includes("register") || lower.includes("event")) return "registration"
  return "default"
}

function buildContextPrompt(selectedForm: any, userProfile: any): string {
  let context = ""
  
  // Add form context
  if (selectedForm) {
    context += `

CURRENTLY SELECTED FORM:
- ID: ${selectedForm.id}
- Name: ${selectedForm.name}
- Description: ${selectedForm.description || 'None'}
- Fields: ${selectedForm.fields?.map((f: any) => `${f.id}: ${f.label} (${f.type}${f.required ? ', required' : ''}${f.defaultValue ? `, filled="${f.defaultValue}"` : ''})`).join(', ') || 'None'}
- Theme: ${selectedForm.styling?.theme || 'default'}
- Submit Button: ${selectedForm.settings?.submitButtonText || 'Submit'}

FILLED FORM DATA (if any):
${selectedForm.fields?.filter((f: any) => f.defaultValue).map((f: any) => `- ${f.label}: "${f.defaultValue}"`).join('\n') || 'No fields have been filled yet.'}

When user asks to modify, add, or change something, apply it to THIS form using the appropriate action type.
When user asks about the form content, who filled it, or to explain the data, analyze the filled values above and provide insights.
Use formId: "${selectedForm.id}" in your action payload.`
  } else {
    context += "\n\nNO FORM SELECTED - User wants to create a new form."
  }

  // Add profile context
  if (userProfile) {
    context += `

USER'S PROFILE DATA (use for fill_form action):
- Personal: firstName="${userProfile.personal?.firstName || ''}", lastName="${userProfile.personal?.lastName || ''}", email="${userProfile.personal?.email || ''}", phone="${userProfile.personal?.phone || ''}", dateOfBirth="${userProfile.personal?.dateOfBirth || ''}", nationality="${userProfile.personal?.nationality || ''}", gender="${userProfile.personal?.gender || ''}"
- Address: street="${userProfile.address?.street || ''}", apartment="${userProfile.address?.apartment || ''}", city="${userProfile.address?.city || ''}", state="${userProfile.address?.state || ''}", postalCode="${userProfile.address?.postalCode || ''}", country="${userProfile.address?.country || ''}"
- Professional: jobTitle="${userProfile.professional?.jobTitle || ''}", company="${userProfile.professional?.company || ''}", industry="${userProfile.professional?.industry || ''}", department="${userProfile.professional?.department || ''}", yearsExperience="${userProfile.professional?.yearsExperience || ''}", linkedIn="${userProfile.professional?.linkedIn || ''}", website="${userProfile.professional?.website || ''}", portfolio="${userProfile.professional?.portfolio || ''}"
- Education: ${userProfile.education?.map((e: any) => `${e.degree} at ${e.institution}`).join(', ') || 'None'}
- Custom Fields: ${Object.entries(userProfile.customFields || {}).map(([k, v]) => `${k}="${v}"`).join(', ') || 'None'}

When user asks to "fill", "auto-fill", "use my profile", or "fill with my info", create a fill_form action matching profile data to form field labels/IDs.`
  } else {
    context += "\n\nNO USER PROFILE - Cannot auto-fill. Suggest user fills their profile first."
  }

  return context
}

// Helper to create fill_form response when profile exists
function createFillResponse(selectedForm: any, userProfile: any): any {
  if (!selectedForm || !userProfile) return null
  
  const fieldValues: Record<string, string> = {}
  
  for (const field of selectedForm.fields || []) {
    const label = (field.label || '').toLowerCase()
    const type = field.type
    
    // Match fields to profile data
    if (label.includes('first') && label.includes('name')) {
      fieldValues[field.id] = userProfile.personal?.firstName || ''
    } else if (label.includes('last') && label.includes('name') || label.includes('surname') || label.includes('family')) {
      fieldValues[field.id] = userProfile.personal?.lastName || ''
    } else if (label.includes('full') && label.includes('name') || (label === 'name' && !label.includes('first') && !label.includes('last'))) {
      fieldValues[field.id] = `${userProfile.personal?.firstName || ''} ${userProfile.personal?.lastName || ''}`.trim()
    } else if (type === 'email' || label.includes('email')) {
      fieldValues[field.id] = userProfile.personal?.email || ''
    } else if (type === 'phone' || label.includes('phone') || label.includes('mobile') || label.includes('tel')) {
      fieldValues[field.id] = userProfile.personal?.phone || ''
    } else if (label.includes('birth') || label.includes('dob') || label.includes('birthday')) {
      fieldValues[field.id] = userProfile.personal?.dateOfBirth || ''
    } else if (label.includes('nationality')) {
      fieldValues[field.id] = userProfile.personal?.nationality || ''
    } else if (label.includes('gender')) {
      fieldValues[field.id] = userProfile.personal?.gender || ''
    } else if (label.includes('street') || (label.includes('address') && !label.includes('email'))) {
      fieldValues[field.id] = userProfile.address?.street || ''
    } else if (label.includes('city')) {
      fieldValues[field.id] = userProfile.address?.city || ''
    } else if (label.includes('state') || label.includes('province')) {
      fieldValues[field.id] = userProfile.address?.state || ''
    } else if (label.includes('zip') || label.includes('postal')) {
      fieldValues[field.id] = userProfile.address?.postalCode || ''
    } else if (label.includes('country')) {
      fieldValues[field.id] = userProfile.address?.country || ''
    } else if (label.includes('job') || label.includes('title') || label.includes('position')) {
      fieldValues[field.id] = userProfile.professional?.jobTitle || ''
    } else if (label.includes('company') || label.includes('organization') || label.includes('employer')) {
      fieldValues[field.id] = userProfile.professional?.company || ''
    } else if (label.includes('industry')) {
      fieldValues[field.id] = userProfile.professional?.industry || ''
    } else if (label.includes('linkedin')) {
      fieldValues[field.id] = userProfile.professional?.linkedIn || ''
    } else if (label.includes('website') || label.includes('portfolio')) {
      fieldValues[field.id] = userProfile.professional?.website || userProfile.professional?.portfolio || ''
    }
  }
  
  // Remove empty values
  const filledValues = Object.fromEntries(Object.entries(fieldValues).filter(([, v]) => v))
  
  if (Object.keys(filledValues).length === 0) {
    return null
  }
  
  return {
    message: `✨ I've filled ${Object.keys(filledValues).length} fields with your profile data!`,
    action: {
      type: "fill_form",
      payload: {
        formId: selectedForm.id,
        fieldValues: filledValues
      }
    },
    suggestions: ["Review the filled data", "Submit the form", "Edit any field"]
  }
}

// ============ API ROUTE HANDLER ============
export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [], selectedForm = null, userProfile = null } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const providers = getProviders()

    // Check for fill request with quick fallback
    const lowerMessage = message.toLowerCase()
    const isFillRequest = lowerMessage.includes('fill') || lowerMessage.includes('auto-fill') || 
                          lowerMessage.includes('use my profile') || lowerMessage.includes('use my info') ||
                          lowerMessage.includes('fill with my') || lowerMessage.includes('autofill')

    if (isFillRequest && selectedForm && userProfile) {
      const fillResponse = createFillResponse(selectedForm, userProfile)
      if (fillResponse) {
        return NextResponse.json(fillResponse)
      }
    }

    // Build messages with form and profile context
    const contextPrompt = buildContextPrompt(selectedForm, userProfile)
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + contextPrompt },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Try each provider
    let lastError: Error | null = null
    
    for (const provider of providers) {
      try {
        const completion = await provider.client.chat.completions.create({
          model: provider.model,
          messages,
          max_tokens: 2048,
          temperature: 0.7,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) throw new Error('Empty response')
        
        // Parse JSON
        let parsed
        try {
          let cleaned = content.trim()
          if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
          if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
          if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
          parsed = JSON.parse(cleaned.trim())
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
          else throw new Error('Could not parse JSON')
        }

        // Replace CURRENT_FORM_ID placeholder
        if (parsed.action?.payload?.formId === 'CURRENT_FORM_ID' && selectedForm?.id) {
          parsed.action.payload.formId = selectedForm.id
        }

        // Add default styling for new forms
        if (parsed.action?.type === 'create_form' && !parsed.action.payload?.styling) {
          parsed.action.payload.styling = getDefaultStyling()
        }

        return NextResponse.json(parsed)

      } catch (error: any) {
        lastError = error
        continue
      }
    }

    // Fallback - check for fill request
    if (isFillRequest) {
      if (!selectedForm) {
        return NextResponse.json({
          message: "Please select a form first, then I can fill it with your profile data.",
          action: { type: "none" },
          suggestions: ["Create a form first", "Select an existing form"]
        })
      }
      if (!userProfile) {
        return NextResponse.json({
          message: "Please fill out your profile first! Click the Profile button in the header to add your information.",
          action: { type: "none" },
          suggestions: ["Open my profile", "What info do you need?"]
        })
      }
    }

    // Fallback to demo
    const formType = detectFormType(message)
    const demoResponse = { ...DEMO_RESPONSES[formType] || DEMO_RESPONSES.default }
    
    // Add default styling to demo forms
    if (demoResponse.action?.type === 'create_form') {
      demoResponse.action.payload.styling = getDefaultStyling()
    }

    return NextResponse.json({
      ...demoResponse,
      message: `${demoResponse.message}`
    })

  } catch (error: any) {
    console.error('[RevoForms] API error:', error)
    return NextResponse.json({ error: 'Failed to process', details: error.message }, { status: 500 })
  }
}

function getDefaultStyling() {
  return {
    theme: 'glassmorphism',
    colors: {
      primary: '#06b6d4',
      secondary: '#a855f7',
      background: 'rgba(15, 15, 26, 0.8)',
      surface: 'rgba(255, 255, 255, 0.05)',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(255, 255, 255, 0.1)',
      error: '#f87171',
      success: '#4ade80',
      accent: '#a855f7'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
    spacing: { fieldGap: '20px', padding: '24px' },
    borderRadius: { input: '12px', button: '12px', form: '20px' },
    shadows: true,
    animation: true
  }
}
