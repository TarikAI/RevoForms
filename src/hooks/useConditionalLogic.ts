/**
 * useConditionalLogic Hook
 *
 * Evaluates conditional logic rules and applies actions
 */

import { useEffect, useState, useCallback } from 'react'
import type { LogicRule, FormLogic, Condition, ComparisonOperator } from '@/types/conditionalLogic'

interface UseConditionalLogicOptions {
  logic: FormLogic
  formValues: Record<string, any>
  onAction?: (action: any) => void
}

interface LogicResult {
  visibleFields: Set<string>
  requiredFields: Set<string>
  disabledFields: Set<string>
  fieldValues: Record<string, any>
}

export function useConditionalLogic({
  logic,
  formValues,
  onAction,
}: UseConditionalLogicOptions) {
  const [result, setResult] = useState<LogicResult>({
    visibleFields: new Set(),
    requiredFields: new Set(),
    disabledFields: new Set(),
    fieldValues: {},
  })

  const evaluateCondition = useCallback((condition: Condition, values: Record<string, any>): boolean => {
    const fieldValue = values[condition.fieldId]
    const compareValue = condition.value

    switch (condition.operator) {
      case 'equals':
        return fieldValue == compareValue
      case 'not_equals':
        return fieldValue != compareValue
      case 'contains':
        return String(fieldValue || '').toLowerCase().includes(String(compareValue).toLowerCase())
      case 'not_contains':
        return !String(fieldValue || '').toLowerCase().includes(String(compareValue).toLowerCase())
      case 'starts_with':
        return String(fieldValue || '').toLowerCase().startsWith(String(compareValue).toLowerCase())
      case 'ends_with':
        return String(fieldValue || '').toLowerCase().endsWith(String(compareValue).toLowerCase())
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue)
      case 'less_than':
        return Number(fieldValue) < Number(compareValue)
      case 'is_empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      case 'is_selected':
        return Array.isArray(fieldValue) ? fieldValue.includes(compareValue) : fieldValue === compareValue
      case 'is_not_selected':
        return Array.isArray(fieldValue) ? !fieldValue.includes(compareValue) : fieldValue !== compareValue
      default:
        return false
    }
  }, [])

  const evaluateConditionGroup = useCallback((
    conditions: Condition[],
    logicalOperator: 'AND' | 'OR',
    values: Record<string, any>
  ): boolean => {
    if (conditions.length === 0) return true

    if (logicalOperator === 'AND') {
      return conditions.every((condition) => evaluateCondition(condition, values))
    } else {
      return conditions.some((condition) => evaluateCondition(condition, values))
    }
  }, [evaluateCondition])

  const evaluateRule = useCallback((rule: LogicRule, values: Record<string, any>): boolean => {
    if (!rule.enabled) return false

    const groupResults = rule.conditionGroups.map((group) =>
      evaluateConditionGroup(group.conditions, group.logicalOperator, values)
    )

    if (rule.groupLogicalOperator === 'AND') {
      return groupResults.every((result) => result)
    } else {
      return groupResults.some((result) => result)
    }
  }, [evaluateConditionGroup])

  const applyAction = useCallback((action: any, currentResult: LogicResult): LogicResult => {
    const newResult = { ...currentResult }

    switch (action.type) {
      case 'show':
        newResult.visibleFields.add(action.targetFieldId)
        break
      case 'hide':
        newResult.visibleFields.delete(action.targetFieldId)
        break
      case 'require':
        newResult.requiredFields.add(action.targetFieldId)
        break
      case 'optional':
        newResult.requiredFields.delete(action.targetFieldId)
        break
      case 'enable':
        newResult.disabledFields.delete(action.targetFieldId)
        break
      case 'disable':
        newResult.disabledFields.add(action.targetFieldId)
        break
      case 'set_value':
        newResult.fieldValues[action.targetFieldId] = action.value
        break
    }

    return newResult
  }, [])

  useEffect(() => {
    const newResult: LogicResult = {
      visibleFields: new Set(),
      requiredFields: new Set(),
      disabledFields: new Set(),
      fieldValues: {},
    }

    // Evaluate all rules
    for (const rule of logic.rules) {
      if (evaluateRule(rule, formValues)) {
        // Apply all actions from this rule
        for (const action of rule.actions) {
          const updatedResult = applyAction(action, newResult)

          // Trigger callback if provided
          if (onAction) {
            onAction(action)
          }

          setResult(updatedResult)
        }
      }
    }
  }, [logic, formValues, evaluateRule, applyAction, onAction])

  return {
    isFieldVisible: (fieldId: string) => result.visibleFields.has(fieldId) || result.visibleFields.size === 0,
    isFieldRequired: (fieldId: string) => result.requiredFields.has(fieldId),
    isFieldDisabled: (fieldId: string) => result.disabledFields.has(fieldId),
    getFieldValue: (fieldId: string) => result.fieldValues[fieldId],
  }
}
