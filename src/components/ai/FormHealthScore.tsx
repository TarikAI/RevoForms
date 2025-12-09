'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Target,
  Zap,
  Clock,
  Users
} from 'lucide-react'
import { FormField } from '@/types/form'

interface HealthMetrics {
  score: number
  issues: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    message: string
    fieldId?: string
  }>
  recommendations: Array<{
    type: string
    priority: 'low' | 'medium' | 'high'
    title: string
    description: string
    impact: string
  }>
  insights: Array<{
    type: string
    title: string
    value: string
    trend: 'up' | 'down' | 'stable'
    description: string
  }>
}

interface FormHealthScoreProps {
  fields: FormField[]
  submissions?: any[]
  onApplyRecommendation?: (recommendation: any) => void
}

export function FormHealthScore({ fields, submissions = [], onApplyRecommendation }: FormHealthScoreProps) {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)

  useEffect(() => {
    analyzeForm()
  }, [fields, submissions])

  const analyzeForm = async () => {
    setIsAnalyzing(true)

    // Simulate API call to AI analysis
    setTimeout(() => {
      const score = calculateHealthScore()
      const issues = identifyIssues()
      const recommendations = generateRecommendations(score)
      const insights = generateInsights()

      setMetrics({ score, issues, recommendations, insights })
      setLastAnalyzed(new Date())
      setIsAnalyzing(false)
    }, 1500)
  }

  const calculateHealthScore = () => {
    let score = 100

    // Deduct points for issues
    if (fields.length > 20) score -= 15
    if (fields.length < 3) score -= 10
    if (!fields.some(f => f.type === 'email')) score -= 20
    if (!fields.some(f => f.placeholder)) score -= 10
    if (fields.filter(f => f.required).length / fields.length > 0.7) score -= 15

    // Bonus points for good practices
    if (fields.some(f => f.conditionalLogic)) score += 10
    if (fields.some(f => f.type === 'file')) score += 5
    if (fields.some(f => f.description)) score += 5

    return Math.min(100, Math.max(0, score))
  }

  const identifyIssues = () => {
    const issues = []

    // Check for missing labels
    fields.forEach(field => {
      if (!field.label || field.label.length < 3) {
        issues.push({
          type: 'unclear_label',
          severity: 'medium' as const,
          message: `Field has unclear or missing label`,
          fieldId: field.id
        })
      }
    })

    // Check for too many required fields
    const requiredCount = fields.filter(f => f.required).length
    if (requiredCount > fields.length * 0.7) {
      issues.push({
        type: 'too_many_required',
        severity: 'high' as const,
        message: 'Too many required fields may reduce completion rates'
      })
    }

    // Check form length
    if (fields.length > 20) {
      issues.push({
        type: 'too_long',
        severity: 'high' as const,
        message: 'Form is too long - consider breaking it into sections'
      })
    }

    return issues
  }

  const generateRecommendations = (score: number) => {
    const recommendations = []

    if (score < 70) {
      recommendations.push({
        type: 'reduce_fields',
        priority: 'high' as const,
        title: 'Reduce Form Length',
        description: 'Remove non-essential fields or move them to a second step',
        impact: '25% increase in completion rate'
      })
    }

    if (!fields.some(f => f.type === 'email')) {
      recommendations.push({
        type: 'add_email',
        priority: 'high' as const,
        title: 'Add Email Field',
        description: 'Collect email addresses to follow up with respondents',
        impact: 'Enables communication and analytics'
      })
    }

    if (!fields.some(f => f.description)) {
      recommendations.push({
        type: 'add_descriptions',
        priority: 'medium' as const,
        title: 'Add Field Descriptions',
        description: 'Provide context for complex or sensitive questions',
        impact: 'Reduces user confusion and errors'
      })
    }

    recommendations.push({
      type: 'enable_progress',
      priority: 'high' as const,
      title: 'Enable Progress Indicator',
      description: 'Show users their progress through the form',
      impact: '15% increase in completion rate'
    })

    return recommendations
  }

  const generateInsights = () => {
    const insights = []

    if (submissions.length > 0) {
      const completionRate = (submissions.filter(s => s.completed).length / submissions.length) * 100
      insights.push({
        type: 'completion_rate',
        title: 'Completion Rate',
        value: `${completionRate.toFixed(1)}%`,
        trend: completionRate > 70 ? 'up' : completionRate < 50 ? 'down' : 'stable',
        description: completionRate > 70 ? 'Good completion rate' : 'Could be improved'
      })

      const avgTime = submissions.reduce((acc, s) => acc + (s.completionTime || 0), 0) / submissions.length
      insights.push({
        type: 'avg_time',
        title: 'Avg. Completion Time',
        value: avgTime > 60 ? `${Math.floor(avgTime / 60)}m ${Math.floor(avgTime % 60)}s` : `${Math.floor(avgTime)}s`,
        trend: 'stable',
        description: avgTime > 300 ? 'Longer than average' : 'Within optimal range'
      })
    }

    insights.push({
      type: 'field_optimization',
      title: 'Optimization Potential',
      value: 'High',
      trend: 'up',
      description: 'Several fields can be optimized for better UX'
    })

    return insights
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-400" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  if (!metrics && !isAnalyzing) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="bg-black/40 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Form Health Score
          </h3>
          {lastAnalyzed && (
            <span className="text-xs text-white/40">
              Analyzed {lastAnalyzed.toLocaleTimeString()}
            </span>
          )}
        </div>

        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Activity className="w-8 h-8 text-neon-cyan" />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - metrics.score / 100) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={getScoreColor(metrics.score)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${getScoreColor(metrics.score)}`}>
                      {metrics.score}
                    </p>
                    <p className="text-xs text-white/60">out of 100</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-white/80">
                {metrics.score >= 80 && "Excellent! Your form is optimized for success."}
                {metrics.score >= 60 && metrics.score < 80 && "Good, but there's room for improvement."}
                {metrics.score < 60 && "Several optimizations are recommended."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Issues */}
      {metrics?.issues.length > 0 && (
        <div className="bg-black/40 rounded-xl p-6 border border-white/10">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Issues Found
          </h4>
          <div className="space-y-3">
            {metrics.issues.map((issue, index) => (
              <div key={index} className="flex items-start gap-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1">
                  <p className="text-sm text-white/80">{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {metrics?.recommendations.length > 0 && (
        <div className="bg-black/40 rounded-xl p-6 border border-white/10">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Recommendations
          </h4>
          <div className="space-y-4">
            {metrics.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="text-white font-medium">{rec.title}</h5>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-white/60 mb-3">{rec.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neon-cyan">{rec.impact}</p>
                  <button
                    onClick={() => onApplyRecommendation?.(rec)}
                    className="text-xs px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {metrics?.insights.length > 0 && (
        <div className="bg-black/40 rounded-xl p-6 border border-white/10">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Key Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.insights.map((insight, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm text-white/80">{insight.title}</h5>
                  {getTrendIcon(insight.trend)}
                </div>
                <p className="text-lg font-semibold text-white mb-1">{insight.value}</p>
                <p className="text-xs text-white/60">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Re-analyze Button */}
      <button
        onClick={analyzeForm}
        disabled={isAnalyzing}
        className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Activity className="w-4 h-4" />
        {isAnalyzing ? 'Analyzing...' : 'Re-analyze Form'}
      </button>
    </div>
  )
}