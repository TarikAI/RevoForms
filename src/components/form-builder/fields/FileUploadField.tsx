'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, File, Image, Film, Music, FileText, AlertCircle } from 'lucide-react'
import type { FormField } from '@/types/form'

interface FileUploadFieldProps {
  field: FormField
  value: File[] | null
  onChange: (files: File[] | null) => void
  error?: string
  disabled?: boolean
}

export function FileUploadField({ field, value, onChange, error, disabled }: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get allowed file types from accept property
  const acceptTypes = field.accept || '*/*'
  const maxFileSize = (field.maxFileSize || 10) * 1024 * 1024 // Convert MB to bytes
  const maxFiles = field.maxFiles || (field.multiple ? 10 : 1)

  // Check if file type is allowed
  const isFileTypeAllowed = (file: File): boolean => {
    if (acceptTypes === '*/*') return true
    const acceptedTypes = acceptTypes.split(',').map(t => t.trim())
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      return file.type.match(type.replace('*', '.*')) !== null
    })
  }

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />
    if (file.type.startsWith('video/')) return <Film className="w-5 h-5" />
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!isFileTypeAllowed(file)) {
      return `File type "${file.type}" is not allowed`
    }
    if (file.size > maxFileSize) {
      return `File size exceeds ${field.maxFileSize || 10}MB limit`
    }
    return null
  }

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || disabled) return

    const newErrors: string[] = []
    const validFiles: File[] = []

    // Check if adding files would exceed the limit
    const currentCount = value?.length || 0
    if (currentCount + files.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate each file
    Array.from(files).forEach(file => {
      const validationError = validateFile(file)
      if (validationError) {
        newErrors.push(`${file.name}: ${validationError}`)
      } else {
        validFiles.push(file)
      }
    })

    setErrors(newErrors)

    if (validFiles.length > 0) {
      // Simulate upload progress
      validFiles.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        simulateUpload(file)
      })

      // Update value
      if (field.multiple) {
        onChange([...(value || []), ...validFiles])
      } else {
        onChange(validFiles)
      }
    }
  }, [value, field, disabled, maxFiles])

  // Simulate file upload with progress
  const simulateUpload = (file: File) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[file.name]
            return newProgress
          })
        }, 500)
      }
      setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
    }, 200)
  }

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Remove file
  const removeFile = (index: number) => {
    if (!value) return
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles.length > 0 ? newFiles : null)
  }

  // Clear all files
  const clearAll = () => {
    onChange(null)
    setErrors([])
  }

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
          ${isDragging
            ? 'border-neon-cyan bg-neon-cyan/10'
            : 'border-white/20 hover:border-white/30 bg-white/5'
          }
          ${error ? 'border-red-500' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          multiple={field.multiple}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <AnimatePresence>
          {!value || value.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 font-medium mb-2">
                {field.dragDrop !== false ? 'Drop files here or click to upload' : 'Click to select files'}
              </p>
              <p className="text-sm text-white/40">
                {acceptTypes !== '*/*' && `Accepts: ${acceptTypes}`}
                {maxFileSize && maxFileSize < 1024 * 1024 * 1024 && ` • Max: ${field.maxFileSize || 10}MB`}
                {field.multiple && maxFiles > 1 && ` • Max ${maxFiles} files`}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-white/70 mb-4">
                {field.multiple
                  ? `${value.length} of ${maxFiles} files selected`
                  : 'File selected'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File List */}
      <AnimatePresence>
        {value && value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {value.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                <div className="text-neon-cyan">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-white/40">{formatFileSize(file.size)}</p>
                </div>
                {uploadProgress[file.name] !== undefined ? (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/50">
                      {Math.round(uploadProgress[file.name])}%
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </motion.div>
            ))}

            {field.multiple && (
              <button
                onClick={clearAll}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Clear all files
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-1"
          >
            {errors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Field Help Text */}
      {field.helpText && (
        <p className="text-sm text-white/40">{field.helpText}</p>
      )}
    </div>
  )
}