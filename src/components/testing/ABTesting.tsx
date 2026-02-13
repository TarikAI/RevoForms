'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  BarChart3,
  Users,
  Target,
  Trophy,
  Clock,
  Calendar,
  Play,
  Pause,
  Square,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Download,
  Upload,
  Shield,
  Zap,
  Activity,
  Flag,
  Award
} from 'lucide-react'

interface TestVariant {
  id: string
  name: string
  description?: string
  traffic: number // Percentage of traffic (0-100)
  changes: {
    type: 'field' | 'style' | 'layout' | 'content'
    target: string
    oldValue?: any
    newValue?: any
    description: string
  }[]
  metrics?: {
    views: number
    submissions: number
    conversionRate: number
    avgTimeSpent: number
    bounceRate: number
  }
}

interface ABTest {
  id: string
  name: string
  description: string
  hypothesis: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  startDate?: string
  endDate?: string
  duration?: number // in days
  variants: TestVariant[]
  winningVariant?: string
  confidence: number // Statistical confidence (0-100)
  significance: number // Minimum difference to consider significant (in %)
  goals: {
    primary: 'conversion_rate' | 'submissions' | 'time_spent' | 'bounce_rate'
    secondary?: string[]
  }
  trafficDistribution: 'equal' | 'manual'
  created: string
  modified: string
}

interface ABTestingProps {
  formId: string
  formName: string
  onTestCreate: (test: ABTest) => void
  onTestUpdate: (testId: string, updates: Partial<ABTest>) => void
}

const GOAL_OPTIONS = [
  { value: 'conversion_rate', label: 'Conversion Rate', description: 'Percentage of views that result in submissions' },
  { value: 'submissions', label: 'Total Submissions', description: 'Total number of form submissions' },
  { value: 'time_spent', label: 'Time Spent', description: 'Average time users spend on form' },
  { value: 'bounce_rate', label: 'Bounce Rate', description: 'Percentage of users who leave without interacting' }
]

const CHANGE_TYPES = [
  { value: 'field', label: 'Field', description: 'Modify, add, or remove form fields' },
  { value: 'style', label: 'Style', description: 'Change colors, fonts, or visual design' },
  { value: 'layout', label: 'Layout', description: 'Adjust form layout and structure' },
  { value: 'content', label: 'Content', description: 'Update text, labels, or descriptions' }
]

export function ABTesting({ formId, formName, onTestCreate, onTestUpdate }: ABTestingProps) {
  const [tests, setTests] = useState<ABTest[]>([])
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTest, setEditingTest] = useState<ABTest | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'completed'>('all')

  // Mock data - in real app, this would come from API
  const mockTests: ABTest[] = [
    {
      id: 'test1',
      name: 'Button Color Test',
      description: 'Testing if a green submit button increases conversions',
      hypothesis: 'A green submit button will increase conversion rate by 10%',
      status: 'running',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-29T00:00:00Z',
      duration: 14,
      variants: [
        {
          id: 'v1',
          name: 'Control',
          description: 'Original blue submit button',
          traffic: 50,
          changes: [
            {
              type: 'style',
              target: 'submit_button',
              newValue: { backgroundColor: '#3B82F6', textColor: '#FFFFFF' },
              description: 'Blue submit button'
            }
          ],
          metrics: {
            views: 1523,
            submissions: 384,
            conversionRate: 25.2,
            avgTimeSpent: 185,
            bounceRate: 31.2
          }
        },
        {
          id: 'v2',
          name: 'Green Button',
          description: 'Green submit button variant',
          traffic: 50,
          changes: [
            {
              type: 'style',
              target: 'submit_button',
              newValue: { backgroundColor: '#10B981', textColor: '#FFFFFF' },
              description: 'Green submit button'
            }
          ],
          metrics: {
            views: 1487,
            submissions: 417,
            conversionRate: 28.0,
            avgTimeSpent: 178,
            bounceRate: 29.1
          }
        }
      ],
      winningVariant: 'v2',
      confidence: 95,
      significance: 5,
      goals: {
        primary: 'conversion_rate'
      },
      trafficDistribution: 'equal',
      created: '2024-01-15T00:00:00Z',
      modified: '2024-01-15T00:00:00Z'
    },
    {
      id: 'test2',
      name: 'Single vs Multi-Step',
      description: 'Testing if a multi-step form improves completion rates',
      hypothesis: 'Breaking the form into multiple steps will increase completion rate',
      status: 'completed',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-14T00:00:00Z',
      duration: 14,
      variants: [
        {
          id: 'v1',
          name: 'Single Page',
          description: 'All fields on one page',
          traffic: 50,
          changes: [{ type: 'layout', target: 'layout', newValue: 'single', description: 'Single page layout' }],
          metrics: {
            views: 3456,
            submissions: 723,
            conversionRate: 20.9,
            avgTimeSpent: 245,
            bounceRate: 42.3
          }
        },
        {
          id: 'v2',
          name: 'Multi-Step',
          description: 'Fields split across multiple steps',
          traffic: 50,
          changes: [{ type: 'layout', target: 'layout', newValue: 'multi', description: 'Multi-step layout' }],
          metrics: {
            views: 3521,
            submissions: 891,
            conversionRate: 25.3,
            avgTimeSpent: 310,
            bounceRate: 35.7
          }
        }
      ],
      winningVariant: 'v2',
      confidence: 98,
      significance: 10,
      goals: {
        primary: 'conversion_rate'
      },
      trafficDistribution: 'equal',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z'
    }
  ]

  const activeTests = tests.length > 0 ? tests : mockTests
  const filteredTests = filterStatus === 'all'
    ? activeTests
    : activeTests.filter(test => test.status === filterStatus)

  const createTest = (testData: Omit<ABTest, 'id' | 'created' | 'modified'>) => {
    const newTest: ABTest = {
      ...testData,
      id: `test_${Date.now()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }

    const updatedTests = [...tests, newTest]
    setTests(updatedTests)
    onTestCreate(newTest)
    setShowCreateModal(false)
    setEditingTest(null)
  }

  const updateTest = (testId: string, updates: Partial<ABTest>) => {
    const updatedTests = tests.map(t =>
      t.id === testId
        ? { ...t, ...updates, modified: new Date().toISOString() }
        : t
    )
    setTests(updatedTests)
    onTestUpdate(testId, updates)
  }

  const startTest = (testId: string) => {
    updateTest(testId, {
      status: 'running',
      startDate: new Date().toISOString()
    })
  }

  const pauseTest = (testId: string) => {
    updateTest(testId, { status: 'paused' })
  }

  const stopTest = (testId: string) => {
    updateTest(testId, {
      status: 'completed',
      endDate: new Date().toISOString()
    })
  }

  const deleteTest = (testId: string) => {
    setTests(tests.filter(t => t.id !== testId))
    if (selectedTest === testId) {
      setSelectedTest(null)
    }
  }

  const duplicateTest = (test: ABTest) => {
    const duplicatedTest: ABTest = {
      ...test,
      id: `test_${Date.now()}`,
      name: `${test.name} (Copy)`,
      description: `${test.description} (Copy)`,
      status: 'draft',
      variants: test.variants.map(v => ({
        ...v,
        id: `v${Date.now()}_${v.id}`,
        metrics: undefined
      })),
      winningVariant: undefined,
      confidence: 0,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }

    setTests([duplicatedTest, ...tests])
  }

  const calculateWinner = (test: ABTest) => {
    if (test.variants.length < 2 || !test.variants.every(v => v.metrics)) return null

    const primaryGoal = test.goals.primary
    let winningVariant: TestVariant | null = null
    let bestScore = 0

    test.variants.forEach(variant => {
      if (!variant.metrics) return

      let score = 0
      switch (primaryGoal) {
        case 'conversion_rate':
          score = variant.metrics.conversionRate
          break
        case 'submissions':
          score = variant.metrics.submissions
          break
        case 'time_spent':
          score = variant.metrics.avgTimeSpent
          break
        case 'bounce_rate':
          score = 100 - variant.metrics.bounceRate
          break
      }

      if (score > bestScore) {
        bestScore = score
        winningVariant = variant
      }
    })

    return winningVariant
  }

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'completed': return 'text-blue-400'
      case 'paused': return 'text-yellow-400'
      case 'draft': return 'text-gray-400'
      default: return 'text-white/60'
    }
  }

  const getTestStatusBg = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/20'
      case 'completed': return 'bg-blue-500/20'
      case 'paused': return 'bg-yellow-500/20'
      case 'draft': return 'bg-gray-500/20'
      default: return 'bg-white/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white">A/B Testing</h3>
          <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">
            {filteredTests.length} tests
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('running')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                filterStatus === 'running' ? 'bg-green-500/20 text-green-400' : 'text-white/60 hover:text-white'
              }`}
            >
              Running
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                filterStatus === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Test
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Active Tests</span>
            <Play className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {activeTests.filter(t => t.status === 'running').length}
          </p>
          <p className="text-xs text-white/40 mt-1">Currently running</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Completed Tests</span>
            <CheckCircle className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {activeTests.filter(t => t.status === 'completed').length}
          </p>
          <p className="text-xs text-white/40 mt-1">With winners</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Avg. Lift</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">+12.5%</p>
          <p className="text-xs text-white/40 mt-1">Avg improvement</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Total Traffic</span>
            <Users className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl font-bold text-white">
            {filteredTests.reduce((acc, test) =>
              acc + test.variants.reduce((sum, v) => sum + (v.metrics?.views || 0), 0), 0
            ).toLocaleString()}
          </p>
          <p className="text-xs text-white/40 mt-1">Total views</p>
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No A/B tests yet</h3>
            <p className="text-white/60 mb-4">Create your first test to optimize form performance</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create First Test
            </button>
          </div>
        ) : (
          filteredTests.map(test => {
            const winner = test.winningVariant ? test.variants.find(v => v.id === test.winningVariant) : null

            return (
              <>
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 bg-white/5 border rounded-lg transition-all cursor-pointer ${
                  selectedTest === test.id
                    ? 'border-neon-cyan/50 bg-neon-cyan/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedTest(selectedTest === test.id ? null : test.id)}
              >
                {/* Test Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="text-lg font-medium text-white">{test.name}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getTestStatusBg(test.status)} ${getTestStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                      {test.winningVariant && test.status === 'completed' && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Winner: {test.variants.find(v => v.id === test.winningVariant)?.name}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm mb-3">{test.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-white/40" />
                        <span className="text-white/60">Hypothesis:</span>
                        <span className="text-white/80">{test.hypothesis}</span>
                      </div>
                      {test.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/40" />
                          <span className="text-white/60">Duration:</span>
                          <span className="text-white/80">{test.duration} days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {test.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startTest(test.id)
                        }}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </button>
                    )}

                    {test.status === 'running' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          pauseTest(test.id)
                        }}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors text-sm flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" />
                        Pause
                      </button>
                    )}

                    {(test.status === 'paused' || test.status === 'running') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          stopTest(test.id)
                        }}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                      >
                        Stop
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateTest(test)
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Duplicate test"
                    >
                      <Copy className="w-4 h-4 text-white/60" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTest(test.id)
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                      title="Delete test"
                    >
                      <Trash2 className="w-4 h-4 text-white/60 group-hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Variants */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.variants.map((variant, index) => {
                    const isWinner = variant.id === test.winningVariant
                    const changeType = variant.changes[0]?.type

                    return (
                      <div
                        key={variant.id}
                        className={`p-4 bg-white/5 border rounded-lg ${
                          isWinner ? 'border-yellow-500/50' : 'border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h6 className="font-medium text-white flex items-center gap-2">
                              Variant {index + 1}: {variant.name}
                              {isWinner && (
                                <>
                                  <Trophy className="w-4 h-4 text-yellow-400" />
                                  <span className="text-xs text-yellow-400">Winner</span>
                                </>
                              )}
                            </h6>
                            <p className="text-sm text-white/60">{variant.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-white">{variant.traffic}%</span>
                            <p className="text-xs text-white/40">Traffic</p>
                          </div>
                        </div>

                        {/* Changes */}
                        <div className="mb-3">
                          <p className="text-xs text-white/60 mb-1">Changes:</p>
                          <div className="flex flex-wrap gap-2">
                            {variant.changes.slice(0, 2).map((change, idx) => {
                              const typeInfo = CHANGE_TYPES.find(t => t.value === change.type)
                              return (
                                <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                                  {typeInfo?.label}
                                </span>
                              )
                            })}
                            {variant.changes.length > 2 && (
                              <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                                +{variant.changes.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metrics */}
                        {variant.metrics && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-white/60">Views</p>
                              <p className="font-medium text-white">
                                {variant.metrics.views.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60">Conversions</p>
                              <p className="font-medium text-white">
                                {variant.metrics.submissions.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60">Rate</p>
                              <p className="font-medium text-white">
                                {variant.metrics.conversionRate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60">Time</p>
                              <p className="font-medium text-white">
                                {variant.metrics.avgTimeSpent}s
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Statistical Significance */}
                {test.status === 'completed' && test.confidence > 0 && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Statistical Significance</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-white/10 rounded-full h-2">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${test.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-green-400">
                          {test.confidence}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      {test.confidence >= 95
                        ? 'Highly significant result'
                        : test.confidence >= 80
                        ? 'Confidence level good'
                        : 'More data needed for certainty'}
                    </p>
                  </div>
                )}
              </motion.div>
              </>
            )}))}
        </div>

      {/* Create/Edit Test Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTest) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowCreateModal(false)
              setEditingTest(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] bg-space-light border border-white/10 rounded-xl p-6 overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-white mb-6">
                {editingTest ? 'Edit Test' : 'Create A/B Test'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Test Name</label>
                  <input
                    type="text"
                    value={editingTest?.name || ''}
                    onChange={(e) => setEditingTest(editingTest ? { ...editingTest, name: e.target.value } : null)}
                    placeholder="Enter test name..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <textarea
                    value={editingTest?.description || ''}
                    onChange={(e) => setEditingTest(editingTest ? { ...editingTest, description: e.target.value } : null)}
                    placeholder="Describe what you're testing..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Hypothesis</label>
                  <textarea
                    value={editingTest?.hypothesis || ''}
                    onChange={(e) => setEditingTest(editingTest ? { ...editingTest, hypothesis: e.target.value } : null)}
                    placeholder="What do you expect to happen? (e.g., 'Green button will increase conversions by 10%')"
                    rows={2}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Primary Goal</label>
                    <select
                      value={editingTest?.goals?.primary || ''}
                      onChange={(e) => setEditingTest(editingTest ? {
                        ...editingTest,
                        goals: { ...editingTest.goals, primary: e.target.value as any }
                      } : null)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      {GOAL_OPTIONS.map(goal => (
                        <option key={goal.value} value={goal.value}>
                          {goal.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Duration (days)</label>
                    <input
                      type="number"
                      value={editingTest?.duration || 14}
                      onChange={(e) => setEditingTest(editingTest ? { ...editingTest, duration: parseInt(e.target.value) || 14 } : null)}
                      min="1"
                      max="365"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Significance Threshold (%)</label>
                  <input
                    type="number"
                    value={editingTest?.significance || 5}
                    onChange={(e) => setEditingTest(editingTest ? { ...editingTest, significance: parseInt(e.target.value) || 5 } : null)}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                  <p className="text-xs text-white/40 mt-1">Minimum difference to consider statistically significant</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (editingTest) {
                      onTestUpdate(editingTest.id, editingTest)
                      setEditingTest(null)
                    } else {
                      // Create new test with a control variant
                      const newTest: ABTest = {
                        id: `test_${Date.now()}`,
                        name: 'New Test',
                        description: '',
                        hypothesis: '',
                        status: 'draft' as const,
                        duration: 14,
                        variants: [
                          {
                            id: 'control',
                            name: 'Control',
                            description: 'Original version',
                            traffic: 50,
                            changes: []
                          }
                        ],
                        confidence: 0,
                        significance: 10,
                        goals: {
                          primary: 'conversion_rate'
                        },
                        trafficDistribution: 'equal' as const,
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                      }
                      createTest(newTest)
                    }
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingTest ? 'Update Test' : 'Create Test'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingTest(null)
                  }}
                  className="px-6 py-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-100 font-medium mb-1">A/B Testing Best Practices</p>
          <p className="text-blue-200/70">
            • Test one variable at a time for clear results
            • Ensure sufficient traffic for statistical significance
            • Run tests for at least 1-2 weeks
            • Consider seasonal factors when planning tests
          </p>
        </div>
      </div>
    </div>
  )
}