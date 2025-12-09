'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  Bot,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
  Settings,
  Sparkles,
  Mic,
  MicOff,
  Type
} from 'lucide-react'
import { FormField, CanvasForm } from '@/types/form'

interface ConversationMessage {
  id: string
  type: 'bot' | 'user'
  content: string | React.ReactNode
  timestamp: Date
  field?: FormField
}

interface ConversationFlow {
  id: string
  name: string
  welcomeMessage: string
  farewellMessage: string
  avatar?: string
  botName?: string
  typingDelay: number
  enableVoice: boolean
  enableAutoSave: boolean
  progress: 'collecting' | 'reviewing' | 'submitting' | 'completed'
}

interface ConversationalFormProps {
  form: CanvasForm
  onComplete: (data: any) => void
  onClose?: () => void
  theme?: 'chat' | 'messenger' | 'whatsapp'
}

export function ConversationalForm({ form, onComplete, onClose, theme = 'chat' }: ConversationalFormProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [flow, setFlow] = useState<ConversationFlow>({
    id: 'default',
    name: 'Default Flow',
    welcomeMessage: `Hi! I'm here to help you fill out the ${form.name}. Let's get started!`,
    farewellMessage: 'Thank you! Your submission has been received.',
    botName: 'Assistant',
    typingDelay: 1000,
    enableVoice: true,
    enableAutoSave: true,
    progress: 'collecting'
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const fields = form.fields.filter(f => f.type !== 'divider' && f.type !== 'heading' && f.type !== 'paragraph')
  const currentField = fields[currentFieldIndex]
  const progressPercentage = (currentFieldIndex / fields.length) * 100

  // Initialize conversation
  useEffect(() => {
    const welcomeMessage: ConversationMessage = {
      id: 'welcome',
      type: 'bot',
      content: flow.welcomeMessage,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])

    if (currentField) {
      setTimeout(() => {
        askQuestion(currentField)
      }, 500)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const askQuestion = (field: FormField) => {
    setIsTyping(true)

    setTimeout(() => {
      const question: ConversationMessage = {
        id: `q-${field.id}`,
        type: 'bot',
        content: generateQuestion(field),
        timestamp: new Date(),
        field
      }

      setMessages(prev => [...prev, question])
      setIsTyping(false)
    }, flow.typingDelay)
  }

  const generateQuestion = (field: FormField): string => {
    const questionMap: Record<string, string> = {
      text: `What is your ${field.label.toLowerCase()}?`,
      email: `What's your email address?`,
      phone: `What's your phone number?`,
      number: `What is ${field.label.toLowerCase()}?`,
      textarea: `Tell me more about ${field.label.toLowerCase()}`,
      date: `When is ${field.label.toLowerCase()}?`,
      time: `What time for ${field.label.toLowerCase()}?`,
      select: `Which option best describes ${field.label.toLowerCase()}?`,
      radio: `Please select ${field.label.toLowerCase()}`,
      checkbox: `Which of these options apply?`,
      file: `Would you like to upload a file for ${field.label.toLowerCase()}?`,
      rating: `How would you rate ${field.label.toLowerCase()}?`,
      range: `Where would you place ${field.label.toLowerCase()} on the scale?`,
      signature: `Please provide your signature for ${field.label.toLowerCase()}`
    }

    return questionMap[field.type] || field.label || `Please provide ${field.label.toLowerCase()}`
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setFormData(prev => ({ ...prev, [currentField.id]: inputValue }))
    setInputValue('')

    // Move to next field
    setTimeout(() => {
      if (currentFieldIndex < fields.length - 1) {
        setCurrentFieldIndex(prev => prev + 1)
        askQuestion(fields[currentFieldIndex + 1])
      } else {
        // All fields collected
        reviewSubmission()
      }
    }, 500)
  }

  const reviewSubmission = () => {
    setFlow(prev => ({ ...prev, progress: 'reviewing' }))

    const reviewMessage: ConversationMessage = {
      id: 'review',
      type: 'bot',
      content: (
        <div className="space-y-3">
          <p>Great! Here's what you've shared with us:</p>
          <div className="bg-white/10 rounded-lg p-3 space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex justify-between text-sm">
                <span className="text-white/60">{field.label}:</span>
                <span className="text-white font-medium">
                  {formData[field.id] || 'Not provided'}
                </span>
              </div>
            ))}
          </div>
          <p>Is everything correct? You can go back to edit or submit.</p>
        </div>
      ),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, reviewMessage])
  }

  const handleSubmit = async () => {
    setFlow(prev => ({ ...prev, progress: 'submitting' }))

    const submittingMessage: ConversationMessage = {
      id: 'submitting',
      type: 'bot',
      content: 'Submitting your response...',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, submittingMessage])

    // Simulate submission
    setTimeout(async () => {
      try {
        await onComplete(formData)

        const successMessage: ConversationMessage = {
          id: 'success',
          type: 'bot',
          content: flow.farewellMessage,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, successMessage])
        setFlow(prev => ({ ...prev, progress: 'completed' }))
      } catch (error) {
        const errorMessage: ConversationMessage = {
          id: 'error',
          type: 'bot',
          content: 'Sorry, there was an error submitting your form. Please try again.',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, errorMessage])
        setFlow(prev => ({ ...prev, progress: 'collecting' }))
      }
    }, 2000)
  }

  const goBack = () => {
    if (flow.progress === 'reviewing' && currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1)
      setFlow(prev => ({ ...prev, progress: 'collecting' }))
      askQuestion(fields[currentFieldIndex - 1])
    }
  }

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    }
  }

  const getThemeStyles = () => {
    const themes = {
      chat: 'bg-gradient-to-br from-purple-900/90 to-pink-900/90',
      messenger: 'bg-blue-600',
      whatsapp: 'bg-green-600'
    }
    return themes[theme]
  }

  const getHeaderStyles = () => {
    const themes = {
      chat: 'bg-gradient-to-r from-purple-600 to-pink-600',
      messenger: 'bg-blue-700',
      whatsapp: 'bg-green-700'
    }
    return themes[theme]
  }

  const getInputStyles = () => {
    const themes = {
      chat: 'bg-white/10 border-white/20',
      messenger: 'bg-white/20 border-white/30',
      whatsapp: 'bg-white/20 border-white/30'
    }
    return themes[theme]
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    >
      <div className="w-full h-full max-w-2xl max-h-[90vh] mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 text-white ${getHeaderStyles()}`}>
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5" />
            <div>
              <h2 className="font-semibold">{flow.botName || 'Assistant'}</h2>
              <p className="text-xs opacity-90">{form.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {flow.progress !== 'completed' && flow.progress !== 'submitting' && (
              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Minus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-black/30 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 ${getThemeStyles()}`}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-neon-cyan text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {typeof message.content === 'string' ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      message.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/10 px-4 py-2 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        {flow.progress !== 'completed' && flow.progress !== 'submitting' && (
          <div className="p-4 border-t border-white/10">
            {flow.progress === 'reviewing' ? (
              <div className="flex gap-2">
                <button
                  onClick={goBack}
                  className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Submit
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                {flow.enableVoice && (
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white'
                        : getInputStyles() + ' text-white/60 hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className={`flex-1 px-4 py-2 rounded-lg text-white placeholder-white/40 focus:outline-none ${getInputStyles()}`}
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2 bg-neon-cyan text-black rounded-lg hover:bg-neon-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}