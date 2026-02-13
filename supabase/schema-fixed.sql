-- =============================================
-- REVOFORMS COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- Created: January 21, 2026
-- FIXED: Trigger function delimiter issue
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Profile settings for AI auto-fill
  profile_data JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}'
);

-- =============================================
-- 2. FORMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Form metadata
  title TEXT NOT NULL DEFAULT 'Untitled Form',
  description TEXT,
  slug TEXT UNIQUE,

  -- Form definition (fields, styling, etc)
  form_data JSONB NOT NULL DEFAULT '{}',
  fields JSONB DEFAULT '[]',
  styling JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_template BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- =============================================
-- 3. FORM RESPONSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,

  -- Response data
  response_data JSONB NOT NULL DEFAULT '{}',

  -- Submission metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- Partial submission support
  is_partial BOOLEAN DEFAULT FALSE,
  resume_token TEXT UNIQUE,
  last_field_completed TEXT,

  -- Analytics
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER
);

-- =============================================
-- 4. FORM ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS form_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,

  -- Daily aggregated stats
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  starts INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  abandonment_rate DECIMAL(5,2),
  avg_completion_time_seconds INTEGER,

  -- Unique constraint for daily stats
  UNIQUE(form_id, date)
);

-- =============================================
-- 5. FORM FIELD ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS form_field_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,

  -- Field-level stats
  date DATE NOT NULL,
  interactions INTEGER DEFAULT 0,
  drop_offs INTEGER DEFAULT 0,
  avg_time_seconds INTEGER,

  UNIQUE(form_id, field_id, date)
);

-- =============================================
-- 6. INTEGRATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Integration type
  type TEXT NOT NULL CHECK (type IN ('google_sheets', 'zapier', 'webhook', 'email', 'slack', 'notion', 'airtable')),
  name TEXT NOT NULL,

  -- Configuration (encrypted in production)
  config JSONB NOT NULL DEFAULT '{}',

  -- OAuth tokens (if applicable)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. FORM INTEGRATIONS (M2M)
-- =============================================
CREATE TABLE IF NOT EXISTS form_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,

  -- Form-specific config
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(form_id, integration_id)
);

-- =============================================
-- 8. WEBHOOKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] DEFAULT ARRAY['submission'],

  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  thumbnail_url TEXT,

  -- Template definition
  form_data JSONB NOT NULL,

  -- Usage stats
  use_count INTEGER DEFAULT 0,

  -- Status
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. PROJECTS TABLE (for organization)
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#06b6d4',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project reference to forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- =============================================
-- 11. TEAMS TABLE (future feature)
-- =============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,

  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. TEAM MEMBERS (M2M)
-- =============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),

  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  UNIQUE(team_id, user_id)
);

-- =============================================
-- 13. AI CONVERSATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,

  messages JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. FILE UPLOADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES form_responses(id) ON DELETE CASCADE,

  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  storage_path TEXT NOT NULL,

  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 15. API KEYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification

  permissions JSONB DEFAULT '["read", "write"]',

  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 16. AUDIT LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,

  old_data JSONB,
  new_data JSONB,

  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON form_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_analytics_form_date ON form_analytics(form_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Forms policies
CREATE POLICY "Users can view own forms" ON forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- Public forms are viewable by anyone (for form filling)
CREATE POLICY "Published forms are public" ON forms
  FOR SELECT USING (status = 'published');

-- Responses policies
CREATE POLICY "Users can view responses to own forms" ON form_responses
  FOR SELECT USING (
    form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
  );

-- Anyone can submit responses to published forms
CREATE POLICY "Anyone can submit to published forms" ON form_responses
  FOR INSERT WITH CHECK (
    form_id IN (SELECT id FROM forms WHERE status = 'published')
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- DONE!
-- =============================================
SELECT 'RevoForms database schema created successfully!' AS status;
