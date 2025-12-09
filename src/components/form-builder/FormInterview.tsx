'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Mic, MicOff, Volume2, VolumeX, Send, 
  ChevronLeft, ChevronRight, HelpCircle, Sparkles,
  MessageCircle, User, Bot
} from 'lucide-react'
import { AvatarFace } from '../avatar/AvatarFace'
import type { CanvasForm, FormField } from '@/types/form'
import { ColorField } from './fields/ColorField'
import { RichTextField } from './fields/RichTextField'
import { AddressAutocompleteField } from './fields/AddressAutocompleteField'
import { EnhancedRangeField } from './fields/EnhancedRangeField'
import { EnhancedFileField } from './fields/EnhancedFileField'
import { CalculationField } from './fields/CalculationField'

interface FormInterviewProps {
  form: CanvasForm
  isOpen: boolean
  onClose: () => void
  creatorProfile?: any // Creator's profile for context
}

interface InterviewMessage {
  id: string
  role: 'avatar' | 'user'
  content: string
  timestamp: Date
  fieldId?: string
}

type AvatarState = 'idle' | 'thinking' | 'speaking' | 'listening' | 'waiting'

export function FormInterview({ form, isOpen, onClose, creatorProfile }: FormInterviewProps) {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [inputValue, setInputValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  
  const visibleFields = form.fields.filter(f => 
    !['divider', 'heading', 'paragraph'].includes(f.type)
  )
  const currentField = visibleFields[currentFieldIndex]
  const progress = ((currentFieldIndex + 1) / visibleFields.length) * 100

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial greeting when interview starts
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getGreeting()
      addAvatarMessage(greeting)
      speak(greeting)
    }
  }, [isOpen])

  // Generate contextual greeting
  const getGreeting = () => {
    const formName = form.name || 'this form'
    const fieldCount = visibleFields.length
    const creatorName = creatorProfile?.personal?.firstName || 'the creator'
    
    return `Hi there! 👋 I'm here to help you fill out ${formName}. This form has ${fieldCount} questions, and I'll guide you through each one. Feel free to ask me anything if you need clarification! Let's start with the first question.`
  }

  // Add avatar message
  const addAvatarMessage = (content: string, fieldId?: string) => {
    const message: InterviewMessage = {
      id: `msg_${Date.now()}`,
      role: 'avatar',
      content,
      timestamp: new Date(),
      fieldId
    }
    setMessages(prev => [...prev, message])
  }

  // Add user message
  const addUserMessage = (content: string) => {
    const message: InterviewMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (!synthRef.current) return
    
    // Cancel any ongoing speech
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Try to get a natural voice
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
    ) || voices[0]
    if (preferredVoice) utterance.voice = preferredVoice
    
    utterance.onstart = () => {
      setAvatarState('speaking')
      setIsSpeaking(true)
    }
    utterance.onend = () => {
      setAvatarState('waiting')
      setIsSpeaking(false)
    }
    
    synthRef.current.speak(utterance)
  }, [])

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      setAvatarState('idle')
    }
  }

  // Get field explanation from AI
  const getFieldExplanation = async (field: FormField) => {
    setAvatarState('thinking')
    
    try {
      const response = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_field',
          field,
          form: { name: form.name, description: form.description },
          creatorProfile,
          conversationHistory: messages.slice(-5)
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.explanation
      }
    } catch (error) {
      console.error('Failed to get explanation:', error)
    }
    
    // Fallback explanation
    return `This field is asking for your ${field.label.toLowerCase()}. ${field.required ? 'This is a required field.' : 'This field is optional.'}`
  }

  // Ask for clarification
  const handleAskHelp = async () => {
    if (!currentField) return
    
    addUserMessage(`Can you explain what "${currentField.label}" means?`)
    const explanation = await getFieldExplanation(currentField)
    addAvatarMessage(explanation, currentField.id)
    speak(explanation)
  }

  // Handle field value change
  const handleFieldChange = (value: any) => {
    if (!currentField) return
    setFormData(prev => ({ ...prev, [currentField.id]: value }))
    setInputValue(typeof value === 'string' ? value : '')
  }

  // Move to next field
  const handleNext = async () => {
    if (!currentField) return
    
    // Validate current field
    if (currentField.required && !formData[currentField.id]) {
      const reminder = `Oops! This field is required. Please provide your ${currentField.label.toLowerCase()} before we continue.`
      addAvatarMessage(reminder)
      speak(reminder)
      return
    }

    // Save the answer
    if (inputValue.trim()) {
      setFormData(prev => ({ ...prev, [currentField.id]: inputValue.trim() }))
    }

    // Move to next field
    if (currentFieldIndex < visibleFields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1)
      const nextField = visibleFields[currentFieldIndex + 1]
      
      // Generate transition message
      const transitions = [
        `Great! Now let's move on to ${nextField.label}.`,
        `Perfect! Next up: ${nextField.label}.`,
        `Excellent! The next question is about ${nextField.label.toLowerCase()}.`,
        `Got it! Now I need to know about ${nextField.label.toLowerCase()}.`
      ]
      const transition = transitions[Math.floor(Math.random() * transitions.length)]
      
      setTimeout(() => {
        addAvatarMessage(transition, nextField.id)
        speak(transition)
        setInputValue('')
      }, 300)
    } else {
      // Form complete
      const completion = `🎉 Wonderful! You've completed all the questions. Would you like to review your answers before submitting, or shall I submit the form now?`
      addAvatarMessage(completion)
      speak(completion)
    }
  }

  // Move to previous field
  const handlePrevious = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1)
      const prevField = visibleFields[currentFieldIndex - 1]
      setInputValue(formData[prevField.id] || '')
      
      const message = `No problem! Let's go back to ${prevField.label}.`
      addAvatarMessage(message, prevField.id)
      speak(message)
    }
  }

  // Handle user chat input
  const handleChatSubmit = async () => {
    if (!inputValue.trim()) return
    
    const userInput = inputValue.trim()
    addUserMessage(userInput)
    setInputValue('')
    setAvatarState('thinking')

    try {
      const response = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message: userInput,
          currentField,
          form: { name: form.name, description: form.description },
          formData,
          creatorProfile,
          conversationHistory: messages.slice(-10)
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Check if AI wants to fill a field
        if (data.fieldValue && currentField) {
          setFormData(prev => ({ ...prev, [currentField.id]: data.fieldValue }))
          setInputValue(data.fieldValue)
        }
        
        addAvatarMessage(data.response)
        speak(data.response)
        
        // Auto-advance if AI suggests it
        if (data.autoAdvance) {
          setTimeout(() => handleNext(), 2000)
        }
      }
    } catch (error) {
      const fallback = "I'm sorry, I didn't quite catch that. Could you rephrase?"
      addAvatarMessage(fallback)
      speak(fallback)
    }
  }

  // Render field input based on type
  const renderFieldInput = () => {
    if (!currentField) return null

    const baseInputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/20"

    switch (currentField.type) {
      case 'textarea':
        return (
          <textarea
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={currentField.placeholder || `Enter your ${currentField.label.toLowerCase()}...`}
            className={`${baseInputClass} min-h-[120px] resize-none`}
            rows={4}
          />
        )

      case 'select':
        return (
          <select
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={`${baseInputClass} cursor-pointer`}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <option value="" style={{ backgroundColor: '#1a1a2e' }}>Select an option...</option>
            {(currentField.options || []).map((opt, idx) => (
              <option key={`${currentField.id}-select-${idx}`} value={opt} style={{ backgroundColor: '#1a1a2e' }}>{opt}</option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-3">
            {(currentField.options || []).map((opt, idx) => (
              <label key={`${currentField.id}-radio-${idx}`} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name={currentField.id}
                  value={opt}
                  checked={inputValue === opt}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  className="w-5 h-5 accent-neon-cyan"
                />
                <span className="text-white">{opt}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-3">
            {(currentField.options || []).map((opt, idx) => (
              <label key={`${currentField.id}-checkbox-${idx}`} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  value={opt}
                  checked={(formData[currentField.id] || []).includes(opt)}
                  onChange={(e) => {
                    const current = formData[currentField.id] || []
                    const updated = e.target.checked 
                      ? [...current, opt]
                      : current.filter((v: string) => v !== opt)
                    handleFieldChange(updated)
                  }}
                  className="w-5 h-5 accent-neon-cyan"
                />
                <span className="text-white">{opt}</span>
              </label>
            ))}
          </div>
        )

      case 'date':
        return (
          <input
            type="date"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={`${baseInputClass} [color-scheme:dark]`}
          />
        )

      case 'email':
        return (
          <input
            type="email"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={currentField.placeholder || 'Enter your email address...'}
            className={baseInputClass}
          />
        )

      case 'phone':
        return (
          <input
            type="tel"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={currentField.placeholder || 'Enter your phone number...'}
            className={baseInputClass}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={currentField.placeholder || 'Enter a number...'}
            className={baseInputClass}
          />
        )

      case 'time':
        return (
          <input
            type="time"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={baseInputClass}
          />
        )

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={`${baseInputClass} [color-scheme:dark]`}
          />
        )

      case 'daterange':
        return (
          <div className="space-y-2">
            <input
              type="date"
              value={inputValue?.start || ''}
              onChange={(e) => handleFieldChange({ ...inputValue, start: e.target.value })}
              placeholder="Start date"
              className={`${baseInputClass} [color-scheme:dark]`}
            />
            <input
              type="date"
              value={inputValue?.end || ''}
              onChange={(e) => handleFieldChange({ ...inputValue, end: e.target.value })}
              placeholder="End date"
              className={`${baseInputClass} [color-scheme:dark]`}
            />
          </div>
        )

      case 'file':
      case 'file_upload':
        return (
          <input
            type="file"
            accept={currentField.accept}
            multiple={currentField.multiple}
            onChange={(e) => handleFieldChange(e.target.files?.[0])}
            className={`${baseInputClass} file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-neon-cyan/20 file:text-neon-cyan file:text-sm`}
          />
        )

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={currentField.validation?.min || 0}
              max={currentField.validation?.max || 100}
              value={inputValue || 50}
              onChange={(e) => handleFieldChange(Number(e.target.value))}
              className="w-full accent-neon-cyan"
            />
            <div className="text-center text-white/60">{inputValue || 50}</div>
          </div>
        )

      case 'richtext':
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-white/60">Rich Text Editor - {currentField.placeholder || 'Text formatting available'}</p>
          </div>
        )

      case 'color':
        return (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={inputValue || '#000000'}
              onChange={(e) => handleFieldChange(e.target.value)}
              className="w-20 h-12 rounded-lg border border-white/20 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={inputValue || ''}
              onChange={(e) => handleFieldChange(e.target.value)}
              placeholder="#000000"
              className={`${baseInputClass} flex-1`}
            />
          </div>
        )

      case 'address_autocomplete':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Start typing address..."
              value={inputValue?.formatted || ''}
              onChange={(e) => handleFieldChange({ ...inputValue, formatted: e.target.value })}
              className={baseInputClass}
            />
            <p className="text-xs text-white/40">Google Places autocomplete</p>
          </div>
        )

      case 'rating':
        const maxStars = currentField.maxStars || 5
        const rating = Number(inputValue) || 0
        return (
          <div className="flex gap-2 justify-center py-4">
            {Array.from({ length: maxStars }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleFieldChange(i + 1)}
                className={`text-4xl transition-colors ${i < rating ? 'text-yellow-400' : 'text-white/20'}`}
              >
                ★
              </button>
            ))}
          </div>
        )

      case 'signature':
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-white/60">Signature Field - Click to sign</p>
          </div>
        )

      case 'matrix':
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-white/60">Matrix Field ({currentField.rows?.length || 0}x{currentField.columns?.length || 0})</p>
          </div>
        )

      case 'country':
        return (
          <select value={inputValue} onChange={(e) => handleFieldChange(e.target.value)} className={baseInputClass}>
            <option value="">Select country...</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
          </select>
        )

      case 'address':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Street Address"
              value={inputValue?.street || ''}
              onChange={(e) => handleFieldChange({ ...inputValue, street: e.target.value })}
              className={baseInputClass}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="City"
                value={inputValue?.city || ''}
                onChange={(e) => handleFieldChange({ ...inputValue, city: e.target.value })}
                className={`${baseInputClass} flex-1`}
              />
              <input
                type="text"
                placeholder="State"
                value={inputValue?.state || ''}
                onChange={(e) => handleFieldChange({ ...inputValue, state: e.target.value })}
                className={`${baseInputClass} w-24`}
              />
              <input
                type="text"
                placeholder="ZIP"
                value={inputValue?.postalCode || ''}
                onChange={(e) => handleFieldChange({ ...inputValue, postalCode: e.target.value })}
                className={`${baseInputClass} w-24`}
              />
            </div>
          </div>
        )

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
              {currentField.currency || '$'}
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={inputValue || ''}
              onChange={(e) => handleFieldChange(e.target.value)}
              className={`${baseInputClass} pl-8`}
            />
          </div>
        )

      case 'payment':
        return (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl text-center">
            <p className="text-white/60">Payment Field</p>
          </div>
        )

      case 'url':
        return (
          <input
            type="url"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder="https://example.com"
            className={baseInputClass}
          />
        )

      case 'password':
        return (
          <input
            type="password"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder="Enter password..."
            className={baseInputClass}
          />
        )

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={inputValue || '#000000'}
              onChange={(e) => handleFieldChange(e.target.value)}
              className="w-20 h-12 bg-transparent border-0 cursor-pointer"
            />
            <input
              type="text"
              value={inputValue || '#000000'}
              onChange={(e) => handleFieldChange(e.target.value)}
              placeholder="#000000"
              className={`${baseInputClass} font-mono`}
            />
          </div>
        )

      case 'calculation':
        return (
          <CalculationField
            field={currentField}
            value={inputValue}
            onChange={handleFieldChange}
            error={fieldErrors[currentField.id]}
            disabled={currentField.disabled}
            formData={responses}
          />
        )

      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={currentField.placeholder || `Enter your ${currentField.label.toLowerCase()}...`}
            className={baseInputClass}
            onKeyPress={(e) => e.key === 'Enter' && handleNext()}
          />
        )
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex"
      >
        {/* Left Panel - Avatar & Chat */}
        <div className="w-[450px] bg-gradient-to-b from-[#0a0a14] to-[#0f0f1a] border-r border-white/10 flex flex-col">
          {/* Avatar Section */}
          <div className="p-6 border-b border-white/10 flex flex-col items-center">
            <div className="relative">
              <AvatarFace state={avatarState} size={120} />
              {isSpeaking && (
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <Volume2 className="w-5 h-5 text-neon-cyan" />
                </motion.div>
              )}
            </div>
            <h3 className="mt-4 text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              RevoForms Interview
            </h3>
            <p className="text-white/50 text-sm">{form.name}</p>
            
            {/* Audio Controls */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={isSpeaking ? stopSpeaking : () => speak(messages[messages.length - 1]?.content || '')}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Repeat last message'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'avatar' 
                    ? 'bg-gradient-to-br from-neon-cyan to-neon-purple' 
                    : 'bg-white/20'
                }`}>
                  {msg.role === 'avatar' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.role === 'avatar'
                    ? 'bg-white/10 text-white rounded-tl-sm'
                    : 'bg-neon-cyan/20 text-white rounded-tr-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <button
                onClick={handleAskHelp}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
                title="Ask for help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Type a message or answer..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 pr-12"
                />
                <button
                  onClick={handleChatSubmit}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form Question */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white/50 text-sm">Question {currentFieldIndex + 1} of {visibleFields.length}</span>
              <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-neon-cyan text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Question Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              {currentField ? (
                <motion.div
                  key={currentField.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Question Label */}
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {currentField.label}
                      {currentField.required && <span className="text-red-400 ml-2">*</span>}
                    </h2>
                    {currentField.placeholder && (
                      <p className="text-white/50 text-lg">{currentField.placeholder}</p>
                    )}
                  </div>

                  {/* Input Field */}
                  <div className="mt-8">
                    {renderFieldInput()}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={handlePrevious}
                      disabled={currentFieldIndex === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" /> Previous
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                    >
                      {currentFieldIndex === visibleFields.length - 1 ? 'Submit' : 'Next'} 
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">🎉 All Done!</h2>
                  <p className="text-white/60">You've answered all the questions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
