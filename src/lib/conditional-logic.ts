import type { FormField } from '@/types/form'

export interface ConditionalRule {
  id: string
  name: string
  description: string
  conditions: Condition[]
  actions: Action[]
  active: boolean
  priority: number
}

export interface Condition {
  fieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'is_checked' | 'is_not_checked' | 'greater_than' | 'less_than' | 'is_one_of' | 'is_not_one_of'
  value?: any
  logic?: 'and' | 'or' // For multiple conditions
}

export interface Action {
  type: 'show_field' | 'hide_field' | 'enable_field' | 'disable_field' | 'require_field' | 'optional_field' | 'set_value' | 'calculate_value' | 'jump_to_page' | 'submit_form'
  targetFieldId?: string
  value?: any
  formula?: string // For calculated fields
}

export interface FormData {
  [key: string]: any
}

/**
 * Evaluate form conditional logic
 */
export class FormConditionalLogic {
  private rules: ConditionalRule[]
  private formData: FormData
  private fields: FormField[]

  constructor(fields: FormField[], rules: ConditionalRule[] = []) {
    this.fields = fields
    this.rules = rules.sort((a, b) => b.priority - a.priority) // Sort by priority
    this.formData = {}
  }

  /**
   * Update form data and apply rules
   */
  updateFormData(newData: FormData): {
    visibleFields: string[]
    disabledFields: string[]
    requiredFields: string[]
    fieldValues: FormData
  } {
    this.formData = { ...this.formData, ...newData }

    // Reset states
    const visibleFields = new Set(this.fields.map(f => f.id))
    const disabledFields = new Set<string>()
    const requiredFields = new Set(this.fields.filter(f => f.required).map(f => f.id))
    const fieldValues: FormData = {}

    // Apply all active rules
    for (const rule of this.rules.filter(r => r.active)) {
      if (this.evaluateConditions(rule.conditions)) {
        for (const action of rule.actions) {
          this.applyAction(action, visibleFields, disabledFields, requiredFields, fieldValues)
        }
      }
    }

    return {
      visibleFields: Array.from(visibleFields),
      disabledFields: Array.from(disabledFields),
      requiredFields: Array.from(requiredFields),
      fieldValues,
    }
  }

  /**
   * Evaluate a group of conditions
   */
  private evaluateConditions(conditions: Condition[]): boolean {
    if (conditions.length === 0) return true

    // Group conditions by logic operator
    const andGroups: Condition[][] = []
    let currentOrGroup: Condition[] = []

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]

      if (i === 0 || condition.logic === 'or') {
        if (currentOrGroup.length > 0) {
          andGroups.push(currentOrGroup)
        }
        currentOrGroup = [condition]
      } else {
        currentOrGroup.push(condition)
      }
    }

    if (currentOrGroup.length > 0) {
      andGroups.push(currentOrGroup)
    }

    // Evaluate OR groups
    return andGroups.some(group =>
      group.every(condition => this.evaluateCondition(condition))
    )
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: Condition): boolean {
    const fieldValue = this.formData[condition.fieldId]
    const field = this.fields.find(f => f.id === condition.fieldId)

    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value

      case 'not_equals':
        return fieldValue != condition.value

      case 'contains':
        if (field?.type === 'checkbox') {
          return Array.isArray(fieldValue) && fieldValue.includes(condition.value)
        }
        return String(fieldValue || '').toLowerCase().includes(String(condition.value || '').toLowerCase())

      case 'not_contains':
        if (field?.type === 'checkbox') {
          return !Array.isArray(fieldValue) || !fieldValue.includes(condition.value)
        }
        return !String(fieldValue || '').toLowerCase().includes(String(condition.value || '').toLowerCase())

      case 'starts_with':
        return String(fieldValue || '').toLowerCase().startsWith(String(condition.value || '').toLowerCase())

      case 'ends_with':
        return String(fieldValue || '').toLowerCase().endsWith(String(condition.value || '').toLowerCase())

      case 'is_empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)

      case 'is_not_empty':
        return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)

      case 'is_checked':
        return fieldValue === true || fieldValue === 'true' || fieldValue === 'on'

      case 'is_not_checked':
        return !fieldValue || fieldValue === false || fieldValue === 'false'

      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)

      case 'less_than':
        return Number(fieldValue) < Number(condition.value)

      case 'is_one_of':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(fieldValue)
        }
        return fieldValue == condition.value

      case 'is_not_one_of':
        if (Array.isArray(condition.value)) {
          return !condition.value.includes(fieldValue)
        }
        return fieldValue != condition.value

      default:
        return false
    }
  }

  /**
   * Apply an action based on its type
   */
  private applyAction(
    action: Action,
    visibleFields: Set<string>,
    disabledFields: Set<string>,
    requiredFields: Set<string>,
    fieldValues: FormData
  ): void {
    switch (action.type) {
      case 'show_field':
        if (action.targetFieldId) {
          visibleFields.add(action.targetFieldId)
        }
        break

      case 'hide_field':
        if (action.targetFieldId) {
          visibleFields.delete(action.targetFieldId)
          // Also clear the value when hiding
          delete this.formData[action.targetFieldId]
        }
        break

      case 'enable_field':
        if (action.targetFieldId) {
          disabledFields.delete(action.targetFieldId)
        }
        break

      case 'disable_field':
        if (action.targetFieldId) {
          disabledFields.add(action.targetFieldId)
        }
        break

      case 'require_field':
        if (action.targetFieldId) {
          requiredFields.add(action.targetFieldId)
        }
        break

      case 'optional_field':
        if (action.targetFieldId) {
          requiredFields.delete(action.targetFieldId)
        }
        break

      case 'set_value':
        if (action.targetFieldId && action.value !== undefined) {
          this.formData[action.targetFieldId] = action.value
          fieldValues[action.targetFieldId] = action.value
        }
        break

      case 'calculate_value':
        if (action.targetFieldId && action.formula) {
          const calculatedValue = this.calculateFormula(action.formula)
          this.formData[action.targetFieldId] = calculatedValue
          fieldValues[action.targetFieldId] = calculatedValue
        }
        break

      case 'jump_to_page':
      case 'submit_form':
        // These would be handled by the form component
        // Consider using a proper event system or callbacks
        break
    }
  }

  /**
   * Calculate value from formula
   */
  private calculateFormula(formula: string): number {
    // Replace field references with actual values
    let processedFormula = formula
    const fieldRegex = /\{([a-zA-Z0-9_-]+)\}/g

    let match
    while ((match = fieldRegex.exec(formula)) !== null) {
      const fieldId = match[1]
      const value = Number(this.formData[fieldId]) || 0
      processedFormula = processedFormula.replace(match[0], value.toString())
    }

    // Safe evaluation of mathematical expressions
    try {
      // Only allow numbers, operators, and parentheses
      if (!/^[\d\s+\-*/().]+$/.test(processedFormula)) {
        return 0
      }

      // Use Function constructor for safe evaluation
      return new Function('return ' + processedFormula)()
    } catch {
      return 0
    }
  }

  /**
   * Add a new rule
   */
  addRule(rule: Omit<ConditionalRule, 'id'>): ConditionalRule {
    const newRule: ConditionalRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    this.rules.push(newRule)
    this.sortRulesByPriority()
    return newRule
  }

  /**
   * Update an existing rule
   */
  updateRule(ruleId: string, updates: Partial<ConditionalRule>): ConditionalRule | null {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId)
    if (ruleIndex === -1) return null

    this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates }
    this.sortRulesByPriority()
    return this.rules[ruleIndex]
  }

  /**
   * Delete a rule
   */
  deleteRule(ruleId: string): boolean {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId)
    if (ruleIndex === -1) return false

    this.rules.splice(ruleIndex, 1)
    return true
  }

  /**
   * Get all rules
   */
  getRules(): ConditionalRule[] {
    return [...this.rules]
  }

  /**
   * Get a specific rule
   */
  getRule(ruleId: string): ConditionalRule | null {
    return this.rules.find(r => r.id === ruleId) || null
  }

  /**
   * Sort rules by priority
   */
  private sortRulesByPriority(): void {
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Validate a rule for errors
   */
  validateRule(rule: ConditionalRule): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check if rule has a name
    if (!rule.name || rule.name.trim() === '') {
      errors.push('Rule must have a name')
    }

    // Check if rule has conditions
    if (rule.conditions.length === 0) {
      errors.push('Rule must have at least one condition')
    }

    // Validate conditions
    for (const condition of rule.conditions) {
      const field = this.fields.find(f => f.id === condition.fieldId)
      if (!field) {
        errors.push(`Condition references unknown field: ${condition.fieldId}`)
      }

      // Check if condition value is valid for the operator
      if (condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' &&
          condition.operator !== 'is_checked' && condition.operator !== 'is_not_checked') {
        if (condition.value === undefined || condition.value === null) {
          errors.push(`Condition for field ${condition.fieldId} is missing a value`)
        }
      }
    }

    // Validate actions
    for (const action of rule.actions) {
      if (action.type === 'show_field' || action.type === 'hide_field' ||
          action.type === 'enable_field' || action.type === 'disable_field' ||
          action.type === 'require_field' || action.type === 'optional_field') {
        if (!action.targetFieldId) {
          errors.push(`Action ${action.type} must specify a target field`)
        } else {
          const field = this.fields.find(f => f.id === action.targetFieldId)
          if (!field) {
            errors.push(`Action references unknown field: ${action.targetFieldId}`)
          }
        }
      }

      if (action.type === 'set_value' && !action.targetFieldId) {
        errors.push('Set value action must specify a target field')
      }

      if (action.type === 'calculate_value' && (!action.targetFieldId || !action.formula)) {
        errors.push('Calculate value action must specify a target field and formula')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Export rules to JSON
   */
  exportRules(): string {
    return JSON.stringify(this.rules, null, 2)
  }

  /**
   * Import rules from JSON
   */
  importRules(jsonString: string): { success: boolean; errors?: string[] } {
    try {
      const importedRules = JSON.parse(jsonString)

      if (!Array.isArray(importedRules)) {
        return { success: false, errors: ['Invalid format: expected array of rules'] }
      }

      // Validate each rule
      const allErrors: string[] = []
      const validRules: ConditionalRule[] = []

      for (const rule of importedRules) {
        const validation = this.validateRule(rule)
        if (validation.valid) {
          validRules.push(rule)
        } else {
          allErrors.push(`Rule "${rule.name || 'unnamed'}": ${validation.errors.join(', ')}`)
        }
      }

      if (allErrors.length > 0) {
        return { success: false, errors: allErrors }
      }

      this.rules = validRules
      this.sortRulesByPriority()
      return { success: true }

    } catch (error) {
      return { success: false, errors: ['Invalid JSON format'] }
    }
  }
}