'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Smartphone, Tablet, Monitor, RotateCcw, Send, CheckCircle } from 'lucide-react'
import type { CanvasForm, FormField } from '@/types/form'

interface FormPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  form: CanvasForm | null
}

export function FormPreviewModal({ isOpen, onClose, form }: FormPreviewModalProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showFields, setShowFields] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (form && isOpen) {
      // Initialize form data with default values
      const initialData: Record<string, any> = {}
      const initialShow: Record<string, boolean> = {}

      form.fields.forEach(field => {
        initialShow[field.id] = true
        if (field.type === 'checkbox') {
          initialData[field.id] = []
        } else if (field.type === 'file') {
          initialData[field.id] = null
        } else if (field.type === 'rating') {
          initialData[field.id] = 0
        } else {
          initialData[field.id] = field.defaultValue || ''
        }
      })

      setFormData(initialData)
      setShowFields(initialShow)
      setIsSubmitted(false)
    }
  }, [form, isOpen])

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const resetForm = () => {
    const initialData: Record<string, any> = {}
    form?.fields.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.id] = []
      } else if (field.type === 'file') {
        initialData[field.id] = null
      } else if (field.type === 'rating') {
        initialData[field.id] = 0
      } else {
        initialData[field.id] = field.defaultValue || ''
      }
    })

    setFormData(initialData)
    setIsSubmitted(false)
  }

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px'
      case 'tablet': return '768px'
      case 'desktop': return '100%'
      default: return '100%'
    }
  }

  const renderField = (field: FormField) => {
    if (!showFields[field.id]) return null

    const value = formData[field.id]
    const baseInputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 transition-all"

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'url':
      case 'password':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={isSubmitted}
              className={baseInputClass}
            />
            {field.helpText && (
              <p className="text-xs text-white/40">{field.helpText}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={field.rows || 4}
              disabled={isSubmitted}
              className={`${baseInputClass} resize-none`}
            />
            {field.helpText && (
              <p className="text-xs text-white/40">{field.helpText}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              disabled={isSubmitted}
              className={baseInputClass}
            >
              <option value="">{field.placeholder || 'Select...'}</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={typeof option === 'string' ? option : option.value}>
                  {typeof option === 'string' ? option : option.label}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="text-xs text-white/40">{field.helpText}</p>
            )}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90 mb-3">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, idx) => {
                const optionValue = typeof option === 'string' ? option : option.value
                const optionLabel = typeof option === 'string' ? option : option.label
                return (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name={field.id}
                      value={optionValue}
                      checked={value === optionValue}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                      disabled={isSubmitted}
                      className="w-4 h-4 text-neon-cyan bg-white/5 border-white/20 focus:ring-neon-cyan focus:ring-offset-0"
                    />
                    <span className="text-white/80 group-hover:text-white">{optionLabel}</span>
                  </label>
                )
              })}
            </div>
            {field.helpText && (
              <p className="text-xs text-white/40 mt-2">{field.helpText}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90 mb-3">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, idx) => {
                const optionValue = typeof option === 'string' ? option : option.value
                const optionLabel = typeof option === 'string' ? option : option.label
                const isChecked = Array.isArray(value) && value.includes(optionValue)
                return (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      value={optionValue}
                      checked={isChecked}
                      onChange={(e) => {
                        if (isChecked) {
                          handleInputChange(field.id, value.filter((v: any) => v !== optionValue))
                        } else {
                          handleInputChange(field.id, [...value, optionValue])
                        }
                      }}
                      disabled={isSubmitted}
                      className="w-4 h-4 rounded text-neon-cyan bg-white/5 border-white/20 focus:ring-neon-cyan focus:ring-offset-0"
                    />
                    <span className="text-white/80 group-hover:text-white">{optionLabel}</span>
                  </label>
                )
              })}
            </div>
            {field.helpText && (
              <p className="text-xs text-white/40 mt-2">{field.helpText}</p>
            )}
          </div>
        )

      case 'rating':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <div className="flex gap-1">
              {[...Array(field.maxStars || 5)].map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInputChange(field.id, idx + 1)}
                  disabled={isSubmitted}
                  className={`text-3xl transition-colors ${
                    idx < value ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {field.helpText && (
              <p className="text-xs text-white/40 mt-2">{field.helpText}</p>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              disabled={isSubmitted}
              className={baseInputClass}
            />
            {field.helpText && (
              <p className="text-xs text-white/40">{field.helpText}</p>
            )}
          </div>
        )

      case 'file':
      case 'file_upload':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="file"
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0] || null)}
              required={field.required}
              disabled={isSubmitted}
              accept={field.accept}
              multiple={field.multiple}
              className={baseInputClass}
            />
            {field.helpText && (
              <p className="text-xs text-white/40">{field.helpText}</p>
            )}
          </div>
        )

      case 'heading':
        const HeadingTag = field.headingLevel || 'h3'
        return (
          <HeadingTag key={field.id} className="text-white font-semibold">
            {field.label}
          </HeadingTag>
        )

      case 'paragraph':
        return (
          <p key={field.id} className="text-white/60">
            {field.content}
          </p>
        )

      case 'divider':
        return <hr key={field.id} className="border-white/10" />

      default:
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={isSubmitted}
              className={baseInputClass}
            />
            {field.helpText && (
              <p className="text-xs text-white/40">{field.helpText}</p>
            )}
          </div>
        )
    }
  }

  if (!isOpen || !form) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full max-w-7xl bg-space-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Form Preview & Testing</h2>
                <p className="text-sm text-white/50">Test your form from different device perspectives</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">Device:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'
                  }`}
                  title="Desktop"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode === 'tablet' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'
                  }`}
                  title="Tablet"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'
                  }`}
                  title="Mobile"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowFields(prev => {
                    const newState: Record<string, boolean> = {}
                    form.fields.forEach(f => {
                      newState[f.id] = !prev[f.id]
                    })
                    return newState
                  })
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
              >
                {Object.values(showFields).every(v => v) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {Object.values(showFields).every(v => v) ? 'Hide All' : 'Show All'}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="mx-auto transition-all duration-300" style={{ width: getPreviewWidth(), maxWidth: '100%' }}>
              {/* Form Preview */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-white mb-2">{form.settings.successMessage}</h3>
                    <p className="text-white/60">Form submitted successfully!</p>
                    <button
                      onClick={resetForm}
                      className="mt-6 px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Test Again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold text-white mb-2">{form.name}</h1>
                      {form.description && (
                        <p className="text-white/60">{form.description}</p>
                      )}
                    </div>

                    {form.fields.map(renderField)}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 px-6 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {isSubmitting ? 'Submitting...' : form.settings.submitButtonText}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}