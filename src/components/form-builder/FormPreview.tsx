'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, Smartphone, Tablet, RotateCcw, CheckCircle, Download, UserCircle, Sparkles } from 'lucide-react'
import type { CanvasForm, FormField } from '@/types/form'
import { useProfileStore, getProfileCompleteness } from '@/store/profileStore'
import { FormInterview } from './FormInterview'
import { ExportModal } from './ExportModal'
import { SignatureField } from './fields/SignatureField'
import { MatrixField } from './fields/MatrixField'
import { FormLayout } from './FormLayout'
import { DateRangeField } from './fields/DateRangeField'
import { ColorField } from './fields/ColorField'
import { CalculationField } from './fields/CalculationField'

interface FormPreviewProps {
  form: CanvasForm | null
  isOpen: boolean
  onClose: () => void
  previewMode?: 'edit' | 'success'
}

type DeviceView = 'desktop' | 'tablet' | 'mobile'

function getOptions(field: FormField): { key: string; value: string; label: string }[] {
  if (!field.options) return []
  return field.options.map((opt, idx) => {
    if (typeof opt === 'string') return { key: `${field.id}-opt-${idx}`, value: opt, label: opt }
    return { key: `${field.id}-opt-${idx}`, value: opt.value, label: opt.label }
  })
}

function matchFieldToProfile(field: FormField, profile: any): string | null {
  if (!profile) return null
  const label = (field.label || '').toLowerCase()
  const type = field.type

  if (label.includes('first') && label.includes('name')) return profile.personal?.firstName || null
  if (label.includes('last') && label.includes('name') || label.includes('surname')) return profile.personal?.lastName || null
  if (label.includes('full') && label.includes('name') || (label === 'name')) {
    const first = profile.personal?.firstName || ''
    const last = profile.personal?.lastName || ''
    return `${first} ${last}`.trim() || null
  }
  if (type === 'email' || label.includes('email')) return profile.personal?.email || null
  if (type === 'phone' || label.includes('phone') || label.includes('mobile')) return profile.personal?.phone || null
  if (label.includes('birth') || label.includes('dob')) return profile.personal?.dateOfBirth || null
  if (label.includes('nationality')) return profile.personal?.nationality || null
  if (label.includes('gender')) return profile.personal?.gender || null
  if (label.includes('street') || (label.includes('address') && !label.includes('email'))) return profile.address?.street || null
  if (label.includes('city')) return profile.address?.city || null
  if (label.includes('state') || label.includes('province')) return profile.address?.state || null
  if (label.includes('zip') || label.includes('postal')) return profile.address?.postalCode || null
  if (label.includes('country')) return profile.address?.country || null
  if (label.includes('job') || label.includes('title') || label.includes('position')) return profile.professional?.jobTitle || null
  if (label.includes('company') || label.includes('organization')) return profile.professional?.company || null
  if (label.includes('industry')) return profile.professional?.industry || null
  if (label.includes('linkedin')) return profile.professional?.linkedIn || null
  if (label.includes('website') || label.includes('portfolio')) return profile.professional?.website || profile.professional?.portfolio || null

  return null
}

export function FormPreview({ form, isOpen, onClose, previewMode = 'edit' }: FormPreviewProps) {
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ratingHover, setRatingHover] = useState<Record<string, number>>({})
  const [showAutoFillSuccess, setShowAutoFillSuccess] = useState(false)
  const [showInterview, setShowInterview] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const { profile, openProfileModal } = useProfileStore()

  useEffect(() => {
    if (form && isOpen) {
      const defaults: Record<string, any> = {}
      form.fields.forEach(field => {
        if (field.defaultValue) defaults[field.id] = field.defaultValue
      })
      setFormData(defaults)
      setIsSubmitted(false)
      setErrors({})
    }
  }, [form?.id, isOpen])

  if (!form) return null

  const deviceWidths = { desktop: '100%', tablet: '768px', mobile: '375px' }

  const resetForm = () => {
    setFormData({})
    setIsSubmitted(false)
    setErrors({})
  }

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n })
  }

  const handleCheckboxChange = (fieldId: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const current = prev[fieldId] || []
      return checked ? { ...prev, [fieldId]: [...current, value] } : { ...prev, [fieldId]: current.filter((v: string) => v !== value) }
    })
  }

  const handleAutoFill = () => {
    if (!profile) { openProfileModal(); return }
    
    const filledData: Record<string, any> = { ...formData }
    let filledCount = 0
    
    form.fields.forEach(field => {
      const value = matchFieldToProfile(field, profile)
      if (value) { filledData[field.id] = value; filledCount++ }
    })
    
    setFormData(filledData)
    if (filledCount > 0) {
      setShowAutoFillSuccess(true)
      setTimeout(() => setShowAutoFillSuccess(false), 2000)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    form.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id]
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = `${field.label} is required`
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitted(true)
    }
  }

  const renderField = (field: FormField) => {
    const baseClass = "w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:border-neon-cyan focus:outline-none transition-colors"
    const errorClass = errors[field.id] ? "border-red-500" : "border-white/20"
    const options = getOptions(field)
    const value = formData[field.id] || ''

    switch (field.type) {
      case 'textarea':
        return <textarea placeholder={field.placeholder} rows={4} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass} resize-none`} />
      case 'select':
        return (
          <select value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass}`}>
            <option value="">{field.placeholder || 'Select...'}</option>
            {options.map(opt => <option key={opt.key} value={opt.value}>{opt.label}</option>)}
          </select>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {options.map(opt => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name={field.id} value={opt.value} checked={value === opt.value} onChange={(e) => handleChange(field.id, e.target.value)} className="w-4 h-4 text-neon-cyan" />
                <span className="text-white/80 group-hover:text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <div className="space-y-2">
            {options.length > 0 ? options.map(opt => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" value={opt.value} checked={(formData[field.id] || []).includes(opt.value)} onChange={(e) => handleCheckboxChange(field.id, opt.value, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-white/80 group-hover:text-white">{opt.label}</span>
              </label>
            )) : (
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={!!formData[field.id]} onChange={(e) => handleChange(field.id, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-white/80 group-hover:text-white">{field.label}</span>
              </label>
            )}
          </div>
        )
      case 'rating':
        const currentRating = formData[field.id] || 0
        const hoverRating = ratingHover[field.id] || 0
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={`${field.id}-star-${star}`} type="button" onClick={() => handleChange(field.id, star)}
                onMouseEnter={() => setRatingHover(prev => ({ ...prev, [field.id]: star }))}
                onMouseLeave={() => setRatingHover(prev => ({ ...prev, [field.id]: 0 }))}
                className={`text-3xl transition-colors ${star <= (hoverRating || currentRating) ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400/50'}`}>★</button>
            ))}
            {currentRating > 0 && <span className="ml-2 text-white/60 self-center">{currentRating}/5</span>}
          </div>
        )
      case 'range':
        return (
          <div className="flex items-center gap-3">
            <input type="range" min={field.validation?.min || 0} max={field.validation?.max || 100} value={value || 50} onChange={(e) => handleChange(field.id, e.target.value)} className="flex-1 accent-neon-cyan" />
            <span className="text-white/60 w-10 text-right">{value || 50}</span>
          </div>
        )
      case 'date':
        return <input type="date" value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass} [color-scheme:dark]`} />
      case 'time':
        return <input type="time" value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass} [color-scheme:dark]`} />
      case 'datetime':
        return <input type="datetime-local" value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass} [color-scheme:dark]}`} />
      case 'signature':
        return (
          <SignatureField
            field={field}
            value={value}
            onChange={(signatureData) => handleChange(field.id, signatureData)}
            error={errors[field.id]}
          />
        )
      case 'matrix':
        return (
          <MatrixField
            field={field}
            value={value}
            onChange={(matrixValue) => handleChange(field.id, matrixValue)}
            error={errors[field.id]}
          />
        )
      case 'daterange':
        return (
          <DateRangeField
            field={field}
            value={value}
            onChange={(dateRange) => handleChange(field.id, dateRange)}
            error={errors[field.id]}
          />
        )
      case 'color':
        return (
          <ColorField
            field={field}
            value={value}
            onChange={(color) => handleChange(field.id, color)}
            error={errors[field.id]}
          />
        )
      case 'file_upload':
        return (
          <div className="space-y-2">
            <input
              type="file"
              multiple={field.multiple}
              accept={field.accept}
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                handleChange(field.id, files)
              }}
              className={`${baseClass} ${errorClass} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20`}
            />
            {Array.isArray(value) && value.length > 0 && (
              <div className="text-xs text-white/60">
                Selected: {value.map(f => f.name).join(', ')}
              </div>
            )}
          </div>
        )
      case 'country':
        return (
          <select value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass}`}>
            <option value="">Select country...</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
            <option value="CN">China</option>
            <option value="IN">India</option>
            <option value="BR">Brazil</option>
          </select>
        )
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
              {field.currency || '$'}
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={value || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className={`${baseClass} ${errorClass} pl-8`}
            />
          </div>
        )
      case 'payment':
        return (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
            <div className="text-center">
              <p className="text-sm text-white/60 mb-2">Payment Field</p>
              <p className="text-xs text-white/40">
                {field.paymentType === 'fixed' && `${field.currency || '$'}${field.amount || 0}`}
                {field.paymentType === 'variable' && 'Pay what you want'}
                {field.paymentType === 'subscription' && `${field.currency || '$'}${field.amount || 0}/${field.billingInterval || 'month'}`}
              </p>
            </div>
          </div>
        )
      case 'calculation':
        return (
          <CalculationField
            field={field}
            value={value}
            onChange={(calcValue) => handleChange(field.id, calcValue)}
            error={errors[field.id]}
            disabled={previewMode === 'success'}
            formData={formData}
          />
        )
      case 'address':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Street Address"
              value={value?.street || ''}
              onChange={(e) => handleChange(field.id, { ...value, street: e.target.value })}
              className={`${baseClass} ${errorClass}`}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="City"
                value={value?.city || ''}
                onChange={(e) => handleChange(field.id, { ...value, city: e.target.value })}
                className={`${baseClass} ${errorClass} flex-1`}
              />
              <input
                type="text"
                placeholder="State"
                value={value?.state || ''}
                onChange={(e) => handleChange(field.id, { ...value, state: e.target.value })}
                className={`${baseClass} ${errorClass} w-24`}
              />
              <input
                type="text"
                placeholder="ZIP"
                value={value?.postalCode || ''}
                onChange={(e) => handleChange(field.id, { ...value, postalCode: e.target.value })}
                className={`${baseClass} ${errorClass} w-24`}
              />
            </div>
          </div>
        )
      case 'url':
        return <input type="url" placeholder={field.placeholder || "https://example.com"} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass}`} />
      case 'password':
        return <input type="password" placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass}`} />
      case 'hidden':
        return <input type="hidden" value={value} onChange={(e) => handleChange(field.id, e.target.value)} />
      case 'divider':
        return <hr className="border-white/20" />
      case 'heading':
        return <h3 className="text-lg font-semibold text-white">{field.label}</h3>
      case 'paragraph':
        return <p className="text-sm text-white/70">{field.content || field.label}</p>
      default:
        return <input type={field.type} placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${baseClass} ${errorClass}`} />
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            key="preview-backdrop"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-4 px-4 bg-black/80 backdrop-blur-sm" 
            onClick={onClose}
          >
            <motion.div 
              key="preview-modal"
              initial={{ scale: 0.95, opacity: 0, y: -20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="w-full max-w-4xl max-h-[calc(100vh-6rem)] bg-space-light border border-white/10 rounded-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-white">Test Form: {form.name}</h2>
                  <p className="text-sm text-white/50">Fill out the form to test it</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Interview Mode Button */}
                  <button onClick={() => setShowInterview(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-neon-cyan/20"
                    title="Interview Mode - AI helps you fill the form">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Interview Mode</span>
                  </button>

                  {/* Auto-fill Button */}
                  <button onClick={handleAutoFill}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
                    title={profile ? "Auto-fill with your profile data" : "Set up profile to auto-fill"}>
                    <UserCircle className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">{profile ? 'Auto-fill' : 'Profile'}</span>
                  </button>

                  {/* Export Button - Opens ExportModal with all options */}
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
                    title="Export (PDF, WordPress, HTML, React, JSON)"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">Export</span>
                  </button>

                  {/* Device View */}
                  <div className="hidden md:flex bg-white/5 rounded-lg p-1">
                    {([{ id: 'desktop', icon: Monitor }, { id: 'tablet', icon: Tablet }, { id: 'mobile', icon: Smartphone }] as const).map(({ id, icon: Icon }) => (
                      <button key={id} onClick={() => setDeviceView(id)}
                        className={`p-2 rounded-md transition-colors ${deviceView === id ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-white/50 hover:text-white'}`}>
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                  
                  <button onClick={resetForm} className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors">
                    <RotateCcw className="w-4 h-4" /><span className="hidden sm:inline">Reset</span>
                  </button>
                  
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Auto-fill Success Message */}
              <AnimatePresence>
                {showAutoFillSuccess && (
                  <motion.div 
                    key="autofill-success"
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-green-500/20 border-b border-green-500/30 px-6 py-2 text-center text-green-400 text-sm flex-shrink-0"
                  >
                    ✓ Fields auto-filled from your profile!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-space" ref={formRef}>
                <div className="transition-all duration-300 bg-space-light/50 rounded-2xl overflow-hidden border border-white/10"
                  style={{ width: deviceWidths[deviceView], maxWidth: '100%' }}>
                  <div className="p-6">
                    {isSubmitted ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Form Submitted!</h3>
                        <p className="text-white/60 mb-6">{form.settings?.successMessage || 'Thank you for your submission!'}</p>
                        
                        <div className="text-left max-w-md mx-auto bg-black/30 rounded-xl p-4 mb-6">
                          <p className="text-white/50 text-sm mb-3">Submitted Data:</p>
                          {Object.entries(formData).map(([key, value]) => {
                            const field = form.fields.find(f => f.id === key)
                            return (
                              <div key={`submitted-${key}`} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                                <span className="text-white/60">{field?.label || key}:</span>
                                <span className="text-white">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                              </div>
                            )
                          })}
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                          <button onClick={() => setShowExportModal(true)}
                            className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export
                          </button>
                          <button onClick={resetForm}
                            className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
                            Submit Another
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-white">{form.name}</h3>
                          {form.description && <p className="text-white/60 mt-2">{form.description}</p>}
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                          <FormLayout fields={form.fields.filter(f => f && f.id)} settings={form.settings}>
                            {(field) => (
                              <div className="space-y-2">
                                {!['divider', 'heading', 'paragraph'].includes(field.type) && (
                                  <label className="block text-sm font-medium text-white/90">
                                    {field.label}{field.required && <span className="text-red-400 ml-1">*</span>}
                                  </label>
                                )}
                                {renderField(field)}
                                {errors[field.id] && <p className="text-red-400 text-sm">{errors[field.id]}</p>}
                              </div>
                            )}
                          </FormLayout>

                          <div className="mt-6">
                            <button type="submit"
                              className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
                              {form.settings?.submitButtonText || 'Submit'}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interview Mode */}
      {form && showInterview && (
        <FormInterview
          form={form}
          isOpen={showInterview}
          onClose={() => setShowInterview(false)}
          creatorProfile={profile}
        />
      )}

      {/* Export Modal - Full export options (PDF, WordPress, HTML, React, JSON) */}
      <ExportModal 
        form={form} 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
        formData={formData}
      />
    </>
  )
}
