'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, Eye, MousePointer, CheckCircle, Clock, TrendingUp, 
  TrendingDown, Users, ArrowUpRight, Download, RefreshCw,
  Calendar, Filter
} from 'lucide-react'
import { useResponseStore } from '@/store/responseStore'
import { useFormStore } from '@/store/formStore'

interface AnalyticsProps {
  formId?: string
  showAllForms?: boolean
}

export function BasicAnalyticsDashboard({ formId, showAllForms = false }: AnalyticsProps) {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(formId || null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { forms } = useFormStore()
  const { responses, analytics, getAnalytics, getResponsesByForm, fetchResponses, exportResponses } = useResponseStore()

  // Set first form as default
  useEffect(() => {
    if (!selectedFormId && forms.length > 0) {
      setSelectedFormId(forms[0].id)
    }
  }, [forms, selectedFormId])

  // Fetch responses when form changes
  useEffect(() => {
    if (selectedFormId) {
      fetchResponses(selectedFormId)
    }
  }, [selectedFormId])

  const handleRefresh = async () => {
    if (!selectedFormId) return
    setIsRefreshing(true)
    await fetchResponses(selectedFormId)
    setIsRefreshing(false)
  }

  const handleExport = (format: 'json' | 'csv') => {
    if (!selectedFormId) return
    const data = exportResponses(selectedFormId, format)
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedFormId}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get analytics for selected form
  const currentAnalytics = selectedFormId ? getAnalytics(selectedFormId) : null
  const currentResponses = selectedFormId ? getResponsesByForm(selectedFormId) : []
  const selectedForm = forms.find(f => f.id === selectedFormId)

  // Calculate additional metrics
  const conversionRate = currentAnalytics && currentAnalytics.starts > 0
    ? Math.round((currentAnalytics.completions / currentAnalytics.starts) * 100)
    : 0

  // Filter responses by date range
  const filteredResponses = currentResponses.filter(r => {
    if (dateRange === 'all') return true
    const date = new Date(r.submittedAt)
    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return date >= cutoff
  })

  // Calculate trend (compare to previous period)
  const calculateTrend = () => {
    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const midpoint = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const startpoint = new Date(midpoint.getTime() - days * 24 * 60 * 60 * 1000)
    
    const currentPeriod = currentResponses.filter(r => new Date(r.submittedAt) >= midpoint).length
    const previousPeriod = currentResponses.filter(r => {
      const date = new Date(r.submittedAt)
      return date >= startpoint && date < midpoint
    }).length
    
    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0
    return Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100)
  }

  const trend = calculateTrend()

  // Get daily response counts for chart
  const getDailyData = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const data: { date: string; count: number }[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const count = currentResponses.filter(r => {
        const respDate = new Date(r.submittedAt).toISOString().split('T')[0]
        return respDate === dateStr
      }).length
      
      data.push({ date: dateStr, count })
    }
    
    return data
  }

  const dailyData = getDailyData()
  const maxCount = Math.max(...dailyData.map(d => d.count), 1)

  if (forms.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-white/30 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white/70 mb-2">No Forms Yet</h3>
        <p className="text-sm text-white/40">Create a form to start tracking analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Form Selector */}
          <select
            value={selectedFormId || ''}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-cyan/50"
          >
            {forms.map((form) => (
              <option key={form.id} value={form.id}>{form.name}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Total Views"
          value={currentAnalytics?.views || 0}
          color="cyan"
          trend={trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : undefined}
          trendUp={trend > 0}
        />
        <StatCard
          icon={<MousePointer className="w-5 h-5" />}
          label="Form Starts"
          value={currentAnalytics?.starts || 0}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Completions"
          value={currentAnalytics?.completions || 0}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          color="amber"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-medium text-white/70 mb-4">Conversion Funnel</h3>
        <div className="space-y-4">
          <FunnelStep
            label="Views"
            value={currentAnalytics?.views || 0}
            percentage={100}
            color="from-blue-500 to-cyan-500"
          />
          <FunnelStep
            label="Started"
            value={currentAnalytics?.starts || 0}
            percentage={currentAnalytics?.views ? Math.round((currentAnalytics.starts / currentAnalytics.views) * 100) : 0}
            color="from-purple-500 to-pink-500"
          />
          <FunnelStep
            label="Completed"
            value={currentAnalytics?.completions || 0}
            percentage={conversionRate}
            color="from-green-500 to-emerald-500"
          />
        </div>
      </div>

      {/* Response Timeline */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white/70">Response Timeline</h3>
          <span className="text-xs text-white/40">{filteredResponses.length} responses</span>
        </div>
        
        {/* Simple Bar Chart */}
        <div className="h-40 flex items-end gap-1">
          {dailyData.slice(-14).map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.count / maxCount) * 100}%` }}
                transition={{ delay: i * 0.02 }}
                className="w-full bg-gradient-to-t from-neon-cyan to-neon-purple rounded-t min-h-[4px]"
                title={`${day.date}: ${day.count} responses`}
              />
              {i % 2 === 0 && (
                <span className="text-[10px] text-white/30">
                  {new Date(day.date).getDate()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Responses */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/70">Recent Responses</h3>
          <span className="text-xs text-white/40">Last 10</span>
        </div>
        
        {filteredResponses.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">
            No responses yet. Share your form to start collecting data!
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
            {filteredResponses.slice(0, 10).map((response, idx) => (
              <div key={response.id} className="px-4 py-3 hover:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      response.status === 'complete' ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-sm text-white/80">
                      Response #{filteredResponses.length - idx}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">
                    {formatTimeAgo(new Date(response.submittedAt))}
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
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  trend, 
  trendUp 
}: { 
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  trend?: string
  trendUp?: boolean
}) {
  const colorMap = {
    cyan: 'from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/30',
    purple: 'from-neon-purple/20 to-neon-purple/5 border-neon-purple/30',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  }
  
  const iconColorMap = {
    cyan: 'text-neon-cyan',
    purple: 'text-neon-purple',
    green: 'text-green-400',
    amber: 'text-amber-400',
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`${iconColorMap[color as keyof typeof iconColorMap]} opacity-60`}>{icon}</span>
        {trend && (
          <span className={`text-xs flex items-center gap-0.5 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/50 mt-1">{label}</p>
    </div>
  )
}

// Funnel Step Component
function FunnelStep({ 
  label, 
  value, 
  percentage, 
  color 
}: { 
  label: string
  value: number
  percentage: number
  color: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 text-sm text-white/60">{label}</div>
      <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${color} flex items-center justify-end pr-3`}
        >
          <span className="text-xs font-medium text-white">{value}</span>
        </motion.div>
      </div>
      <div className="w-12 text-right text-sm text-white/50">{percentage}%</div>
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default BasicAnalyticsDashboard
