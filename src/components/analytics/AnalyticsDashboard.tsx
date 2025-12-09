'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Line, LineChart, Bar, BarChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Calendar, TrendingUp, Users, Eye, MousePointer, Clock, CheckCircle, BarChart3, Download, Filter } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalViews: number
    totalStarts: number
    totalCompletions: number
    avgCompletionTime: number
    conversionRate: number
    uniqueVisitors: number
    returnVisitors: number
  }
  timeSeries: {
    date: string
    views: number
    starts: number
    completions: number
    uniqueVisitors: number
  }[]
  fieldPerformance: {
    fieldId: string
    fieldName: string
    interactionRate: number
    dropOffRate: number
    avgTimeSpent: number
    errorRate: number
  }[]
  deviceAnalytics: {
    device: string
    sessions: number
    completions: number
    avgTime: number
  }[]
  geographicData: {
    country: string
    sessions: number
    conversions: number
  }[]
  topReferrers: {
    source: string
    sessions: number
    conversions: number
  }[]
}

const COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export function AnalyticsDashboard({ formId }: { formId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'funnel' | 'fields' | 'devices' | 'geo'>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, formId])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/analytics/${formId}?range=${dateRange}`)
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Use mock data for demo
      setData(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): AnalyticsData => ({
    overview: {
      totalViews: 12543,
      totalStarts: 3824,
      totalCompletions: 2149,
      avgCompletionTime: 185,
      conversionRate: 56.2,
      uniqueVisitors: 8942,
      returnVisitors: 3601,
    },
    timeSeries: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      views: Math.floor(Math.random() * 2000) + 1000,
      starts: Math.floor(Math.random() * 600) + 200,
      completions: Math.floor(Math.random() * 400) + 100,
      uniqueVisitors: Math.floor(Math.random() * 1500) + 500,
    })),
    fieldPerformance: [
      { fieldId: 'field_1', fieldName: 'Email', interactionRate: 98.2, dropOffRate: 2.1, avgTimeSpent: 12, errorRate: 1.2 },
      { fieldId: 'field_2', fieldName: 'Full Name', interactionRate: 95.4, dropOffRate: 4.6, avgTimeSpent: 8, errorRate: 0.8 },
      { fieldId: 'field_3', fieldName: 'Company', interactionRate: 72.3, dropOffRate: 27.7, avgTimeSpent: 6, errorRate: 0.3 },
      { fieldId: 'field_4', fieldName: 'Phone Number', interactionRate: 58.1, dropOffRate: 41.9, avgTimeSpent: 10, errorRate: 2.4 },
    ],
    deviceAnalytics: [
      { device: 'Desktop', sessions: 8234, completions: 4521, avgTime: 195 },
      { device: 'Mobile', sessions: 3129, completions: 1243, avgTime: 142 },
      { device: 'Tablet', sessions: 1180, completions: 485, avgTime: 168 },
    ],
    geographicData: [
      { country: 'United States', sessions: 5432, conversions: 2341 },
      { country: 'United Kingdom', sessions: 2134, conversions: 982 },
      { country: 'Canada', sessions: 1892, conversions: 876 },
      { country: 'Australia', sessions: 1234, conversions: 543 },
      { country: 'Germany', sessions: 981, conversions: 421 },
    ],
    topReferrers: [
      { source: 'Direct', sessions: 4321, conversions: 1892 },
      { source: 'Google', sessions: 3214, conversions: 1432 },
      { source: 'Social Media', sessions: 1893, conversions: 721 },
      { source: 'Email Campaign', sessions: 1234, conversions: 543 },
      { source: 'Partner Sites', sessions: 981, conversions: 421 },
    ],
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'funnel', label: 'Conversion Funnel', icon: TrendingUp },
          { id: 'fields', label: 'Field Performance', icon: MousePointer },
          { id: 'devices', label: 'Devices', icon: Users },
          { id: 'geo', label: 'Geographic', icon: Eye },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedMetric(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedMetric === id
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Metrics */}
      {selectedMetric === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Eye className="w-5 h-5" />}
              label="Total Views"
              value={data.overview.totalViews.toLocaleString()}
              change={12.5}
              color="cyan"
            />
            <MetricCard
              icon={<MousePointer className="w-5 h-5" />}
              label="Form Starts"
              value={data.overview.totalStarts.toLocaleString()}
              change={8.3}
              color="purple"
            />
            <MetricCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Completions"
              value={data.overview.totalCompletions.toLocaleString()}
              change={15.7}
              color="green"
            />
            <MetricCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Conversion Rate"
              value={`${data.overview.conversionRate}%`}
              change={5.2}
              color="amber"
            />
          </div>

          {/* Time Series Chart */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="views"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="starts"
                  stackId="1"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Device Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Device Usage</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.deviceAnalytics}
                    dataKey="sessions"
                    name="Sessions"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {data.deviceAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Referrers</h3>
              <div className="space-y-3">
                {data.topReferrers.map((referrer, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-white/70">{referrer.source}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-white/50">{referrer.sessions} sessions</span>
                      <span className="text-sm font-medium text-white">
                        {referrer.conversions} conversions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Conversion Funnel */}
      {selectedMetric === 'funnel' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Conversion Funnel</h3>
            <div className="relative">
              {[
                { label: 'Form Views', value: data.overview.totalViews, color: '#06b6d4' },
                { label: 'Form Starts', value: data.overview.totalStarts, color: '#a855f7' },
                { label: 'Form Completions', value: data.overview.totalCompletions, color: '#22c55e' },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80">{step.label}</span>
                    <span className="text-white font-medium">{step.value.toLocaleString()}</span>
                  </div>
                  <div className="h-8 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(step.value / data.overview.totalViews) * 100}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: step.color }}
                    />
                  </div>
                  {idx < 2 && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                      <div className="text-xs text-white/50 bg-black/50 px-2 py-1 rounded">
                        {((step.value / (idx === 0 ? data.overview.totalViews : data.overview.totalStarts)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/60">Avg. Time</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.overview.avgCompletionTime}s</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/60">Unique Visitors</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.overview.uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/60">Return Rate</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {((data.overview.returnVisitors / data.overview.uniqueVisitors) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/60">Avg. Daily</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Math.round(data.overview.totalCompletions / 7)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Field Performance */}
      {selectedMetric === 'fields' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Field Performance Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60">Field Name</th>
                  <th className="text-center py-3 px-4 text-white/60">Interaction Rate</th>
                  <th className="text-center py-3 px-4 text-white/60">Drop-off Rate</th>
                  <th className="text-center py-3 px-4 text-white/60">Avg. Time (s)</th>
                  <th className="text-center py-3 px-4 text-white/60">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.fieldPerformance.map((field) => (
                  <tr key={field.fieldId} className="border-b border-white/5">
                    <td className="py-3 px-4 text-white">{field.fieldName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        field.interactionRate > 90 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {field.interactionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        field.dropOffRate < 10 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {field.dropOffRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-white/80">{field.avgTimeSpent}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        field.errorRate < 2 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {field.errorRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Device Analytics */}
      {selectedMetric === 'devices' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Device Analytics</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.deviceAnalytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="device" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <Legend />
              <Bar dataKey="sessions" fill="#06b6d4" name="Sessions" />
              <Bar dataKey="completions" fill="#22c55e" name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Geographic Data */}
      {selectedMetric === 'geo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Top Countries</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.geographicData.slice(0, 5)}
                  dataKey="sessions"
                  name="Sessions"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.geographicData.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Conversion by Country</h3>
            <div className="space-y-4">
              {data.geographicData.slice(0, 5).map((country, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70">{country.country}</span>
                    <span className="text-sm text-white/50">
                      {((country.conversions / country.sessions) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(country.conversions / country.sessions) * 100}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change: number
  color: string
}

function MetricCard({ icon, label, value, change, color }: MetricCardProps) {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} border rounded-xl p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="opacity-60">{icon}</span>
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs mt-1">
        {change > 0 ? (
          <span className="text-green-400">↑ {change}%</span>
        ) : (
          <span className="text-red-400">↓ {Math.abs(change)}%</span>
        )}
        <span className="text-white/40 ml-1">vs last period</span>
      </p>
    </motion.div>
  )
}