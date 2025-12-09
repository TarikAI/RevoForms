'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, X, Mic, MicOff, Send, 
  Volume2, VolumeX, Minimize2, Maximize2,
  Sparkles, HelpCircle
} from 'lucide-react'
import { AvatarFace } from './AvatarFace'

/**
 * InterviewAvatar - Revolutionary "Forms That Talk Back" Feature
 * 
 * This component appears on live forms to help users fill them out.
 * It can answer questions, provide guidance, and validate inputs
 * in a conversational manner - like having an interview, not just filling a form.
 */

interface FormContext {
  formName: string
  formDescription: string
  fields: Array<{
    id: string
    label: string
    type: string
    required: boolean
    placeholder?: string
    helpText?: string
  }>
  creatorName?: string
  customInstructions?: string
}

interface InterviewAvatarProps {
  formContext: FormContext
  currentFieldId?: string
  onFieldFocus?: (fieldId: string) => void
  onSuggestValue?: (fieldId: string, value: string) => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  minimizedByDefault?: boolean
  voiceEnabled?: boolean
}

type AvatarState = 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'celebrating'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function InterviewAvatar({
  formContext,
  currentFieldId,
  onFieldFocus,
  onSuggestValue,
  position = 'bottom-right',
  minimizedByDefault = true,
  voiceEnabled = false
}: InterviewAvatarProps) {
  const [isMinimized, setIsMinimized] = useState(minimizedByDefault)
  const [isExpanded, setIsExpanded] = useState(false)
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(!voiceEnabled)
  const [hasGreeted, setHasGreeted] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Greet user when avatar is opened for first time
  useEffect(() => {
    if (!isMinimized && !hasGreeted) {
      setHasGreeted(true)
      setAvatarState('greeting')
      
      const greeting = `Hi! I'm here to help you fill out "${formContext.formName}". ${
        formContext.formDescription ? formContext.formDescription + ' ' : ''
      }Feel free to ask me anything about the form fields, and I'll guide you through!`
      
      setTimeout(() => {
        addMessage('assistant', greeting)
        setAvatarState('idle')
      }, 500)
    }
  }, [isMinimized, hasGreeted, formContext])

  // React to field focus changes
  useEffect(() => {
    if (currentFieldId && !isMinimized) {
      const field = formContext.fields.find(f => f.id === currentFieldId)
      if (field?.helpText) {
        // Offer contextual help
        setAvatarState('speaking')
        addMessage('assistant', `📝 **${field.label}**: ${field.helpText}`)
        setTimeout(() => setAvatarState('idle'), 2000)
      }
    }
  }, [currentFieldId])

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }


  // Handle sending messages to AI
  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage('user', userMessage)
    setIsProcessing(true)
    setAvatarState('thinking')

    try {
      // Build context for AI
      const currentField = currentFieldId 
        ? formContext.fields.find(f => f.id === currentFieldId)
        : null

      const systemContext = `
You are a friendly AI assistant helping someone fill out a form called "${formContext.formName}".
${formContext.formDescription ? `Form description: ${formContext.formDescription}` : ''}
${formContext.customInstructions ? `Creator's instructions: ${formContext.customInstructions}` : ''}

Available fields:
${formContext.fields.map(f => `- ${f.label} (${f.type}${f.required ? ', required' : ''})`).join('\n')}

${currentField ? `The user is currently on the "${currentField.label}" field.` : ''}

Your role:
1. Answer questions about the form fields
2. Explain what information is needed
3. Provide encouragement
4. Help validate inputs
5. Be friendly and conversational

Keep responses concise (2-3 sentences max).
`

      const response = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          systemContext,
          conversationHistory: messages.slice(-6)
        })
      })

      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json()
      
      setAvatarState('speaking')
      addMessage('assistant', data.message)
      
      // Check if AI suggested a field value
      if (data.suggestedValue && currentFieldId && onSuggestValue) {
        onSuggestValue(currentFieldId, data.suggestedValue)
      }
      
      setTimeout(() => setAvatarState('idle'), 2000)
    } catch (error) {
      console.error('Interview AI Error:', error)
      addMessage('assistant', "Sorry, I had trouble understanding. Could you rephrase that?")
      setAvatarState('idle')
    } finally {
      setIsProcessing(false)
    }
  }

  // Quick help buttons
  const quickHelps = [
    { label: "What's this form for?", query: "What is this form for?" },
    { label: "What's required?", query: "What fields are required?" },
    { label: "Help with this field", query: "Can you help me with the current field?" }
  ]

  // Minimized bubble view
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`fixed ${positionClasses[position]} z-50`}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(false)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple shadow-lg shadow-neon-cyan/30 flex items-center justify-center group"
        >
          <AvatarFace state={avatarState} size={40} />
          
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-neon-cyan/30 animate-ping" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Need help? Click me!
          </div>
        </motion.button>
      </motion.div>
    )
  }


  // Expanded chat view
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`fixed ${positionClasses[position]} z-50`}
    >
      <div 
        className={`bg-[#0a0a14]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'w-96 h-[500px]' : 'w-80 h-[400px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10">
          <div className="flex items-center gap-3">
            <AvatarFace state={avatarState} size={36} />
            <div>
              <h4 className="text-white text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
                Form Assistant
              </h4>
              <p className="text-white/50 text-xs">I'm here to help!</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-neon-cyan" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4 text-white/50" /> : <Maximize2 className="w-4 h-4 text-white/50" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Minimize to bubble"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: isExpanded ? '340px' : '250px' }}>
          {messages.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="w-10 h-10 mx-auto text-white/20 mb-3" />
              <p className="text-white/40 text-sm">Ask me anything about this form!</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-neon-cyan/20 text-white'
                  : 'bg-white/5 text-white/90'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white/5 px-4 py-2 rounded-xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Help Buttons */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {quickHelps.map((help) => (
              <button
                key={help.label}
                onClick={() => {
                  setInputValue(help.query)
                  setTimeout(() => handleSend(), 100)
                }}
                className="px-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                {help.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/10">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-neon-cyan/50"
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isProcessing}
              className="p-2 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl text-white disabled:opacity-30 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
