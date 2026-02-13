'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Image, X, Loader2, CheckCircle,
  AlertCircle, FileUp, Wand2, Edit3, Download
} from 'lucide-react'
import type { ProcessingMode } from '@/types/upload'
import { toast } from 'sonner'

// Unified result interface
export interface UploadResult {
  success: boolean
  mode: ProcessingMode
  error?: string
  // For recreate mode
  formStructure?: {
    name: string
    description: string
    fields: any[]
    settings?: any
    styling?: any
  }
  // For fill mode
  filledPDF?: ArrayBuffer
  filledImage?: ArrayBuffer
  // Analysis data
  detectedFields?: any[]
  // For multiple files
  batchResults?: BatchFileResult[]
  summary?: {
    total: number
    success: number
    failed: number
  }
}

interface BatchFileResult {
  filename: string
  success: boolean
  formStructure?: any
  error?: string
  provider?: string
}

interface UploadZoneProps {
  onUploadComplete?: (result: UploadResult | UploadResult[]) => void
  onFormCreated?: (formData: any) => void
  onFilledPdf?: (pdfData: ArrayBuffer, filename: string) => void
  onEditedImage?: (imageData: ArrayBuffer, filename: string) => void
  compact?: boolean
  allowMultiple?: boolean
  batchMode?: 'separate' | 'combined'
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'processing' | 'success' | 'error'

interface UploadedFile {
  file: File
  preview?: string
  type: 'pdf' | 'image' | 'other'
}

export function UploadZone({
  onUploadComplete,
  onFormCreated,
  onFilledPdf,
  onEditedImage,
  compact,
  allowMultiple = false,
  batchMode = 'separate'
}: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('create')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [userPrompt, setUserPrompt] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState('dragging')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState('idle')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState('idle')
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      if (allowMultiple) {
        files.forEach((f) => handleFile(f))
      } else {
        handleFile(files[0])
      }
    }
  }, [allowMultiple])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (allowMultiple) {
        Array.from(files).forEach((f) => handleFile(f))
      } else {
        handleFile(files[0])
      }
    }
  }, [allowMultiple])

  const handleFile = async (file: File) => {
    const type = file.type === 'application/pdf' ? 'pdf'
      : file.type.startsWith('image/') ? 'image' : 'other'

    let preview: string | undefined
    if (type === 'image') {
      preview = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    }

    setUploadedFiles((prev) => [...prev, { file, preview, type }])
    setError(null)
    setResult(null)
  }

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return

    setState('uploading')
    setError(null)

    try {
      const formData = new FormData()

      if (allowMultiple && uploadedFiles.length > 1) {
        // Batch upload
        uploadedFiles.forEach((f) => {
          formData.append('files', f.file)
        })
        formData.append('mode', processingMode)
        formData.append('batchMode', batchMode)
      } else {
        // Single file upload
        formData.append('file', uploadedFiles[0].file)
        formData.append('mode', processingMode)
      }

      if (userPrompt.trim()) {
        formData.append('prompt', userPrompt.trim())
      }

      setState('processing')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Processing failed')
      }

      setResult(data)
      setState('success')

      // Build unified result
      const uploadResult: UploadResult = {
        success: true,
        mode: processingMode,
        formStructure: data.formStructure,
        filledPDF: data.filledPDF,
        filledImage: data.filledImage,
        detectedFields: data.detectedFields,
        batchResults: data.batchResults,
        summary: data.summary
      }

      // Call unified callback
      if (allowMultiple && data.batchResults) {
        onUploadComplete?.(data.batchResults)
      } else {
        onUploadComplete?.(uploadResult)
      }

      // Call specific callbacks
      if (data.formStructure && onFormCreated) {
        onFormCreated(data.formStructure)
      }
      if (data.filledPDF && onFilledPdf) {
        onFilledPdf(data.filledPDF, `filled_${uploadedFiles[0].file.name}`)
      }
      if (data.filledImage && onEditedImage) {
        onEditedImage(data.filledImage, `edited_${uploadedFiles[0].file.name}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMsg)
      setState('error')
      onUploadComplete?.({ success: false, mode: processingMode, error: errorMsg })
    }
  }

  const reset = () => {
    setUploadedFiles([])
    setState('idle')
    setError(null)
    setResult(null)
    setResults([])
    setUserPrompt('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const modeOptions = [
    { id: 'create', label: 'Create Editable Form', icon: Wand2, desc: 'Convert to RevoForm' },
    { id: 'fill', label: 'Fill Form', icon: Edit3, desc: 'Fill and download' },
    { id: 'edit-image', label: 'Edit with Handwriting', icon: Image, desc: 'Add handwriting/signatures' },
  ]

  // Compact mode - just a button
  if (compact) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          multiple={allowMultiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          title="Upload form"
        >
          <FileUp className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        multiple={allowMultiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drop Zone */}
      {uploadedFiles.length === 0 && (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            state === 'dragging'
              ? 'border-neon-cyan bg-neon-cyan/10'
              : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }`}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${state === 'dragging' ? 'text-neon-cyan' : 'text-white/50'}`} />
          <p className="text-sm text-white/70 mb-1">
            Drop your form here or <span className="text-neon-cyan">browse</span>
          </p>
          <p className="text-xs text-white/40">PDF, PNG, JPG supported</p>
        </motion.div>
      )}

      {/* File Previews */}
      <AnimatePresence>
        {uploadedFiles.map((uploadedFile, index) => (
          <motion.div
            key={uploadedFile.file.name + index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3"
          >
            <button
              onClick={() => {
                setUploadedFiles((prev) => prev.filter((f) => f.file !== uploadedFile.file))
              }}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>

            {uploadedFile.preview ? (
              <img src={uploadedFile.preview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{uploadedFile.file.name}</p>
              <p className="text-xs text-white/50">{(uploadedFile.file.size / 1024).toFixed(1)} KB</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Mode Selection & Process Button */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Batch Mode Selection for multiple files */}
          {allowMultiple && uploadedFiles.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => {}}
                className="flex-1 py-2 bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg text-neon-cyan text-sm"
              >
                Separate Forms
              </button>
              <button
                onClick={() => {}}
                className="flex-1 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm"
              >
                Combined Form
              </button>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {modeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setProcessingMode(option.id as ProcessingMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  processingMode === option.id
                    ? 'bg-neon-cyan/20 border border-neon-cyan/30'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <option.icon className={`w-5 h-5 ${processingMode === option.id ? 'text-neon-cyan' : 'text-white/50'}`} />
                <div>
                  <p className={`text-sm ${processingMode === option.id ? 'text-white' : 'text-white/80'}`}>{option.label}</p>
                  <p className="text-xs text-white/40">{option.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* AI Prompt Input */}
          <div>
            <label className="text-xs text-white/50 mb-2 block">Add instructions for AI (optional)</label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., 'Make it a job application form with modern styling' or 'Extract all fields and add validation'"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 resize-none"
              rows={2}
            />
          </div>

          {/* Process Button */}
          <button
            onClick={processFiles}
            disabled={state === 'uploading' || state === 'processing'}
            className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {(state === 'uploading' || state === 'processing') ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Process Form{uploadedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Error State */}
      {state === 'error' && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={reset} className="text-xs text-white/50 hover:text-white mt-2">
              Try again
            </button>
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {state === 'success' && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <p className="text-sm text-green-400 font-medium">
              {allowMultiple && uploadedFiles.length > 1
                ? `${result.summary?.success || uploadedFiles.length} forms processed successfully!`
                : 'Form processed successfully!'}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {result.formStructure && (
              <button
                onClick={() => onFormCreated?.(result.formStructure)}
                className="py-2 bg-neon-cyan/20 text-neon-cyan text-sm rounded-lg hover:bg-neon-cyan/30"
              >
                Add to Canvas
              </button>
            )}
            {result.filledPDF && (
              <button
                onClick={() => {
                  const blob = new Blob([result.filledPDF], { type: 'application/pdf' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `filled_${uploadedFiles[0]?.file.name || 'form.pdf'}`
                  a.click()
                }}
                className="py-2 bg-neon-purple/20 text-neon-purple text-sm rounded-lg hover:bg-neon-purple/30 flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
            {result.filledImage && (
              <button
                onClick={() => {
                  const blob = new Blob([result.filledImage], { type: 'image/png' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `edited_${uploadedFiles[0]?.file.name || 'form.png'}`
                  a.click()
                }}
                className="py-2 bg-neon-purple/20 text-neon-purple text-sm rounded-lg hover:bg-neon-purple/30 flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download Image
              </button>
            )}
            <button onClick={reset} className="px-3 py-2 bg-white/10 text-white/60 text-sm rounded-lg hover:bg-white/20">
              New
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
