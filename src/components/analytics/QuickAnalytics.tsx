'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Eye, MousePointer, CheckCircle, XCircle, Clock, TrendingUp,
  TrendingDown, BarChart3, Calendar, Users
} from 'lucide-react'
import { useResponseStore, type FormAnalytics } from '@/store/responseStore'

interface AnalyticsDashboardProps {
  formId: string
  formTitle?: string
}

export function AnalyticsDashboard({ formId, formTitle }: AnalyticsDashboardProps) {
  const responses = useResponseStore((state) => state.getResponsesByForm(formId))
  const analytics = useResponseStore((state) => state.getAnalytics(formId))

  const stats = useMemo(() => {
    const completionRate = analytics.starts > 0
      ? Math.round((analytics.completions / analytics.starts) * 100)
      : 0

    const abandonments = analytics.starts - analytics.completions

    return {
      views: analytics.views,
      starts: analytics.starts,
      completions: analytics.completions,
      abandonments,
      completionRate,
      avgTime: analytics.averageTime,
      trend: 0
    }
  }, [analytics])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const statCards = [
    { label: 'Views', value: stats.views, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { label: 'Starts', value: stats.starts, icon: MousePointer, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { label: 'Completions', value: stats.completions, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    { label: 'Abandoned', value: stats.abandonments, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-neon-cyan" />
          Analytics
        </h3>
        {stats.trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${stats.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(stats.trend)}% vs last week
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-2">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 bg-white/5 border border-white/10 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${stat.bg}`}>
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
              </div>
              <span className="text-xs text-white/60">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">Completion Rate</span>
          <span className="text-sm font-bold text-white">{stats.completionRate}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionRate}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
          />
        </div>
      </div>

      {/* Avg Completion Time */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-white/60">Avg. Completion Time</span>
        </div>
        <span className="text-sm font-bold text-white">{formatTime(stats.avgTime)}</span>
      </div>

      {/* Recent Responses Count */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neon-cyan" />
          <span className="text-xs text-white/60">Total Responses</span>
        </div>
        <span className="text-sm font-bold text-white">{responses.length}</span>
      </div>

      {responses.length === 0 && (
        <p className="text-xs text-white/40 text-center py-2">
          No responses yet. Share your form to start collecting data!
        </p>
      )}
    </div>
  )
}
