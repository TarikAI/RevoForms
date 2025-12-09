'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, FunctionSquare, Plus, Minus, X, Divide, Percent, Equals } from 'lucide-react'
import { FormField } from '@/types/form'

interface CalculationFieldProps {
  field: FormField
  value?: number
  onChange: (value: number) => void
  error?: string
  disabled?: boolean
  formData?: Record<string, any>
}

export function CalculationField({ field, value = 0, onChange, error, disabled, formData = {} }: CalculationFieldProps) {
  const [formula, setFormula] = useState(field.formula || '')
  const [result, setResult] = useState(value)
  const [isEditing, setIsEditing] = useState(false)
  const [variables, setVariables] = useState<string[]>([])

  const fieldConfig = field.fieldConfig || {}
  const calculationType = fieldConfig.calculationType || 'simple' // 'simple' or 'advanced'
  const currency = fieldConfig.currency || 'USD'
  const decimalPlaces = fieldConfig.decimalPlaces !== undefined ? fieldConfig.decimalPlaces : 2
  const showFormula = fieldConfig.showFormula !== false

  useEffect(() => {
    if (field.formula !== formula) {
      setFormula(field.formula || '')
    }
    if (field.fieldRefs) {
      setVariables(field.fieldRefs.filter((ref: any) => ref && typeof ref === 'string'))
    }
  }, [field])

  useEffect(() => {
    calculateResult()
  }, [formData, formula])

  const calculateResult = () => {
    try {
      let calcFormula = formula
      let calculatedValue = 0

      // Replace field references with actual values
      variables.forEach(variable => {
        const fieldValue = formData[variable] || 0
        const numValue = parseFloat(fieldValue.toString().replace(/[^0-9.-]/g, '')) || 0
        // Use regex to replace whole word matches only
        const regex = new RegExp(`\\b${variable}\\b`, 'g')
        calcFormula = calcFormula.replace(regex, numValue.toString())
      })

      // Evaluate the formula safely
      if (calculationType === 'simple') {
        // Simple arithmetic evaluation
        calculatedValue = evalSimpleFormula(calcFormula)
      } else {
        // Advanced calculations with functions
        calculatedValue = evalAdvancedFormula(calcFormula)
      }

      // Round to specified decimal places
      calculatedValue = Math.round(calculatedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)

      setResult(calculatedValue)
      onChange(calculatedValue)
    } catch (error) {
      console.error('Calculation error:', error)
      setResult(0)
      onChange(0)
    }
  }

  const evalSimpleFormula = (formula: string): number => {
    // Remove whitespace and validate characters
    const cleanFormula = formula.replace(/\s/g, '')
    if (!/^[\d+\-*/().\s]+$/.test(cleanFormula)) {
      throw new Error('Invalid formula characters')
    }

    // Use Function constructor for safer evaluation
    try {
      return new Function('return ' + cleanFormula)()
    } catch {
      return 0
    }
  }

  const evalAdvancedFormula = (formula: string): number => {
    // Support for math functions
    const mathFunctions = {
      sqrt: Math.sqrt,
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      pow: Math.pow,
      log: Math.log,
      log10: Math.log10,
      exp: Math.exp,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      PI: Math.PI,
      E: Math.E
    }

    let evalFormula = formula

    // Replace math functions
    Object.keys(mathFunctions).forEach(func => {
      const regex = new RegExp(`\\b${func}\\b`, 'g')
      evalFormula = evalFormula.replace(regex, `mathFunctions.${func}`)
    })

    // Replace field references (already done above)

    try {
      return new Function('mathFunctions', 'return ' + evalFormula)(mathFunctions)
    } catch {
      return 0
    }
  }

  const insertOperator = (operator: string) => {
    setFormula(prev => prev + operator)
  }

  const insertVariable = (variable: string) => {
    setFormula(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + variable)
  }

  const formatResult = () => {
    if (fieldConfig.formatAs === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(result)
    } else if (fieldConfig.formatAs === 'percentage') {
      return `${(result * 100).toFixed(decimalPlaces)}%`
    } else {
      return result.toFixed(decimalPlaces)
    }
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      {/* Display Result */}
      {!isEditing && (
        <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-white">{field.label}</label>
            {field.required && <span className="text-red-400">*</span>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">
                {formatResult()}
              </span>
            </div>

            {field.canEdit !== false && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Edit Formula
              </button>
            )}
          </div>

          {showFormula && formula && (
            <div className="mt-3 p-2 bg-black/20 rounded-lg">
              <p className="text-xs text-white/60 font-mono">
                Formula: {formula}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Formula Editor */}
      {isEditing && (
        <div className="p-4 bg-white/5 border border-white/20 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">
              {calculationType === 'advanced' ? 'Advanced' : 'Simple'} Calculator
            </label>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-white/60 hover:text-white"
            >
              Done
            </button>
          </div>

          {/* Formula Display */}
          <div className="p-3 bg-black/30 rounded-lg">
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full bg-transparent text-white font-mono text-lg outline-none"
              placeholder="Enter formula..."
            />
          </div>

          {/* Variable Buttons */}
          {variables.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Insert Field:</p>
              <div className="flex flex-wrap gap-2">
                {variables.map(variable => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Operator Buttons */}
          <div>
            <p className="text-xs text-white/40 mb-2">Operators:</p>
            <div className="grid grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => insertOperator('+')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertOperator('-')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertOperator('*')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertOperator('/')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
              >
                <Divide className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertOperator('%')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
              >
                <Percent className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertOperator('()')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center text-xs"
              >
                ( )
              </button>
            </div>
          </div>

          {/* Advanced Functions */}
          {calculationType === 'advanced' && (
            <div>
              <p className="text-xs text-white/40 mb-2">Functions:</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {['sqrt', 'abs', 'min', 'max', 'ceil', 'floor', 'round', 'pow'].map(func => (
                  <button
                    key={func}
                    type="button"
                    onClick={() => insertOperator(`${func}()`)}
                    className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                  >
                    {func}()
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Preview:</span>
              <span className="text-lg font-bold text-green-400">{formatResult()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40 mt-2">{field.helpText}</p>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}