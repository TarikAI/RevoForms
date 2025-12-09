'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  Plus,
  Trash2,
  ArrowRight,
  Copy,
  Settings,
  Play,
  Eye,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Edit,
  Lock,
  Unlock
} from 'lucide-react'
import type { FormField } from '@/types/form'

interface BranchCondition {
  id: string
  fieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value: string | number | boolean
  logicOperator?: 'AND' | 'OR'
}

interface Branch {
  id: string
  name: string
  conditions: BranchCondition[]
  targetFieldId: string
  action: 'show' | 'hide' | 'require' | 'optional' | 'jump_to'
  jumpToFieldId?: string
  isEnabled: boolean
}

interface BranchingLogicProps {
  fields: FormField[]
  onBranchesChange: (branches: Branch[]) => void
  initialBranches?: Branch[]
}

const OPERATORS = [
  { value: 'equals', label: 'Equals', types: ['text', 'email', 'select', 'radio'] },
  { value: 'not_equals', label: 'Does not equal', types: ['text', 'email', 'select', 'radio'] },
  { value: 'contains', label: 'Contains', types: ['text', 'textarea', 'email'] },
  { value: 'not_contains', label: 'Does not contain', types: ['text', 'textarea', 'email'] },
  { value: 'greater_than', label: 'Greater than', types: ['number', 'date', 'range'] },
  { value: 'less_than', label: 'Less than', types: ['number', 'date', 'range'] },
  { value: 'is_empty', label: 'Is empty', types: ['all'] },
  { value: 'is_not_empty', label: 'Is not empty', types: ['all'] },
]

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  email: 'Email',
  number: 'Number',
  textarea: 'Text Area',
  select: 'Dropdown',
  multiselect: 'Multi Select',
  radio: 'Radio Button',
  checkbox: 'Checkbox',
  date: 'Date',
  time: 'Time',
  file: 'File Upload',
  rating: 'Rating',
  range: 'Range',
  payment: 'Payment',
  signature: 'Signature'
}

export function BranchingLogic({ fields, onBranchesChange, initialBranches = [] }: BranchingLogicProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [testMode, setTestMode] = useState(false)
  const [testData, setTestData] = useState<Record<string, any>>({})

  const addBranch = useCallback(() => {
    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      name: `Branch ${branches.length + 1}`,
      conditions: [{
        id: `condition_${Date.now()}`,
        fieldId: fields[0]?.id || '',
        operator: 'equals',
        value: '',
        logicOperator: 'AND'
      }],
      targetFieldId: fields[1]?.id || '',
      action: 'show',
      isEnabled: true
    }

    const newBranches = [...branches, newBranch]
    setBranches(newBranches)
    onBranchesChange(newBranches)
    setExpandedBranches(prev => new Set(prev).add(newBranch.id))
  }, [branches, fields, onBranchesChange])

  const updateBranch = useCallback((branchId: string, updates: Partial<Branch>) => {
    const newBranches = branches.map(b =>
      b.id === branchId ? { ...b, ...updates } : b
    )
    setBranches(newBranches)
    onBranchesChange(newBranches)
  }, [branches, onBranchesChange])

  const deleteBranch = useCallback((branchId: string) => {
    const newBranches = branches.filter(b => b.id !== branchId)
    setBranches(newBranches)
    onBranchesChange(newBranches)
  }, [branches, onBranchesChange])

  const duplicateBranch = useCallback((branch: Branch) => {
    const newBranch: Branch = {
      ...branch,
      id: `branch_${Date.now()}`,
      name: `${branch.name} (Copy)`,
      conditions: branch.conditions.map(c => ({
        ...c,
        id: `condition_${Date.now()}`
      }))
    }

    const newBranches = [...branches, newBranch]
    setBranches(newBranches)
    onBranchesChange(newBranches)
  }, [branches, onBranchesChange])

  const addCondition = useCallback((branchId: string) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    const newCondition: BranchCondition = {
      id: `condition_${Date.now()}`,
      fieldId: fields[0]?.id || '',
      operator: 'equals',
      value: '',
      logicOperator: 'AND'
    }

    updateBranch(branchId, {
      conditions: [...branch.conditions, newCondition]
    })
  }, [branches, fields, updateBranch])

  const updateCondition = useCallback((branchId: string, conditionId: string, updates: Partial<BranchCondition>) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    const newConditions = branch.conditions.map(c =>
      c.id === conditionId ? { ...c, ...updates } : c
    )

    updateBranch(branchId, { conditions: newConditions })
  }, [branches, updateBranch])

  const removeCondition = useCallback((branchId: string, conditionId: string) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch || branch.conditions.length <= 1) return

    const newConditions = branch.conditions.filter(c => c.id !== conditionId)
    updateBranch(branchId, { conditions: newConditions })
  }, [branches, updateBranch])

  const getCompatibleOperators = (fieldType: string) => {
    return OPERATORS.filter(op => op.types.includes(fieldType) || op.types.includes('all'))
  }

  const renderCondition = (branch: Branch, condition: BranchCondition, conditionIndex: number) => {
    const field = fields.find(f => f.id === condition.fieldId)
    const compatibleOperators = getCompatibleOperators(field?.type || 'text')

    return (
      <div key={condition.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
        {conditionIndex > 0 && (
          <select
            value={condition.logicOperator}
            onChange={(e) => updateCondition(branch.id, condition.id, {
              logicOperator: e.target.value as 'AND' | 'OR'
            })}
            className="px-2 py-1 bg-white/10 border border-white/10 rounded text-sm text-white"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        )}

        <select
          value={condition.fieldId}
          onChange={(e) => updateCondition(branch.id, condition.id, {
            fieldId: e.target.value
          })}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="">Select field...</option>
          {fields.map(field => (
            <option key={field.id} value={field.id}>
              {field.label || 'Untitled'} ({FIELD_TYPE_LABELS[field.type] || field.type})
            </option>
          ))}
        </select>

        <select
          value={condition.operator}
          onChange={(e) => updateCondition(branch.id, condition.id, {
            operator: e.target.value as BranchCondition['operator']
          })}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          {compatibleOperators.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>

        {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
          <input
            type={field?.type === 'number' ? 'number' : 'text'}
            value={condition.value as string}
            onChange={(e) => updateCondition(branch.id, condition.id, {
              value: field?.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
            })}
            placeholder="Value..."
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40"
          />
        )}

        {branch.conditions.length > 1 && (
          <button
            onClick={() => removeCondition(branch.id, condition.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
          >
            <Trash2 className="w-4 h-4 text-white/50 group-hover:text-red-400" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white">Conditional Logic</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTestMode(!testMode)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              testMode
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <Play className="w-4 h-4" />
            {testMode ? 'Testing Mode' : 'Test Logic'}
          </button>
          <button
            onClick={addBranch}
            className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-100 font-medium mb-1">What is Conditional Logic?</p>
          <p className="text-blue-200/70">
            Create smart forms that show/hide fields based on user responses. For example, show "Company Name"
            field only when user selects "Business" as account type.
          </p>
        </div>
      </div>

      {/* Branches List */}
      <div className="space-y-4">
        <AnimatePresence>
          {branches.map(branch => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Branch Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => {
                  setExpandedBranches(prev => {
                    const next = new Set(prev)
                    if (next.has(branch.id)) {
                      next.delete(branch.id)
                    } else {
                      next.add(branch.id)
                    }
                    return next
                  })
                }}
              >
                <div className="flex items-center gap-3">
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    {expandedBranches.has(branch.id) ? (
                      <ChevronDown className="w-4 h-4 text-white/60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={branch.name}
                    onChange={(e) => updateBranch(branch.id, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-white font-medium border-none outline-none"
                    placeholder="Branch name..."
                  />
                  {branch.isEnabled ? (
                    <Unlock className="w-4 h-4 text-green-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateBranch(branch.id, { isEnabled: !branch.isEnabled })
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      branch.isEnabled
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {branch.isEnabled ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateBranch(branch)
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteBranch(branch.id)
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                  >
                    <Trash2 className="w-4 h-4 text-white/60 group-hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Branch Content */}
              <AnimatePresence>
                {expandedBranches.has(branch.id) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {/* Conditions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-white">Conditions</h4>
                          <button
                            onClick={() => addCondition(branch.id)}
                            className="text-xs px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Condition
                          </button>
                        </div>
                        <div className="space-y-2">
                          {branch.conditions.map((condition, index) =>
                            renderCondition(branch, condition, index)
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div>
                        <h4 className="text-sm font-medium text-white mb-3">Action</h4>
                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                          <select
                            value={branch.action}
                            onChange={(e) => updateBranch(branch.id, {
                              action: e.target.value as Branch['action']
                            })}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          >
                            <option value="show">Show field</option>
                            <option value="hide">Hide field</option>
                            <option value="require">Make required</option>
                            <option value="optional">Make optional</option>
                            <option value="jump_to">Jump to field</option>
                          </select>

                          <select
                            value={branch.targetFieldId}
                            onChange={(e) => updateBranch(branch.id, {
                              targetFieldId: e.target.value
                            })}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          >
                            <option value="">Select field...</option>
                            {fields.map(field => (
                              <option key={field.id} value={field.id}>
                                {field.label || 'Untitled'} ({FIELD_TYPE_LABELS[field.type] || field.type})
                              </option>
                            ))}
                          </select>

                          {branch.action === 'jump_to' && (
                            <>
                              <ArrowRight className="w-4 h-4 text-white/50" />
                              <select
                                value={branch.jumpToFieldId || ''}
                                onChange={(e) => updateBranch(branch.id, {
                                  jumpToFieldId: e.target.value
                                })}
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                              >
                                <option value="">Jump to field...</option>
                                {fields.map(field => (
                                  <option key={field.id} value={field.id}>
                                    {field.label || 'Untitled'}
                                  </option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {branches.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <GitBranch className="w-10 h-10 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No conditional rules yet</h3>
          <p className="text-white/60 mb-4">Create your first branch to start building smart forms</p>
          <button
            onClick={addBranch}
            className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create First Branch
          </button>
        </div>
      )}

      {/* Test Mode Panel */}
      <AnimatePresence>
        {testMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl"
          >
            <h4 className="text-sm font-medium text-green-400 mb-3">Test Your Logic</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.slice(0, 5).map(field => (
                <div key={field.id} className="space-y-2">
                  <label className="text-xs text-white/60">{field.label || 'Untitled'}</label>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={testData[field.id] || ''}
                    onChange={(e) => setTestData(prev => ({
                      ...prev,
                      [field.id]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                    }))}
                    placeholder={`Enter test value for ${field.label || 'field'}...`}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Result
              </button>
              <button className="px-4 py-2 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Test Case
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}