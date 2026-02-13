# RevoForms - Complete Fix Instructions for Claude in VS Code

## PRIORITY 1: TypeScript Errors to Fix

### Error 1: ABTesting.tsx (lines 692-694)
**File:** `src/components/testing/ABTesting.tsx`
**Error:** TS1005: ')' expected at line 692, TS1381: Unexpected token at line 694

**Action:** Search the entire file for:
- Unclosed parentheses, braces, or JSX tags
- Missing closing tags in JSX
- Incorrect ternary operator syntax
- Template literal issues

Look especially for:
1. Any `{tests.map(` or similar that might not be properly closed
2. Ternary operators `? :` that might be malformed
3. JSX elements that aren't properly closed

### Error 2: API Route Type Errors (ALREADY FIXED but verify)
These files were updated but verify they have proper TypeScript types:

1. `src/app/api/ai/analyze/route.ts` - needs explicit types for `analysis` object
2. `src/app/api/ai/interview/route.ts` - `aiMessage` should be initialized as `let aiMessage: string = ''`
3. `src/app/api/ai/optimize/route.ts` - needs explicit types for `optimizations` object

## PRIORITY 2: Supabase Integration

### Database Schema (run in Supabase SQL Editor)


## SUPABASE DATABASE SCHEMA

Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER PROFILES TABLE (Extended user info)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Personal Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(20),
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  -- Professional
  company VARCHAR(255),
  job_title VARCHAR(255),
  industry VARCHAR(100),
  website VARCHAR(255),
  linkedin VARCHAR(255),
  -- Education
  education_level VARCHAR(100),
  school VARCHAR(255),
  degree VARCHAR(255),
  graduation_year INTEGER,
  -- Custom Fields (JSONB for flexibility)
  custom_fields JSONB DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- FORMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled Form',
  description TEXT,
  -- Form Settings
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  is_public BOOLEAN DEFAULT false,
  requires_login BOOLEAN DEFAULT false,
  -- Styling (JSONB)
  theme JSONB DEFAULT '{"primaryColor": "#06b6d4", "backgroundColor": "#0a0a1a", "fontFamily": "Inter"}',
  custom_css TEXT,
  -- Form Structure (JSONB array of fields)
  fields JSONB DEFAULT '[]',
  -- Layout settings
  layout JSONB DEFAULT '{"type": "standard", "columns": 1}',
  -- Position on canvas
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  width INTEGER DEFAULT 600,
  height INTEGER DEFAULT 400,
  -- Settings
  settings JSONB DEFAULT '{
    "showProgressBar": true,
    "allowSave": true,
    "confirmationMessage": "Thank you for your submission!",
    "redirectUrl": null,
    "limitResponses": false,
    "responseLimit": null,
    "scheduleStart": null,
    "scheduleEnd": null
  }',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- FORM FIELDS TABLE (Alternative to JSONB)
-- ============================================
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  field_type VARCHAR(50) NOT NULL, -- text, email, number, textarea, select, checkbox, radio, file, date, etc.
  label VARCHAR(255) NOT NULL,
  placeholder VARCHAR(255),
  helper_text TEXT,
  -- Validation
  required BOOLEAN DEFAULT false,
  validation JSONB DEFAULT '{}', -- min, max, pattern, etc.
  -- Options (for select, radio, checkbox)
  options JSONB DEFAULT '[]',
  -- Conditional Logic
  conditions JSONB DEFAULT '[]',
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  -- Styling
  width VARCHAR(20) DEFAULT 'full', -- full, half, third
  custom_class VARCHAR(255),
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FORM SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  -- Submission Data
  data JSONB NOT NULL DEFAULT '{}',
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  -- Status
  status VARCHAR(20) DEFAULT 'completed', -- started, completed, abandoned
  completion_time INTEGER, -- seconds to complete
  -- Partial submission support
  is_partial BOOLEAN DEFAULT false,
  last_field_completed VARCHAR(255),
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FORM ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS form_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Counts
  views INTEGER DEFAULT 0,
  starts INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  abandonments INTEGER DEFAULT 0,
  -- Averages
  avg_completion_time INTEGER, -- seconds
  -- Device breakdown
  desktop_views INTEGER DEFAULT 0,
  mobile_views INTEGER DEFAULT 0,
  tablet_views INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(form_id, date)
);

-- ============================================
-- FORM TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- contact, survey, registration, feedback, etc.
  thumbnail_url TEXT,
  -- Template Data
  fields JSONB NOT NULL DEFAULT '[]',
  theme JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  -- Stats
  use_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- A/B TESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft, running, paused, completed
  -- Test Configuration
  metric VARCHAR(50) NOT NULL, -- completion_rate, conversion_rate, time_to_complete
  traffic_split JSONB DEFAULT '{"control": 50, "variant": 50}',
  -- Variants (JSONB array)
  variants JSONB NOT NULL DEFAULT '[]',
  -- Results
  winner_variant_id VARCHAR(255),
  confidence DECIMAL(5,2),
  -- Duration
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INTEGRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- google_sheets, zapier, webhook, email, slack
  name VARCHAR(255),
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOM CODE SNIPPETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS custom_code_snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- javascript, css, html
  code TEXT NOT NULL,
  position VARCHAR(20) DEFAULT 'body_end', -- head, body_start, body_end
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FILE UPLOADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
  field_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_analytics_form_id_date ON form_analytics(form_id, date);
CREATE INDEX IF NOT EXISTS idx_ab_tests_form_id ON ab_tests(form_id);
CREATE INDEX IF NOT EXISTS idx_integrations_form_id ON integrations(form_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own forms" ON forms FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create forms" ON forms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own forms" ON forms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own forms" ON forms FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view submissions to their forms" ON form_submissions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_submissions.form_id AND forms.user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_analytics_updated_at BEFORE UPDATE ON form_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment template use count
CREATE OR REPLACE FUNCTION increment_template_use_count()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called when a form is created from a template
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```



## SUPABASE CLIENT SETUP

Create or update `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for API routes)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types for database tables
export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Form {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  is_public: boolean
  requires_login: boolean
  theme: Record<string, any>
  custom_css: string | null
  fields: any[]
  layout: Record<string, any>
  position_x: number
  position_y: number
  width: number
  height: number
  settings: Record<string, any>
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface FormSubmission {
  id: string
  form_id: string
  user_id: string | null
  data: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  status: 'started' | 'completed' | 'abandoned'
  completion_time: number | null
  is_partial: boolean
  last_field_completed: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}
```

## INSTALL SUPABASE

Run this command:
```bash
npm install @supabase/supabase-js
```



---

## PROMPT FOR CLAUDE IN VS CODE

Copy and paste this entire prompt into Claude in VS Code:

---

**TASK: Fix RevoForms TypeScript Errors and Integrate Supabase**

I need you to fix all TypeScript errors in my RevoForms project so it can deploy to Vercel successfully.

## ERRORS TO FIX

### 1. ABTesting.tsx Syntax Error
**File:** `src/components/testing/ABTesting.tsx`
**Error:** Lines 692-694 have syntax errors: "')' expected" and "Unexpected token"

Please:
1. Open the file and carefully check for:
   - Unclosed JSX tags
   - Unclosed parentheses or braces in map() functions
   - Malformed ternary operators
   - Any syntax issues in the JSX structure
2. The file is 865 lines long, so check methodically
3. Look for any `{tests.map(` or similar that might not be properly closed

### 2. Type Errors in API Routes
Verify these files have proper TypeScript types (they may have been partially fixed):

**File:** `src/app/api/ai/analyze/route.ts`
- The `analysis` object needs explicit TypeScript types for `issues`, `recommendations`, `insights`, `fieldAnalysis`

**File:** `src/app/api/ai/interview/route.ts`  
- Variable `aiMessage` should be initialized: `let aiMessage: string = ''`

**File:** `src/app/api/ai/optimize/route.ts`
- The `optimizations` object needs explicit TypeScript types for `applied`, `predictedImpact`, `abTest`, `rolloutPlan`

### 3. Verify All Empty Array Types
Search for any `= []` declarations and ensure they have explicit types like `Array<Type>` or `Type[]`

## VERIFICATION COMMAND
After fixing, run: `npx tsc --noEmit`
This should complete with no errors.

## ADDITIONAL TASKS

### Install Supabase
```bash
npm install @supabase/supabase-js
```

### Create Supabase Client
Create `src/lib/supabase.ts` with proper client setup (see CLAUDE_FIX_INSTRUCTIONS.md for the code)

### Run the Database Schema
The SQL schema is in `CLAUDE_FIX_INSTRUCTIONS.md` - copy it to Supabase SQL Editor and run it.

---

**END OF PROMPT**

---

## QUICK REFERENCE: Environment Variables

Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `ZAI_API_KEY` - Your Z.ai API key
- `ZAI_BASE_URL` - https://api.z.ai/api/coding/paas/v4
- `ZAI_MODEL` - glm-4.6
- `NEXTAUTH_SECRET` - A secure random string
- `NEXT_PUBLIC_APP_URL` - Your production URL

## DEBUGGING TIPS

If TypeScript still fails:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npx tsc --noEmit` to see all errors
4. Fix errors one by one

If Vercel build runs out of memory:
- This is usually due to large component files
- Consider splitting large components into smaller ones
