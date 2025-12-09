import type { CanvasForm, FormField } from '@/types/form'

export interface ABTest {
  id: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  variants: ABTestVariant[]
  trafficSplit: number[] // Must sum to 100
  startDate?: Date
  endDate?: Date
  targetAudience?: {
    criteria: string[]
    percentage?: number
  }
  goals: ABTestGoal[]
  results?: ABTestResult[]
  winner?: string
  confidence: number // Statistical confidence level
}

export interface ABTestVariant {
  id: string
  name: string
  formId: string
  modifications: FormModification[]
  weight: number // Traffic percentage
}

export interface FormModification {
  type: 'field' | 'style' | 'content' | 'layout'
  target: string // Field ID, style property, etc.
  operation: 'add' | 'update' | 'remove' | 'replace'
  value?: any
  originalValue?: any // For rollback
}

export interface ABTestGoal {
  type: 'conversion' | 'completion_rate' | 'time_on_form' | 'drop_off_rate' | 'custom_event'
  value?: number
  event?: string
}

export interface ABTestResult {
  variantId: string
  submissions: number
  conversions: number
  completionRate: number
  averageTime: number // seconds
  dropOffRate: number
  customMetrics?: Record<string, number>
}

/**
 * A/B Testing Engine
 */
export class ABTestingEngine {
  private tests: ABTest[]
  private userAssignments: Map<string, Map<string, string>> // userId -> testId -> variantId

  constructor(tests: ABTest[] = []) {
    this.tests = tests
    this.userAssignments = new Map()
  }

  /**
   * Create a new A/B test
   */
  createTest(testData: Omit<ABTest, 'id'>): ABTest {
    const test: ABTest = {
      ...testData,
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Validate traffic split
    const totalWeight = test.trafficSplit.reduce((a, b) => a + b, 0)
    if (totalWeight !== 100) {
      throw new Error(`Traffic split must sum to 100%, got ${totalWeight}%`)
    }

    this.tests.push(test)
    return test
  }

  /**
   * Get test variant for a user
   */
  getVariantForUser(testId: string, userId: string): string | null {
    const test = this.tests.find(t => t.id === testId)
    if (!test || test.status !== 'running') return null

    // Check if user already assigned
    if (this.userAssignments.has(userId)) {
      const userTests = this.userAssignments.get(userId)!
      if (userTests.has(testId)) {
        return userTests.get(testId)!
      }
    }

    // Assign user based on traffic split
    const random = Math.random() * 100
    let cumulative = 0
    let assignedVariant = test.variants[0].id

    for (let i = 0; i < test.variants.length; i++) {
      cumulative += test.trafficSplit[i]
      if (random <= cumulative) {
        assignedVariant = test.variants[i].id
        break
      }
    }

    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map())
    }
    this.userAssignments.get(userId)!.set(testId, assignedVariant)

    return assignedVariant
  }

  /**
   * Apply modifications to form based on variant
   */
  applyVariantModifications(form: CanvasForm, variant: ABTestVariant): CanvasForm {
    let modifiedForm = { ...form }

    for (const modification of variant.modifications) {
      switch (modification.type) {
        case 'field':
          modifiedForm = this.applyFieldModification(modifiedForm, modification)
          break
        case 'style':
          modifiedForm = this.applyStyleModification(modifiedForm, modification)
          break
        case 'content':
          modifiedForm = this.applyContentModification(modifiedForm, modification)
          break
        case 'layout':
          modifiedForm = this.applyLayoutModification(modifiedForm, modification)
          break
      }
    }

    return modifiedForm
  }

  private applyFieldModification(form: CanvasForm, modification: FormModification): CanvasForm {
    const fields = [...form.fields]

    switch (modification.operation) {
      case 'add':
        if (modification.value) {
          fields.push(modification.value as FormField)
        }
        break

      case 'update':
        const updateIndex = fields.findIndex(f => f.id === modification.target)
        if (updateIndex !== -1 && modification.value) {
          fields[updateIndex] = { ...fields[updateIndex], ...modification.value }
        }
        break

      case 'remove':
        const removeIndex = fields.findIndex(f => f.id === modification.target)
        if (removeIndex !== -1) {
          fields.splice(removeIndex, 1)
        }
        break

      case 'replace':
        const replaceIndex = fields.findIndex(f => f.id === modification.target)
        if (replaceIndex !== -1 && modification.value) {
          fields[replaceIndex] = modification.value as FormField
        }
        break
    }

    return { ...form, fields }
  }

  private applyStyleModification(form: CanvasForm, modification: FormModification): CanvasForm {
    if (!form.styling) {
      form.styling = {
        theme: 'modern-dark',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          background: '#0f0f1a',
          surface: '#1a1a2e',
          text: '#ffffff',
          textSecondary: '#a1a1aa',
          border: '#27273a',
          error: '#ef4444',
          success: '#22c55e',
          accent: '#06b6d4',
        },
      }
    }

    if (modification.operation === 'update' && modification.value) {
      const keys = modification.target.split('.')
      let current: any = form.styling

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = modification.value
    }

    return form
  }

  private applyContentModification(form: CanvasForm, modification: FormModification): CanvasForm {
    if (modification.target === 'name') {
      return { ...form, name: modification.value || form.name }
    }
    if (modification.target === 'description') {
      return { ...form, description: modification.value || form.description }
    }
    if (modification.target === 'submitButtonText') {
      return {
        ...form,
        settings: { ...form.settings, submitButtonText: modification.value || form.settings.submitButtonText }
      }
    }
    if (modification.target === 'successMessage') {
      return {
        ...form,
        settings: { ...form.settings, successMessage: modification.value || form.settings.successMessage }
      }
    }
    return form
  }

  private applyLayoutModification(form: CanvasForm, modification: FormModification): CanvasForm {
    if (modification.target === 'columns') {
      // Apply multi-column layout to fields
      const fields = form.fields.map((field, index) => ({
        ...field,
        width: modification.value[index] || field.width
      }))
      return { ...form, fields }
    }
    return form
  }

  /**
   * Record conversion for a variant
   */
  recordConversion(testId: string, variantId: string, userId: string, metric: Partial<ABTestResult>): void {
    const test = this.tests.find(t => t.id === testId)
    if (!test) return

    if (!test.results) test.results = []

    let result = test.results.find(r => r.variantId === variantId)
    if (!result) {
      result = {
        variantId,
        submissions: 0,
        conversions: 0,
        completionRate: 0,
        averageTime: 0,
        dropOffRate: 0,
      }
      test.results.push(result)
    }

    // Update metrics
    if (metric.submissions !== undefined) result.submissions += metric.submissions
    if (metric.conversions !== undefined) result.conversions += metric.conversions
    if (metric.averageTime !== undefined) {
      result.averageTime = (result.averageTime + metric.averageTime) / 2
    }
    if (metric.dropOffRate !== undefined) {
      result.dropOffRate = (result.dropOffRate + metric.dropOffRate) / 2
    }

    // Calculate derived metrics
    if (result.submissions > 0) {
      result.completionRate = (result.conversions / result.submissions) * 100
    }

    // Check for statistical significance
    this.calculateStatisticalSignificance(test)
  }

  /**
   * Calculate statistical significance
   */
  private calculateStatisticalSignificance(test: ABTest): void {
    if (!test.results || test.results.length < 2) return

    // Simple chi-squared test for conversion rates
    const control = test.results[0]
    const variant = test.results[1]

    if (control.submissions > 30 && variant.submissions > 30) {
      // Calculate p-value (simplified)
      const pooledRate = (control.conversions + variant.conversions) / (control.submissions + variant.submissions)
      const pooledSE = Math.sqrt(pooledRate * (1 - pooledRate) * (1/control.submissions + 1/variant.submissions))
      const zScore = Math.abs((variant.conversions/variant.submissions - control.conversions/control.submissions) / pooledSE)

      // Approximate p-value from z-score
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))

      // Update confidence
      test.confidence = Math.max(0, Math.min(100, (1 - pValue) * 100))

      // Determine winner if confidence > 95%
      if (test.confidence > 95) {
        test.winner = variant.completionRate > control.completionRate ? variant.id : control.id
        test.status = 'completed'
      }
    }
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(x))
    const d = 0.3989423 * Math.exp(-x * x / 2)
    const prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
    return x > 0 ? 1 - prob : prob
  }

  /**
   * Get test results
   */
  getTestResults(testId: string): ABTest | null {
    return this.tests.find(t => t.id === testId) || null
  }

  /**
   * List all tests
   */
  listTests(): ABTest[] {
    return this.tests
  }

  /**
   * Start a test
   */
  startTest(testId: string): boolean {
    const test = this.tests.find(t => t.id === testId)
    if (!test) return false

    if (test.status === 'draft') {
      test.status = 'running'
      test.startDate = new Date()
      return true
    }

    if (test.status === 'paused') {
      test.status = 'running'
      return true
    }

    return false
  }

  /**
   * Pause a test
   */
  pauseTest(testId: string): boolean {
    const test = this.tests.find(t => t.id === testId)
    if (!test || test.status !== 'running') return false

    test.status = 'paused'
    return true
  }

  /**
   * Stop a test
   */
  stopTest(testId: string): boolean {
    const test = this.tests.find(t => t.id === testId)
    if (!test) return false

    test.status = 'completed'
    test.endDate = new Date()
    return true
  }

  /**
   * Delete a test
   */
  deleteTest(testId: string): boolean {
    const index = this.tests.findIndex(t => t.id === testId)
    if (index === -1) return false

    this.tests.splice(index, 1)

    // Clean up user assignments
    for (const [userId, userTests] of this.userAssignments.entries()) {
      userTests.delete(testId)
      if (userTests.size === 0) {
        this.userAssignments.delete(userId)
      }
    }

    return true
  }

  /**
   * Export test results
   */
  exportResults(testId: string): any {
    const test = this.getTestResults(testId)
    if (!test) return null

    return {
      test: {
        id: test.id,
        name: test.name,
        status: test.status,
        startDate: test.startDate,
        endDate: test.endDate,
        confidence: test.confidence,
        winner: test.winner,
      },
      variants: test.variants.map(v => ({
        id: v.id,
        name: v.name,
        weight: v.weight,
        modifications: v.modifications,
      })),
      results: test.results,
    }
  }

  /**
   * Generate A/B test report
   */
  generateReport(testId: string): string {
    const test = this.getTestResults(testId)
    if (!test || !test.results) return 'No results available'

    let report = `A/B Test Report: ${test.name}\n`
    report += `========================\n\n`
    report += `Status: ${test.status}\n`
    report += `Confidence: ${test.confidence.toFixed(2)}%\n`
    if (test.winner) report += `Winner: ${test.winner}\n`
    report += `\nResults:\n`

    for (const result of test.results) {
      const variant = test.variants.find(v => v.id === result.variantId)
      report += `\n${variant?.name || 'Variant'}:\n`
      report += `- Submissions: ${result.submissions}\n`
      report += `- Conversions: ${result.conversions}\n`
      report += `- Conversion Rate: ${result.completionRate.toFixed(2)}%\n`
      report += `- Average Time: ${result.averageTime.toFixed(2)}s\n`
      report += `- Drop-off Rate: ${result.dropOffRate.toFixed(2)}%\n`
    }

    if (test.results.length >= 2) {
      const improvement = ((test.results[1].completionRate - test.results[0].completionRate) / test.results[0].completionRate) * 100
      report += `\n\nImprovement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%\n`
    }

    return report
  }
}