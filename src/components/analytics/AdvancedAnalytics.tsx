'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Settings,
  Maximize2,
  Grid3X3,
  Activity,
  MapPin,
  Monitor,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  Info,
  ChevronDown,
  CircleCheck
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalViews: number
    totalSubmissions: number
    conversionRate: number
    avgCompletionTime: number
    bounceRate: number
    uniqueVisitors: number
    returningUsers: number
  }
  timeline: {
    date: string
    views: number
    submissions: number
    uniqueUsers: number
  }[]
  devices: {
    desktop: number
    mobile: number
    tablet: number
    other: number
  }
  locations: {
    country: string
    count: number
    percentage: number
  }[]
  trafficSources: {
    source: string
    count: number
    percentage: number
  }[]
  fieldPerformance: {
    fieldId: string
    fieldName: string
    views: number
    interactions: number
    dropOffRate: number
    avgTimeSpent: number
  }[]
  completionFunnel: {
    step: string
    count: number
    percentage: number
  }[]
  abandonmentPoints: {
    fieldName: string
    position: number
    abandonments: number
    reason: string
  }[]
}

interface AdvancedAnalyticsProps {
  formId: string
  formName: string
  dateRange: {
    start: Date
    end: Date
  }
  onDateRangeChange: (range: { start: Date; end: Date }) => void
}

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
  { label: 'All time', days: null }
]

const MOCK_DATA: AnalyticsData = {
  overview: {
    totalViews: 15420,
    totalSubmissions: 3845,
    conversionRate: 24.9,
    avgCompletionTime: 185,
    bounceRate: 31.2,
    uniqueVisitors: 12450,
    returningUsers: 2970
  },
  timeline: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    views: Math.floor(Math.random() * 500) + 300,
    submissions: Math.floor(Math.random() * 100) + 50,
    uniqueUsers: Math.floor(Math.random() * 400) + 200
  })),
  devices: {
    desktop: 6543,
    mobile: 7890,
    tablet: 987,
    other: 0
  },
  locations: [
    { country: 'United States', count: 5234, percentage: 42.3 },
    { country: 'United Kingdom', count: 2345, percentage: 19.0 },
    { country: 'Canada', count: 1876, percentage: 15.2 },
    { country: 'Australia', count: 1234, percentage: 10.0 },
    { country: 'Germany', count: 987, percentage: 8.0 },
    { country: 'Other', count: 644, percentage: 5.5 }
  ],
  trafficSources: [
    { source: 'Direct', count: 5432, percentage: 44.0 },
    { source: 'Google', count: 3456, percentage: 28.0 },
    { source: 'Social Media', count: 1876, percentage: 15.2 },
    { source: 'Email', count: 987, percentage: 8.0 },
    { source: 'Other', count: 569, percentage: 4.8 }
  ],
  fieldPerformance: [
    { fieldId: '1', fieldName: 'Full Name', views: 15420, interactions: 14567, dropOffRate: 5.5, avgTimeSpent: 12 },
    { fieldId: '2', fieldName: 'Email Address', views: 14567, interactions: 13987, dropOffRate: 4.0, avgTimeSpent: 18 },
    { fieldId: '3', fieldName: 'Company', views: 13987, interactions: 8234, dropOffRate: 41.1, avgTimeSpent: 24 },
    { fieldId: '4', fieldName: 'Message', views: 8234, interactions: 7567, dropOffRate: 8.1, avgTimeSpent: 45 }
  ],
  completionFunnel: [
    { step: 'Form Viewed', count: 15420, percentage: 100 },
    { step: 'Started', count: 8934, percentage: 57.9 },
    { step: 'First Field', count: 7856, percentage: 50.9 },
    { step: 'Half Complete', count: 5432, percentage: 35.2 },
    { step: 'Completed', count: 3845, percentage: 24.9 }
  ],
  abandonmentPoints: [
    { fieldName: 'Company', position: 3, abandonments: 5753, reason: 'Optional field skipped' },
    { fieldName: 'Message', position: 4, abandonments: 667, reason: 'Too much text required' },
    { fieldName: 'Phone', position: 5, abandonments: 234, reason: 'Privacy concerns' }
  ]
}

export function AdvancedAnalytics({ formId, formName, dateRange, onDateRangeChange }: AdvancedAnalyticsProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'funnel' | 'devices' | 'locations' | 'performance'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const changePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'funnel', label: 'Conversion Funnel', icon: Target },
    { id: 'devices', label: 'Monitors & Browsers', icon: Monitor },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'performance', label: 'Performance', icon: Activity }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-neon-cyan" />
          <div>
            <h3 className="text-lg font-semibold text-white">Advanced Analytics</h3>
            <p className="text-sm text-white/60">{formName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
            <Calendar className="w-4 h-4 text-white/60" />
            <select
              value={JSON.stringify(dateRange)}
              onChange={(e) => {
                const range = JSON.parse(e.target.value)
                onDateRangeChange({
                  start: new Date(range.start),
                  end: new Date(range.end)
                })
              }}
              className="bg-transparent text-white text-sm outline-none"
            >
              <option value={JSON.stringify({
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
              })}>
                Last 30 days
              </option>
              <option value={JSON.stringify({
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
              })}>
                Last 7 days
              </option>
              <option value={JSON.stringify({
                start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
              })}>
                Last 3 months
              </option>
            </select>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                selectedTab === tab.id
                  ? 'text-neon-cyan border-neon-cyan'
                  : 'text-white/50 border-transparent hover:text-white/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {selectedTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Total Views</span>
                  <Eye className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(MOCK_DATA.overview.totalViews)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+12.5%</span>
                  <span className="text-xs text-white/40">vs last period</span>
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Submissions</span>
                  <Target className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(MOCK_DATA.overview.totalSubmissions)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+8.3%</span>
                  <span className="text-xs text-white/40">vs last period</span>
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Conversion Rate</span>
                  <BarChart3 className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-2xl font-bold text-white">{MOCK_DATA.overview.conversionRate}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+2.1%</span>
                  <span className="text-xs text-white/40">vs last period</span>
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Avg. Completion</span>
                  <Clock className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-2xl font-bold text-white">{formatDuration(MOCK_DATA.overview.avgCompletionTime)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400">-15s</span>
                  <span className="text-xs text-white/40">vs last period</span>
                </div>
              </div>
            </div>

            {/* Traffic Timeline Chart */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
              <h4 className="text-lg font-medium text-white mb-4">Traffic Overview</h4>
              <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/60">Interactive chart visualization</p>
                  <p className="text-xs text-white/40 mt-1">Views and submissions over time</p>
                </div>
              </div>
            </div>

            {/* Monitor and Location Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-4">Monitor Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(MOCK_DATA.devices).map(([device, count]) => {
                    const percentage = (count / Object.values(MOCK_DATA.devices).reduce((a, b) => a + b, 0)) * 100
                    const icons = {
                      desktop: Monitor,
                      mobile: Monitor,
                      tablet: Monitor,
                      other: Monitor
                    }
                    const Icon = icons[device as keyof typeof icons]

                    return (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-white/60" />
                          <span className="text-white capitalize">{device}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-white/10 rounded-full h-2">
                            <div
                              className="h-full bg-neon-cyan rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-white/60 w-12 text-right">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-4">Top Locations</h4>
                <div className="space-y-3">
                  {MOCK_DATA.locations.slice(0, 5).map(location => (
                    <div key={location.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-white/60" />
                        <span className="text-white">{location.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/60">{formatNumber(location.count)}</span>
                        <span className="text-sm text-white/60 w-12 text-right">{location.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Conversion Funnel Tab */}
        {selectedTab === 'funnel' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
              <h4 className="text-lg font-medium text-white mb-6">Conversion Funnel</h4>
              <div className="space-y-4">
                {MOCK_DATA.completionFunnel.map((step, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">{step.step}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-white/60">{formatNumber(step.count)}</span>
                        <span className="text-sm font-medium text-neon-cyan">{step.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${step.percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      />
                    </div>
                    {index < MOCK_DATA.completionFunnel.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowDownRight className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
              <h4 className="text-lg font-medium text-white mb-4">Abandonment Points</h4>
              <div className="space-y-3">
                {MOCK_DATA.abandonmentPoints.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{point.fieldName}</p>
                      <p className="text-sm text-white/60">{point.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-medium">{formatNumber(point.abandonments)}</p>
                      <p className="text-xs text-white/40">abandoned</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Other tabs would follow similar pattern... */}
        {selectedTab === 'devices' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-white/5 border border-white/10 rounded-lg"
          >
            <h4 className="text-lg font-medium text-white mb-4">Monitor & Browser Analytics</h4>
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Detailed device and browser analytics</p>
            </div>
          </motion.div>
        )}

        {selectedTab === 'locations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-white/5 border border-white/10 rounded-lg"
          >
            <h4 className="text-lg font-medium text-white mb-4">Geographic Analytics</h4>
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Interactive map and location statistics</p>
            </div>
          </motion.div>
        )}

        {selectedTab === 'performance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
              <h4 className="text-lg font-medium text-white mb-4">Field Performance</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-white/60 text-sm">
                      <th className="pb-3">Field Name</th>
                      <th className="pb-3">Views</th>
                      <th className="pb-3">Interactions</th>
                      <th className="pb-3">Drop-off Rate</th>
                      <th className="pb-3">Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {MOCK_DATA.fieldPerformance.map((field, index) => (
                      <tr key={index} className="border-t border-white/10">
                        <td className="py-3 text-white">{field.fieldName}</td>
                        <td className="py-3 text-white/60">{formatNumber(field.views)}</td>
                        <td className="py-3 text-white/60">{formatNumber(field.interactions)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            field.dropOffRate > 30 ? 'bg-red-500/20 text-red-400' :
                            field.dropOffRate > 15 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {field.dropOffRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-white/60">{field.avgTimeSpent}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal would go here */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-space-light border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Export Analytics</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Export as CSV</span>
                    <Download className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-white/60 mt-1">Raw data with all metrics</p>
                </button>
                <button className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Export as PDF Report</span>
                    <Download className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-white/60 mt-1">Visual analytics report</p>
                </button>
                <button className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Schedule Report</span>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-white/60 mt-1">Receive regular analytics reports</p>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}