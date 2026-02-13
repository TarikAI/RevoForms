'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Plus, Settings, HelpCircle, User, UserCircle, FileText, ChevronDown, Focus, Trash2, Layers, LayoutTemplate, BarChart3, Plug, Shield, Code, Users, Database, Bell, Mail, Lock, Menu, X, FolderPlus, Share2, Copy } from 'lucide-react'
import { useFormStore } from '@/store/formStore'
import { useChatStore } from '@/store/chatStore'
import { useProfileStore, getProfileCompleteness } from '@/store/profileStore'
import { TemplatesModal } from '@/components/templates/TemplatesModal'
import { IntegrationsModal } from '@/components/integrations/IntegrationsModal'
import { ShareModal } from '@/components/share/ShareModal'
import { MultiFileUploadZone } from '@/components/upload/MultiFileUploadZone'
import { signIn, signOut, useSession } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showFormsMenu, setShowFormsMenu] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareFormId, setShareFormId] = useState<string | null>(null)
  const [showMultiFileUpload, setShowMultiFileUpload] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const formsMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const toolsMenuRef = useRef<HTMLDivElement>(null)

  // Handle hydration
  useEffect(() => { setMounted(true) }, [])
  
  const forms = useFormStore((state) => state.forms)
  const selectedFormId = useFormStore((state) => state.selectedFormId)
  const selectForm = useFormStore((state) => state.selectForm)
  const focusOnForm = useFormStore((state) => state.focusOnForm)
  const deleteForm = useFormStore((state) => state.deleteForm)
  const duplicateForm = useFormStore((state) => state.duplicateForm)
  const { clearMessages, focusInput } = useChatStore()
  const { profile, openProfileModal } = useProfileStore()
  
  const completeness = getProfileCompleteness(profile)

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formsMenuRef.current && !formsMenuRef.current.contains(e.target as Node)) {
        setShowFormsMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNewProject = () => {
    clearMessages()
    focusInput()
    setShowFormsMenu(false)
    // Scroll to bottom of page to show chat
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  const handleFocusForm = (formId: string) => {
    selectForm(formId)
    focusOnForm(formId)
    setShowFormsMenu(false)
  }

  const handleDeleteForm = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation()
    if (confirm('Delete this form?')) {
      deleteForm(formId)
    }
  }

  const handleShareForm = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation()
    setShareFormId(formId)
    setShowShareModal(true)
    setShowFormsMenu(false)
  }

  const handleDuplicateForm = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation()
    const newId = duplicateForm(formId)
    if (newId) {
      setShowFormsMenu(false)
    }
  }

  // Show loading state during hydration
  const formsCount = mounted ? forms.length : 0

  return (
    <header className="h-14 border-b border-white/10 bg-space-light/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 relative z-[200]">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold text-white hidden sm:block">
            Revo<span className="text-neon-cyan">Forms</span>
          </span>
        </button>

        {/* Dashboard Button */}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm transition-colors"
        >
          <BarChart3 className="w-4 h-4 text-neon-cyan" />
          <span className="font-medium">Dashboard</span>
        </button>

        {/* Projects Button */}
        <button
          onClick={() => window.location.href = '/projects'}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm transition-colors"
        >
          <FolderPlus className="w-4 h-4 text-orange-400" />
          <span className="font-medium">Projects</span>
        </button>
        
        {/* Forms Dropdown */}
        <div className="relative" ref={formsMenuRef}>
          <button 
            onClick={() => setShowFormsMenu(!showFormsMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              showFormsMenu 
                ? 'bg-neon-cyan/20 border-neon-cyan/50 shadow-lg shadow-neon-cyan/20' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <Layers className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm text-white/90 hidden sm:inline font-medium">
              {formsCount === 0 ? 'No forms' : `${formsCount} form${formsCount !== 1 ? 's' : ''}`}
            </span>
            <span className="text-sm text-white/90 sm:hidden font-medium">{formsCount}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${showFormsMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showFormsMenu && mounted && (
            <div 
              className="absolute left-0 top-full mt-2 py-0 w-80 rounded-xl overflow-hidden"
              style={{ 
                backgroundColor: '#0a0a18',
                border: '2px solid rgba(6,182,212,0.5)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.95), 0 0 60px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                zIndex: 99999,
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Header */}
              <div 
                className="px-4 py-3 border-b border-neon-cyan/30 flex items-center justify-between"
                style={{ backgroundColor: 'rgba(6,182,212,0.15)' }}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neon-cyan" />
                  <span className="text-sm font-semibold text-neon-cyan">Your Forms</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-medium">
                  {formsCount}
                </span>
              </div>
              
              {formsCount === 0 ? (
                <div className="px-4 py-8 text-center" style={{ backgroundColor: '#0a0a18' }}>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-sm text-white/70 font-medium">No forms created yet</p>
                  <p className="text-xs text-white/40 mt-1">Ask AI to create your first form!</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto" style={{ backgroundColor: '#0a0a18' }}>
                  {forms.map((form, idx) => {
                    const isSelected = selectedFormId === form.id
                    return (
                      <div 
                        key={form.id}
                        className={`flex items-center justify-between px-3 py-3 transition-all duration-150 cursor-pointer group ${
                          isSelected 
                            ? 'bg-neon-cyan/15 border-l-3 border-l-neon-cyan' 
                            : 'hover:bg-white/5 border-l-3 border-l-transparent'
                        }`}
                        style={{ 
                          backgroundColor: isSelected ? 'rgba(6,182,212,0.2)' : '#0a0a18',
                          borderLeftWidth: '3px'
                        }}
                        onClick={() => handleFocusForm(form.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div 
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected 
                                ? 'bg-neon-cyan/30 shadow-lg shadow-neon-cyan/20' 
                                : 'bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10'
                            }`}
                          >
                            <span className={`text-sm font-bold ${isSelected ? 'text-neon-cyan' : 'text-white/70'}`}>
                              {idx + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-white/90'}`}>
                              {form.name || 'Untitled Form'}
                            </p>
                            <p className="text-[11px] text-white/50">
                              {form.fields?.length || 0} fields
                              {isSelected && <span className="ml-2 text-neon-cyan">• Selected</span>}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleShareForm(e, form.id)}
                            className="p-1.5 hover:bg-neon-cyan/20 rounded-lg text-white/50 hover:text-neon-cyan transition-all"
                            title="Share form"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDuplicateForm(e, form.id)}
                            className="p-1.5 hover:bg-neon-purple/20 rounded-lg text-white/50 hover:text-neon-purple transition-all"
                            title="Duplicate form"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleFocusForm(form.id) }}
                            className="p-1.5 hover:bg-neon-cyan/20 rounded-lg text-white/50 hover:text-neon-cyan transition-all"
                            title="Focus on form"
                          >
                            <Focus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteForm(e, form.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-all"
                            title="Delete form"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Footer with Create Button */}
              <div className="px-3 py-3 border-t border-neon-cyan/20" style={{ backgroundColor: 'rgba(6,182,212,0.08)' }}>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setShowTemplatesModal(true); setShowFormsMenu(false) }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm text-white/90 font-medium transition-all"
                  >
                    <LayoutTemplate className="w-4 h-4" /> Templates
                  </button>
                  <button
                    onClick={handleNewProject}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 rounded-lg text-sm text-white font-semibold transition-all shadow-lg shadow-neon-cyan/20"
                  >
                    <Plus className="w-4 h-4" /> New Form
                  </button>
                  <button
                    onClick={() => { setShowMultiFileUpload(true); setShowFormsMenu(false) }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 hover:text-white font-medium transition-all"
                  >
                    <FolderPlus className="w-4 h-4" /> Upload Forms
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Mobile Menu Toggle */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Menu"
      >
        {showMobileMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Right: Tools Menu */}
      <div className="hidden md:block">
        <div className="relative" ref={toolsMenuRef}>
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              showToolsMenu
                ? 'bg-neon-cyan/20 border-neon-cyan/50 shadow-lg shadow-neon-cyan/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <Settings className="w-4 h-4 text-neon-purple" />
            <span className="text-sm text-white/90 font-medium">Tools</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${showToolsMenu ? 'rotate-180' : ''}`} />
          </button>

          {showToolsMenu && (
            <div
              className="absolute right-0 top-full mt-2 py-2 w-64 rounded-xl overflow-hidden"
              style={{
                backgroundColor: '#0a0a18',
                border: '2px solid rgba(168,85,247,0.5)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.95), 0 0 60px rgba(168,85,247,0.3)',
                zIndex: 99999,
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Form Tools</p>
              </div>

              <button
                onClick={() => { window.location.href = '/security' }}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center group-hover:from-green-500/30 group-hover:to-emerald-500/30">
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Security</p>
                  <p className="text-xs text-white/50">Advanced protection features</p>
                </div>
              </button>

              <button
                onClick={() => { window.location.href = '/collaboration' }}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Collaboration</p>
                  <p className="text-xs text-white/50">Real-time team editing</p>
                </div>
              </button>

              <button
                onClick={() => { window.location.href = '/custom-code' }}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-indigo-500/30 group-hover:to-purple-500/30">
                  <Code className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Custom Code</p>
                  <p className="text-xs text-white/50">Inject JS/CSS/HTML</p>
                </div>
              </button>

              <button
                onClick={() => { window.location.href = '/import-export' }}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30">
                  <Database className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Import/Export</p>
                  <p className="text-xs text-white/50">Migrate forms easily</p>
                </div>
              </button>

              <button
                onClick={() => { window.location.href = '/notifications' }}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-indigo-500/30">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Notifications</p>
                  <p className="text-xs text-white/50">Smart alerts system</p>
                </div>
              </button>

              <button
                onClick={() => { window.location.href = '/compliance' }}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center group-hover:from-green-500/30 group-hover:to-emerald-500/30">
                  <Lock className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">GDPR Compliance</p>
                  <p className="text-xs text-white/50">Privacy & data protection</p>
                </div>
              </button>

              <div className="px-3 py-2 border-t border-white/10 mt-2">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Quick Links</p>
              </div>

              <button
                onClick={() => setShowTemplatesModal(true)}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30">
                  <LayoutTemplate className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Templates</p>
                  <p className="text-xs text-white/50">Browse form templates</p>
                </div>
              </button>

              <button
                onClick={() => setShowIntegrationsModal(true)}
                className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-500/30">
                  <Plug className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Integrations</p>
                  <p className="text-xs text-white/50">Connect your tools</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Templates, Integrations, Profile & Settings */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Templates Button - Hidden on desktop, shown on mobile */}
        <button
          onClick={() => setShowTemplatesModal(true)}
          className="md:hidden flex items-center gap-1.5 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm transition-colors"
          title="Form Templates"
        >
          <LayoutTemplate className="w-4 h-4 text-neon-purple" />
        </button>

        {/* Integrations Button - Hidden on desktop, shown on mobile */}
        <button
          onClick={() => setShowIntegrationsModal(true)}
          className="md:hidden flex items-center gap-1.5 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm transition-colors"
          title="Integrations & Analytics"
        >
          <Plug className="w-4 h-4 text-neon-cyan" />
        </button>

  
        <button
          onClick={() => {
            if (session) {
              openProfileModal()
            } else {
              window.location.href = '/auth/signin'
            }
          }}
          className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm transition-colors"
          title={session ? "My Profile" : "Sign In"}
        >
          <UserCircle className="w-4 h-4" />
          <span className="hidden md:inline">{session ? 'Profile' : 'Sign In'}</span>
          {mounted && session && profile && completeness < 100 && (
            <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
          )}
        </button>

        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden md:flex" title="Help">
          <HelpCircle className="w-5 h-5 text-white/50" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden md:flex" title="Settings">
          <Settings className="w-5 h-5 text-white/50" />
        </button>
        
        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="ml-1 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <User className="w-4 h-4 text-white" />
          </button>
          
          {showUserMenu && (
            <div 
              className="absolute right-0 top-full mt-2 py-2 w-48 rounded-xl shadow-xl overflow-hidden"
              style={{ 
                backgroundColor: '#0d0d1a',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)',
                zIndex: 9999
              }}
            >
              {session ? (
                <>
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">{session.user?.email}</p>
                    <p className="text-xs text-white/50">Signed in</p>
                  </div>
                  <button
                    onClick={() => { openProfileModal(); setShowUserMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                  >
                    <UserCircle className="w-4 h-4" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      signOut()
                      setShowUserMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">Guest User</p>
                    <p className="text-xs text-white/50">Sign in to save forms</p>
                  </div>
                  <a
                    href="/auth/signin"
                    className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 block"
                  >
                    Sign In
                  </a>
                  <a
                    href="/auth/signup"
                    className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 block"
                  >
                    Create Account
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Templates Modal */}
      <TemplatesModal isOpen={showTemplatesModal} onClose={() => setShowTemplatesModal(false)} />
      
      {/* Integrations & Analytics Modal */}
      <IntegrationsModal isOpen={showIntegrationsModal} onClose={() => setShowIntegrationsModal(false)} />
      
      {/* Share Modal */}
      {shareFormId && (
        <ShareModal
          form={forms.find(f => f.id === shareFormId)!}
          isOpen={showShareModal}
          onClose={() => { setShowShareModal(false); setShareFormId(null) }}
        />
      )}

      {/* Multi-File Upload Modal */}
      <MultiFileUploadZone
        isOpen={showMultiFileUpload}
        onClose={() => setShowMultiFileUpload(false)}
        onFormCreated={(formData) => {
          const formStore = require('@/store/formStore').default.getState() as any
          formStore.addForm(formData)
        }}
      />
    </header>
  )
}
