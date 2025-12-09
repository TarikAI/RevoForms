'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText, Eye, CheckCircle, Target, Download, Filter,
  ArrowUp, ArrowDown, Search, ArrowLeft, Sparkles, Plus,
  BarChart3, Clock
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'
import { useResponseStore } from '@/store/responseStore'

export default function Dashboard() {
  const { forms } = useFormStore()
  const { responses, analytics } = useResponseStore()
  const [timeRange, setTimeRange] = useState('7d')
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate real metrics from store data
  const totalResponses = responses.length
  const totalViews = Object.values(analytics).reduce((sum, a) => sum + a.views, 0)
  const totalCompletions = Object.values(analytics).reduce((sum, a) => sum + a.completions, 0)
  const avgConversion = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0

  const metrics = [
    {
      label: 'Total Forms',
      value: forms.length,
      icon: <FileText className="w-5 h-5" />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Total Responses',
      value: totalResponses,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Conversion Rate',
      value: `${avgConversion}%`,
      icon: <Target className="w-5 h-5" />,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Total Views',
      value: totalViews,
      icon: <Eye className="w-5 h-5" />,
      gradient: 'from-orange-500 to-amber-500'
    }
  ]

  // Get top forms by responses
  const topForms = forms.map(form => ({
    id: form.id,
    name: form.name,
    submissions: analytics[form.id]?.completions || 0,
    views: analytics[form.id]?.views || 0,
    conversion: analytics[form.id]?.views > 0 
      ? Math.round((analytics[form.id]?.completions / analytics[form.id]?.views) * 100) 
      : 0
  })).sort((a, b) => b.submissions - a.submissions).slice(0, 5)

  // Recent responses
  const recentResponses = responses.slice(-5).reverse()

  return (
    <div className="min-h-screen bg-gradient-to-br from-space to-space-light overflow-auto pb-20">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Canvas
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-neon-cyan" />
            Dashboard
          </h1>
          <p className="text-white/60 text-lg">
            Monitor your forms, responses, and performance
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button className="px-4 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center text-white mb-4`}>
                {metric.icon}
              </div>
              <p className="text-3xl font-bold text-white">{metric.value}</p>
              <p className="text-sm text-white/50 mt-1">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Forms */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-neon-cyan" />
                Top Performing Forms
              </h2>
            </div>
            
            {topForms.length > 0 ? (
              <div className="space-y-3">
                {topForms.map((form, index) => (
                  <motion.div 
                    key={form.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{form.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-white/50">
                          <span>{form.submissions} responses</span>
                          <span>•</span>
                          <span>{form.views} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-neon-cyan">{form.conversion}%</p>
                      <p className="text-xs text-white/40">conversion</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No forms created yet</p>
                <Link href="/" className="text-neon-cyan text-sm hover:underline mt-2 inline-block">
                  Create your first form →
                </Link>
              </div>
            )}
          </div>

          {/* Recent Responses */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-neon-purple" />
                Recent Responses
              </h2>
            </div>
            
            {recentResponses.length > 0 ? (
              <div className="space-y-3">
                {recentResponses.map((response, index) => {
                  const form = forms.find(f => f.id === response.formId)
                  return (
                    <motion.div 
                      key={response.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-white/5 rounded-lg"
                    >
                      <p className="text-sm text-white font-medium truncate">
                        {form?.name || 'Unknown Form'}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {mounted && new Date(response.submittedAt).toLocaleString()}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No responses yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/" className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors">
              <Plus className="w-5 h-5 text-neon-cyan" />
              <span className="font-medium text-white">Create New Form</span>
            </Link>
            <Link href="/" className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors">
              <BarChart3 className="w-5 h-5 text-neon-purple" />
              <span className="font-medium text-white">View All Analytics</span>
            </Link>
            <Link href="/" className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors">
              <Download className="w-5 h-5 text-green-400" />
              <span className="font-medium text-white">Export All Data</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
