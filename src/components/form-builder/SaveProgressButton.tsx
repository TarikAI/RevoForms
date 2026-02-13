'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Mail, Clock, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'

interface SaveProgressButtonProps {
  formId: string
  formData: Record<string, any>
  currentStep?: number
  totalSteps?: number
  onSave?: (progressId: string) => void
  onLoad?: (formData: Record<string, any>) => void
  className?: string
  autoSave?: boolean
  autoSaveInterval?: number // in seconds
}

export function SaveProgressButton({
  formId,
  formData,
  currentStep,
  totalSteps,
  onSave,
  onLoad,
  className = '',
  autoSave = false,
  autoSaveInterval = 30
}: SaveProgressButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [savedProgress, setSavedProgress] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check for saved progress on mount
  useEffect(() => {
    checkForSavedProgress()
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return

    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        handleSave(false)
      }
    }, autoSaveInterval * 1000)

    return () => clearInterval(interval)
  }, [formData, autoSave, autoSaveInterval])

  const checkForSavedProgress = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/save-progress`)
      const data = await response.json()

      if (data.success && data.formData && Object.keys(data.formData).length > 0) {
        setSavedProgress(data)

        // Ask user if they want to load saved progress
        const shouldLoad = window.confirm(
          `We found your saved progress from ${new Date(data.savedAt).toLocaleDateString()}. Would you like to continue where you left off?`
        )

        if (shouldLoad) {
          onLoad?.(data.formData)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        }
      }
    } catch (error) {
      console.error('Failed to check for saved progress:', error)
    }
  }

  const handleSave = async (showConfirmation = true) => {
    if (Object.keys(formData).length === 0) {
      setError('No form data to save')
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/forms/${formId}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          currentStep,
          totalSteps,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSavedProgress({
          id: data.progressId,
          accessCode: data.accessCode,
          expiresAt: data.expiresAt,
        })
        setLastAutoSave(new Date())
        onSave?.(data.progressId)

        if (showConfirmation) {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 5000)
        }
      } else {
        setError(data.error || 'Failed to save progress')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save progress')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setIsSavingEmail(true)
    setError(null)

    try {
      const response = await fetch(`/api/forms/${formId}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          currentStep,
          totalSteps,
          email,
          sendEmail: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowEmailForm(false)
        setEmail('')
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        setError(data.error || 'Failed to save and send email')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save and send email')
    } finally {
      setIsSavingEmail(false)
    }
  }

  if (savedProgress && !showEmailForm) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">
            Progress saved
            {lastAutoSave && (
              <span className="text-green-400/70 ml-1">
                • {lastAutoSave.toLocaleTimeString()}
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
          title="Save progress"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {autoSave && lastAutoSave && (
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            Auto-saved at {lastAutoSave.toLocaleTimeString()}
          </div>
        )}

        <button
          onClick={() => setShowEmailForm(true)}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-30"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save & Continue Later
            </>
          )}
        </button>
      </div>

      {/* Email Form Modal */}
      {showEmailForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowEmailForm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md p-6 bg-space-light border border-white/10 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Save Your Progress
              </h3>
              <button
                onClick={() => setShowEmailForm(false)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-white/60 mb-6">
              Enter your email address to save your progress. We'll send you a link to return to this form anytime.
            </p>

            <form onSubmit={handleSaveWithEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEmail}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  {isSavingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 inline mr-2" />
                      Send Link
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-xs text-white/40 mt-4 text-center">
              Your progress will be saved for 30 days
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Progress saved successfully!</span>
          {savedProgress?.accessCode && (
            <span className="text-sm opacity-90">
              Code: {savedProgress.accessCode}
            </span>
          )}
        </motion.div>
      )}
    </>
  )
}