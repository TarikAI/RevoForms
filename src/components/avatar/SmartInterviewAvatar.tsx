'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, X, Mic, MicOff, Send, 
  Volume2, VolumeX, Minimize2, Maximize2,
  Sparkles, HelpCircle, Edit3, UserCheck,
  BookOpen, Play, Pause
} from 'lucide-react'
import { AvatarFace } from './AvatarFace'

/**
 * SmartInterviewAvatar - "Forms That Talk Back" v2
 * 
 * Features:
 * 1. INTERVIEW MODE: AI asks questions and fills form based on user's voice/text answers
 * 2. EXPLAIN MODE: When viewing a filled form, AI explains about the person who filled it
 * 3. GUIDE MODE: Traditional assistance - explains fields and answers questions
 */

interface FormField {
  id: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  helpText?: string
  value?: string
}

interface FormContext {
  formName: string
  formDescription: string
  fields: FormField[]
  creatorName?: string
  creatorProfile?: {
    name?: string
    company?: string
    bio?: string
  }
  customInstructions?: string
}

interface SmartInterviewAvatarProps {
  formContext: FormContext
  mode: 'interview' | 'explain' | 'guide'
  currentFieldId?: string
  filledData?: Record<string, any>
  onFieldFocus?: (fieldId: string) => void
  onFieldFill?: (fieldId: string, value: string) => void
  onFormComplete?: (data: Record<string, any>) => void
  position?: 'bottom-right' | 'bottom-left' | 'side-panel'
  minimizedByDefault?: boolean
  voiceEnabled?: boolean
  autoStart?: boolean
}

type AvatarState = 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'celebrating' | 'interviewing'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  fieldContext?: string
}

export function SmartInterviewAvatar({
  formContext,
  mode = 'guide',
  currentFieldId,
  filledData,
  onFieldFocus,
  onFieldFill,
  onFormComplete,
  position = 'bottom-right',
  minimizedByDefault = true,
  voiceEnabled = false,
  autoStart = false
}: SmartInterviewAvatarProps) {
  const [isMinimized, setIsMinimized] = useState(minimizedByDefault)
  const [isExpanded, setIsExpanded] = useState(false)
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(!voiceEnabled)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [interviewFieldIndex, setInterviewFieldIndex] = useState(0)
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, string>>({})
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'side-panel': 'relative w-full h-full'
  }

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = useCallback((role: ChatMessage['role'], content: string, fieldContext?: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      fieldContext
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  // Greet user based on mode
  useEffect(() => {
    if (!isMinimized && !hasGreeted) {
      setHasGreeted(true)
      setAvatarState('greeting')
      
      let greeting = ''
      switch (mode) {
        case 'interview':
          greeting = `Hi! I'm here to help you fill out "${formContext.formName}" through a conversation. I'll ask you questions one by one, and fill in the form for you. Would you like to start the interview?`
          break
        case 'explain':
          greeting = `Hello! I can explain the information in this "${formContext.formName}" submission. This person has filled out ${Object.keys(filledData || {}).length} fields. What would you like to know about them?`
          break
        default:
          greeting = `Hi! I'm here to help you with "${formContext.formName}". ${formContext.formDescription || ''} Feel free to ask me anything about the form!`
      }
      
      setTimeout(() => {
        addMessage('assistant', greeting)
        setAvatarState('idle')
        
        if (autoStart && mode === 'interview') {
          setTimeout(() => startInterview(), 1000)
        }
      }, 500)
    }
  }, [isMinimized, hasGreeted, formContext, mode, filledData, autoStart])

  // Start interview mode
  const startInterview = useCallback(() => {
    setIsInterviewActive(true)
    setInterviewFieldIndex(0)
    setCollectedAnswers({})
    askNextQuestion(0)
  }, [formContext.fields])

  // Ask the next question in interview
  const askNextQuestion = useCallback((index: number) => {
    const requiredFields = formContext.fields.filter(f => f.required || f.type !== 'divider')
    
    if (index >= requiredFields.length) {
      // Interview complete!
      setAvatarState('celebrating')
      addMessage('assistant', `🎉 Great! I've collected all the information. Here's a summary:\n\n${
        Object.entries(collectedAnswers).map(([k, v]) => `• ${k}: ${v}`).join('\n')
      }\n\nWould you like me to submit this, or would you like to make any changes?`)
      setIsInterviewActive(false)
      onFormComplete?.(collectedAnswers)
      return
    }

    const field = requiredFields[index]
    setAvatarState('interviewing')
    
    // Generate a natural question for this field
    let question = ''
    const label = field.label.toLowerCase()
    
    if (label.includes('name') && label.includes('first')) {
      question = "What's your first name?"
    } else if (label.includes('name') && label.includes('last')) {
      question = "And what's your last name?"
    } else if (label.includes('name')) {
      question = "May I have your full name?"
    } else if (label.includes('email')) {
      question = "What's your email address?"
    } else if (label.includes('phone') || label.includes('mobile')) {
      question = "What's the best phone number to reach you?"
    } else if (label.includes('company') || label.includes('organization')) {
      question = "Which company or organization are you with?"
    } else if (label.includes('message') || label.includes('comment')) {
      question = "Is there anything you'd like to add or tell us?"
    } else {
      question = `What would you like to enter for "${field.label}"?`
    }
    
    if (field.helpText) {
      question += ` (${field.helpText})`
    }
    
    onFieldFocus?.(field.id)
    addMessage('assistant', question, field.id)
    setInterviewFieldIndex(index)
  }, [formContext.fields, collectedAnswers, onFieldFocus, onFormComplete])

  // Process interview answer
  const processInterviewAnswer = useCallback(async (answer: string) => {
    const requiredFields = formContext.fields.filter(f => f.required || f.type !== 'divider')
    const currentField = requiredFields[interviewFieldIndex]
    
    if (!currentField) return
    
    // Save the answer
    setCollectedAnswers(prev => ({
      ...prev,
      [currentField.label]: answer
    }))
    
    // Fill the field in the form
    onFieldFill?.(currentField.id, answer)
    
    // Acknowledge and move to next
    const acknowledgments = [
      "Got it!",
      "Perfect!",
      "Thanks!",
      "Great!",
      "Noted!"
    ]
    const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)]
    addMessage('assistant', `${ack} I've recorded "${answer}" for ${currentField.label}.`)
    
    // Move to next question
    setTimeout(() => {
      askNextQuestion(interviewFieldIndex + 1)
    }, 800)
  }, [formContext.fields, interviewFieldIndex, onFieldFill, askNextQuestion])

  // Handle sending messages
  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage('user', userMessage)
    setIsProcessing(true)
    setAvatarState('thinking')

    // If in interview mode and active, process as answer
    if (mode === 'interview' && isInterviewActive) {
      await processInterviewAnswer(userMessage)
      setIsProcessing(false)
      return
    }

    try {
      // Build context for AI based on mode
      let systemContext = ''
      
      switch (mode) {
        case 'explain':
          systemContext = `You are explaining a form submission to a viewer.
Form: "${formContext.formName}"
${formContext.formDescription ? `Description: ${formContext.formDescription}` : ''}

Filled Data:
${Object.entries(filledData || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Your role:
1. Explain who this person is based on their answers
2. Provide insights about their responses
3. Answer questions about specific fields
4. Be helpful and professional
5. If asked, summarize the key information`
          break
          
        case 'interview':
          systemContext = `You are conducting a friendly form interview.
The user wants to start or continue filling "${formContext.formName}".
Fields to collect: ${formContext.fields.map(f => f.label).join(', ')}

If user says they want to start, begin asking questions one by one.
Keep responses SHORT and conversational.`
          break
          
        default:
          systemContext = `You are helping someone fill out "${formContext.formName}".
${formContext.formDescription || ''}
Fields: ${formContext.fields.map(f => `${f.label} (${f.type}${f.required ? ', required' : ''})`).join(', ')}
Keep responses SHORT (2-3 sentences max).`
      }

      const response = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          systemContext,
          conversationHistory: messages.slice(-8)
        })
      })

      if (!response.ok) throw new Error('Failed')
      
      const data = await response.json()
      
      setAvatarState('speaking')
      addMessage('assistant', data.message)
      
      // Check for special commands
      if (data.message.toLowerCase().includes('start') && mode === 'interview' && !isInterviewActive) {
        setTimeout(() => startInterview(), 1000)
      }
      
      setTimeout(() => setAvatarState('idle'), 2000)
    } catch (error) {
      addMessage('assistant', "Sorry, I had trouble with that. Could you try again?")
      setAvatarState('idle')
    } finally {
      setIsProcessing(false)
    }
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAndProcess(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setAvatarState('listening')
    } catch (error) {
      addMessage('assistant', "Couldn't access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAndProcess = async (audioBlob: Blob) => {
    setAvatarState('thinking')
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const response = await fetch('/api/ai/voice', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Transcription failed')
      
      const { text } = await response.json()
      if (text) {
        setInputValue(text)
        addMessage('user', text)
        
        if (mode === 'interview' && isInterviewActive) {
          await processInterviewAnswer(text)
        } else {
          await handleSend()
        }
      }
    } catch (error) {
      addMessage('assistant', "Sorry, I couldn't understand. Please try again or type your answer.")
      setAvatarState('idle')
    }
  }

  // Mode-specific quick actions
  const quickActions = {
    interview: [
      { label: "Start interview", action: () => startInterview() },
      { label: "Skip this field", action: () => askNextQuestion(interviewFieldIndex + 1) },
      { label: "Go back", action: () => interviewFieldIndex > 0 && askNextQuestion(interviewFieldIndex - 1) }
    ],
    explain: [
      { label: "Summarize this person", action: () => setInputValue("Give me a summary of this person") },
      { label: "Key highlights", action: () => setInputValue("What are the key highlights?") },
      { label: "Contact info", action: () => setInputValue("What's their contact information?") }
    ],
    guide: [
      { label: "What's required?", action: () => setInputValue("What fields are required?") },
      { label: "Help with this field", action: () => setInputValue("Help me with the current field") },
      { label: "What's this form for?", action: () => setInputValue("What is this form for?") }
    ]
  }

  // Minimized bubble
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={positionClasses[position]}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(false)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple shadow-lg shadow-neon-cyan/30 flex items-center justify-center group"
        >
          <AvatarFace state={avatarState} size={40} />
          <span className="absolute inset-0 rounded-full bg-neon-cyan/30 animate-ping" />
          
          {/* Mode indicator */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0a0a14] border border-neon-cyan flex items-center justify-center">
            {mode === 'interview' && <Mic className="w-3 h-3 text-neon-cyan" />}
            {mode === 'explain' && <BookOpen className="w-3 h-3 text-neon-purple" />}
            {mode === 'guide' && <HelpCircle className="w-3 h-3 text-white" />}
          </div>
        </motion.button>
      </motion.div>
    )
  }

  // Expanded view
  const panelWidth = position === 'side-panel' ? 'w-full' : isExpanded ? 'w-96' : 'w-80'
  const panelHeight = position === 'side-panel' ? 'h-full' : isExpanded ? 'h-[520px]' : 'h-[420px]'

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={position === 'side-panel' ? 'relative w-full h-full' : positionClasses[position]}
    >
      <div className={`bg-[#0a0a14]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${panelWidth} ${panelHeight} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10">
          <div className="flex items-center gap-3">
            <AvatarFace state={avatarState} size={36} />
            <div>
              <h4 className="text-white text-sm font-medium flex items-center gap-1.5">
                {mode === 'interview' && <><Mic className="w-3.5 h-3.5 text-neon-cyan" /> Interview Mode</>}
                {mode === 'explain' && <><BookOpen className="w-3.5 h-3.5 text-neon-purple" /> Explain Mode</>}
                {mode === 'guide' && <><Sparkles className="w-3.5 h-3.5 text-neon-cyan" /> Form Assistant</>}
              </h4>
              <p className="text-white/50 text-xs">
                {mode === 'interview' && (isInterviewActive ? `Question ${interviewFieldIndex + 1} of ${formContext.fields.length}` : 'Ready to start')}
                {mode === 'explain' && `${Object.keys(filledData || {}).length} fields filled`}
                {mode === 'guide' && "I'm here to help!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 hover:bg-white/10 rounded-lg">
              {isMuted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-neon-cyan" />}
            </button>
            {position !== 'side-panel' && (
              <>
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  {isExpanded ? <Minimize2 className="w-4 h-4 text-white/50" /> : <Maximize2 className="w-4 h-4 text-white/50" />}
                </button>
                <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Interview progress bar */}
        {mode === 'interview' && isInterviewActive && (
          <div className="px-4 py-2 bg-neon-cyan/5 border-b border-white/5">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>Progress</span>
              <span>{Math.round((interviewFieldIndex / formContext.fields.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(interviewFieldIndex / formContext.fields.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-neon-cyan/20 text-white'
                  : msg.role === 'system'
                  ? 'bg-neon-purple/10 text-white/70 text-xs italic'
                  : 'bg-white/5 text-white/90'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white/5 px-4 py-2 rounded-xl flex gap-1">
                <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {quickActions[mode].map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="px-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                {action.label}
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
              placeholder={
                mode === 'interview' && isInterviewActive
                  ? "Type your answer..."
                  : mode === 'explain'
                  ? "Ask about this submission..."
                  : "Ask me anything..."
              }
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-neon-cyan/50"
              disabled={isProcessing}
            />
            
            {/* Voice button for interview mode */}
            {mode === 'interview' && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-xl transition-colors ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 animate-pulse' 
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isProcessing}
              className="p-2 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl text-white disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
