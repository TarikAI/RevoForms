# RevoForms Feature Implementation Guide
## Comprehensive Prompt for Claude Code

**Project Path:** `D:\AI Projects\revoforms`
**Tech Stack:** Next.js 15, React 18, Zustand, Tailwind CSS, Framer Motion
**AI Provider:** Z.ai GLM-4.6 (primary), OpenRouter (fallback)

---

## 🎯 QUICK START

Copy this entire file to Claude Code as a prompt, or use these individual sections as needed.

**Priority Order:**
1. AI Avatar Enhancement (Forms That Talk Back) - KILLER FEATURE
2. Platform Integrations (Slack, Notion, Airtable, HubSpot, Salesforce)
3. CMS Integrations (Webflow, Shopify, Wix, Squarespace)
4. Team Collaboration System
5. Unlimited Free Responses Infrastructure
6. Conditional Logic Builder
7. PWA/Offline Support
8. WCAG 2.2 AA Accessibility
9. Template Gallery (50+ templates)

---

## PROMPT FOR CLAUDE CODE

```
I need you to implement the following features for RevoForms, an AI-powered form platform.
Project is at: D:\AI Projects\revoforms

PRIORITY 1: AI AVATAR ENHANCEMENT - "FORMS THAT TALK BACK"

This is our killer differentiator. Implement:

1. Viseme-based lip sync system:
   - Create /src/lib/visemes.ts with phoneme-to-viseme mapping
   - Update AvatarFace.tsx to animate mouth based on viseme input
   - Smooth interpolation between mouth shapes

2. Text-to-Speech service:
   - Create /src/services/ttsService.ts
   - Support browser TTS (free), ElevenLabs (premium), OpenAI TTS
   - Generate visemes from text for lip sync
   - Create /src/app/api/voice/tts/route.ts for server-side TTS

3. "Forms That Talk Back" component:
   - Create /src/components/form-builder/FormInterview.tsx
   - Avatar appears alongside form for respondents
   - Avatar explains questions, provides context
   - Can answer respondent questions in real-time
   - Voice input support for responses
   - Create /src/app/api/ai/interview/route.ts for AI responses

PRIORITY 2: PLATFORM INTEGRATIONS

Create API routes and UI for:

1. Slack Integration (/src/app/api/integrations/slack/route.ts):
   - Webhook notifications on form submission
   - Rich Slack message formatting with blocks
   - Test connection functionality

2. Notion Integration (/src/app/api/integrations/notion/route.ts):
   - Add form submissions to Notion databases
   - List available databases
   - Auto-map form fields to Notion properties

3. Airtable Integration (/src/app/api/integrations/airtable/route.ts):
   - Add records to Airtable bases
   - List bases and tables
   - Field mapping

4. HubSpot Integration (/src/app/api/integrations/hubspot/route.ts):
   - Create contacts from form submissions
   - Submit to HubSpot forms
   - Lead qualification

5. Salesforce Integration (/src/app/api/integrations/salesforce/route.ts):
   - Create leads and contacts
   - OAuth flow
   - Object field mapping

PRIORITY 3: CMS & WEBSITE BUILDER INTEGRATIONS

1. Webflow (/src/app/api/integrations/webflow/route.ts):
   - Generate embed code for Webflow
   - Add to CMS collections
   - Native widget support

2. Shopify (/src/app/api/integrations/shopify/route.ts):
   - Liquid snippet generator
   - Theme section schema
   - Cart/checkout integration

3. Wix (/src/app/api/integrations/wix/route.ts):
   - iframe and HTML component code
   - Velo (Corvid) integration code
   - Event handling

4. Squarespace (/src/app/api/integrations/squarespace/route.ts):
   - Code block embed
   - Code injection for popups
   - Trigger options (button, scroll, exit intent)

PRIORITY 4: TEAM COLLABORATION

1. Team Store (/src/store/teamStore.ts):
   - Team creation and management
   - Member roles (owner, admin, editor, viewer)
   - Invite via email
   - Permission management

2. Team UI (/src/components/team/TeamCollaboration.tsx):
   - Member list with roles
   - Invite form
   - Role management
   - Activity log

PRIORITY 5: UNLIMITED FREE RESPONSES

1. Usage Store (/src/store/usageStore.ts):
   - Track forms, submissions, storage
   - Plan limits (free, pro, team, enterprise)
   - All plans have unlimited forms and responses
   - Differentiation on features (branding, integrations, team size)

2. Usage Dashboard (/src/components/usage/UsageDashboard.tsx):
   - Visual usage stats
   - Plan comparison
   - Upgrade prompts

PRIORITY 6: CONDITIONAL LOGIC BUILDER

1. Types (/src/types/conditionalLogic.ts):
   - Conditions, operators, actions
   - Rule structure with groups

2. Logic Builder UI (/src/components/logic/ConditionalLogicBuilder.tsx):
   - Visual rule builder
   - Condition groups with AND/OR logic
   - Actions: show, hide, require, skip, set value
   - Enable/disable rules

PRIORITY 7: PWA & ACCESSIBILITY

1. PWA Setup:
   - Install next-pwa
   - Configure manifest.json
   - Service worker for offline form filling

2. WCAG 2.2 AA:
   - aria-labels on all interactive elements
   - Color contrast compliance
   - Keyboard navigation
   - Focus indicators
   - Screen reader support

PRIORITY 8: TEMPLATE GALLERY

Create /src/data/templates.ts with 50+ templates:
- Contact forms (5 variants)
- Surveys (5 variants)
- Registration forms (5 variants)
- Feedback forms (5 variants)
- Job applications (5 variants)
- Event RSVPs (5 variants)
- Lead generation (5 variants)
- Support tickets (5 variants)
- Quizzes (5 variants)
- Order forms (5 variants)

Each template should have:
- Unique ID
- Name and description
- Category
- Pre-configured fields
- Suggested styling
- Thumbnail/preview

---

IMPLEMENTATION NOTES:

- Use existing component patterns (motion, tailwind, glassmorphism)
- Integrate with existing stores (formStore, chatStore, profileStore)
- Follow the existing API route structure
- Use Z.ai for AI features, OpenRouter as fallback
- All integrations should have:
  - API routes
  - Configuration UI
  - Test connection feature
  - Error handling

Start with Priority 1 (AI Avatar) as it's the most differentiating feature.
```

---

## DETAILED IMPLEMENTATION CODE

The full implementation code for each feature is available in the complete prompt file.
See: /mnt/user-data/outputs/CLAUDE_CODE_IMPLEMENTATION_PROMPT.md

---

## FILES TO CREATE

### AI Avatar System
- `/src/lib/visemes.ts`
- `/src/services/ttsService.ts`
- `/src/app/api/voice/tts/route.ts`
- `/src/components/form-builder/FormInterview.tsx`
- `/src/app/api/ai/interview/route.ts`
- Update `/src/components/avatar/AvatarFace.tsx`

### Platform Integrations
- `/src/app/api/integrations/slack/route.ts`
- `/src/app/api/integrations/notion/route.ts`
- `/src/app/api/integrations/airtable/route.ts`
- `/src/app/api/integrations/hubspot/route.ts`
- `/src/app/api/integrations/salesforce/route.ts`

### CMS Integrations
- `/src/app/api/integrations/webflow/route.ts`
- `/src/app/api/integrations/shopify/route.ts`
- `/src/app/api/integrations/wix/route.ts`
- `/src/app/api/integrations/squarespace/route.ts`

### Team Collaboration
- `/src/store/teamStore.ts`
- `/src/components/team/TeamCollaboration.tsx`
- `/src/app/api/team/invite/route.ts`

### Usage & Billing
- `/src/store/usageStore.ts`
- `/src/components/usage/UsageDashboard.tsx`

### Conditional Logic
- `/src/types/conditionalLogic.ts`
- `/src/components/logic/ConditionalLogicBuilder.tsx`
- `/src/hooks/useConditionalLogic.ts`

### Templates
- `/src/data/templates.ts`
- `/src/components/templates/TemplateGallery.tsx`

---

## ENVIRONMENT VARIABLES NEEDED

Add these to `.env.local`:

```env
# Text-to-Speech (optional - falls back to browser TTS)
ELEVENLABS_API_KEY=your-key
NEXT_PUBLIC_ELEVENLABS_API_KEY=your-key

# Salesforce OAuth (optional)
SALESFORCE_CLIENT_ID=your-client-id
SALESFORCE_CLIENT_SECRET=your-client-secret
```

---

## TESTING CHECKLIST

After implementation, verify:

- [ ] Avatar speaks with lip sync animation
- [ ] TTS works (browser at minimum)
- [ ] FormInterview guides users through forms
- [ ] AI answers questions about form fields
- [ ] Slack notifications arrive with rich formatting
- [ ] Notion entries are created with correct fields
- [ ] Airtable records are added successfully
- [ ] HubSpot contacts are created
- [ ] Salesforce leads are created
- [ ] Webflow embed code renders correctly
- [ ] Shopify Liquid snippet works in themes
- [ ] Wix iframe and Velo code work
- [ ] Squarespace embed and popup work
- [ ] Team invites send and can be accepted
- [ ] Usage tracking records submissions
- [ ] Conditional logic shows/hides fields
- [ ] PWA installs on mobile
- [ ] All elements are keyboard accessible

---

**Copy this entire file to Claude Code to begin implementation.**
