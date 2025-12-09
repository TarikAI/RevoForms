'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, BarChart3, Plug, Shield, Eye, MousePointer, CheckCircle, Clock,
  Webhook, Mail, Table2, Zap, Workflow, Copy, Check, ExternalLink, Download,
  Lock, Key, AlertTriangle, RefreshCw, Trash2, ChevronRight
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'
import { useResponseStore } from '@/store/responseStore'
import { IntegrationManager } from './IntegrationManager'

interface IntegrationsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'analytics' | 'integrations' | 'security'

interface Integration {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  status: 'connected' | 'disconnected' | 'coming-soon'
  color: string
}

export function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('analytics')
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [emailNotification, setEmailNotification] = useState('')
  
  const { forms } = useFormStore()
  const { getFormAnalytics, getFormResponses, exportResponses, clearFormResponses } = useResponseStore()
  
  // Select first form by default
  useEffect(() => {
    if (forms.length > 0 && !selectedFormId) {
      setSelectedFormId(forms[0].id)
    }
  }, [forms, selectedFormId])

  const selectedForm = forms.find(f => f.id === selectedFormId)
  const analytics = selectedFormId ? getFormAnalytics(selectedFormId) : null
  const responses = selectedFormId ? getFormResponses(selectedFormId) : []

  const integrations: Integration[] = [
    { id: 'webhook', name: 'Webhook', icon: <Webhook className="w-5 h-5" />, description: 'Send form data to any URL', status: 'disconnected', color: 'from-orange-500 to-red-500' },
    { id: 'google-sheets', name: 'Google Sheets', icon: <Table2 className="w-5 h-5" />, description: 'Sync responses to spreadsheet', status: 'coming-soon', color: 'from-green-500 to-emerald-500' },
    { id: 'email', name: 'Email Notifications', icon: <Mail className="w-5 h-5" />, description: 'Get notified on submissions', status: 'disconnected', color: 'from-blue-500 to-cyan-500' },
    { id: 'zapier', name: 'Zapier', icon: <Zap className="w-5 h-5" />, description: 'Connect 5000+ apps', status: 'disconnected', color: 'from-orange-400 to-amber-500' },
    { id: 'n8n', name: 'n8n', icon: <Workflow className="w-5 h-5" />, description: 'Open source workflow automation', status: 'disconnected', color: 'from-purple-500 to-pink-500' },
  ]

  const handleCopyWebhook = () => {
    const sampleWebhook = `https://api.revoforms.com/webhook/${selectedFormId || 'form-id'}`
    navigator.clipboard.writeText(sampleWebhook)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  const handleExport = (format: 'json' | 'csv') => {
    if (!selectedFormId) return
    const data = exportResponses(selectedFormId, format)
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedForm?.name || 'form'}-responses.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  const conversionRate = analytics && analytics.starts > 0 
    ? Math.round((analytics.completions / analytics.starts) * 100) 
    : 0

  const tabs = [
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'integrations' as TabType, label: 'Integrations', icon: Plug },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999999] flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[calc(100vh-8rem)] bg-space-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Integrations & Analytics</h2>
                <p className="text-sm text-white/50">Track performance and connect your tools</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === id
                    ? 'text-neon-cyan border-neon-cyan'
                    : 'text-white/50 border-transparent hover:text-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Form Selector */}
            {forms.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/60 mb-2">Select Form</label>
                <select
                  value={selectedFormId || ''}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="w-full max-w-xs px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-cyan/50"
                >
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>{form.name}</option>
                  ))}
                </select>
              </div>
            )}

            {forms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white/30" />
                </div>
                <h3 className="text-lg font-medium text-white/70 mb-2">No Forms Yet</h3>
                <p className="text-sm text-white/40">Create a form to start tracking analytics</p>
              </div>
            ) : (
              <>
                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard icon={<Eye />} label="Views" value={analytics?.views || 0} color="cyan" />
                      <StatCard icon={<MousePointer />} label="Starts" value={analytics?.starts || 0} color="purple" />
                      <StatCard icon={<CheckCircle />} label="Completions" value={analytics?.completions || 0} color="green" />
                      <StatCard icon={<Clock />} label="Avg. Time" value={`${analytics?.averageTime || 0}s`} color="amber" />
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-white/60">Conversion Rate</h3>
                        <span className="text-2xl font-bold text-white">{conversionRate}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all duration-500"
                          style={{ width: `${conversionRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/40 mt-2">
                        {analytics?.completions || 0} completed out of {analytics?.starts || 0} started
                      </p>
                    </div>

                    {/* Recent Responses */}
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white/80">Recent Responses</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleExport('csv')}
                            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 flex items-center gap-1.5"
                          >
                            <Download className="w-3 h-3" /> CSV
                          </button>
                          <button 
                            onClick={() => handleExport('json')}
                            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 flex items-center gap-1.5"
                          >
                            <Download className="w-3 h-3" /> JSON
                          </button>
                        </div>
                      </div>
                      
                      {responses.length === 0 ? (
                        <div className="p-8 text-center text-white/40 text-sm">
                          No responses yet. Share your form to start collecting data!
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {responses.slice(0, 10).map((response, idx) => (
                            <div key={response.id} className="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Response #{responses.length - idx}</span>
                                <span className="text-xs text-white/40">
                                  {new Date(response.submittedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-white/50 mt-1 truncate">
                                {Object.entries(response.data).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Clear Data */}
                    {responses.length > 0 && (
                      <button
                        onClick={() => {
                          if (selectedFormId && confirm('Clear all responses for this form?')) {
                            clearFormResponses(selectedFormId)
                          }
                        }}
                        className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Clear all responses
                      </button>
                    )}
                  </div>
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    {/* Integration Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integrations.map((integration) => (
                        <IntegrationCard key={integration.id} integration={integration} />
                      ))}
                    </div>

                    {/* Webhook Setup */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
                        <Webhook className="w-4 h-4 text-orange-400" /> Webhook Configuration
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Webhook URL</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              placeholder="https://your-server.com/webhook"
                              className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50"
                            />
                            <button className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-sm font-medium rounded-lg hover:opacity-90">
                              Save
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Your Form Endpoint</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`https://api.revoforms.com/submit/${selectedFormId || 'form-id'}`}
                              className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white/60 font-mono"
                            />
                            <button 
                              onClick={handleCopyWebhook}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 transition-colors"
                            >
                              {copiedWebhook ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email Notifications */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-400" /> Email Notifications
                      </h3>
                      
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailNotification}
                          onChange={(e) => setEmailNotification(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50"
                        />
                        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                          Enable
                        </button>
                      </div>
                      <p className="text-xs text-white/40 mt-2">Get an email every time someone submits your form</p>
                    </div>

                    {/* Advanced Integration Manager */}
                    {selectedFormId && (
                      <IntegrationManager
                        formId={selectedFormId}
                        integrations={[]}
                        onIntegrationChange={(integrations) => {
                          console.log('Integrations updated:', integrations)
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    {/* Security Status */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Security Status: Protected</h3>
                          <p className="text-xs text-white/50">Your forms are secured with industry-standard encryption</p>
                        </div>
                      </div>
                    </div>

                    {/* Security Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SecurityFeature
                        icon={<Lock />}
                        title="SSL/TLS Encryption"
                        description="All data transmitted over HTTPS"
                        enabled={true}
                      />
                      <SecurityFeature
                        icon={<Key />}
                        title="Data Encryption at Rest"
                        description="AES-256 encryption for stored data"
                        enabled={true}
                      />
                      <SecurityFeature
                        icon={<RefreshCw />}
                        title="CAPTCHA Protection"
                        description="Prevent spam submissions"
                        enabled={false}
                        comingSoon
                      />
                      <SecurityFeature
                        icon={<AlertTriangle />}
                        title="Rate Limiting"
                        description="Prevent abuse and DDoS attacks"
                        enabled={true}
                      />
                    </div>

                    {/* GDPR & Compliance */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-white/80 mb-4">Compliance & Privacy</h3>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-neon-cyan" />
                          <span className="text-sm text-white/70">Enable GDPR consent checkbox on forms</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded accent-neon-cyan" />
                          <span className="text-sm text-white/70">Auto-delete responses after 90 days</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded accent-neon-cyan" />
                          <span className="text-sm text-white/70">Anonymize IP addresses</span>
                        </label>
                      </div>
                    </div>

                    {/* Data Retention */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-white/80 mb-4">Data Retention</h3>
                      
                      <select className="w-full max-w-xs px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-cyan/50">
                        <option value="forever">Keep forever</option>
                        <option value="365">Delete after 1 year</option>
                        <option value="180">Delete after 6 months</option>
                        <option value="90">Delete after 90 days</option>
                        <option value="30">Delete after 30 days</option>
                      </select>
                      <p className="text-xs text-white/40 mt-2">Automatically delete form responses after the selected period</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap = {
    cyan: 'from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/30 text-neon-cyan',
    purple: 'from-neon-purple/20 to-neon-purple/5 border-neon-purple/30 text-neon-purple',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="opacity-60">{icon}</span>
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

// Integration Card Component
function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center text-white`}>
          {integration.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white">{integration.name}</h4>
            {integration.status === 'coming-soon' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded">Soon</span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-0.5">{integration.description}</p>
        </div>
        <button 
          disabled={integration.status === 'coming-soon'}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            integration.status === 'connected'
              ? 'bg-green-500/20 text-green-400'
              : integration.status === 'coming-soon'
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          {integration.status === 'connected' ? 'Connected' : integration.status === 'coming-soon' ? 'Soon' : 'Connect'}
        </button>
      </div>
    </div>
  )
}

// Security Feature Component
function SecurityFeature({ icon, title, description, enabled, comingSoon }: { 
  icon: React.ReactNode; title: string; description: string; enabled: boolean; comingSoon?: boolean 
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white">{title}</h4>
            {comingSoon && <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded">Soon</span>}
          </div>
          <p className="text-xs text-white/50 mt-0.5">{description}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-400' : 'bg-white/20'}`} />
      </div>
    </div>
  )
}
