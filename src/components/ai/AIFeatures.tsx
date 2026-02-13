'use client'

import React, { useState, useEffect } from 'react'
import {
  Brain,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  FileText,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  X,
  Eye,
  Edit,
  Trash2,
  Plus,
  Timer
} from 'lucide-react'

interface AIFeature {
  id: string
  name: string
  description: string
  category: 'analysis' | 'generation' | 'optimization' | 'automation'
  icon: React.ReactNode
  enabled: boolean
  config: any
  lastRun?: string
  status: 'idle' | 'running' | 'completed' | 'error'
}

interface AIInsight {
  id: string
  type: 'drop_off' | 'completion_rate' | 'field_performance' | 'user_behavior' | 'conversion_optimization'
  title: string
  description: string
  value: string | number
  recommendation: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  actionable: boolean
  impact?: string
  createdAt: string
}

interface AIFeaturesProps {
  formId: string
  features: AIFeature[]
  insights: AIInsight[]
  onFeatureToggle: (featureId: string, enabled: boolean) => void
  onFeatureConfigure: (featureId: string, config: any) => void
  onInsightDismiss: (insightId: string) => void
}

export function AIFeatures({
  formId,
  features,
  insights,
  onFeatureToggle,
  onFeatureConfigure,
  onInsightDismiss
}: AIFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'insights' | 'analytics'>('features')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const categories = [
    { id: 'analysis', label: 'AI Analysis', icon: <BarChart3 /> },
    { id: 'generation', label: 'Content Generation', icon: <FileText /> },
    { id: 'optimization', label: 'Form Optimization', icon: <TrendingUp /> },
    { id: 'automation', label: 'Smart Automation', icon: <Zap /> }
  ]

  const filteredFeatures = features.filter(f => activeTab === 'features' || categories[0].id === f.category)

  useEffect(() => {
    // Generate AI analysis when tab changes
    if (activeTab === 'analytics' && !aiAnalysis) {
      generateAIAnalysis()
    }
  }, [activeTab])

  const generateAIAnalysis = () => {
    setIsAnalyzing(true)

    // Simulate AI analysis
    setTimeout(() => {
      setAiAnalysis({
        formHealthScore: 85,
        completionRate: 72,
        averageTimeToComplete: '2m 34s',
        dropOffPoints: [
          { field: 'Email', percentage: 15, reason: 'Validation error' },
          { field: 'Phone', percentage: 12, reason: 'Optional field' },
          { field: 'Company', percentage: 8, reason: 'Too complex' }
        ],
        suggestions: [
          'Remove optional fields to increase completion rate',
          'Add clear error messages for better UX',
          'Simplify complex questions for faster completion'
        ],
        predictions: {
          nextWeekCompletions: 234,
          likelyToComplete: 0.78,
          recommendedActions: [
            'Add progress indicator',
            'Enable auto-save',
            'Reduce form length by 20%'
          ]
        }
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleFeatureAction = (feature: AIFeature, action: 'toggle' | 'configure' | 'run') => {
    switch (action) {
      case 'toggle':
        onFeatureToggle(feature.id, !feature.enabled)
        break
      case 'configure':
        setSelectedFeature(feature)
        setShowConfigModal(true)
        break
      case 'run':
        onFeatureToggle(feature.id, true)
        // Simulate running feature
        setTimeout(() => {
          onFeatureToggle(feature.id, false)
        }, 3000)
        break
    }
  }

  const getPriorityColor = (priority: string) => {
      const colors = {
        low: 'text-blue-400',
        medium: 'text-yellow-400',
        high: 'text-orange-400',
        critical: 'text-red-400'
      }
      return colors[priority as keyof typeof colors] || 'text-white/60'
    }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-neon-cyan" />
            AI-Powered Features
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Leverage AI to optimize and analyze your forms
          </p>
        </div>
        <button
          onClick={generateAIAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI Analysis
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === category.id
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* AI Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {aiAnalysis ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Form Health Score"
                  value={aiAnalysis.formHealthScore}
                  type="score"
                  icon={<Target />}
                />
                <MetricCard
                  title="Completion Rate"
                  value={`${aiAnalysis.completionRate}%`}
                  type="percentage"
                  icon={<TrendingUp />}
                />
                <MetricCard
                  title="Avg. Completion Time"
                  value={aiAnalysis.averageTimeToComplete}
                  type="time"
                  icon={<Timer />}
                />
              </div>

              {/* Drop-off Analysis */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-medium text-white mb-4">Drop-off Points</h4>
                <div className="space-y-3">
                  {aiAnalysis.dropOffPoints.map((point: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{point.field}</span>
                          <span className="text-sm text-orange-400">{point.percentage}%</span>
                        </div>
                        <p className="text-xs text-white/40">{point.reason}</p>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  AI Recommendations
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.suggestions.map((suggestion: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-200">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Predictions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-white mb-2">Next Week Predictions</h4>
                  <p className="text-2xl font-bold text-white">{aiAnalysis.predictions.nextWeekCompletions}</p>
                  <p className="text-xs text-white/40">Expected completions</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-white mb-2">Conversion Probability</h4>
                  <p className="text-2xl font-bold text-green-400">
                    {(aiAnalysis.predictions.likelyToComplete * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-white/40">Based on current patterns</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center text-white/30" />
              <p className="text-sm text-white/40">Click "AI Analysis" to get insights</p>
            </div>
          )}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center text-white/30" />
              <p className="text-sm text-white/40">No AI features available yet</p>
            </div>
          ) : (
            filteredFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onAction={(action) => handleFeatureAction(feature, action)}
              />
            ))
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center text-white/30" />
              <p className="text-sm text-white/40">No insights available yet</p>
            </div>
          ) : (
            insights
              .sort((a, b) => {
              const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
              return priorityOrder[a.priority] - priorityOrder[b.priority]
            })
              .map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onDismiss={() => onInsightDismiss(insight.id)}
                />
              ))
          )}
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-space-light p-6 rounded-xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{selectedFeature.name}</h3>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  setSelectedFeature(null)
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <p className="text-sm text-white/60 mb-4">{selectedFeature.description}</p>

            <div className="space-y-4">
              {selectedFeature.category === 'analysis' && (
                <>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Analysis Frequency</label>
                    <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                      <option value="realtime">Real-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Metrics to Track</label>
                    <div className="space-y-2">
                      {['completion_rate', 'drop_off_points', 'time_analysis', 'user_demographics'].map(metric => (
                        <label key={metric} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={true} className="w-4 h-4 rounded accent-neon-cyan" />
                          <span className="text-sm text-white/70">{metric.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedFeature.category === 'generation' && (
                <>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Content Type</label>
                    <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                      <option value="descriptions">Field Descriptions</option>
                      <option value="thank_you">Thank You Pages</option>
                      <option value="emails">Email Templates</option>
                      <option value="titles">Form Titles</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Tone</label>
                    <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="casual">Casual</option>
                      <option value="persuasive">Persuasive</option>
                    </select>
                  </div>
                </>
              )}

              {selectedFeature.category === 'optimization' && (
                <>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Optimization Goals</label>
                    <div className="space-y-2">
                      {['Increase conversion rate', 'Reduce completion time', 'Improve accessibility', 'Mobile optimization'].map(goal => (
                        <label key={goal} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={false} className="w-4 h-4 rounded accent-neon-cyan" />
                          <span className="text-sm text-white/70">{goal.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Aggressiveness</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      defaultValue="5"
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {selectedFeature.category === 'automation' && (
                <>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Trigger Events</label>
                    <div className="space-y-2">
                      {['form_submit', 'field_change', 'abandon_form', 'time_elapsed'].map(event => (
                        <label key={event} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={false} className="w-4 h-4 rounded accent-neon-cyan" />
                          <span className="text-sm text-white/70">{event.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Actions</label>
                    <div className="space-y-2">
                      {['Send follow-up email', 'Create task in project', 'Notify team', 'Update CRM record'].map(action => (
                        <label key={action} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={false} className="w-4 h-4 rounded accent-neon-cyan" />
                          <span className="text-sm text-white/70">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  setSelectedFeature(null)
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onFeatureConfigure(selectedFeature.id, { test: true })
                  setShowConfigModal(false)
                  setSelectedFeature(null)
                }}
                className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  type,
  icon
}: {
  title: string
  value: string | number
  type: 'score' | 'percentage' | 'time'
  icon: React.ReactNode
}) {
  const getIconColor = () => {
    switch (type) {
      case 'score':
        return parseFloat(value as string) >= 80
          ? 'text-green-400'
          : parseFloat(value as string) >= 60
          ? 'text-yellow-400'
          : 'text-orange-400'
      case 'percentage':
        return parseFloat(value as string) >= 70
          ? 'text-green-400'
          : parseFloat(value as string) >= 50
          ? 'text-yellow-400'
          : 'text-orange-400'
      case 'time':
        return 'text-white'
      default:
        return 'text-white/60'
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2 opacity-60">
        {icon}
        <span className="text-xs text-white/50">{title}</span>
      </div>
      <p className={`text-2xl font-bold ${getIconColor()}`}>{value}</p>
    </div>
  )
}

// Feature Card Component
function FeatureCard({
  feature,
  onAction
}: {
  feature: AIFeature
  onAction: (action: 'toggle' | 'configure' | 'run') => void
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
            {feature.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white">{feature.name}</h4>
            <p className="text-xs text-white/50 mt-1">{feature.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${
                feature.enabled
                  ? 'bg-green-400'
                  : 'bg-gray-400'
              }`} />
              <span className="text-xs text-white/40">
                {feature.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {feature.status === 'running' && (
            <button
              onClick={() => onAction('toggle')}
              className="p-1.5 bg-orange-500/20 text-orange-400 rounded transition-colors"
              title="Pause"
            >
              <Pause className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onAction('configure')}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white/60 rounded transition-colors"
            title="Configure"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={() => onAction('toggle')}
            className={`p-1.5 rounded-lg transition-colors ${
              feature.enabled
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30'
            }`}
            title={feature.enabled ? 'Disable' : 'Enable'}
          >
            {feature.enabled ? <X className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// Insight Card Component
function InsightCard({
  insight,
  onDismiss
}: {
  insight: AIInsight
  onDismiss: () => void
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          insight.priority === 'critical'
            ? 'bg-red-500/20 text-red-400'
            : insight.priority === 'high'
            ? 'bg-orange-500/20 text-orange-400'
            : insight.priority === 'medium'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {insight.type === 'drop_off' && <Target className="w-4 h-4" />}
          {insight.type === 'completion_rate' && <BarChart3 className="w-4 h-4" />}
          {insight.type === 'field_performance' && <FileText className="w-4 h-4" />}
          {insight.type === 'user_behavior' && <Users className="w-4 h-4" />}
          {insight.type === 'conversion_optimization' && <TrendingUp className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
          <p className="text-xs text-white/60 mb-2">{insight.description}</p>
          {insight.value && (
            <p className="text-sm font-mono text-neon-cyan mb-2">{insight.value}</p>
          )}
          {insight.impact && (
            <p className="text-xs text-white/40">Impact: {insight.impact}</p>
          )}
          {insight.actionable && (
            <div className="flex gap-2 mt-2">
              <button className="text-xs px-2 py-1 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded transition-colors">
                Apply Suggestion
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss()}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-3 h-3 text-white/40" />
        </button>
      </div>
    </div>
  )
}