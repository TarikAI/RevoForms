# RevoForms TypeScript Error Fix Prompt for Claude in VSCode

## Context
RevoForms is a Next.js 15.1.9 form builder application being deployed to Vercel. The build is failing due to TypeScript errors. This prompt provides all necessary context to fix every error.

## Current Errors to Fix

### 1. ABTesting.tsx Syntax Error (Line 692)
**File:** `src/components/testing/ABTesting.tsx`
**Error:** `')' expected` at line 692

This is likely a cascading error from earlier in the file. Check for:
- Unclosed parentheses, brackets, or braces
- Missing commas in JSX props
- Incorrect ternary operators
- Malformed template literals

### 2. API Route Type Errors

All API routes with empty arrays need explicit typing. Pattern to fix:

**BAD:**
```typescript
const result = {
  items: [],
  data: []
}
```

**GOOD:**
```typescript
const result: {
  items: Array<{ id: string; name: string }>
  data: Array<{ type: string; value: string }>
} = {
  items: [],
  data: []
}
```

### 3. Uninitialized Variables

**BAD:**
```typescript
let aiMessage: string
if (condition) {
  aiMessage = "Hello"
}
```

**GOOD:**
```typescript
let aiMessage: string = ''
if (condition) {
  aiMessage = "Hello"
}
```

## Files That May Need Fixes

Run this command to find all TypeScript errors:
```bash
npx tsc --noEmit 2>&1
```

Common files with issues:
- `src/app/api/ai/analyze/route.ts` - Already fixed
- `src/app/api/ai/optimize/route.ts` - Already fixed  
- `src/app/api/ai/interview/route.ts` - Already fixed
- `src/components/testing/ABTesting.tsx` - NEEDS FIX
- Any file with `[]` arrays that get `.push()` called

## How to Fix Each Pattern

### Pattern A: Empty Array Type Inference
When TypeScript sees `[]`, it infers `never[]`. Add explicit types:

```typescript
// Before
const analysis = {
  issues: [],
  recommendations: []
}

// After  
const analysis: {
  issues: Array<{ type: string; message: string }>
  recommendations: Array<{ title: string; description: string }>
} = {
  issues: [],
  recommendations: []
}
```

### Pattern B: Variable Used Before Assignment
Initialize all variables that might be used conditionally:

```typescript
// Before
let response: Response
let message: string

// After
let response: Response | undefined
let message: string = ''
```

### Pattern C: JSX Syntax Errors
Check for these common issues:
- Missing closing tags
- Unclosed curly braces in expressions
- Missing commas between props
- Incorrect conditional rendering syntax

## Instructions

1. First, run `npx tsc --noEmit` to get the full list of errors
2. Fix each error systematically starting from the first file
3. After each fix, run `npx tsc --noEmit` again to verify
4. Once all errors are fixed, run `npm run build` to verify production build

## Supabase Integration Notes

The project now has Supabase configured:
- Client: `src/lib/supabase.ts`
- Types: `src/types/database.ts`  
- Schema: `supabase/schema.sql`

Environment variables needed in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)

## Vercel Environment Variables

Make sure these are set in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://zbxtgfwcscfvwilnlnvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ZAI_API_KEY=edd2c82c6f134a0a832765f2925d2131.9e4q1vgVjSonaLED
ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4
ZAI_MODEL=glm-4.6
NEXTAUTH_SECRET=revoforms-production-secret-key-2024
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_EXPORT=true
```

## Final Checklist

- [ ] All TypeScript errors fixed (`npx tsc --noEmit` passes)
- [ ] Build succeeds (`npm run build` passes)
- [ ] All environment variables set in Vercel
- [ ] Supabase schema executed in Supabase SQL Editor
- [ ] Git committed and pushed
