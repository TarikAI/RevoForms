'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Download, Eye, Pen, Type, FileText, 
  Image as ImageIcon, Loader2, CheckCircle 
} from 'lucide-react'
import type { DetectedField, ProcessingResult } from '@/types/upload'

interface FillFormModalProps {
  isOpen: boolean
  onClose: () => void
  uploadResult: ProcessingResult | null
  originalFile?: { name: string; type: string; data: string }
}

type FillStyle = 'typed' | 'handwriting'

export function FillFormModal({ isOpen, onClose, uploadResult, originalFile }: FillFormModalProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [fillStyle, setFillStyle] = useState<FillStyle>('typed')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [downloadReady, setDownloadReady] = useState(false)

  // Initialize field values from detected fields
  useEffect(() => {
    if (uploadResult?.analysis?.fields) {
      const initial: Record<string, string> = {}
      uploadResult.analysis.fields.forEach(field => {
        initial[field.id] = field.value || ''
      })
      setFieldValues(initial)
    }
  }, [uploadResult])

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleFillAndDownload = async (format: 'pdf' | 'image') => {
    if (!uploadResult || !originalFile) return

    setIsProcessing(true)
    try {
      const endpoint = format === 'pdf' ? '/api/pdf/fill' : '/api/image/edit'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalFile: originalFile.data,
          mimeType: originalFile.type,
          fieldValues,
          fillStyle,
          fields: uploadResult.analysis?.fields
        })
      })

      if (!response.ok) throw new Error('Failed to process')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `filled_${originalFile.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      setDownloadReady(true)
      setTimeout(() => setDownloadReady(false), 3000)
    } catch (error) {
      console.error('Fill error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePreview = async () => {
    // Generate preview without downloading
    setIsProcessing(true)
    try {
      // For now, just show a preview state
      setPreviewUrl(originalFile?.data || null)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  const fields = uploadResult?.analysis?.fields || []
  const isPdf = originalFile?.type === 'application/pdf'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-cyan/20 rounded-lg">
                <FileText className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Fill Form</h2>
                <p className="text-white/50 text-sm">
                  {fields.length} fields detected • {originalFile?.name}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex">
            {/* Preview Panel */}
            <div className="w-1/2 border-r border-white/10 p-4 overflow-y-auto bg-white/5">
              <div className="aspect-[8.5/11] bg-white rounded-lg overflow-hidden relative">
                {originalFile?.data && !isPdf ? (
                  <img 
                    src={originalFile.data} 
                    alt="Form preview" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText className="w-16 h-16" />
                  </div>
                )}
                {/* Field highlights would go here */}
              </div>
            </div>

            {/* Fields Panel */}
            <div className="w-1/2 p-4 overflow-y-auto">
              {/* Fill Style Toggle */}
              <div className="mb-4">
                <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Fill Style</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFillStyle('typed')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                      fillStyle === 'typed'
                        ? 'bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    Typed
                  </button>
                  <button
                    onClick={() => setFillStyle('handwriting')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                      fillStyle === 'handwriting'
                        ? 'bg-neon-purple/20 border border-neon-purple/30 text-neon-purple'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <Pen className="w-4 h-4" />
                    Handwriting
                  </button>
                </div>
                {fillStyle === 'handwriting' && (
                  <p className="text-white/40 text-xs mt-2">
                    ✨ Uses NanoBanana AI to add realistic handwriting
                  </p>
                )}
              </div>

              {/* Fields List */}
              <div className="space-y-3">
                <p className="text-white/50 text-xs uppercase tracking-wide">Fields</p>
                {fields.length === 0 ? (
                  <p className="text-white/40 text-sm py-4 text-center">
                    No fillable fields detected
                  </p>
                ) : (
                  fields.map((field: DetectedField) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-white/70 text-sm flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-red-400">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={fieldValues[field.id] || ''}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          rows={3}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 resize-none"
                        />
                      ) : field.type === 'select' && field.options ? (
                        <select
                          value={fieldValues[field.id] || ''}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
                        >
                          <option value="">Select...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={fieldValues[field.id] === 'true'}
                          onChange={e => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                          className="w-5 h-5 rounded bg-white/5 border border-white/10"
                        />
                      ) : (
                        <input
                          type={field.type === 'date' ? 'date' : 'text'}
                          value={fieldValues[field.id] || ''}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {downloadReady && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-green-400 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Download started!
                </motion.div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={isProcessing}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              {isPdf ? (
                <button
                  onClick={() => handleFillAndDownload('pdf')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl hover:opacity-90 flex items-center gap-2 transition-opacity disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download PDF
                </button>
              ) : (
                <button
                  onClick={() => handleFillAndDownload('image')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl hover:opacity-90 flex items-center gap-2 transition-opacity disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  Download Image
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
