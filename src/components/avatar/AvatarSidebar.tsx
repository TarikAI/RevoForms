'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Mic, Send, MicOff, Sparkles, 
  Download, Eye, Upload, X, FileText, UserCircle,
  Paperclip, MessageSquare, Minimize2, Volume2, VolumeX, Loader2
} from 'lucide-react'
import { UploadZone, FillFormModal } from '@/components/upload'
import { useChatStore } from '@/store/chatStore'
import { useFormStore } from '@/store/formStore'
import { useProfileStore, getProfileCompleteness } from '@/store/profileStore'
import { AvatarFace } from './AvatarFace'
import { ChatMessage } from './ChatMessage'
import type { AIResponse } from '@/types/chat'
import type { ProcessingResult } from '@/types/upload'

interface AvatarSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  onPreview?: () => void
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'ready-to-send'

export function AvatarSidebar({ isExpanded, onToggle, onPreview }: AvatarSidebarProps) {
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [fillModalOpen, setFillModalOpen] = useState(false)
  const [uploadResult, setUploadResult] = useState<ProcessingResult | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{name: string; type: string; data: string} | null>(null)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true)
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [isClient, setIsClient] = useState(false)
  
  const [pendingFile, setPendingFile] = useState<{
    file: File
    preview: string
    type: 'image' | 'pdf'
  } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const {
    messages,
    avatarState,
    isRecording,
    shouldFocusInput,
    voiceOnlyMode,
    isAvatarFloating,
    addMessage,
    setAvatarState,
    setIsRecording,
    clearFocusInput,
    setVoiceOnlyMode,
    setAvatarFloating,
    initialize
  } = useChatStore()

  const { addForm, updateForm, forms, selectedFormId, openExport } = useFormStore()
  const { profile, openProfileModal, addSavedForm } = useProfileStore()
  const profileCompleteness = getProfileCompleteness(profile)

  const currentForm = selectedFormId ? forms.find(f => f.id === selectedFormId) : null

  const suggestions = currentForm 
    ? ["Add a phone field", "Change theme to neon", "Make it more colorful", "Add validation"]
    : ["Create a contact form", "Build a survey", "Make a registration form", "Design a feedback form"]

  // Set client flag after mount
  useEffect(() => { setIsClient(true) }, [])

  // Initialize
  useEffect(() => { initialize() }, [initialize])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Focus input when requested - also expand sidebar
  useEffect(() => {
    if (shouldFocusInput) {
      if (!isExpanded) {
        onToggle() // Expand the sidebar first
      }
      // Delay focus to allow sidebar to expand
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
      clearFocusInput()
    }
  }, [shouldFocusInput, clearFocusInput, isExpanded, onToggle])

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser')
        return
      }

      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }

        setInterimTranscript(interim)
        if (final) {
          setTranscript(prev => prev + final)
          setInputValue(prev => prev + final)
          setVoiceState('ready-to-send')
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        setVoiceState('idle')
        setAvatarState('idle')

        // Handle specific errors
        if (event.error === 'not-allowed') {
          addMessage({
            role: 'assistant',
            content: 'Microphone permission denied. Please allow microphone access to use voice input.'
          })
        } else if (event.error === 'no-speech') {
          addMessage({
            role: 'assistant',
            content: 'No speech detected. Please try again.'
          })
        }
      }

      recognitionRef.current.onend = () => {
        // Don't auto-reset if we have transcript ready to send
        if (transcript || inputValue) {
          setVoiceState('ready-to-send')
        } else {
          setVoiceState('idle')
        }
        setIsRecording(false)
        setAvatarState('idle')
      }

      // Request microphone permission on initialization
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('Microphone permission granted')
        })
        .catch((error) => {
          console.warn('Microphone permission denied:', error)
          addMessage({
            role: 'assistant',
            content: 'Microphone access is required for voice input. Please allow microphone access in your browser settings.'
          })
        })
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
      }
    }
  }, [setIsRecording, setAvatarState, transcript, inputValue, addMessage])

  // Speak text
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !isSpeakingEnabled) return
    
    synthRef.current.cancel()
    const cleanText = text.replace(/\*\*/g, '').replace(/\n/g, '. ').replace(/•/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    synthRef.current.speak(utterance)
  }, [isSpeakingEnabled])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    
    if (!isImage && !isPdf) {
      addMessage({ role: 'assistant', content: 'Please upload an image (PNG, JPG) or PDF file.' })
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const preview = event.target?.result as string
      setPendingFile({ file, preview, type: isPdf ? 'pdf' : 'image' })
    }
    reader.readAsDataURL(file)
    
    if (e.target) e.target.value = ''
  }, [addMessage])

  const removePendingFile = useCallback(() => setPendingFile(null), [])

  // Handle upload completion
  const handleUploadComplete = useCallback((result: ProcessingResult) => {
    if (!result.success) {
      addMessage({ role: 'assistant', content: `Upload failed: ${result.error}` })
      return
    }

    if (result.generatedForm) {
      const defaultStyling = {
        theme: 'glassmorphism',
        colors: {
          primary: '#06b6d4', secondary: '#a855f7',
          background: 'rgba(15, 15, 26, 0.8)', surface: 'rgba(255, 255, 255, 0.05)',
          text: '#ffffff', textMuted: 'rgba(255, 255, 255, 0.6)',
          border: 'rgba(255, 255, 255, 0.1)', error: '#f87171',
          success: '#4ade80', accent: '#a855f7'
        },
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
        spacing: { fieldGap: '20px', padding: '24px' },
        borderRadius: { input: '12px', button: '12px', form: '20px' },
        shadows: true, animation: true
      }

      const formId = addForm({
        name: result.generatedForm.name || 'Uploaded Form',
        description: result.generatedForm.description || '',
        fields: result.generatedForm.fields || [],
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Thank you!',
          collectEmails: true,
        },
        styling: result.generatedForm.styling || defaultStyling,
        size: { width: 420, height: 500 },
      })

      if (pendingFile) {
        addSavedForm({
          name: result.generatedForm.name || 'Uploaded Form',
          originalFileName: pendingFile.file.name,
          originalFileData: pendingFile.preview,
          fileType: pendingFile.type,
          generatedFormId: formId,
        })
      }

      addMessage({ 
        role: 'assistant', 
        content: `✅ Form "${result.generatedForm.name}" created! I detected ${result.generatedForm.fields?.length || 0} fields.` 
      })
      setShowUpload(false)
      setPendingFile(null)
    }

    if (result.mode === 'fill' && result.analysis) {
      setUploadResult(result)
      setFillModalOpen(true)
    }
  }, [addForm, addMessage, addSavedForm, pendingFile])

  // Process AI response
  const processAIResponse = useCallback(async (response: AIResponse) => {
    if (!response.action || response.action.type === 'none') return

    const { type, payload } = response.action
    const defaultStyling = {
      theme: 'glassmorphism',
      colors: {
        primary: '#06b6d4', secondary: '#a855f7',
        background: 'rgba(15, 15, 26, 0.8)', surface: 'rgba(255, 255, 255, 0.05)',
        text: '#ffffff', textMuted: 'rgba(255, 255, 255, 0.6)',
        border: 'rgba(255, 255, 255, 0.1)', error: '#f87171',
        success: '#4ade80', accent: '#a855f7'
      },
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
      spacing: { fieldGap: '20px', padding: '24px' },
      borderRadius: { input: '12px', button: '12px', form: '20px' },
      shadows: true, animation: true
    }

    switch (type) {
      case 'create_form':
        addForm({
          name: payload.name || 'New Form',
          description: payload.description || '',
          fields: payload.fields || [],
          settings: {
            submitButtonText: payload.settings?.submitButtonText || 'Submit',
            successMessage: payload.settings?.successMessage || 'Thank you!',
            collectEmails: true,
          },
          styling: payload.styling || defaultStyling,
          size: { width: 420, height: 500 },
        })
        break

      case 'update_form':
        if (currentForm && payload.updates) {
          updateForm(currentForm.id, payload.updates)
        }
        break

      case 'add_fields':
        if (currentForm && payload.fields) {
          const newFields = payload.fields.map((f: any, i: number) => ({
            ...f, id: f.id || `f_${Date.now()}_${i}`
          }))
          const position = payload.position || 'end'
          let updatedFields = [...currentForm.fields]
          if (position === 'start') updatedFields = [...newFields, ...updatedFields]
          else if (typeof position === 'number') updatedFields.splice(position, 0, ...newFields)
          else updatedFields = [...updatedFields, ...newFields]
          updateForm(currentForm.id, { fields: updatedFields })
        }
        break

      case 'remove_fields':
        if (currentForm && payload.fieldLabels) {
          const labelsToRemove = payload.fieldLabels.map((l: string) => l.toLowerCase())
          const updatedFields = currentForm.fields.filter(
            f => !labelsToRemove.includes(f.label.toLowerCase())
          )
          updateForm(currentForm.id, { fields: updatedFields })
        }
        break

      case 'update_field':
        if (currentForm && payload.fieldLabel && payload.updates) {
          const fieldIndex = currentForm.fields.findIndex(
            f => f.label.toLowerCase() === payload.fieldLabel.toLowerCase()
          )
          if (fieldIndex >= 0) {
            const updatedFields = [...currentForm.fields]
            updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...payload.updates }
            updateForm(currentForm.id, { fields: updatedFields })
          }
        }
        break

      case 'update_styling':
        if (currentForm && payload.styling) {
          updateForm(currentForm.id, {
            styling: { ...currentForm.styling, ...payload.styling }
          })
        }
        break

      case 'duplicate_form':
        if (currentForm) {
          addForm({
            ...currentForm,
            name: payload.newName || `${currentForm.name} (Copy)`,
            position: { x: currentForm.position.x + 50, y: currentForm.position.y + 50 },
          })
        }
        break

      case 'fill_form':
        if (currentForm && payload.fieldValues) {
          const updatedFields = currentForm.fields.map(field => {
            const value = payload.fieldValues[field.id] || payload.fieldValues[field.label.toLowerCase()]
            if (value) return { ...field, defaultValue: value }
            return field
          })
          updateForm(currentForm.id, { fields: updatedFields })
        }
        break
    }
  }, [addForm, updateForm, selectedFormId, forms, currentForm])

  // Send message
  const handleSend = async () => {
    if ((!inputValue.trim() && !pendingFile) || isProcessing) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setTranscript('')
    setInterimTranscript('')
    setVoiceState('idle')
    setIsProcessing(true)
    
    if (pendingFile) {
      addMessage({ 
        role: 'user', 
        content: userMessage || `Process this ${pendingFile.type === 'pdf' ? 'PDF' : 'image'}...`,
        attachments: [{ type: pendingFile.type, name: pendingFile.file.name }]
      })
    } else {
      addMessage({ role: 'user', content: userMessage })
    }
    
    setAvatarState('thinking')

    try {
      if (pendingFile) {
        const formData = new FormData()
        formData.append('file', pendingFile.file)
        formData.append('mode', 'recreate')
        formData.append('prompt', userMessage)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) throw new Error('Upload failed')
        
        const result = await uploadResponse.json()
        
        if (result.success && result.formStructure) {
          if (userMessage) {
            const aiResponse = await fetch('/api/ai/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                message: `I just uploaded a form. Here's what I want: ${userMessage}. Form structure: ${JSON.stringify(result.formStructure)}`,
                conversationHistory: messages.slice(-5),
                selectedForm: null,
                userProfile: profile,
                uploadedFormStructure: result.formStructure
              }),
            })
            
            if (aiResponse.ok) {
              const aiData = await aiResponse.json()
              handleUploadComplete({ success: true, mode: 'recreate', generatedForm: aiData.action?.payload || result.formStructure })
              addMessage({ role: 'assistant', content: aiData.message })
              speak(aiData.message)
            } else {
              handleUploadComplete({ success: true, mode: 'recreate', generatedForm: result.formStructure })
            }
          } else {
            handleUploadComplete({ success: true, mode: 'recreate', generatedForm: result.formStructure })
          }
        } else {
          throw new Error(result.error || 'Failed to process file')
        }
        
        setPendingFile(null)
        setAvatarState('idle')
        setIsProcessing(false)
        return
      }
      
      // Build context for form explanation
      let enhancedMessage = userMessage
      if (currentForm && (userMessage.toLowerCase().includes('who filled') || userMessage.toLowerCase().includes('form content') || userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('tell me about'))) {
        const filledData = currentForm.fields.filter(f => f.defaultValue).map(f => `${f.label}: ${f.defaultValue}`).join(', ')
        if (filledData) {
          enhancedMessage = `${userMessage}\n\nForm data context: The form "${currentForm.name}" has the following filled values: ${filledData}`
        }
      }
      
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: enhancedMessage,
          conversationHistory: messages.slice(-10),
          selectedForm: currentForm,
          userProfile: profile
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')
      
      const data: AIResponse = await response.json()
      
      setAvatarState('speaking')
      addMessage({ role: 'assistant', content: data.message })
      speak(data.message)
      
      await processAIResponse(data)
      
      setTimeout(() => setAvatarState('idle'), 2000)
    } catch (error) {
      console.error('AI Error:', error)
      setAvatarState('error')
      addMessage({ 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again!` 
      })
      setTimeout(() => setAvatarState('idle'), 2000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Voice recording
  const toggleVoice = () => {
    if (isRecording) {
      // Stop recording - keep transcript ready to send
      recognitionRef.current?.stop()
      setIsRecording(false)
      if (inputValue.trim()) {
        setVoiceState('ready-to-send')
      } else {
        setVoiceState('idle')
      }
      setAvatarState('idle')
    } else if (voiceState === 'ready-to-send') {
      // Send the message
      handleSend()
    } else {
      // Start recording
      setTranscript('')
      setInterimTranscript('')
      setIsRecording(true)
      setVoiceState('listening')
      setAvatarState('listening')
      
      try {
        recognitionRef.current?.start()
      } catch (e) {
        console.error('Failed to start recognition:', e)
        setIsRecording(false)
        setVoiceState('idle')
        setAvatarState('idle')
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Enter floating mode
  const enterFloatingMode = () => {
    setAvatarFloating(true)
  }

  // Check if speech recognition is available
  const isSpeechRecognitionAvailable = () => {
    return isClient && typeof window !== 'undefined' &&
           ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  }

  // Get voice button state - improved clarity
  const getVoiceButtonState = () => {
    if (!isSpeechRecognitionAvailable()) {
      return {
        icon: MicOff,
        color: 'bg-red-900/20 text-red-400 cursor-not-allowed',
        label: 'Speech recognition not supported'
      }
    }

    if (isRecording) return {
      icon: MicOff,
      color: 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse',
      label: 'Click to stop recording'
    }
    if (voiceState === 'ready-to-send') return {
      icon: Send,
      color: 'bg-green-500 text-white shadow-lg shadow-green-500/30',
      label: 'Click to send message'
    }
    return {
      icon: Mic,
      color: 'bg-white/5 text-white/50 hover:bg-neon-cyan/20 hover:text-neon-cyan',
      label: 'Click to start voice input'
    }
  }

  const voiceBtn = getVoiceButtonState()
  const VoiceIcon = voiceBtn.icon

  // Don't render sidebar when avatar is in floating mode
  if (isAvatarFloating) return null

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <motion.div
        initial={false}
        animate={{ width: isExpanded ? 380 : 64 }}
        className="h-full bg-[#0a0a14]/95 backdrop-blur-xl border-l border-white/10 flex flex-col relative"
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#0f0f1a] border border-white/10 rounded-l-lg flex items-center justify-center hover:bg-white/5 transition-colors z-10"
        >
          {isExpanded ? <ChevronRight className="w-4 h-4 text-white/70" /> : <ChevronLeft className="w-4 h-4 text-white/70" />}
        </button>

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="p-4 flex items-center gap-4 border-b border-white/10">
                <div className="relative">
                  <AvatarFace state={avatarState} size={64} />
                  {/* Processing indicator - animated glowing ring */}
                  {isProcessing && (
                    <svg className="absolute inset-0 -m-2 w-[80px] h-[80px]" viewBox="0 0 80 80">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <motion.circle
                        cx="40" cy="40" r="36" fill="none"
                        stroke="url(#progressGradient)" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray="226"
                        animate={{ strokeDashoffset: [226, 0], rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.8))' }}
                      />
                    </svg>
                  )}
                  {/* Listening indicator - pulsing red ring */}
                  {isRecording && (
                    <motion.div
                      className="absolute inset-0 -m-2 rounded-full border-3 border-red-500"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.3, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' }}
                    />
                  )}
                  {/* Ready to send indicator - green ring */}
                  {voiceState === 'ready-to-send' && !isRecording && (
                    <motion.div
                      className="absolute inset-0 -m-2 rounded-full border-3 border-green-500"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neon-cyan" />
                    RevoForms AI
                  </h3>
                  <p className="text-sm flex items-center gap-2">
                    {isRecording ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Listening... speak now
                      </span>
                    ) : voiceState === 'ready-to-send' ? (
                      <span className="text-green-400">Press Enter or click mic to send</span>
                    ) : isProcessing ? (
                      <span className="text-neon-cyan flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Working on your request...
                      </span>
                    ) : (
                      <span className="text-white/50">Your form assistant</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
                    className={`p-2 rounded-lg transition-colors ${isSpeakingEnabled ? 'text-neon-cyan hover:bg-neon-cyan/10' : 'text-white/30 hover:bg-white/5'}`}
                    title={isSpeakingEnabled ? 'Mute responses' : 'Enable voice responses'}
                  >
                    {isSpeakingEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={enterFloatingMode}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    title="Floating mode"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Context */}
              {currentForm && (
                <div className="px-4 py-2 bg-neon-cyan/10 border-b border-neon-cyan/20 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neon-cyan" />
                  <span className="text-neon-cyan text-sm truncate">Editing: {currentForm.name}</span>
                </div>
              )}

              {/* Voice Status Banner */}
              <AnimatePresence>
                {(isRecording || voiceState === 'ready-to-send') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`px-4 py-3 border-b ${isRecording ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <>
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-400 text-sm font-medium">Recording your voice...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-green-400 text-sm font-medium">Ready to send</span>
                          </>
                        )}
                      </div>
                      {isRecording && (
                        <button onClick={toggleVoice} className="text-xs text-red-400 hover:text-red-300">
                          Stop
                        </button>
                      )}
                    </div>
                    {(transcript || interimTranscript) && (
                      <p className="text-white/80 text-sm mt-2 bg-black/20 rounded-lg px-3 py-2">
                        "{transcript}<span className="text-white/40">{interimTranscript}</span>"
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {messages.length <= 1 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-white/40 text-xs uppercase tracking-wide">Quick Start</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInputValue(suggestion)}
                          className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Action Buttons */}
              {forms.length > 0 && (
                <div className="px-4 py-2 flex gap-2 border-t border-white/5">
                  <button
                    onClick={onPreview}
                    className="flex-1 py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button
                    onClick={() => {
                      const formId = selectedFormId || forms[0]?.id
                      if (formId) openExport(formId)
                    }}
                    className="flex-1 py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              )}

              {/* Profile Access */}
              <div className="px-4 py-2 border-t border-white/5">
                <button
                  onClick={openProfileModal}
                  className="w-full py-2 px-3 text-sm bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 flex items-center justify-center gap-2 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  {profile ? `My Profile (${profileCompleteness}%)` : 'Set Up Profile'}
                </button>
              </div>

              {/* Pending File Preview */}
              {pendingFile && (
                <div className="px-4 py-2 border-t border-white/5">
                  <div className="flex items-center gap-3 p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                    {pendingFile.type === 'image' ? (
                      <img src={pendingFile.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-red-500/20 rounded flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{pendingFile.file.name}</p>
                      <p className="text-xs text-white/50">Add instructions or send</p>
                    </div>
                    <button onClick={removePendingFile} className="p-1.5 hover:bg-white/10 rounded-lg">
                      <X className="w-4 h-4 text-white/50" />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Zone */}
              <AnimatePresence>
                {showUpload && !pendingFile && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 overflow-hidden border-t border-white/5"
                  >
                    <div className="py-3">
                      <UploadZone
                        onFormCreated={(formData) => handleUploadComplete({ success: true, mode: 'recreate', generatedForm: formData })}
                        onFilledPdf={(pdfData, filename) => {
                          const blob = new Blob([pdfData], { type: 'application/pdf' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = filename
                          a.click()
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-xl transition-colors ${pendingFile ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setShowUpload(!showUpload)}
                    className={`p-3 rounded-xl transition-colors ${showUpload ? 'bg-neon-purple/20 text-neon-purple' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                    title="Upload zone"
                  >
                    {showUpload ? <X className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        isRecording ? 'Listening...' :
                        pendingFile ? "Describe what to do..." :
                        currentForm ? `Edit "${currentForm.name}"...` : 
                        "Describe your form..."
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 pr-12"
                      disabled={isProcessing}
                    />
                    <button
                      onClick={handleSend}
                      disabled={(!inputValue.trim() && !pendingFile) || isProcessing}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={toggleVoice}
                    disabled={isClient ? !isSpeechRecognitionAvailable() : true}
                    className={`p-3 rounded-xl transition-all ${voiceBtn.color} disabled:cursor-not-allowed`}
                    title={voiceBtn.label}
                  >
                    <VoiceIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Voice instructions */}
                <p className="text-xs text-center text-white/40 mt-2">
                  {isRecording ? 'Click mic to stop • Enter to send' : 
                   voiceState === 'ready-to-send' ? 'Click mic or press Enter to send' :
                   'Click mic to speak • Type or speak your request'}
                </p>
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-4 gap-4"
            >
              <div className="relative">
                <AvatarFace state={avatarState} size={48} />
                {isProcessing && (
                  <motion.div
                    className="absolute inset-0 -m-1 rounded-full"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0%, #06b6d4 30%, transparent 60%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={onToggle} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Chat">
                  <MessageSquare className="w-5 h-5 text-neon-cyan" />
                </button>
                <button onClick={() => { onToggle(); setTimeout(() => fileInputRef.current?.click(), 100) }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Upload">
                  <Paperclip className="w-5 h-5 text-white/50" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <FillFormModal
        isOpen={fillModalOpen}
        onClose={() => setFillModalOpen(false)}
        uploadResult={uploadResult}
        originalFile={uploadedFile || undefined}
      />
    </>
  )
}
