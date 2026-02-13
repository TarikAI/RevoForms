'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, File, FileImage, FileVideo, FileAudio,
  FileText, Download, Eye, Trash2, AlertCircle,
  CheckCircle, FolderOpen, Cloud, Zap
} from 'lucide-react'

interface EnhancedFileFieldProps {
  field: any
  value?: File[]
  onChange?: (files: File[]) => void
  error?: string
  disabled?: boolean
}

interface UploadedFile {
  file: File
  id: string
  preview?: string
  progress?: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

export function EnhancedFileField({ field, value = [], onChange, error, disabled }: EnhancedFileFieldProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const {
    accept = '*/*',
    maxFiles = 1,
    maxSize = 10, // MB
    multiple = maxFiles > 1,
    showPreview = true,
    dragDrop = true,
    storageProvider = 'local', // local, s3, gcs, cloudinary, uploadcare
    autoUpload = true,
    showFileSize = true,
    showProgressBar = true,
    capture = false, // For mobile camera
    resize = false,
    resizeOptions = { maxWidth: 1920, maxHeight: 1080, quality: 0.8 },
    watermark = false,
    watermarkText = '',
    zipMultiple = false,
    enableCloudUpload = true
  } = field

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }

    // Check file type
    if (accept !== '*/*' && accept !== '*') {
      const acceptedTypes = accept.split(',').map((t: string) => t.trim())
      const isAccepted = acceptedTypes.some((type: string) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.includes('*')) {
          const baseType = type.split('/')[0]
          return file.type.startsWith(baseType)
        }
        return file.type === type
      })

      if (!isAccepted) {
        return `File type not allowed. Accepted: ${accept}`
      }
    }

    return null
  }

  const processFile = async (file: File): Promise<File> => {
    // Resize image if needed
    if (resize && file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          // Calculate new dimensions
          if (width > resizeOptions.maxWidth || height > resizeOptions.maxHeight) {
            const aspectRatio = width / height
            if (width > height) {
              width = resizeOptions.maxWidth
              height = width / aspectRatio
            } else {
              height = resizeOptions.maxHeight
              width = height * aspectRatio
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const FileConstructor = (window as any).File || File
                const resizedFile = new FileConstructor([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                })
                resolve(resizedFile)
              } else {
                resolve(file)
              }
            },
            file.type,
            resizeOptions.quality
          )
        }
        img.src = URL.createObjectURL(file)
      })
    }

    return file
  }

  const uploadFile = async (uploadedFile: UploadedFile): Promise<string> => {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setUploadProgress(prev => ({ ...prev, [uploadedFile.id]: i }))
    }

    // Return mock URL
    return `https://example.com/files/${uploadedFile.file.name}`
  }

  const handleFiles = async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = []
    const fileArray = Array.from(fileList)

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        alert(`${file.name}: ${validationError}`)
        continue
      }

      const processedFile = await processFile(file)
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random()}`,
        file: processedFile,
        preview: '',
        status: 'uploading'
      }

      // Generate preview for images
      if (showPreview && processedFile.type.startsWith('image/')) {
        uploadedFile.preview = URL.createObjectURL(processedFile)
      }

      newFiles.push(uploadedFile)
    }

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onChange?.(updatedFiles.map(uf => uf.file))

    // Upload files if auto-upload is enabled
    if (autoUpload) {
      for (const uploadedFile of newFiles) {
        try {
          const url = await uploadFile(uploadedFile)
          uploadedFile.status = 'success'
          uploadedFile.url = url
        } catch (err) {
          uploadedFile.status = 'error'
          uploadedFile.error = 'Upload failed'
        }
        setFiles([...updatedFiles])
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!dragDrop || disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [dragDrop, disabled, files.length])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (dragDrop && !disabled) {
      setIsDragOver(true)
    }
  }, [dragDrop, disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id)
    setFiles(updatedFiles)
    onChange?.(updatedFiles.map(uf => uf.file))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="w-5 h-5" />
    if (file.type.startsWith('video/')) return <FileVideo className="w-5 h-5" />
    if (file.type.startsWith('audio/')) return <FileAudio className="w-5 h-5" />
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-sm font-medium text-white/90">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragOver
            ? 'border-neon-cyan bg-neon-cyan/10'
            : 'border-white/20 hover:border-white/40 bg-white/5'
          }
          ${!dragDrop ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          capture={capture ? 'environment' : undefined}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <motion.div
          animate={{
            scale: isDragOver ? 1.1 : 1,
            opacity: disabled ? 0.5 : 1
          }}
          className="flex flex-col items-center gap-4"
        >
          {enableCloudUpload && dragDrop ? (
            <Cloud className="w-12 h-12 text-white/60" />
          ) : (
            <Upload className="w-12 h-12 text-white/60" />
          )}

          <div>
            <p className="text-white font-medium mb-1">
              {dragDrop ? 'Drop files here or click to browse' : 'Click to select files'}
            </p>
            <p className="text-xs text-white/50">
              {accept !== '*/*' && `Accepted: ${accept}`}
              {maxSize && ` • Max size: ${maxSize}MB`}
              {maxFiles > 1 && ` • Max files: ${maxFiles}`}
            </p>
          </div>
        </motion.div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {files.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                {/* File Preview */}
                {showPreview && uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-white/60">
                    {getFileIcon(uploadedFile.file)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {uploadedFile.file.name}
                  </p>
                  {showFileSize && (
                    <p className="text-xs text-white/60">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'uploading' && showProgressBar && (
                    <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-neon-cyan"
                        animate={{ width: `${uploadProgress[uploadedFile.id] || 0}%` }}
                      />
                    </div>
                  )}

                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}

                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}

                  {/* Actions */}
                  {uploadedFile.status === 'success' && uploadedFile.url && (
                    <button
                      onClick={() => window.open(uploadedFile.url)}
                      className="p-1 hover:bg-white/10 rounded"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-white/60" />
                    </button>
                  )}

                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="p-1 hover:bg-red-500/20 rounded"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zip Multiple Option */}
      {multiple && files.length > 1 && zipMultiple && (
        <button
          onClick={() => {
            // Implement zip functionality
            console.log('Zipping files...')
          }}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/80"
        >
          <FolderOpen className="w-4 h-4" />
          Download as ZIP
        </button>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-400"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40">{field.helpText}</p>
      )}
    </div>
  )
}