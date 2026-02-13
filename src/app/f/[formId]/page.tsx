'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, CheckCircle, Loader2, AlertCircle, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react'
import { PoweredByBadge } from '@/components/ui/PoweredByBadge'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
  validation?: {
    pattern?: string
    min?: number
    max?: number
  }
}

interface FormData {
  id: string
  title: string
  description?: string
  fields: FormField[]
  styling?: any
  settings?: {
    submitText?: string
    successMessage?: string
    redirectUrl?: string
    showProgressBar?: boolean
    enablePartialSave?: boolean
  }
}

export default function PublicFormPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const formId = params.formId as string
  const isEmbed = searchParams.get('embed') === 'true'
  const resumeToken = searchParams.get('resume') || null
  
  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [startTime] = useState(Date.now())
  const [fieldTimes, setFieldTimes] = useState<Record<string, number>>({})
  const lastFieldTime = useRef(Date.now())
  const formRef = useRef<HTMLFormElement>(null)

  // Track view on mount
  useEffect(() => {
    if (formId) {
      trackEvent('view')
    }
  }, [formId])

  // Load form
  useEffect(() => {
    const loadForm = async () => {
      try {
        // Try localStorage first (for demo/development)
        const storedForms = localStorage.getItem('revoforms-forms')
        if (storedForms) {
          const { forms } = JSON.parse(storedForms)
          const foundForm = forms.find((f: any) => f.id === formId)
          if (foundForm) {
            setForm({
              id: foundForm.id,
              title: foundForm.title || foundForm.name || 'Untitled Form',
              description: foundForm.description,
              fields: foundForm.fields || [],
              styling: foundForm.styling,
              settings: foundForm.settings
            })
            setLoading(false)
            return
          }
        }
        
        // Fallback: try API
        const response = await fetch(`/api/forms/${formId}`)
        if (response.ok) {
          const data = await response.json()
          setForm(data)
        } else {
          setError('Form not found')
        }
      } catch (err) {
        setError('Failed to load form')
      } finally {
        setLoading(false)
      }
    }
    
    loadForm()
  }, [formId])

  // Track field time when changing fields
  useEffect(() => {
    if (form && form.fields[currentFieldIndex]) {
      const fieldId = form.fields[currentFieldIndex].id
      const now = Date.now()
      const timeSpent = Math.round((now - lastFieldTime.current) / 1000)
      
      if (currentFieldIndex > 0) {
        const prevFieldId = form.fields[currentFieldIndex - 1].id
        setFieldTimes(prev => ({
          ...prev,
          [prevFieldId]: (prev[prevFieldId] || 0) + timeSpent
        }))
      }
      
      lastFieldTime.current = now
    }
  }, [currentFieldIndex, form])

  const trackEvent = async (event: 'view' | 'start' | 'complete') => {
    try {
      // Track analytics (would send to server in production)
      console.log(`[Analytics] ${event} for form ${formId}`)
    } catch (err) {
      console.error('Failed to track event:', err)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }))
    // Clear error when user types
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const validateField = (field: FormField): boolean => {
    const value = formValues[field.id]
    
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      setFieldErrors(prev => ({ ...prev, [field.id]: 'This field is required' }))
      return false
    }
    
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, [field.id]: 'Please enter a valid email' }))
        return false
      }
    }
    
    if (field.type === 'phone' && value) {
      const phoneRegex = /^[\d\s\-+()]+$/
      if (!phoneRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, [field.id]: 'Please enter a valid phone number' }))
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (!form) return
    const currentField = form.fields[currentFieldIndex]
    
    if (validateField(currentField)) {
      if (currentFieldIndex < form.fields.length - 1) {
        setCurrentFieldIndex(prev => prev + 1)
        // Track start on first field completion
        if (currentFieldIndex === 0) {
          trackEvent('start')
        }
      }
    }
  }

  const handlePrev = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (form && currentFieldIndex === form.fields.length - 1) {
        handleSubmit(e as any)
      } else {
        handleNext()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    
    // Validate all fields
    let hasErrors = false
    form.fields.forEach(field => {
      if (!validateField(field)) {
        hasErrors = true
      }
    })
    
    if (hasErrors) return
    
    setSubmitting(true)
    
    try {
      const completionTime = Math.round((Date.now() - startTime) / 1000)
      
      const response = await fetch(`/api/submit/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: formValues,
          metadata: {
            completionTime,
            userAgent: navigator.userAgent,
            referrer: document.referrer
          },
          fieldTimes,
          resumeToken
        })
      })
      
      if (response.ok) {
        setSubmitted(true)
        trackEvent('complete')
        
        // Notify parent if embedded
        if (isEmbed) {
          window.parent.postMessage({
            type: 'revoforms-submitted',
            formId,
          }, '*')
        }
        
        // Redirect if configured
        if (form.settings?.redirectUrl) {
          setTimeout(() => {
            window.location.href = form.settings!.redirectUrl!
          }, 2000)
        }
      } else {
        throw new Error('Submission failed')
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-save partial submission
  const savePartial = async () => {
    if (!form || Object.keys(formValues).length === 0) return
    
    try {
      const response = await fetch(`/api/submit/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: formValues,
          isPartial: true,
          resumeToken,
          dropoffField: form.fields[currentFieldIndex]?.id,
          fieldTimes
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Could store resumeToken in URL for later
        console.log('Partial save successful:', data.resumeToken)
      }
    } catch (err) {
      console.error('Failed to save partial:', err)
    }
  }

  // Save partial on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (form?.settings?.enablePartialSave && !submitted) {
        savePartial()
      }
    }
    
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [formValues, submitted])

  const renderField = (field: FormField) => {
    const baseInputClass = `w-full px-4 py-3 bg-white/5 border ${fieldErrors[field.id] ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/20 transition-all`
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'number':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className={baseInputClass}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={4}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseInputClass + " resize-none"}
          />
        )
      
      case 'select':
        return (
          <select
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select an option...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={formValues[field.id] === opt}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-4 h-4 accent-neon-cyan"
                />
                <span className="text-white/80">{opt}</span>
              </label>
            ))}
          </div>
        )
      
      case 'checkbox':
        if (field.options) {
          return (
            <div className="space-y-2">
              {field.options.map((opt) => (
                <label key={opt} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={(formValues[field.id] || []).includes(opt)}
                    onChange={(e) => {
                      const current = formValues[field.id] || []
                      if (e.target.checked) {
                        handleInputChange(field.id, [...current, opt])
                      } else {
                        handleInputChange(field.id, current.filter((v: string) => v !== opt))
                      }
                    }}
                    className="w-4 h-4 accent-neon-cyan"
                  />
                  <span className="text-white/80">{opt}</span>
                </label>
              ))}
            </div>
          )
        }
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues[field.id] || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="w-5 h-5 accent-neon-cyan"
            />
            <span className="text-white/80">{field.label}</span>
          </label>
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
          />
        )
      
      case 'rating':
        const rating = formValues[field.id] || 0
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleInputChange(field.id, star)}
                className={`w-12 h-12 rounded-lg text-xl transition-all ${
                  star <= rating
                    ? 'bg-yellow-400 text-black scale-110'
                    : 'bg-white/10 text-white/40 hover:bg-white/20'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        )
      
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className={baseInputClass}
          />
        )
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1a] to-[#0a0a14] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading form...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1a] to-[#0a0a14] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Form Not Found</h1>
          <p className="text-white/60">{error || 'This form may have been deleted or the link is invalid.'}</p>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1a] to-[#0a0a14] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-white/60 mb-6">
            {form.settings?.successMessage || 'Your response has been submitted successfully.'}
          </p>
          <a 
            href="https://revoforms.dev" 
            target="_blank"
            className="text-neon-cyan hover:underline text-sm"
          >
            Create your own forms with RevoForms →
          </a>
        </motion.div>
        {!isEmbed && <PoweredByBadge />}
      </div>
    )
  }

  const currentField = form.fields[currentFieldIndex]
  const progress = ((currentFieldIndex + 1) / form.fields.length) * 100

  // Conversational Form View
  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1a] to-[#0a0a14] flex flex-col ${isEmbed ? '' : 'py-8 px-4'}`}>
      {/* Progress Bar */}
      {form.settings?.showProgressBar !== false && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
          <motion.div 
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          key={currentFieldIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl px-4"
        >
          {/* Form Header - only on first field */}
          {currentFieldIndex === 0 && (
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{form.title}</h1>
              {form.description && (
                <p className="text-white/60">{form.description}</p>
              )}
            </div>
          )}

          {/* Current Field */}
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="p-6 md:p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-white/40">
                  {currentFieldIndex + 1} of {form.fields.length}
                </span>
                {currentField.required && (
                  <span className="text-xs text-red-400">Required</span>
                )}
              </div>
              
              <label className="block text-lg font-medium text-white mb-4">
                {currentField.label}
              </label>
              
              {renderField(currentField)}
              
              {fieldErrors[currentField.id] && (
                <p className="text-sm text-red-400 mt-2">{fieldErrors[currentField.id]}</p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentFieldIndex === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  currentFieldIndex === 0
                    ? 'opacity-0 pointer-events-none'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              {currentFieldIndex === form.fields.length - 1 ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {form.settings?.submitText || 'Submit'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Keyboard hint */}
            <p className="text-center text-xs text-white/30 mt-4">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter ↵</kbd> to continue
            </p>
          </form>
        </motion.div>
      </div>

      {!isEmbed && <PoweredByBadge formName={form.title} />}
    </div>
  )
}
