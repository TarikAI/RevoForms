'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, CheckCircle, AlertTriangle, FileText, Lock, Eye,
  Users, Database, Globe, Mail, Download, Upload, Search,
  Settings, Clock, Calendar, Activity, BadgeCheck, Info,
  X, Plus, Edit3, Trash2, ChevronDown, ChevronRight,
  FileCheck, UserCheck, Cookie, Key, Archive, Filter
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'

interface ConsentRecord {
  id: string
  userId: string
  formId: string
  consentType: 'processing' | 'marketing' | 'analytics' | 'cookies'
  granted: boolean
  timestamp: Date
  ipAddress: string
  userAgent: string
  documentVersion: string
}

interface DataRequest {
  id: string
  type: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction'
  userId: string
  userEmail: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestedAt: Date
  completedAt?: Date
  notes?: string
  processedBy?: string
}

interface DataBreach {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedRecords: number
  detectedAt: Date
  reportedToAuthorities: boolean
  notifiedUsers: boolean
  resolved: boolean
  resolutionDate?: Date
}

interface PrivacySetting {
  key: string
  label: string
  description: string
  enabled: boolean
  required: boolean
  category: 'consent' | 'data' | 'cookies' | 'security'
}

export function GDPRCompliance() {
  const [activeTab, setActiveTab] = useState<'overview' | 'consent' | 'requests' | 'breaches' | 'settings'>('overview')
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([
    {
      id: '1',
      userId: 'user_123',
      formId: 'form_456',
      consentType: 'processing',
      granted: true,
      timestamp: new Date(Date.now() - 24 * 60000),
      ipAddress: '203.0.113.1',
      userAgent: 'Mozilla/5.0...',
      documentVersion: 'v2.1'
    },
    {
      id: '2',
      userId: 'user_456',
      formId: 'form_456',
      consentType: 'marketing',
      granted: false,
      timestamp: new Date(Date.now() - 48 * 60000),
      ipAddress: '198.51.100.1',
      userAgent: 'Mozilla/5.0...',
      documentVersion: 'v2.1'
    }
  ])

  const [dataRequests, setDataRequests] = useState<DataRequest[]>([
    {
      id: '1',
      type: 'access',
      userId: 'user_789',
      userEmail: 'user@example.com',
      status: 'pending',
      requestedAt: new Date(Date.now() - 2 * 60000)
    },
    {
      id: '2',
      type: 'erasure',
      userId: 'user_101',
      userEmail: 'deleted@example.com',
      status: 'completed',
      requestedAt: new Date(Date.now() - 24 * 60000),
      completedAt: new Date(Date.now() - 12 * 60000),
      processedBy: 'admin@example.com'
    }
  ])

  const [dataBreaches, setDataBreaches] = useState<DataBreach[]>([
    {
      id: '1',
      severity: 'medium',
      description: 'Unauthorized access attempt blocked',
      affectedRecords: 0,
      detectedAt: new Date(Date.now() - 72 * 60000),
      reportedToAuthorities: false,
      notifiedUsers: false,
      resolved: true,
      resolutionDate: new Date(Date.now() - 70 * 60000)
    }
  ])

  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    { key: 'cookie_consent', label: 'Cookie Consent Banner', description: 'Display cookie consent banner', enabled: true, required: true, category: 'consent' },
    { key: 'data_retention', label: 'Automatic Data Deletion', description: 'Delete data after retention period', enabled: true, required: false, category: 'data' },
    { key: 'anonymization', label: 'Data Anonymization', description: 'Anonymize personal data after 30 days', enabled: false, required: false, category: 'data' },
    { key: 'double_optin', label: 'Double Opt-in', description: 'Require email confirmation for subscriptions', enabled: true, required: false, category: 'consent' },
    { key: 'right_to_withdraw', label: 'Easy Withdrawal', description: 'Allow users to withdraw consent easily', enabled: true, required: true, category: 'consent' },
    { key: 'privacy_by_design', label: 'Privacy by Design', description: 'Implement privacy-first approach', enabled: true, required: true, category: 'security' }
  ])

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['consent', 'processing']))
  const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'consent', label: 'Consent Management', icon: CheckCircle, count: consentRecords.length },
    { id: 'requests', label: 'Data Requests', icon: Users, count: dataRequests.filter(r => r.status === 'pending').length },
    { id: 'breaches', label: 'Data Breaches', icon: AlertTriangle },
    { id: 'settings', label: 'Privacy Settings', icon: Settings }
  ]

  const gdprMetrics = [
    { label: 'Compliance Score', value: '94%', icon: BadgeCheck, color: 'text-green-600' },
    { label: 'Active Consents', value: '1,247', icon: UserCheck, color: 'text-blue-600' },
    { label: 'Pending Requests', value: '3', icon: Clock, color: 'text-yellow-600' },
    { label: 'Data Subjects', value: '5,421', icon: Users, color: 'text-purple-600' }
  ]

  const requestTypes = [
    { id: 'access', label: 'Right to Access', description: 'Request copy of personal data', icon: Eye },
    { id: 'portability', label: 'Right to Portability', description: 'Request data in machine-readable format', icon: Download },
    { id: 'rectification', label: 'Right to Rectification', description: 'Request correction of inaccurate data', icon: Edit3 },
    { id: 'erasure', label: 'Right to Erasure', description: 'Request deletion of personal data', icon: Trash2 },
    { id: 'restriction', label: 'Right to Restrict Processing', description: 'Request limitation of processing', icon: Lock }
  ]

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const updatePrivacySetting = (key: string, enabled: boolean) => {
    setPrivacySettings(prev => prev.map(setting =>
      setting.key === key ? { ...setting, enabled } : setting
    ))
  }

  const handleDataRequest = (type: DataRequest['type'], email: string) => {
    const newRequest: DataRequest = {
      id: Date.now().toString(),
      type,
      userId: 'temp_' + Date.now(),
      userEmail: email,
      status: 'pending',
      requestedAt: new Date()
    }
    setDataRequests(prev => [newRequest, ...prev])
    setShowRequestModal(false)
  }

  const getRequestIcon = (type: DataRequest['type']) => {
    const requestType = requestTypes.find(t => t.id === type)
    return requestType?.icon || FileText
  }

  const getSeverityColor = (severity: DataBreach['severity']) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
    }
  }

  const getStatusColor = (status: DataRequest['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 min-h-screen overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-10 h-10" />
            GDPR Compliance
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Comprehensive privacy and data protection compliance
          </p>
        </div>

        {/* Compliance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {gdprMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${metric.color} opacity-50`} />
                </div>
              </motion.div>
            )
          })}
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
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
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
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Compliance Checklist */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-green-600" />
                        Compliance Checklist
                      </h3>
                      <div className="space-y-3">
                        {[
                          'Privacy Policy Published',
                          'Cookie Consent Implemented',
                          'Data Processing Records',
                          'Data Protection Officer Assigned',
                          'Breach Detection System',
                          'Data Subject Rights Process'
                        ].map((item, index) => (
                          <label key={index} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              defaultChecked={index < 4}
                              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Recent Activity
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Consent updated</span>
                          <span className="text-xs text-slate-500">2 hours ago</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Data request received</span>
                          <span className="text-xs text-slate-500">5 hours ago</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-yellow-600 rounded-full" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Privacy policy updated</span>
                          <span className="text-xs text-slate-500">1 day ago</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-600 rounded-full" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Data audit completed</span>
                          <span className="text-xs text-slate-500">3 days ago</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legal Documents */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Legal Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { name: 'Privacy Policy', version: 'v2.1', lastUpdated: '2024-01-15' },
                        { name: 'Cookie Policy', version: 'v1.3', lastUpdated: '2024-01-10' },
                        { name: 'Data Processing Agreement', version: 'v3.0', lastUpdated: '2024-01-01' }
                      ].map((doc, index) => (
                        <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{doc.name}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Version {doc.version}</p>
                              <p className="text-xs text-slate-500 mt-1">Updated {doc.lastUpdated}</p>
                            </div>
                            <Download className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'consent' && (
                <motion.div
                  key="consent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Consent Records
                    </h3>
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                      </button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">User</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Consent Type</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consentRecords.map(record => (
                          <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900 dark:text-slate-100">User {record.userId.slice(-4)}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize text-slate-700 dark:text-slate-300">{record.consentType}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                record.granted
                                  ? 'text-green-600 bg-green-100'
                                  : 'text-red-600 bg-red-100'
                              }`}>
                                {record.granted ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                {record.granted ? 'Granted' : 'Denied'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {record.timestamp.toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-slate-600 dark:text-slate-400">{record.ipAddress}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Data Subject Requests
                    </h3>
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Request
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {requestTypes.map(type => {
                      const Icon = type.icon
                      return (
                        <div key={type.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                          <Icon className="w-8 h-8 text-slate-600 dark:text-slate-400 mb-3" />
                          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{type.label}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{type.description}</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-4">
                    {dataRequests.map(request => {
                      const RequestIcon = getRequestIcon(request.type)
                      return (
                        <div key={request.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <RequestIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {requestTypes.find(t => t.id === request.type)?.label}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{request.userEmail}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Requested: {request.requestedAt.toLocaleString()}
                                </p>
                                {request.completedAt && (
                                  <p className="text-xs text-slate-500">
                                    Completed: {request.completedAt.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'breaches' && (
                <motion.div
                  key="breaches"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Data Breach Incidents
                    </h3>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Report Breach
                    </button>
                  </div>

                  <div className="space-y-4">
                    {dataBreaches.map(breach => (
                      <div key={breach.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{breach.description}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(breach.severity)}`}>
                                {breach.severity}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <span>Affected: {breach.affectedRecords} records</span>
                              <span>Detected: {breach.detectedAt.toLocaleDateString()}</span>
                              {breach.resolved && (
                                <span className="text-green-600">Resolved</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={breach.reportedToAuthorities}
                              className="w-4 h-4 text-green-600 rounded"
                              readOnly
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Reported to authorities</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={breach.notifiedUsers}
                              className="w-4 h-4 text-green-600 rounded"
                              readOnly
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Notified users</span>
                          </label>
                        </div>
                      </div>
                    ))}
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
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Privacy Settings
                    </h3>
                    <div className="space-y-4">
                      {['consent', 'data', 'cookies', 'security'].map(category => (
                        <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                          <button
                            onClick={() => toggleSection(category)}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                          >
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 capitalize">{category} Settings</h4>
                            {expandedSections.has(category) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          {expandedSections.has(category) && (
                            <div className="p-4 pt-0 space-y-3">
                              {privacySettings
                                .filter(setting => setting.category === category)
                                .map(setting => (
                                  <label key={setting.key} className="flex items-center justify-between cursor-pointer">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{setting.label}</span>
                                        {setting.required && <BadgeCheck className="w-4 h-4 text-green-600" />}
                                      </div>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={setting.enabled}
                                      onChange={(e) => updatePrivacySetting(setting.key, e.target.checked)}
                                      disabled={setting.required}
                                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                    />
                                  </label>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Retention Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Data Retention
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Default Retention Period
                        </label>
                        <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                          <option>30 days</option>
                          <option>90 days</option>
                          <option>1 year</option>
                          <option>2 years</option>
                          <option>5 years</option>
                          <option>Until revoked</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Automatic Cleanup
                        </label>
                        <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                          <option>Quarterly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Data Request Modal */}
        <AnimatePresence>
          {showRequestModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRequestModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Create Data Request
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Request Type
                    </label>
                    <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {requestTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      User Email
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDataRequest('access', 'user@example.com')
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Request
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