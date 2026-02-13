'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Mail, MessageSquare, Send, Plus, X, Settings, Clock,
  CheckCircle, AlertTriangle, Info, Trash2, Copy, TestTube,
  Filter, Search, Edit3, Eye, EyeOff, Zap, Users, Calendar,
  FileText, Webhook, Smartphone, Globe, Headphones, Star
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'

interface NotificationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: {
    event: 'submit' | 'field_change' | 'response_update' | 'schedule' | 'quota_reached'
    conditions: {
      fieldId?: string
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
      value?: string
      logic?: 'and' | 'or'
    }[]
  }
  actions: {
    type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'push' | 'in_app'
    recipients: string[]
    template?: string
    delay?: number
    retry?: {
      attempts: number
      interval: number
    }
  }[]
  schedule?: {
    type: 'immediate' | 'delayed' | 'scheduled'
    time?: string
    timezone?: string
  }
  analytics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    failed: number
  }
}

interface NotificationTemplate {
  id: string
  name: string
  subject?: string
  body: string
  variables: string[]
  type: 'email' | 'sms' | 'push' | 'webhook'
}

interface NotificationLog {
  id: string
  ruleName: string
  type: string
  recipient: string
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed'
  timestamp: Date
  error?: string
}

export function ConditionalNotifications() {
  const { forms, selectedFormId } = useFormStore()
  const currentForm = forms.find(f => f.id === selectedFormId) || null
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'logs' | 'settings'>('rules')
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([
    {
      id: '1',
      name: 'New Submission Alert',
      description: 'Notify team when form is submitted',
      enabled: true,
      trigger: {
        event: 'submit',
        conditions: []
      },
      actions: [
        {
          type: 'email',
          recipients: ['team@example.com'],
          template: 'new_submission',
          delay: 0
        },
        {
          type: 'slack',
          recipients: ['#general'],
          delay: 0
        }
      ],
      schedule: {
        type: 'immediate'
      },
      analytics: {
        sent: 124,
        delivered: 120,
        opened: 98,
        clicked: 45,
        failed: 4
      }
    },
    {
      id: '2',
      name: 'High Value Lead',
      description: 'Alert sales team for high-value submissions',
      enabled: true,
      trigger: {
        event: 'field_change',
        conditions: [
          {
            fieldId: 'budget',
            operator: 'greater_than',
            value: '10000',
            logic: 'and'
          },
          {
            fieldId: 'priority',
            operator: 'equals',
            value: 'high'
          }
        ]
      },
      actions: [
        {
          type: 'email',
          recipients: ['sales@example.com'],
          template: 'high_value_lead',
          delay: 0,
          retry: {
            attempts: 3,
            interval: 300
          }
        }
      ],
      schedule: {
        type: 'immediate'
      },
      analytics: {
        sent: 23,
        delivered: 23,
        opened: 20,
        clicked: 18,
        failed: 0
      }
    },
    {
      id: '3',
      name: 'Abandoned Form Reminder',
      description: 'Send reminder if form not completed',
      enabled: false,
      trigger: {
        event: 'schedule',
        conditions: []
      },
      actions: [
        {
          type: 'email',
          recipients: ['{{user_email}}'],
          template: 'reminder_email',
          delay: 3600
        }
      ],
      schedule: {
        type: 'delayed',
        time: '1 hour',
        timezone: 'UTC'
      },
      analytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0
      }
    }
  ])

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'new_submission',
      name: 'New Submission',
      subject: 'New Form Submission: {{form_name}}',
      body: 'A new form has been submitted:\n\n{{form_data}}',
      variables: ['form_name', 'form_data', 'submission_date'],
      type: 'email'
    },
    {
      id: 'high_value_lead',
      name: 'High Value Lead Alert',
      subject: 'High Value Lead - ${{budget}}',
      body: 'High value lead detected:\n\nBudget: {{budget}}\nContact: {{email}}\nPhone: {{phone}}',
      variables: ['budget', 'email', 'phone'],
      type: 'email'
    },
    {
      id: 'reminder_email',
      name: 'Form Reminder',
      subject: 'Complete Your Form',
      body: 'Hi {{name}},\n\nYou started filling out the form but didn\'t complete it. Click here to continue: {{form_url}}',
      variables: ['name', 'form_url'],
      type: 'email'
    }
  ])

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([
    {
      id: '1',
      ruleName: 'New Submission Alert',
      type: 'email',
      recipient: 'team@example.com',
      status: 'delivered',
      timestamp: new Date(Date.now() - 5 * 60000)
    },
    {
      id: '2',
      ruleName: 'High Value Lead',
      type: 'email',
      recipient: 'sales@example.com',
      status: 'opened',
      timestamp: new Date(Date.now() - 15 * 60000)
    },
    {
      id: '3',
      ruleName: 'Abandoned Form Reminder',
      type: 'email',
      recipient: 'user@example.com',
      status: 'failed',
      timestamp: new Date(Date.now() - 30 * 60000),
      error: 'Invalid email address'
    }
  ])

  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)
  const [testRule, setTestRule] = useState<NotificationRule | null>(null)

  const tabs = [
    { id: 'rules', label: 'Rules', icon: Settings, count: notificationRules.filter(r => r.enabled).length },
    { id: 'templates', label: 'Templates', icon: FileText, count: templates.length },
    { id: 'logs', label: 'Logs', icon: Clock, count: notificationLogs.length },
    { id: 'settings', label: 'Settings', icon: Bell }
  ]

  const actionTypes = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'webhook', label: 'Webhook', icon: Webhook },
    { id: 'slack', label: 'Slack', icon: MessageSquare },
    { id: 'teams', label: 'Microsoft Teams', icon: Users },
    { id: 'push', label: 'Push Notification', icon: Smartphone },
    { id: 'in_app', label: 'In-App Notification', icon: Bell }
  ]

  const triggerEvents = [
    { id: 'submit', label: 'Form Submitted', description: 'When a form is submitted' },
    { id: 'field_change', label: 'Field Changed', description: 'When a specific field value changes' },
    { id: 'response_update', label: 'Response Updated', description: 'When a form response is updated' },
    { id: 'schedule', label: 'Scheduled', description: 'Triggered at scheduled times' },
    { id: 'quota_reached', label: 'Quota Reached', description: 'When submission quota is reached' }
  ]

  const getStatusColor = (status: NotificationLog['status']) => {
    switch (status) {
      case 'sent': return 'text-blue-600 bg-blue-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'opened': return 'text-purple-600 bg-purple-100'
      case 'clicked': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    const actionType = actionTypes.find(t => t.id === type)
    return actionType?.icon || Mail
  }

  const handleToggleRule = (ruleId: string) => {
    setNotificationRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const handleDeleteRule = (ruleId: string) => {
    setNotificationRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule)
    setShowRuleModal(true)
  }

  const handleTestRule = (rule: NotificationRule) => {
    setTestRule(rule)
    setTimeout(() => {
      alert(`Test notification sent for rule: ${rule.name}`)
      setTestRule(null)
    }, 2000)
  }

  const handleSaveRule = (rule: NotificationRule) => {
    if (editingRule) {
      setNotificationRules(prev => prev.map(r => r.id === rule.id ? rule : r))
    } else {
      setNotificationRules(prev => [...prev, { ...rule, id: Date.now().toString() }])
    }
    setShowRuleModal(false)
    setEditingRule(null)
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 min-h-screen overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
            <Bell className="w-10 h-10" />
            Conditional Notifications
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Smart notifications based on form activity and conditions
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Rules</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {notificationRules.filter(r => r.enabled).length}
                </p>
              </div>
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Sent Today</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">142</p>
              </div>
              <Send className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Open Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">78%</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Failed</p>
                <p className="text-3xl font-bold text-red-600 mt-1">4</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
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
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 relative ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'rules' && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Notification Rules
                    </h3>
                    <button
                      onClick={() => {
                        setEditingRule(null)
                        setShowRuleModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Rule
                    </button>
                  </div>

                  {notificationRules.map(rule => (
                    <div key={rule.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{rule.name}</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={() => handleToggleRule(rule.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{rule.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Trigger: {triggerEvents.find(e => e.id === rule.trigger.event)?.label}</span>
                            <span>Actions: {rule.actions.length}</span>
                            <span>Sent: {rule.analytics.sent}</span>
                            <span>Delivered: {rule.analytics.delivered}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTestRule(rule)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Test Rule"
                          >
                            {testRule?.id === rule.id ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {rule.actions.map((action, index) => {
                          const ActionIcon = getTypeIcon(action.type)
                          return (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 text-xs"
                            >
                              <ActionIcon className="w-3 h-3" />
                              {action.type}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'templates' && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Notification Templates
                    </h3>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      New Template
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(template => {
                      const Icon = getTypeIcon(template.type)
                      return (
                        <div key={template.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{template.name}</h4>
                                <p className="text-xs text-slate-500 capitalize">{template.type}</p>
                              </div>
                            </div>
                            <button className="p-1 text-slate-400 hover:text-slate-600">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          {template.subject && (
                            <div className="mb-2">
                              <p className="text-xs text-slate-500 mb-1">Subject:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{template.subject}</p>
                            </div>
                          )}
                          <div className="mb-3">
                            <p className="text-xs text-slate-500 mb-1">Body:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{template.body}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map(variable => (
                              <span
                                key={variable}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                              >
                                {`{{${variable}}}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Rule</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Type</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Recipient</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notificationLogs.map(log => {
                          const StatusIcon = getStatusColor(log.status).includes('Check') ? CheckCircle :
                            getStatusColor(log.status).includes('Alert') ? AlertTriangle : Info
                          return (
                            <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-900 dark:text-slate-100">{log.ruleName}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {(() => {
                const TypeIcon = getTypeIcon(log.type)
                return <TypeIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              })()}
                                  <span className="capitalize text-slate-700 dark:text-slate-300">{log.type}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-slate-700 dark:text-slate-300">{log.recipient}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                                  <span className={`w-2 h-2 rounded-full ${
                                    log.status === 'delivered' ? 'bg-green-600' :
                                    log.status === 'opened' ? 'bg-purple-600' :
                                    log.status === 'clicked' ? 'bg-yellow-600' :
                                    log.status === 'failed' ? 'bg-red-600' : 'bg-blue-600'
                                  }`} />
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {log.timestamp.toLocaleString()}
                                </p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            From Email
                          </label>
                          <input
                            type="email"
                            defaultValue="noreply@example.com"
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Reply To
                          </label>
                          <input
                            type="email"
                            defaultValue="support@example.com"
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">SMS Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Provider
                          </label>
                          <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                            <option>Twilio</option>
                            <option>Plivo</option>
                            <option>ClickSend</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            From Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+1234567890"
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rate Limiting</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Max Emails/Hour
                        </label>
                        <input
                          type="number"
                          defaultValue="1000"
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Max SMS/Hour
                        </label>
                        <input
                          type="number"
                          defaultValue="500"
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Max Webhooks/Minute
                        </label>
                        <input
                          type="number"
                          defaultValue="60"
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Rule Modal */}
        <AnimatePresence>
          {showRuleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRuleModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                  {editingRule ? 'Edit Rule' : 'Create New Rule'}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      defaultValue={editingRule?.name || ''}
                      placeholder="Enter rule name"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      defaultValue={editingRule?.description || ''}
                      placeholder="Describe what this rule does"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Trigger Event
                    </label>
                    <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {triggerEvents.map(event => (
                        <option key={event.id} value={event.id}>{event.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Actions
                    </label>
                    <div className="space-y-3">
                      {actionTypes.map(type => {
                        const Icon = type.icon
                        return (
                          <label key={type.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                            <input
                              type="checkbox"
                              defaultChecked={editingRule?.actions.some(a => a.type === type.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium text-slate-900 dark:text-slate-100">{type.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <button
                    onClick={() => setShowRuleModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingRule) {
                        handleSaveRule(editingRule)
                      } else {
                        const newRule: NotificationRule = {
                          id: Date.now().toString(),
                          name: 'New Rule',
                          description: '',
                          enabled: true,
                          trigger: {
                            event: 'submit',
                            conditions: []
                          },
                          actions: [],
                          schedule: {
                            type: 'immediate'
                          },
                          analytics: {
                            sent: 0,
                            delivered: 0,
                            opened: 0,
                            clicked: 0,
                            failed: 0
                          }
                        }
                        handleSaveRule(newRule)
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRule ? 'Update' : 'Create'} Rule
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}