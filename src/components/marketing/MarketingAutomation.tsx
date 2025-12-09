'use client'

import React, { useState, useEffect } from 'react'
import {
  Mail,
  Send,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Filter,
  Copy,
  ExternalLink,
  Settings
} from 'lucide-react'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  fromEmail: string
  fromName: string
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused'
  template?: string
  content: string
  recipients: {
    type: 'all' | 'segment' | 'custom'
    count: number
    criteria?: any
    emails?: string[]
  }
  schedule?: {
    date: string
    time: string
    timezone: string
  }
  analytics: {
    sent: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  createdAt: string
  lastModified?: string
}

interface AutomationRule {
  id: string
  name: string
  trigger: {
    event: 'form_submission' | 'field_change' | 'time_delay' | 'email_opened' | 'link_clicked'
    conditions: any[]
  }
  actions: {
    type: 'send_email' | 'add_to_segment' | 'remove_from_segment' | 'update_field' | 'notify_admin'
    config: any
  }[]
  status: 'active' | 'inactive' | 'testing'
  executions: number
  lastExecution?: string
}

interface MarketingAutomationProps {
  formId: string
  campaigns: EmailCampaign[]
  automations: AutomationRule[]
  onCampaignChange: (campaigns: EmailCampaign[]) => void
  onAutomationChange: (automations: AutomationRule[]) => void
}

export function MarketingAutomation({
  formId,
  campaigns,
  automations,
  onCampaignChange,
  onAutomationChange
}: MarketingAutomationProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'automations' | 'analytics'>('campaigns')
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null)
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null)
  const [templates, setTemplates] = useState([
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to {{company_name}}!',
      content: '<p>Hi {{first_name}},</p><p>Thank you for signing up!</p>'
    },
    {
      id: 'confirmation',
      name: 'Form Confirmation',
      subject: 'We received your submission',
      content: '<p>Hi {{name}},</p><p>We have received your form submission.</p>'
    },
    {
      id: 'followup',
      name: 'Follow Up',
      subject: 'Following up on your submission',
      content: '<p>Hi {{name}},</p><p>Just following up on your recent form submission.</p>'
    }
  ])

  const totalSubscribers = campaigns.reduce((acc, campaign) => acc + campaign.recipients.count, 0)
  const averageOpenRate = campaigns.length > 0
    ? Math.round((campaigns.reduce((acc, c) => acc + (c.analytics.opened / c.analytics.sent) * 100, 0) / campaigns.length))
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-neon-cyan" />
            Marketing Automation
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Create email campaigns and automated workflows
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCampaignModal(true)}
            className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Campaign
          </button>
          <button
            onClick={() => setShowAutomationModal(true)}
            className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/90 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Automation
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Total Subscribers"
          value={totalSubscribers.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<Send className="w-4 h-4" />}
          label="Emails Sent"
          value={campaigns.reduce((acc, c) => acc + c.analytics.sent, 0).toLocaleString()}
          color="green"
        />
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Avg. Open Rate"
          value={`${averageOpenRate}%`}
          color="purple"
        />
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label="Active Automations"
          value={automations.filter(a => a.status === 'active').length}
          color="orange"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'campaigns'
              ? 'bg-neon-cyan/20 text-neon-cyan'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Send className="w-4 h-4" />
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('automations')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'automations'
              ? 'bg-neon-cyan/20 text-neon-cyan'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-4 h-4" />
          Automations
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-neon-cyan/20 text-neon-cyan'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-12 h-12" />}
              title="No campaigns yet"
              description="Create your first email campaign to start engaging with your audience"
              action={() => setShowCampaignModal(true)}
              actionText="Create Campaign"
            />
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={() => {
                    setEditingCampaign(campaign)
                    setShowCampaignModal(true)
                  }}
                  onDelete={() => {
                    onCampaignChange(campaigns.filter(c => c.id !== campaign.id))
                  }}
                  onDuplicate={() => {
                    const duplicated = {
                      ...campaign,
                      id: `campaign_${Date.now()}`,
                      name: `${campaign.name} (Copy)`,
                      status: 'draft' as const,
                      analytics: {
                        sent: 0,
                        opened: 0,
                        clicked: 0,
                        bounced: 0,
                        unsubscribed: 0
                      }
                    }
                    onCampaignChange([...campaigns, duplicated])
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          {automations.length === 0 ? (
            <EmptyState
              icon={<Zap className="w-12 h-12" />}
              title="No automations yet"
              description="Set up automated workflows to save time and nurture leads"
              action={() => setShowAutomationModal(true)}
              actionText="Create Automation"
            />
          ) : (
            <div className="space-y-3">
              {automations.map((automation) => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onEdit={() => {
                    setEditingAutomation(automation)
                    setShowAutomationModal(true)
                  }}
                  onToggle={() => {
                    onAutomationChange(
                      automations.map(a =>
                        a.id === automation.id
                          ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' }
                          : a
                      )
                    )
                  }}
                  onDelete={() => {
                    onAutomationChange(automations.filter(a => a.id !== automation.id))
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Campaign Performance */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-medium text-white mb-4">Campaign Performance</h3>
            <div className="space-y-3">
              {campaigns
                .filter(c => c.analytics.sent > 0)
                .slice(0, 5)
                .map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{campaign.name}</p>
                      <p className="text-xs text-white/40">{campaign.subject}</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="text-center">
                        <p className="text-white/60">Sent</p>
                        <p className="font-medium">{campaign.analytics.sent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60">Open Rate</p>
                        <p className="font-medium text-green-400">
                          {Math.round((campaign.analytics.opened / campaign.analytics.sent) * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60">Click Rate</p>
                        <p className="font-medium text-blue-400">
                          {Math.round((campaign.analytics.clicked / campaign.analytics.opened) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Automation Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Automations Triggered"
              value={automations.reduce((acc, a) => acc + a.executions, 0)}
              change={12}
              icon={<Zap />}
            />
            <MetricCard
              title="Conversion Rate"
              value="24%"
              change={8}
              icon={<Target />}
            />
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <CampaignModal
          campaign={editingCampaign}
          templates={templates}
          onSave={(campaign) => {
            if (editingCampaign) {
              onCampaignChange(campaigns.map(c => c.id === campaign.id ? campaign : c))
            } else {
              onCampaignChange([...campaigns, campaign])
            }
            setShowCampaignModal(false)
            setEditingCampaign(null)
          }}
          onCancel={() => {
            setShowCampaignModal(false)
            setEditingCampaign(null)
          }}
        />
      )}

      {/* Automation Modal */}
      {showAutomationModal && (
        <AutomationModal
          automation={editingAutomation}
          onSave={(automation) => {
            if (editingAutomation) {
              onAutomationChange(automations.map(a => a.id === automation.id ? automation : a))
            } else {
              onAutomationChange([...automations, automation])
            }
            setShowAutomationModal(false)
            setEditingAutomation(null)
          }}
          onCancel={() => {
            setShowAutomationModal(false)
            setEditingAutomation(null)
          }}
        />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2 opacity-60">
        {icon}
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

// Empty State Component
function EmptyState({
  icon,
  title,
  description,
  action,
  actionText
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: () => void
  actionText: string
}) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center text-white/30">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-white/70 mb-2">{title}</h3>
      <p className="text-sm text-white/40 mb-4 max-w-md mx-auto">{description}</p>
      <button
        onClick={action}
        className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
      >
        {actionText}
      </button>
    </div>
  )
}

// Campaign Card Component
function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onDuplicate
}: {
  campaign: EmailCampaign
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-400',
    scheduled: 'bg-blue-500/20 text-blue-400',
    running: 'bg-green-500/20 text-green-400',
    completed: 'bg-purple-500/20 text-purple-400',
    paused: 'bg-orange-500/20 text-orange-400'
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">{campaign.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-white/50">{campaign.subject}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Edit className="w-3 h-3 text-white/60" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Copy className="w-3 h-3 text-white/60" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{campaign.recipients.count} recipients</span>
        <span>
          {campaign.analytics.opened > 0 && (
            <>
              {Math.round((campaign.analytics.opened / campaign.analytics.sent) * 100)}% opened
            </>
          )}
        </span>
      </div>
    </div>
  )
}

// Automation Card Component
function AutomationCard({
  automation,
  onEdit,
  onToggle,
  onDelete
}: {
  automation: AutomationRule
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">{automation.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              automation.status === 'active'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {automation.status}
            </span>
          </div>
          <p className="text-xs text-white/50">
            Trigger: {automation.trigger.event.replace('_', ' ')}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            {automation.status === 'active' ? (
              <Pause className="w-3 h-3 text-white/60" />
            ) : (
              <Play className="w-3 h-3 text-white/60" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Edit className="w-3 h-3 text-white/60" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{automation.actions.length} actions</span>
        <span>Executed {automation.executions} times</span>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  icon
}: {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/60">{title}</span>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        <span className={`text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      </div>
    </div>
  )
}

// Campaign Modal Component
function CampaignModal({
  campaign,
  templates,
  onSave,
  onCancel
}: {
  campaign: EmailCampaign | null
  templates: any[]
  onSave: (campaign: EmailCampaign) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(
    campaign || {
      id: `campaign_${Date.now()}`,
      name: '',
      subject: '',
      fromEmail: '',
      fromName: '',
      status: 'draft' as const,
      content: '',
      recipients: {
        type: 'all' as const,
        count: 0
      },
      analytics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      },
      createdAt: new Date().toISOString()
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-space-light p-6 rounded-xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          {campaign ? 'Edit Campaign' : 'Create Campaign'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Subject Line</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">From Name</label>
              <input
                type="text"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">From Email</label>
              <input
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              placeholder="Enter your email content (HTML supported)"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
            >
              Save Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Automation Modal Component (simplified)
function AutomationModal({
  automation,
  onSave,
  onCancel
}: {
  automation: AutomationRule | null
  onSave: (automation: AutomationRule) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(
    automation || {
      id: `automation_${Date.now()}`,
      name: '',
      trigger: {
        event: 'form_submission' as const,
        conditions: []
      },
      actions: [],
      status: 'inactive' as const,
      executions: 0
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-space-light p-6 rounded-xl border border-white/20 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          {automation ? 'Edit Automation' : 'Create Automation'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Automation Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Trigger Event</label>
            <select
              value={formData.trigger.event}
              onChange={(e) => setFormData({
                ...formData,
                trigger: { ...formData.trigger, event: e.target.value as any }
              })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
            >
              <option value="form_submission">Form Submitted</option>
              <option value="field_change">Field Changed</option>
              <option value="time_delay">Time Delay</option>
              <option value="email_opened">Email Opened</option>
              <option value="link_clicked">Link Clicked</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/90 text-white font-medium rounded-lg transition-colors"
            >
              Save Automation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}