'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Eye, EyeOff, Lock, Key, AlertTriangle, CheckCircle, X,
  RefreshCw, Users, Clock, Activity, ShieldCheck, Ban, Fingerprint,
  Smartphone, Mail, Globe, Cpu, HardDrive, Database, KeyRound,
  BadgeCheck, FileCheck, UserCheck, Bell, Settings
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'

interface SecuritySettings {
  passwordProtection: {
    enabled: boolean
    password: string
    showPassword: boolean
  }
  twoFactorAuth: {
    enabled: boolean
    methods: ('email' | 'sms' | 'app')[]
  }
  accessControl: {
    allowedDomains: string[]
    blockedIPs: string[]
    geoRestriction: {
      enabled: boolean
      allowedCountries: string[]
      blockedCountries: string[]
    }
  }
  rateLimit: {
    enabled: boolean
    maxSubmissions: number
    timeWindow: number // minutes
  }
  botProtection: {
    enabled: boolean
    recaptcha: boolean
    honeyPot: boolean
    timestamp: boolean
  }
  dataEncryption: {
    enabled: boolean
    atRest: boolean
    inTransit: boolean
    fieldLevel: boolean
  }
  auditLog: {
    enabled: boolean
    logLevel: 'basic' | 'detailed' | 'comprehensive'
    retention: number // days
  }
  compliance: {
    gdpr: boolean
    ccpa: boolean
    hipaa: boolean
    soc2: boolean
  }
}

interface SecurityEvent {
  id: string
  timestamp: Date
  type: 'login' | 'submission' | 'blocked' | 'suspicious' | 'breach'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ip: string
  location: string
  userAgent: string
}

interface ThreatDetection {
  type: string
  count: number
  lastDetected: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export function AdvancedSecurity() {
  const { forms, selectedFormId } = useFormStore()
  const currentForm = forms.find(f => f.id === selectedFormId) || null
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'monitoring' | 'compliance'>('overview')
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordProtection: {
      enabled: false,
      password: '',
      showPassword: false
    },
    twoFactorAuth: {
      enabled: false,
      methods: []
    },
    accessControl: {
      allowedDomains: [],
      blockedIPs: [],
      geoRestriction: {
        enabled: false,
        allowedCountries: [],
        blockedCountries: []
      }
    },
    rateLimit: {
      enabled: true,
      maxSubmissions: 10,
      timeWindow: 60
    },
    botProtection: {
      enabled: true,
      recaptcha: false,
      honeyPot: true,
      timestamp: true
    },
    dataEncryption: {
      enabled: true,
      atRest: true,
      inTransit: true,
      fieldLevel: false
    },
    auditLog: {
      enabled: true,
      logLevel: 'detailed',
      retention: 90
    },
    compliance: {
      gdpr: false,
      ccpa: false,
      hipaa: false,
      soc2: false
    }
  })

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60000),
      type: 'blocked',
      severity: 'medium',
      description: 'Suspicious activity from unknown IP',
      ip: '192.168.1.100',
      location: 'Unknown',
      userAgent: 'Mozilla/5.0...'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60000),
      type: 'submission',
      severity: 'low',
      description: 'Form submitted successfully',
      ip: '203.0.113.1',
      location: 'United States',
      userAgent: 'Mozilla/5.0...'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60000),
      type: 'suspicious',
      severity: 'high',
      description: 'Multiple failed login attempts detected',
      ip: '198.51.100.1',
      location: 'China',
      userAgent: 'curl/7.68.0'
    }
  ])

  const [threatDetections, setThreatDetections] = useState<ThreatDetection[]>([
    {
      type: 'SQL Injection',
      count: 5,
      lastDetected: new Date(Date.now() - 2 * 60000),
      severity: 'high',
      description: 'Attempting to inject SQL code'
    },
    {
      type: 'XSS Attack',
      count: 12,
      lastDetected: new Date(Date.now() - 10 * 60000),
      severity: 'medium',
      description: 'Cross-site scripting attempts'
    },
    {
      type: 'Brute Force',
      count: 150,
      lastDetected: new Date(Date.now() - 1 * 60000),
      severity: 'critical',
      description: 'Multiple password attempts'
    },
    {
      type: 'DDoS',
      count: 3,
      lastDetected: new Date(Date.now() - 30 * 60000),
      severity: 'high',
      description: 'Distributed denial of service'
    }
  ])

  const [securityScore, setSecurityScore] = useState(85)
  const [isLoading, setIsLoading] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'settings', label: 'Security Settings', icon: Settings },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'compliance', label: 'Compliance', icon: FileCheck }
  ]

  const securityMetrics = [
    { label: 'Security Score', value: `${securityScore}%`, icon: ShieldCheck, color: 'text-green-400' },
    { label: 'Threats Blocked', value: '1,247', icon: Ban, color: 'text-red-400' },
    { label: 'Active Sessions', value: '23', icon: Users, color: 'text-blue-400' },
    { label: 'Uptime', value: '99.9%', icon: Clock, color: 'text-green-400' }
  ]

  const quickActions = [
    {
      icon: RefreshCw,
      label: 'Rotate Keys',
      description: 'Generate new API keys',
      action: () => handleRotateKeys()
    },
    {
      icon: Eye,
      label: 'Audit Logs',
      description: 'Review security events',
      action: () => setActiveTab('monitoring')
    },
    {
      icon: Lock,
      label: 'Enable 2FA',
      description: 'Add extra security layer',
      action: () => handleEnable2FA()
    },
    {
      icon: Shield,
      label: 'Security Scan',
      description: 'Run vulnerability scan',
      action: () => handleSecurityScan()
    }
  ]

  const handleRotateKeys = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('API keys rotated successfully!')
    }, 2000)
  }

  const handleEnable2FA = () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorAuth: { ...prev.twoFactorAuth, enabled: true }
    }))
  }

  const handleSecurityScan = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('Security scan completed. No vulnerabilities found.')
    }, 3000)
  }

  const updateSecuritySettings = (section: keyof SecuritySettings, updates: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login': return UserCheck
      case 'submission': return CheckCircle
      case 'blocked': return Ban
      case 'suspicious': return AlertTriangle
      case 'breach': return Shield
      default: return Bell
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-10 h-10" />
            Advanced Security
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Enterprise-grade security features for your forms
          </p>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {securityMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={action.action}
                disabled={isLoading}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 text-left group"
              >
                <Icon className="w-8 h-8 text-slate-600 dark:text-slate-400 group-hover:text-green-600 transition-colors mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{action.label}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
              </motion.button>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
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
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
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

          {/* Tab Content */}
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
                  {/* Recent Security Events */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Security Events</h3>
                    <div className="space-y-3">
                      {securityEvents.slice(0, 5).map(event => {
                        const EventIcon = getTypeIcon(event.type)
                        return (
                          <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <EventIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{event.description}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {event.ip} • {event.location} • {event.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                              {event.severity}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Threat Detection */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Threat Detection</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {threatDetections.map((threat, index) => (
                        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{threat.type}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{threat.description}</p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                <span>{threat.count} attempts</span>
                                <span>Last: {threat.lastDetected.toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(threat.severity)}`}>
                              {threat.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Password Protection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Password Protection</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={securitySettings.passwordProtection.enabled}
                          onChange={(e) => updateSecuritySettings('passwordProtection', { enabled: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-slate-700 dark:text-slate-300">Enable password protection</span>
                      </label>
                      {securitySettings.passwordProtection.enabled && (
                        <div className="relative">
                          <input
                            type={securitySettings.passwordProtection.showPassword ? 'text' : 'password'}
                            value={securitySettings.passwordProtection.password}
                            onChange={(e) => updateSecuritySettings('passwordProtection', { password: e.target.value })}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pr-12"
                          />
                          <button
                            onClick={() => updateSecuritySettings('passwordProtection', {
                              showPassword: !securitySettings.passwordProtection.showPassword
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          >
                            {securitySettings.passwordProtection.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Two-Factor Authentication</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorAuth.enabled}
                          onChange={(e) => updateSecuritySettings('twoFactorAuth', { enabled: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-slate-700 dark:text-slate-300">Enable 2FA</span>
                      </label>
                      {securitySettings.twoFactorAuth.enabled && (
                        <div className="space-y-2 pl-7">
                          {['email', 'sms', 'app'].map(method => (
                            <label key={method} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={securitySettings.twoFactorAuth.methods.includes(method as any)}
                                onChange={(e) => {
                                  const methods = e.target.checked
                                    ? [...securitySettings.twoFactorAuth.methods, method as any]
                                    : securitySettings.twoFactorAuth.methods.filter(m => m !== method)
                                  updateSecuritySettings('twoFactorAuth', { methods })
                                }}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="text-slate-700 dark:text-slate-300 capitalize">{method}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rate Limiting */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rate Limiting</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={securitySettings.rateLimit.enabled}
                          onChange={(e) => updateSecuritySettings('rateLimit', { enabled: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-slate-700 dark:text-slate-300">Enable rate limiting</span>
                      </label>
                      {securitySettings.rateLimit.enabled && (
                        <div className="grid grid-cols-2 gap-4 pl-7">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Max Submissions
                            </label>
                            <input
                              type="number"
                              value={securitySettings.rateLimit.maxSubmissions}
                              onChange={(e) => updateSecuritySettings('rateLimit', { maxSubmissions: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Time Window (minutes)
                            </label>
                            <input
                              type="number"
                              value={securitySettings.rateLimit.timeWindow}
                              onChange={(e) => updateSecuritySettings('rateLimit', { timeWindow: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bot Protection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bot Protection</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'recaptcha', label: 'Google reCAPTCHA' },
                        { key: 'honeyPot', label: 'Honeypot Fields' },
                        { key: 'timestamp', label: 'Timestamp Verification' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={securitySettings.botProtection[key as keyof typeof securitySettings.botProtection] as boolean}
                            onChange={(e) => updateSecuritySettings('botProtection', { [key]: e.target.checked })}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Data Encryption */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Data Encryption</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'atRest', label: 'Encryption at Rest', icon: HardDrive },
                        { key: 'inTransit', label: 'Encryption in Transit', icon: Globe },
                        { key: 'fieldLevel', label: 'Field-Level Encryption', icon: KeyRound }
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300">{label}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={securitySettings.dataEncryption[key as keyof typeof securitySettings.dataEncryption] as boolean}
                              onChange={(e) => updateSecuritySettings('dataEncryption', { [key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'monitoring' && (
                <motion.div
                  key="monitoring"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Security Audit Log */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Security Audit Log</h3>
                      <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                        Export Log
                      </button>
                    </div>

                    <div className="space-y-3">
                      {securityEvents.map(event => {
                        const EventIcon = getTypeIcon(event.type)
                        return (
                          <div key={event.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(event.severity)}`}>
                                <EventIcon className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-slate-100">{event.description}</p>
                                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <p>Type: <span className="font-medium">{event.type}</span></p>
                                    <p>IP Address: <span className="font-mono">{event.ip}</span></p>
                                    <p>Location: <span className="font-medium">{event.location}</span></p>
                                    <p>User Agent: <span className="font-mono text-xs">{event.userAgent}</span></p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                                    {event.severity}
                                  </span>
                                  <p className="text-xs text-slate-500 mt-2">
                                    {event.timestamp.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Real-time Monitoring */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Real-time Monitoring</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Activity className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">Active Users</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">147</p>
                        <p className="text-sm text-green-600 mt-1">↑ 12% from last hour</p>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">Threats Blocked</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">23</p>
                        <p className="text-sm text-red-600 mt-1">↑ 8% from last hour</p>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Database className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">Data Processed</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">2.3GB</p>
                        <p className="text-sm text-blue-600 mt-1">↑ 24% from last hour</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'compliance' && (
                <motion.div
                  key="compliance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Compliance Standards */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Compliance Standards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'gdpr', label: 'GDPR', description: 'General Data Protection Regulation' },
                        { key: 'ccpa', label: 'CCPA', description: 'California Consumer Privacy Act' },
                        { key: 'hipaa', label: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
                        { key: 'soc2', label: 'SOC 2', description: 'Service Organization Control 2' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{label}</span>
                                {securitySettings.compliance[key as keyof typeof securitySettings.compliance] && (
                                  <BadgeCheck className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={securitySettings.compliance[key as keyof typeof securitySettings.compliance] as boolean}
                                onChange={(e) => updateSecuritySettings('compliance', { [key]: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Controls */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Privacy Controls</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">Data Anonymization</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Automatically anonymize personal data after retention period
                          </p>
                        </div>
                        <select className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm">
                          <option>Never</option>
                          <option>30 days</option>
                          <option>90 days</option>
                          <option>1 year</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">Cookie Consent</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Implement cookie consent banner
                          </p>
                        </div>
                        <select className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm">
                          <option>Disabled</option>
                          <option>Strict</option>
                          <option>Custom</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">Right to Deletion</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Allow users to request data deletion
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Data Processing Agreement */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Data Processing Agreement</h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <FileCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">DPA Status: Active</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                            Your data processing agreement is active and covers all GDPR requirements.
                          </p>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            View Agreement
                          </button>
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