'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, MousePointer, CheckCircle, XCircle, Clock, TrendingUp, 
  TrendingDown, BarChart3, Activity
} from 'lucide-react'
import { useResponseStore, type FormAnalytics } from '@/store/responseStore'

interface FormAnalyticsWidgetProps {
  formId: string
  formTitle?: string
  compact?: boolean
}

export function FormAnalyticsWidget({ formId, formTitle, compact = false }: FormAnalyticsWidgetProps) {
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
      trend: 0
    }
  }, [analytics])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs text-white/60">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{stats.views}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span>{stats.completions}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>{stats.completionRate}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {formTitle && (
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">{formTitle}</h3>
          {stats.trend !== 0 && (
            <div className={`flex items-center gap-1 text-xs ${stats.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(stats.trend)}% vs last week</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Eye} label="Views" value={stats.views} color="cyan" />
        <StatCard icon={MousePointer} label="Starts" value={stats.starts} color="purple" />
        <StatCard icon={CheckCircle} label="Completions" value={stats.completions} color="green" />
        <StatCard icon={XCircle} label="Abandoned" value={stats.abandonments} color="red" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
            <BarChart3 className="w-3 h-3" />
            Completion Rate
          </div>
          <div className="text-2xl font-bold text-white">{stats.completionRate}%</div>
          <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${stats.completionRate}%` }}
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
            />
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
            <Clock className="w-3 h-3" />
            Avg. Completion Time
          </div>
          <div className="text-2xl font-bold text-white">{formatTime(stats.avgTime)}</div>
        </div>
      </div>

      {/* Recent Responses */}
      {responses.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <div className="text-xs text-white/60 mb-2">Recent Responses ({responses.length})</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {responses.slice(0, 5).map((response) => (
              <div key={response.id} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded">
                <span className="text-white/80 truncate max-w-[150px]">
                  {response.data.email || response.data.name || 'Anonymous'}
                </span>
                <span className="text-white/40">
                  {new Date(response.submittedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
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
  color 
}: { 
  icon: any
  label: string
  value: number
  color: 'cyan' | 'purple' | 'green' | 'red'
}) {
  const colorClasses = {
    cyan: 'bg-neon-cyan/20 text-neon-cyan',
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400'
  }

  return (
    <div className="p-3 bg-white/5 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-xs text-white/60">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  )
}

// Mini sparkline chart for daily stats
export function MiniChart({ data, height = 30 }: { data: number[], height?: number }) {
  if (data.length < 2) return null
  
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (v / max) * 100
  }))
  
  const pathD = points.reduce((d, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`, ''
  )

  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={pathD} fill="none" stroke="url(#gradient)" strokeWidth="2" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  )
}
