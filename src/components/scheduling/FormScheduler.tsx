'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Users,
  BarChart3,
  Globe,
  Shield,
  Bell,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  Lock,
  Unlock,
  Timer,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react'

interface ScheduleRule {
  id: string
  name: string
  type: 'open_close' | 'quota' | 'maintenance' | 'scheduled_publish'
  isEnabled: boolean
  timezone: string
  schedule: {
    startDate?: string
    endDate?: string
    startTime?: string
    endTime?: string
    daysOfWeek?: number[]
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
  restrictions?: {
    maxSubmissions?: number
    perUser?: number
    perDay?: number
    perWeek?: number
    perMonth?: number
  }
  actions?: {
    showMessage?: boolean
    customMessage?: string
    redirectUrl?: string
    notifyAdmin?: boolean
    webhookUrl?: string
  }
  stats?: {
    totalViews?: number
    totalSubmissions?: number
    currentQuota?: number
    lastActivity?: string
  }
}

interface FormSchedulerProps {
  formId: string
  onScheduleChange: (schedules: ScheduleRule[]) => void
  initialSchedules?: ScheduleRule[]
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export function FormScheduler({ formId, onScheduleChange, initialSchedules = [] }: FormSchedulerProps) {
  const [schedules, setSchedules] = useState<ScheduleRule[]>(initialSchedules)
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const addSchedule = (type: ScheduleRule['type']) => {
    const newSchedule: ScheduleRule = {
      id: `schedule_${Date.now()}`,
      name: `New ${type.replace('_', ' ')} Rule`,
      type,
      isEnabled: true,
      timezone: 'UTC',
      schedule: {
        recurrence: 'none'
      }
    }

    if (type === 'quota') {
      newSchedule.restrictions = {
        maxSubmissions: 100
      }
    }

    const newSchedules = [...schedules, newSchedule]
    setSchedules(newSchedules)
    onScheduleChange(newSchedules)
    setSelectedSchedule(newSchedule.id)
  }

  const updateSchedule = (scheduleId: string, updates: Partial<ScheduleRule>) => {
    const newSchedules = schedules.map(s =>
      s.id === scheduleId ? { ...s, ...updates } : s
    )
    setSchedules(newSchedules)
    onScheduleChange(newSchedules)
  }

  const deleteSchedule = (scheduleId: string) => {
    const newSchedules = schedules.filter(s => s.id !== scheduleId)
    setSchedules(newSchedules)
    onScheduleChange(newSchedules)
    if (selectedSchedule === scheduleId) {
      setSelectedSchedule(null)
    }
  }

  const duplicateSchedule = (schedule: ScheduleRule) => {
    const newSchedule: ScheduleRule = {
      ...schedule,
      id: `schedule_${Date.now()}`,
      name: `${schedule.name} (Copy)`
    }

    const newSchedules = [...schedules, newSchedule]
    setSchedules(newSchedules)
    onScheduleChange(newSchedules)
  }

  const activeSchedules = useMemo(() => schedules.filter(s => s.isEnabled), [schedules])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white">Form Scheduling</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded-full text-xs font-medium">
            {activeSchedules.length} Active
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Total Views</span>
            <Eye className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">
            {schedules.reduce((acc, s) => acc + (s.stats?.totalViews || 0), 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Total Submissions</span>
            <Target className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">
            {schedules.reduce((acc, s) => acc + (s.stats?.totalSubmissions || 0), 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Quota Used</span>
            <BarChart3 className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">
            {schedules.reduce((acc, s) => acc + (s.stats?.currentQuota || 0), 0)}%
          </p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Last Activity</span>
            <Clock className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-sm font-medium text-white">
            {schedules.some(s => s.stats?.lastActivity)
              ? new Date(Math.max(...schedules.map(s =>
                  s.stats?.lastActivity ? new Date(s.stats.lastActivity).getTime() : 0
                ))).toLocaleDateString()
              : 'No activity'
            }
          </p>
        </div>
      </div>

      {/* Schedule Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => addSchedule('open_close')}
          className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-neon-cyan/50 transition-all group"
        >
          <Timer className="w-6 h-6 text-neon-cyan mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-medium text-white mb-1">Open/Close Schedule</h4>
          <p className="text-xs text-white/60">Set specific dates and times when form is available</p>
        </button>

        <button
          onClick={() => addSchedule('quota')}
          className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-neon-cyan/50 transition-all group"
        >
          <Target className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-medium text-white mb-1">Submission Quotas</h4>
          <p className="text-xs text-white/60">Limit total or per-user submissions</p>
        </button>

        <button
          onClick={() => addSchedule('maintenance')}
          className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-neon-cyan/50 transition-all group"
        >
          <Shield className="w-6 h-6 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-medium text-white mb-1">Maintenance Mode</h4>
          <p className="text-xs text-white/60">Temporarily disable form for updates</p>
        </button>

        <button
          onClick={() => addSchedule('scheduled_publish')}
          className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-neon-cyan/50 transition-all group"
        >
          <Zap className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-medium text-white mb-1">Scheduled Publish</h4>
          <p className="text-xs text-white/60">Auto-publish/unpublish form at set times</p>
        </button>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white/60">Active Schedules</h4>
        {schedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No schedules created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 bg-white/5 border rounded-lg cursor-pointer transition-all ${
                  selectedSchedule === schedule.id
                    ? 'border-neon-cyan/50 bg-neon-cyan/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedSchedule(schedule.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="font-medium text-white">{schedule.name}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        schedule.isEnabled
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {schedule.isEnabled ? 'Active' : 'Paused'}
                      </span>
                      <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/60">
                        {schedule.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{schedule.timezone}</span>
                      </div>
                      {schedule.schedule.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(schedule.schedule.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {schedule.restrictions?.maxSubmissions && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{schedule.restrictions.maxSubmissions} max</span>
                        </div>
                      )}
                    </div>

                    {schedule.stats && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        {schedule.stats.totalViews && (
                          <span>{schedule.stats.totalViews} views</span>
                        )}
                        {schedule.stats.totalSubmissions && (
                          <span>{schedule.stats.totalSubmissions} submissions</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateSchedule(schedule.id, { isEnabled: !schedule.isEnabled })
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        schedule.isEnabled
                          ? 'text-green-400 hover:bg-green-500/20'
                          : 'text-gray-400 hover:bg-gray-500/20'
                      }`}
                    >
                      {schedule.isEnabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateSchedule(schedule)
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSchedule(schedule.id)
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                    >
                      <Trash2 className="w-4 h-4 text-white/60 group-hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Details Panel */}
      <AnimatePresence>
        {selectedSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gradient-to-r from-neon-cyan/5 to-purple/5 border border-neon-cyan/30 rounded-xl"
          >
            {(() => {
              const schedule = schedules.find(s => s.id === selectedSchedule)
              if (!schedule) return null

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Schedule Details</h4>
                    <button
                      onClick={() => setSelectedSchedule(null)}
                      className="text-white/60 hover:text-white"
                    >
                      ×
                    </button>
                  </div>

                  {/* Edit form would go here */}
                  <div className="text-sm text-white/60">
                    Click "Edit" to modify this schedule rule
                  </div>

                  <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Schedule
                  </button>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
        <Bell className="w-5 h-5 text-yellow-400 mt-0.5" />
        <div className="text-sm">
          <p className="text-yellow-100 font-medium mb-1">Pro Tip</p>
          <p className="text-yellow-200/70">
            Combine multiple schedule rules for complex scenarios. For example, set a form to be open only during
            business hours with a daily submission limit.
          </p>
        </div>
      </div>
    </div>
  )
}