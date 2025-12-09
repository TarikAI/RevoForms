# Changelog

All notable changes to RevoForms will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-10 - "Genesis"

### Added

#### AI & Voice Features
- AI conversational form builder using Z.ai GLM-4.6 model
- Voice input for form creation (Web Speech API)
- AI Avatar assistant with state animations (idle, listening, thinking, speaking, error)
- PDF and image-to-form extraction
- Smart field generation with 30+ field types
- Context-aware responses using conversation history

#### Form Builder
- Infinite canvas with drag-and-drop interface
- Real-time form preview
- Field popup editor with advanced options
- Properties panel with 4 tabs (Form, Fields, Style, CSS)
- Multi-column layout support
- Conditional logic (UI prepared)
- Form duplication
- Keyboard shortcuts

#### Export & Integration
- Multi-format export: HTML, React, JSON, WordPress, PDF
- Embed code generator (inline, popup, slide-in)
- QR code generation for form links
- Shareable form links
- "Powered by RevoForms" viral badge

#### Design System
- Glassmorphism design theme
- Custom CSS with 20+ targetable class names
- Real-time style editor
- Color picker integration
- Typography controls
- Spacing and border radius adjustments

#### User Experience
- User profile system (6 tabs) for AI auto-fill
- Response collection backend (localStorage)
- Basic analytics dashboard
- Form templates (10 pre-built)
- Dark mode by default

### Infrastructure
- Next.js 15 with App Router
- React 18 with Turbopack
- Zustand for state management with persistence
- Framer Motion for animations
- pdf-lib for PDF generation
- Web Speech API for voice features

### Known Limitations
- Data stored in localStorage only (no cloud sync)
- No user authentication
- No team collaboration features
- Integrations are UI-ready but not connected to backends
- No CAPTCHA protection

---

## [Unreleased]

### Planned for v1.1.0
- Google Sheets integration
- Email notifications on form submission
- Zapier integration
- Additional templates

### Planned for v1.2.0
- User authentication (Supabase)
- Cloud sync for forms
- Team collaboration
- Payment processing (Stripe)

---

## Version Naming Convention

Each major release has a codename:
- **1.0.0** - Genesis (Initial Release)
- **2.0.0** - TBD (Authentication & Cloud)
- **3.0.0** - TBD (Enterprise Features)

## Upgrade Guide

### Migrating from 0.x to 1.0.0
No migration needed - this is the initial release.

---

For detailed documentation, visit [docs.revoforms.com](https://docs.revoforms.com)
