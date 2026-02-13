/**
 * Conditional Logic Types
 *
 * Defines types for conditional logic rules, conditions, and actions
 */

export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_selected'
  | 'is_not_selected'

export type LogicalOperator = 'AND' | 'OR'

export type ActionType =
  | 'show'
  | 'hide'
  | 'require'
  | 'optional'
  | 'enable'
  | 'disable'
  | 'set_value'
  | 'skip_to'
  | 'jump_to'
  | 'calculate'

export interface Condition {
  id: string
  fieldId: string
  operator: ComparisonOperator
  value: any
  label?: string // Display label for the field
}

export interface ConditionGroup {
  id: string
  conditions: Condition[]
  logicalOperator: LogicalOperator
}

export interface Action {
  id: string
  type: ActionType
  targetFieldId: string
  value?: any
  calculateExpression?: string // For 'calculate' action
}

export interface LogicRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  conditionGroups: ConditionGroup[]
  groupLogicalOperator: LogicalOperator // How to combine condition groups
  actions: Action[]
  trigger: 'immediate' | 'on_change' | 'on_submit' | 'on_blur'
}

export interface FormLogic {
  formId: string
  rules: LogicRule[]
}
