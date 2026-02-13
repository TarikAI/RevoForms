'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Eye, Send, CheckCircle, XCircle, Clock, TrendingUp,
  TrendingDown, BarChart3, Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useResponseStore, type FormAnalytics } from '@/store/responseStore'

interface AnalyticsDashboardProps {
  formId: string
  formTitle?: string
}

export function AnalyticsDashboard({ formId, formTitle }: AnalyticsDashboardProps) {
  const analytics = useResponseStore((state) => state.getAnalytics(formId))
  const responses = useResponseStore((state) => state.getResponsesByForm(formId))

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
      trend: 0 // Simplified - would need historical data
    }
  }, [analytics])

  // Generate mock chart data (last 7 days)
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, i) => ({
      date: day,
      submissions: Math.floor(Math.random() * Math.max(1, analytics.completions / 7)),
      views: Math.floor(Math.random() * Math.max(1, analytics.views / 7))
    }))
  }, [analytics])

  const maxSubmissions = Math.max(...chartData.map((d: any) => d.submissions), 1)

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Eye} label="Views" value={stats.views} color="cyan" />
        <StatCard icon={Send} label="Submissions" value={stats.completions} color="purple" trend={stats.trend} />
        <StatCard icon={CheckCircle} label="Completion Rate" value={`${stats.completionRate}%`} color="green" />
        <StatCard icon={Clock} label="Avg. Time" value={formatTime(stats.avgTime)} color="yellow" />
      </div>

      {/* Mini Chart */}
      {chartData.length > 0 && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Last 7 Days</span>
            <BarChart3 className="w-4 h-4 text-white/40" />
          </div>
          <div className="flex items-end gap-1 h-16">
            {chartData.map((day: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-gradient-to-t from-neon-cyan/60 to-neon-purple/60 rounded-t transition-all hover:from-neon-cyan hover:to-neon-purple"
                  style={{ height: `${(day.submissions / maxSubmissions) * 100}%`, minHeight: day.submissions > 0 ? '4px' : '0' }}
                />
                <span className="text-[10px] text-white/40">{day.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {responses.length > 0 && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Recent Submissions</span>
            <span className="text-xs text-white/40">{responses.length} total</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {responses.slice(0, 5).map((response: any) => (
              <div key={response.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/60 truncate max-w-[120px]">
                    {response.data.email || response.data.name || 'Anonymous'}
                  </span>
                </div>
                <span className="text-[10px] text-white/40">
                  {formatTimeAgo(response.submittedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {responses.length === 0 && !analytics && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
          <BarChart3 className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/60">No data yet</p>
          <p className="text-xs text-white/40 mt-1">Share your form to start collecting responses</p>
        </div>
      )}
    </div>
  )
}


// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  trend 
}: { 
  icon: any
  label: string
  value: string | number
  color: 'cyan' | 'purple' | 'green' | 'yellow'
  trend?: number
}) {
  const colorClasses = {
    cyan: 'from-neon-cyan/20 to-neon-cyan/5 text-neon-cyan',
    purple: 'from-neon-purple/20 to-neon-purple/5 text-neon-purple',
    green: 'from-green-500/20 to-green-500/5 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border border-white/10`}
    >
      <div className="flex items-center justify-between mb-1">
        <Icon className="w-4 h-4 opacity-60" />
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-0.5 text-[10px] ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-white/50">{label}</div>
    </motion.div>
  )
}

// Helper: Format seconds to readable time
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

// Helper: Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}

export { StatCard, formatTime, formatTimeAgo }
