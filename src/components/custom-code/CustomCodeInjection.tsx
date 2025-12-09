'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Play, Save, Trash2, Copy, Check, AlertTriangle, Upload,
  Download, FileText, FileCode, Palette, Eye, EyeOff, Settings,
  Plus, X, ChevronDown, ChevronRight, Zap, Globe, Shield, Database
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'

interface CodeSnippet {
  id: string
  name: string
  type: 'javascript' | 'css' | 'html'
  code: string
  description: string
  placement: 'head' | 'body' | 'footer'
  enabled: boolean
  trigger: 'always' | 'onload' | 'onsubmit' | 'onsuccess' | 'onerror'
  conditions: {
    device?: 'all' | 'desktop' | 'mobile' | 'tablet'
    page?: string
    utm_source?: string
    referrer?: string
  }
}

interface SavedSnippet {
  id: string
  name: string
  code: string
  type: 'javascript' | 'css' | 'html'
  category: string
  tags: string[]
  createdAt: Date
  used: number
}

export function CustomCodeInjection() {
  const { currentForm } = useFormStore()
  const [activeTab, setActiveTab] = useState<'editor' | 'library' | 'analytics'>('editor')
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([
    {
      id: '1',
      name: 'Google Analytics',
      type: 'javascript',
      code: `<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>`,
      description: 'Track form views and submissions',
      placement: 'head',
      enabled: true,
      trigger: 'always',
      conditions: { device: 'all' }
    },
    {
      id: '2',
      name: 'Custom CSS',
      type: 'css',
      code: `.form-field {
  border-radius: 12px !important;
  transition: all 0.3s ease;
}

.form-field:focus {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}`,
      description: 'Enhanced form field styling',
      placement: 'head',
      enabled: true,
      trigger: 'always',
      conditions: { device: 'all' }
    },
    {
      id: '3',
      name: 'Facebook Pixel',
      type: 'javascript',
      code: `<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>`,
      description: 'Track conversions for Facebook ads',
      placement: 'head',
      enabled: false,
      trigger: 'onload',
      conditions: { device: 'all' }
    }
  ])

  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([
    {
      id: '1',
      name: 'Form Validation Enhancement',
      code: `// Custom validation logic
document.querySelector('form').addEventListener('submit', function(e) {
  const email = document.getElementById('email').value;
  if (!email.includes('@')) {
    alert('Please enter a valid email address');
    e.preventDefault();
  }
});`,
      type: 'javascript',
      category: 'Validation',
      tags: ['validation', 'form', 'email'],
      createdAt: new Date(Date.now() - 86400000),
      used: 15
    },
    {
      id: '2',
      name: 'Progress Bar',
      code: `.progress-bar {
  height: 4px;
  background: linear-gradient(to right, #4F46E5, #7C3AED);
  position: fixed;
  top: 0;
  left: 0;
  transition: width 0.3s ease;
  z-index: 9999;
}`,
      type: 'css',
      category: 'UI/UX',
      tags: ['progress', 'bar', 'visual'],
      createdAt: new Date(Date.now() - 172800000),
      used: 8
    }
  ])

  const [currentSnippet, setCurrentSnippet] = useState<CodeSnippet>({
    id: '',
    name: '',
    type: 'javascript',
    code: '',
    description: '',
    placement: 'head',
    enabled: true,
    trigger: 'always',
    conditions: { device: 'all' }
  })

  const [previewMode, setPreviewMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['placement', 'trigger', 'conditions']))

  const tabs = [
    { id: 'editor', label: 'Code Editor', icon: Code2 },
    { id: 'library', label: 'Snippet Library', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: Globe }
  ]

  const codeTemplates = [
    {
      name: 'Custom Thank You Message',
      type: 'javascript' as const,
      code: `// Custom thank you message
window.addEventListener('form-success', function(e) {
  const message = document.createElement('div');
  message.innerHTML = 'Thank you for your submission!';
  message.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#4F46E5;color:white;padding:20px;border-radius:8px;z-index:9999;';
  document.body.appendChild(message);
  setTimeout(() => message.remove(), 3000);
});`
    },
    {
      name: 'Animated Submit Button',
      type: 'css' as const,
      code: `.submit-button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.submit-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.submit-button:hover::before {
  left: 100%;
}`
    },
    {
      name: 'Exit Intent Popup',
      type: 'javascript' as const,
      code: `// Exit intent popup
document.addEventListener('mouseleave', function(e) {
  if (e.clientY < 0) {
    const popup = document.createElement('div');
    popup.innerHTML = 'Wait! Get 10% off before you leave!';
    popup.style.cssText = 'position:fixed;top:20px;right:20px;background:#F59E0B;color:white;padding:15px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(popup);
  }
});`
    }
  ]

  const handleAddSnippet = () => {
    const newSnippet: CodeSnippet = {
      ...currentSnippet,
      id: Date.now().toString(),
      name: currentSnippet.name || 'Untitled Snippet'
    }
    setCodeSnippets(prev => [...prev, newSnippet])
    setCurrentSnippet({
      id: '',
      name: '',
      type: 'javascript',
      code: '',
      description: '',
      placement: 'head',
      enabled: true,
      trigger: 'always',
      conditions: { device: 'all' }
    })
  }

  const handleUpdateSnippet = (id: string, updates: Partial<CodeSnippet>) => {
    setCodeSnippets(prev => prev.map(snippet =>
      snippet.id === id ? { ...snippet, ...updates } : snippet
    ))
  }

  const handleDeleteSnippet = (id: string) => {
    setCodeSnippets(prev => prev.filter(snippet => snippet.id !== id))
  }

  const handleToggleSnippet = (id: string) => {
    setCodeSnippets(prev => prev.map(snippet =>
      snippet.id === id ? { ...snippet, enabled: !snippet.enabled } : snippet
    ))
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveToLibrary = () => {
    if (!currentSnippet.name || !currentSnippet.code) return

    const newSavedSnippet: SavedSnippet = {
      id: Date.now().toString(),
      name: currentSnippet.name,
      code: currentSnippet.code,
      type: currentSnippet.type,
      category: 'Custom',
      tags: [],
      createdAt: new Date(),
      used: 0
    }

    setSavedSnippets(prev => [...prev, newSavedSnippet])
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

  const handleUseFromLibrary = (snippet: SavedSnippet) => {
    setCurrentSnippet({
      id: '',
      name: snippet.name,
      type: snippet.type,
      code: snippet.code,
      description: '',
      placement: 'head',
      enabled: true,
      trigger: 'always',
      conditions: { device: 'all' }
    })
    setActiveTab('editor')
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getCodeLanguage = (type: CodeSnippet['type']) => {
    switch (type) {
      case 'javascript': return 'javascript'
      case 'css': return 'css'
      case 'html': return 'html'
    }
  }

  const getTypeIcon = (type: CodeSnippet['type']) => {
    switch (type) {
      case 'javascript': return FileCode
      case 'css': return Palette
      case 'html': return FileText
    }
  }

  const getTypeColor = (type: CodeSnippet['type']) => {
    switch (type) {
      case 'javascript': return 'text-yellow-600 bg-yellow-100'
      case 'css': return 'text-blue-600 bg-blue-100'
      case 'html': return 'text-orange-600 bg-orange-100'
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <Code2 className="w-10 h-10" />
            Custom Code Injection
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Add custom JavaScript, CSS, and HTML to your forms
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Snippets</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {codeSnippets.filter(s => s.enabled).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Snippets</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {codeSnippets.length}
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Library Items</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {savedSnippets.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Performance</p>
                <p className="text-3xl font-bold text-green-600 mt-1">98%</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex space-x-1 p-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'editor' && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Code Editor */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={currentSnippet.name}
                          onChange={(e) => setCurrentSnippet(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Snippet Name"
                          className="text-xl font-semibold bg-transparent border-b-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 outline-none pb-1 text-slate-900 dark:text-slate-100"
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              previewMode
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {previewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            Preview
                          </button>
                          {currentSnippet.code && (
                            <button
                              onClick={handleSaveToLibrary}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Save to Library
                            </button>
                          )}
                          <button
                            onClick={currentSnippet.id ? undefined : handleAddSnippet}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {currentSnippet.id ? 'Update' : 'Save'}
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute top-3 left-3 z-10">
                          <select
                            value={currentSnippet.type}
                            onChange={(e) => setCurrentSnippet(prev => ({ ...prev, type: e.target.value as any }))}
                            className="px-3 py-1.5 bg-slate-800 dark:bg-slate-900 text-white rounded-lg text-sm border border-slate-600"
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="css">CSS</option>
                            <option value="html">HTML</option>
                          </select>
                        </div>
                        <textarea
                          value={currentSnippet.code}
                          onChange={(e) => setCurrentSnippet(prev => ({ ...prev, code: e.target.value }))}
                          placeholder={`// Enter your ${currentSnippet.type} code here...`}
                          className="w-full h-96 p-12 pt-14 bg-slate-900 dark:bg-slate-950 text-green-400 font-mono text-sm rounded-lg border border-slate-700 focus:border-indigo-500 outline-none resize-none"
                          spellCheck={false}
                        />
                      </div>

                      <textarea
                        value={currentSnippet.description}
                        onChange={(e) => setCurrentSnippet(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add a description for this snippet..."
                        className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Settings Panel */}
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Settings</h3>
                          <button
                            onClick={() => handleCopyCode(currentSnippet.code)}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Placement */}
                        <div className="space-y-3">
                          <button
                            onClick={() => toggleSection('placement')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Placement</span>
                            {expandedSections.has('placement') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          {expandedSections.has('placement') && (
                            <div className="space-y-2 pl-4">
                              {['head', 'body', 'footer'].map(placement => (
                                <label key={placement} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="placement"
                                    value={placement}
                                    checked={currentSnippet.placement === placement}
                                    onChange={(e) => setCurrentSnippet(prev => ({ ...prev, placement: e.target.value as any }))}
                                    className="text-indigo-600"
                                  />
                                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{placement}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Trigger */}
                        <div className="space-y-3 mt-4">
                          <button
                            onClick={() => toggleSection('trigger')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Trigger</span>
                            {expandedSections.has('trigger') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          {expandedSections.has('trigger') && (
                            <div className="space-y-2 pl-4">
                              {[
                                { value: 'always', label: 'Always' },
                                { value: 'onload', label: 'On Page Load' },
                                { value: 'onsubmit', label: 'On Form Submit' },
                                { value: 'onsuccess', label: 'On Successful Submit' },
                                { value: 'onerror', label: 'On Error' }
                              ].map(trigger => (
                                <label key={trigger.value} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="trigger"
                                    value={trigger.value}
                                    checked={currentSnippet.trigger === trigger.value}
                                    onChange={(e) => setCurrentSnippet(prev => ({ ...prev, trigger: e.target.value as any }))}
                                    className="text-indigo-600"
                                  />
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{trigger.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Conditions */}
                        <div className="space-y-3 mt-4">
                          <button
                            onClick={() => toggleSection('conditions')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Conditions</span>
                            {expandedSections.has('conditions') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          {expandedSections.has('conditions') && (
                            <div className="space-y-3 pl-4">
                              <div>
                                <label className="text-xs text-slate-600 dark:text-slate-400">Device</label>
                                <select
                                  value={currentSnippet.conditions.device}
                                  onChange={(e) => setCurrentSnippet(prev => ({
                                    ...prev,
                                    conditions: { ...prev.conditions, device: e.target.value as any }
                                  }))}
                                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                                >
                                  <option value="all">All Devices</option>
                                  <option value="desktop">Desktop Only</option>
                                  <option value="mobile">Mobile Only</option>
                                  <option value="tablet">Tablet Only</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Templates */}
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Quick Templates</h3>
                        <div className="space-y-2">
                          {codeTemplates.map((template, index) => {
                            const Icon = getTypeIcon(template.type)
                            return (
                              <button
                                key={index}
                                onClick={() => setCurrentSnippet(prev => ({
                                  ...prev,
                                  name: template.name,
                                  type: template.type,
                                  code: template.code
                                }))}
                                className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{template.name}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Snippets */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Active Snippets ({codeSnippets.filter(s => s.enabled).length})
                    </h3>
                    <div className="space-y-3">
                      {codeSnippets.map(snippet => {
                        const Icon = getTypeIcon(snippet.type)
                        return (
                          <div key={snippet.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={snippet.enabled}
                                  onChange={() => handleToggleSnippet(snippet.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                              </label>
                              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{snippet.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{snippet.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(snippet.type)}`}>
                                {snippet.type}
                              </span>
                              <span className="text-xs text-slate-500 capitalize">{snippet.placement}</span>
                              <button
                                onClick={() => handleDeleteSnippet(snippet.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'library' && (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search snippets..."
                          className="w-full px-4 py-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedSnippets.map(snippet => {
                      const Icon = getTypeIcon(snippet.type)
                      return (
                        <div key={snippet.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{snippet.name}</h4>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(snippet.type)}`}>
                              {snippet.type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {snippet.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Used {snippet.used} times
                            </span>
                            <button
                              onClick={() => handleUseFromLibrary(snippet)}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                              Use Snippet
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Code Performance</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Load Time Impact</span>
                          <span className="text-sm font-medium text-green-600">+12ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Errors</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Warnings</span>
                          <span className="text-sm font-medium text-yellow-600">2</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Usage Stats</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Total Executions</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">1,247</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Success Rate</span>
                          <span className="text-sm font-medium text-green-600">99.8%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Avg. Duration</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">45ms</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Security Scan</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">No XSS vulnerabilities</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Secure code injection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Review external scripts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}