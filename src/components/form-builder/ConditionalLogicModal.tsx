'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Settings, Code, Play, AlertCircle } from 'lucide-react'
import { FormConditionalLogic, type ConditionalRule, type Condition, type Action } from '@/lib/conditional-logic'
import type { FormField } from '@/types/form'

interface ConditionalLogicModalProps {
  isOpen: boolean
  onClose: () => void
  fields: FormField[]
  rules: ConditionalRule[]
  onRulesChange: (rules: ConditionalRule[]) => void
}

export function ConditionalLogicModal({ isOpen, onClose, fields, rules, onRulesChange }: ConditionalLogicModalProps) {
  const [logicEngine, setLogicEngine] = useState<FormConditionalLogic | null>(null)
  const [editingRule, setEditingRule] = useState<ConditionalRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [testData, setTestData] = useState<Record<string, any>>({})
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    if (isOpen && fields) {
      const engine = new FormConditionalLogic(fields, rules)
      setLogicEngine(engine)

      // Initialize test data with default values
      const initialData: Record<string, any> = {}
      fields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'multiselect') {
          initialData[field.id] = []
        } else {
          initialData[field.id] = ''
        }
      })
      setTestData(initialData)
    }
  }, [isOpen, fields, rules])

  const handleCreateRule = () => {
    if (!logicEngine) return

    const newRule = logicEngine.addRule({
      name: 'New Rule',
      description: '',
      conditions: [],
      actions: [],
      active: true,
      priority: rules.length,
    })

    setEditingRule(newRule)
    setIsCreating(true)
  }

  const handleSaveRule = () => {
    if (!editingRule || !logicEngine) return

    const validation = logicEngine.validateRule(editingRule)
    if (!validation.valid) {
      alert('Rule validation failed:\n' + validation.errors.join('\n'))
      return
    }

    if (isCreating) {
      onRulesChange([...rules, editingRule])
    } else {
      onRulesChange(rules.map(r => r.id === editingRule.id ? editingRule : r))
    }

    setEditingRule(null)
    setIsCreating(false)
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      onRulesChange(rules.filter(r => r.id !== ruleId))
    }
  }

  const handleToggleRule = (ruleId: string) => {
    onRulesChange(rules.map(r =>
      r.id === ruleId ? { ...r, active: !r.active } : r
    ))
  }

  const handleTestRules = () => {
    if (!logicEngine) return

    const results = logicEngine.updateFormData(testData)
    setTestResults(results)
  }

  const addCondition = (rule: ConditionalRule) => {
    const newCondition: Condition = {
      fieldId: fields[0]?.id || '',
      operator: 'equals',
      value: '',
    }

    setEditingRule({
      ...rule,
      conditions: [...rule.conditions, newCondition],
    })
  }

  const updateCondition = (rule: ConditionalRule, index: number, condition: Condition) => {
    const updatedConditions = [...rule.conditions]
    updatedConditions[index] = condition
    setEditingRule({
      ...rule,
      conditions: updatedConditions,
    })
  }

  const removeCondition = (rule: ConditionalRule, index: number) => {
    const updatedConditions = rule.conditions.filter((_, i) => i !== index)
    setEditingRule({
      ...rule,
      conditions: updatedConditions,
    })
  }

  const addAction = (rule: ConditionalRule) => {
    const newAction: Action = {
      type: 'show_field',
      targetFieldId: fields[0]?.id || '',
    }

    setEditingRule({
      ...rule,
      actions: [...rule.actions, newAction],
    })
  }

  const updateAction = (rule: ConditionalRule, index: number, action: Action) => {
    const updatedActions = [...rule.actions]
    updatedActions[index] = action
    setEditingRule({
      ...rule,
      actions: updatedActions,
    })
  }

  const removeAction = (rule: ConditionalRule, index: number) => {
    const updatedActions = rule.actions.filter((_, i) => i !== index)
    setEditingRule({
      ...rule,
      actions: updatedActions,
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-x-0 top-14 bottom-0 z-[999999] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm"
        style={{ position: 'fixed', left: 0, right: 0, top: '56px', bottom: 0, zIndex: 999999 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl max-h-[calc(100vh-8rem)] bg-space-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Conditional Logic</h2>
                <p className="text-sm text-white/50">Create rules to show/hide fields based on user input</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!editingRule ? (
              <div className="space-y-6">
                {/* Rules List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Active Rules</h3>
                    <button
                      onClick={handleCreateRule}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                      Add Rule
                    </button>
                  </div>

                  {rules.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                      <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No rules created yet</p>
                      <p className="text-sm text-white/40 mt-2">Create your first rule to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className={`p-4 border rounded-xl transition-all ${
                            rule.active
                              ? 'bg-white/5 border-white/20'
                              : 'bg-white/5 border-white/10 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-white">{rule.name}</h4>
                                <button
                                  onClick={() => handleToggleRule(rule.id)}
                                  className={`px-2 py-1 rounded-full text-xs transition-colors ${
                                    rule.active
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : 'bg-white/10 text-white/50'
                                  }`}
                                >
                                  {rule.active ? 'Active' : 'Inactive'}
                                </button>
                              </div>
                              <p className="text-sm text-white/60 mb-3">{rule.description}</p>
                              <div className="text-xs text-white/40">
                                {rule.conditions.length} condition(s) • {rule.actions.length} action(s)
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingRule(rule)
                                  setIsCreating(false)
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Settings className="w-4 h-4 text-white/50" />
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-white/50" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Test Rules */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Test Rules
                  </h3>

                  <div className="space-y-4">
                    {fields.slice(0, 5).map((field) => (
                      <div key={field.id} className="flex items-center gap-3">
                        <label className="text-sm text-white/70 min-w-0 flex-1">{field.label}</label>
                        <input
                          type={field.type}
                          placeholder="Test value"
                          value={testData[field.id] || ''}
                          onChange={(e) => setTestData({ ...testData, [field.id]: e.target.value })}
                          className="w-40 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-neon-cyan/50"
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleTestRules}
                      className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors"
                    >
                      Run Test
                    </button>

                    {testResults && (
                      <div className="mt-4 p-4 bg-black/30 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2">Results:</h4>
                        <pre className="text-xs text-white/60 overflow-x-auto">
                          {JSON.stringify(testResults, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Rule Editor */
              <div className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Rule name"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    className="text-xl font-semibold text-white bg-transparent border-none outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={editingRule.description}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    className="w-full mt-2 text-white/60 bg-transparent border-none outline-none placeholder-white/40"
                  />
                </div>

                {/* Conditions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-white">Conditions</h4>
                    <button
                      onClick={() => addCondition(editingRule)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Condition
                    </button>
                  </div>

                  {editingRule.conditions.length === 0 ? (
                    <p className="text-center py-4 text-white/40">No conditions added</p>
                  ) : (
                    editingRule.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                        <select
                          value={condition.fieldId}
                          onChange={(e) =>
                            updateCondition(editingRule, index, {
                              ...condition,
                              fieldId: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          {fields.map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            updateCondition(editingRule, index, {
                              ...condition,
                              operator: e.target.value as Condition['operator'],
                            })
                          }
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not equals</option>
                          <option value="contains">Contains</option>
                          <option value="not_contains">Does not contain</option>
                          <option value="is_empty">Is empty</option>
                          <option value="is_not_empty">Is not empty</option>
                        </select>

                        {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
                          <input
                            type="text"
                            placeholder="Value"
                            value={condition.value || ''}
                            onChange={(e) =>
                              updateCondition(editingRule, index, {
                                ...condition,
                                value: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          />
                        )}

                        <button
                          onClick={() => removeCondition(editingRule, index)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-white">Actions</h4>
                    <button
                      onClick={() => addAction(editingRule)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Action
                    </button>
                  </div>

                  {editingRule.actions.length === 0 ? (
                    <p className="text-center py-4 text-white/40">No actions added</p>
                  ) : (
                    editingRule.actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                        <select
                          value={action.type}
                          onChange={(e) =>
                            updateAction(editingRule, index, {
                              ...action,
                              type: e.target.value as Action['type'],
                            })
                          }
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          <option value="show_field">Show field</option>
                          <option value="hide_field">Hide field</option>
                          <option value="require_field">Require field</option>
                          <option value="optional_field">Make field optional</option>
                          <option value="set_value">Set value</option>
                        </select>

                        {(action.type === 'show_field' || action.type === 'hide_field' || action.type === 'require_field' || action.type === 'optional_field') && (
                          <select
                            value={action.targetFieldId || ''}
                            onChange={(e) =>
                              updateAction(editingRule, index, {
                                ...action,
                                targetFieldId: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          >
                            <option value="">Select field...</option>
                            {fields.map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {action.type === 'set_value' && (
                          <>
                            <select
                              value={action.targetFieldId || ''}
                              onChange={(e) =>
                                updateAction(editingRule, index, {
                                  ...action,
                                  targetFieldId: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                            >
                              <option value="">Select field...</option>
                              {fields.map((field) => (
                                <option key={field.id} value={field.id}>
                                  {field.label}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="Value"
                              value={action.value || ''}
                              onChange={(e) =>
                                updateAction(editingRule, index, {
                                  ...action,
                                  value: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                            />
                          </>
                        )}

                        <button
                          onClick={() => removeAction(editingRule, index)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            {editingRule ? (
              <>
                <button
                  onClick={() => {
                    setEditingRule(null)
                    setIsCreating(false)
                  }}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  {isCreating ? 'Create Rule' : 'Save Changes'}
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                  Close
                </button>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                    <Code className="w-4 h-4" />
                    Export Rules
                  </button>
                  <button
                    onClick={handleCreateRule}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}