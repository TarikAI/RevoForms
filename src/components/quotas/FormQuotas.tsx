'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  BarChart3,
  Activity,
  Shield,
  Zap,
  Globe,
  Bell,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Copy,
  RefreshCw
} from 'lucide-react'

interface QuotaRule {
  id: string
  name: string
  type: 'total_submissions' | 'per_user' | 'per_day' | 'per_week' | 'per_month' | 'per_hour' | 'per_ip' | 'per_domain'
  limit: number
  current: number
  warningThreshold: number
  action: 'block' | 'warn' | 'queue' | 'redirect'
  isEnabled: boolean
  resetDate?: string
  redirectUrl?: string
  customMessage?: string
  notifyAdmins: boolean
  notifyEmails: string[]
  stats: {
    hitCount: number
    blockedCount: number
    warnedCount: number
    lastHit: string
  }
}

interface FormQuotasProps {
  formId: string
  formName: string
  onQuotasChange: (quotas: QuotaRule[]) => void
  initialQuotas?: QuotaRule[]
  currentStats?: {
    totalSubmissions: number
    uniqueUsers: number
    todaySubmissions: number
    weeklySubmissions: number
    monthlySubmissions: number
  }
}

export function FormQuotas({
  formId,
  formName,
  onQuotasChange,
  initialQuotas = [],
  currentStats = {
    totalSubmissions: 0,
    uniqueUsers: 0,
    todaySubmissions: 0,
    weeklySubmissions: 0,
    monthlySubmissions: 0
  }
}: FormQuotasProps) {
  const [quotas, setQuotas] = useState<QuotaRule[]>(initialQuotas)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null)

  const quotaTypes = [
    { value: 'total_submissions', label: 'Total Submissions', icon: Target, description: 'Limit total number of submissions' },
    { value: 'per_user', label: 'Per User', icon: Users, description: 'Limit submissions per user' },
    { value: 'per_day', label: 'Per Day', icon: Calendar, description: 'Limit submissions per day' },
    { value: 'per_week', label: 'Per Week', icon: Calendar, description: 'Limit submissions per week' },
    { value: 'per_month', label: 'Per Month', icon: Calendar, description: 'Limit submissions per month' },
    { value: 'per_hour', label: 'Per Hour', icon: Clock, description: 'Limit submissions per hour (rate limiting)' },
    { value: 'per_ip', label: 'Per IP Address', icon: Globe, description: 'Limit submissions per IP address' },
    { value: 'per_domain', label: 'Per Domain', icon: Globe, description: 'Limit submissions per email domain' }
  ]

  const actions = [
    { value: 'block', label: 'Block Submission', color: 'red', description: 'Stop users from submitting' },
    { value: 'warn', label: 'Show Warning', color: 'yellow', description: 'Allow with warning message' },
    { value: 'queue', label: 'Queue Submission', color: 'blue', description: 'Queue for later processing' },
    { value: 'redirect', label: 'Redirect', color: 'purple', description: 'Redirect to another URL' }
  ]

  const addQuota = (type: QuotaRule['type']) => {
    const typeInfo = quotaTypes.find(t => t.value === type)
    const newQuota: QuotaRule = {
      id: `quota_${Date.now()}`,
      name: `${typeInfo?.label} Limit`,
      type,
      limit: 100,
      current: 0,
      warningThreshold: 80,
      action: 'block',
      isEnabled: true,
      notifyAdmins: true,
      notifyEmails: [],
      stats: {
        hitCount: 0,
        blockedCount: 0,
        warnedCount: 0,
        lastHit: new Date().toISOString()
      }
    }

    // Set current value based on type
    switch (type) {
      case 'total_submissions':
        newQuota.current = currentStats.totalSubmissions
        break
      case 'per_day':
        newQuota.current = currentStats.todaySubmissions
        break
      case 'per_week':
        newQuota.current = currentStats.weeklySubmissions
        break
      case 'per_month':
        newQuota.current = currentStats.monthlySubmissions
        break
    }

    const newQuotas = [...quotas, newQuota]
    setQuotas(newQuotas)
    onQuotasChange(newQuotas)
    setSelectedQuota(newQuota.id)
  }

  const updateQuota = (quotaId: string, updates: Partial<QuotaRule>) => {
    const newQuotas = quotas.map(q =>
      q.id === quotaId ? { ...q, ...updates } : q
    )
    setQuotas(newQuotas)
    onQuotasChange(newQuotas)
  }

  const deleteQuota = (quotaId: string) => {
    const newQuotas = quotas.filter(q => q.id !== quotaId)
    setQuotas(newQuotas)
    onQuotasChange(newQuotas)
    if (selectedQuota === quotaId) {
      setSelectedQuota(null)
    }
  }

  const duplicateQuota = (quota: QuotaRule) => {
    const newQuota: QuotaRule = {
      ...quota,
      id: `quota_${Date.now()}`,
      name: `${quota.name} (Copy)`,
      stats: {
        hitCount: 0,
        blockedCount: 0,
        warnedCount: 0,
        lastHit: new Date().toISOString()
      }
    }

    const newQuotas = [...quotas, newQuota]
    setQuotas(newQuotas)
    onQuotasChange(newQuotas)
  }

  const getQuotaProgress = (quota: QuotaRule) => {
    return Math.min((quota.current / quota.limit) * 100, 100)
  }

  const getQuotaStatus = (quota: QuotaRule) => {
    const progress = getQuotaProgress(quota)
    if (progress >= 100) return { status: 'exceeded', color: 'red' }
    if (progress >= quota.warningThreshold) return { status: 'warning', color: 'yellow' }
    return { status: 'normal', color: 'green' }
  }

  const activeQuotas = quotas.filter(q => q.isEnabled)
  const criticalQuotas = activeQuotas.filter(q => getQuotaProgress(q) >= 90)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white">Quotas & Limits</h3>
        </div>
        <div className="flex items-center gap-2">
          {criticalQuotas.length > 0 && (
            <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium animate-pulse">
              {criticalQuotas.length} Critical
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Quota
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Total Submissions</span>
            <Target className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">{currentStats.totalSubmissions.toLocaleString()}</p>
          <p className="text-xs text-white/40 mt-1">All time</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Unique Users</span>
            <Users className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">{currentStats.uniqueUsers.toLocaleString()}</p>
          <p className="text-xs text-white/40 mt-1">Distinct submitters</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Today</span>
            <Calendar className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">{currentStats.todaySubmissions}</p>
          <p className="text-xs text-white/40 mt-1">Last 24 hours</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Active Quotas</span>
            <Activity className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">{activeQuotas.length}</p>
          <p className="text-xs text-white/40 mt-1">{criticalQuotas.length} critical</p>
        </div>
      </div>

      {/* Quota Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {quotaTypes.map(type => {
          const Icon = type.icon
          const existingQuota = quotas.find(q => q.type === type.value)
          return (
            <button
              key={type.value}
              onClick={() => !existingQuota && addQuota(type.value as QuotaRule['type'])}
              disabled={!!existingQuota}
              className={`p-3 border rounded-lg transition-all ${
                existingQuota
                  ? 'bg-neon-cyan/10 border-neon-cyan/50 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-neon-cyan/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-neon-cyan" />
                <div className="text-left">
                  <h5 className="text-sm font-medium text-white">{type.label}</h5>
                  <p className="text-xs text-white/60">{type.description}</p>
                  {existingQuota && (
                    <p className="text-xs text-neon-cyan mt-1">Active: {existingQuota.limit}</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Quotas List */}
      <div className="space-y-4">
        {quotas.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No quotas set</h3>
            <p className="text-white/60 mb-4">Add quotas to control form submissions</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Your First Quota
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {quotas.map(quota => {
              const progress = getQuotaProgress(quota)
              const status = getQuotaStatus(quota)
              const typeInfo = quotaTypes.find(t => t.value === quota.type)
              const Icon = typeInfo?.icon || Target
              const actionInfo = actions.find(a => a.value === quota.action)

              return (
                <motion.div
                  key={quota.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 bg-white/5 border rounded-lg transition-all cursor-pointer ${
                    selectedQuota === quota.id
                      ? 'border-neon-cyan/50 bg-neon-cyan/5'
                      : status.color === 'red'
                      ? 'border-red-500/50 bg-red-500/5'
                      : status.color === 'yellow'
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedQuota(quota.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-neon-cyan" />
                      <div>
                        <h5 className="font-medium text-white flex items-center gap-2">
                          {quota.name}
                          {!quota.isEnabled && <Lock className="w-4 h-4 text-gray-400" />}
                          {status.status === 'exceeded' && (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          )}
                          {status.status === 'warning' && (
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          )}
                        </h5>
                        <p className="text-sm text-white/60">{typeInfo?.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateQuota(quota.id, { isEnabled: !quota.isEnabled })
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          quota.isEnabled
                            ? 'text-green-400 hover:bg-green-500/20'
                            : 'text-gray-400 hover:bg-gray-500/20'
                        }`}
                      >
                        {quota.isEnabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateQuota(quota)
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 text-white/60" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteQuota(quota.id)
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                      >
                        <Trash2 className="w-4 h-4 text-white/60 group-hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/60">
                        {quota.current.toLocaleString()} / {quota.limit.toLocaleString()} used
                      </span>
                      <span className={`text-sm font-medium ${
                        status.color === 'red' ? 'text-red-400' :
                        status.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          status.color === 'red' ? 'bg-red-500' :
                          status.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Action Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-white/40" />
                        <span className="text-white/60">Action:</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          actionInfo?.color === 'red' ? 'bg-red-500/20 text-red-400' :
                          actionInfo?.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                          actionInfo?.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {actionInfo?.label}
                        </span>
                      </div>

                      {quota.notifyAdmins && (
                        <div className="flex items-center gap-1">
                          <Bell className="w-3 h-3 text-white/40" />
                          <span className="text-white/60">Admin alerts on</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span>Hit: {quota.stats.hitCount}</span>
                      <span>Blocked: {quota.stats.blockedCount}</span>
                      {quota.stats.lastHit && (
                        <span>Last: {new Date(quota.stats.lastHit).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Critical Alert */}
      {criticalQuotas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-400 font-medium mb-1">Critical: Quota Limits Reached</h4>
              <p className="text-red-200/70 text-sm mb-2">
                The following quotas have reached or exceeded their limits:
              </p>
              <ul className="text-red-200/70 text-sm space-y-1">
                {criticalQuotas.map(quota => {
                  const typeInfo = quotaTypes.find(t => t.value === quota.type)
                  return (
                    <li key={quota.id} className="flex items-center gap-2">
                      <span>• {quota.name} ({quota.current}/{quota.limit})</span>
                      {quota.action === 'block' && (
                        <span className="px-2 py-0.5 bg-red-500/20 rounded text-xs">Blocking submissions</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Adjust Quotas
            </button>
          </div>
        </motion.div>
      )}

      {/* Quota Details Panel */}
      <AnimatePresence>
        {selectedQuota && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gradient-to-r from-neon-cyan/5 to-purple/5 border border-neon-cyan/30 rounded-xl"
          >
            {(() => {
              const quota = quotas.find(q => q.id === selectedQuota)
              if (!quota) return null

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Quota Configuration</h4>
                    <button
                      onClick={() => setSelectedQuota(null)}
                      className="text-white/60 hover:text-white"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/60">Limit</label>
                      <input
                        type="number"
                        value={quota.limit}
                        onChange={(e) => updateQuota(quota.id, { limit: parseInt(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/60">Warning Threshold (%)</label>
                      <input
                        type="number"
                        value={quota.warningThreshold}
                        onChange={(e) => updateQuota(quota.id, { warningThreshold: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/60">Action when quota is exceeded</label>
                    <select
                      value={quota.action}
                      onChange={(e) => updateQuota(quota.id, { action: e.target.value as QuotaRule['action'] })}
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      {actions.map(action => (
                        <option key={action.value} value={action.value}>{action.label}</option>
                      ))}
                    </select>
                  </div>

                  {quota.action === 'redirect' && (
                    <div>
                      <label className="text-xs text-white/60">Redirect URL</label>
                      <input
                        type="url"
                        value={quota.redirectUrl || ''}
                        onChange={(e) => updateQuota(quota.id, { redirectUrl: e.target.value })}
                        placeholder="https://example.com/thank-you"
                        className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-white/60">Custom Message</label>
                    <textarea
                      value={quota.customMessage || ''}
                      onChange={(e) => updateQuota(quota.id, { customMessage: e.target.value })}
                      placeholder="Message to show when quota is reached..."
                      rows={3}
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quota.notifyAdmins}
                        onChange={(e) => updateQuota(quota.id, { notifyAdmins: e.target.checked })}
                        className="rounded bg-white/10 border-white/20 text-neon-cyan"
                      />
                      <span className="text-sm text-white/80">Notify admins</span>
                    </label>

                    <button
                      onClick={() => updateQuota(quota.id, {
                        current: 0,
                        stats: { ...quota.stats, hitCount: 0, blockedCount: 0, warnedCount: 0 }
                      })}
                      className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/80 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset Counter
                    </button>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}