'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { FormField } from '@/types/form'

interface AIMessage {
  id: string
  type: 'suggestion' | 'analysis' | 'tip' | 'question' | 'optimization'
  content: string
  actionable?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  priority?: 'low' | 'medium' | 'high'
}

interface AIAssistantProps {
  fields: FormField[]
  onFieldAdd?: (field: FormField) => void
  onFieldUpdate?: (fieldId: string, updates: Partial<FormField>) => void
  onOptimizationApply?: (optimization: any) => void
  className?: string
}

export function AIAssistant({
  fields,
  onFieldAdd,
  onFieldUpdate,
  onOptimizationApply,
  className
}: AIAssistantProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-generate insights when fields change
  useEffect(() => {
    if (fields.length > 0 && !isTyping) {
      generateInsights()
    }
  }, [fields])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateInsights = async () => {
    setIsTyping(true)

    // Simulate AI analysis
    setTimeout(() => {
      const insights: AIMessage[] = []

      // Check for missing common fields
      const hasEmail = fields.some(f => f.type === 'email')
      if (!hasEmail) {
        insights.push({
          id: `missing-email-${Date.now()}`,
          type: 'suggestion',
          content: 'Consider adding an email field to stay in touch with respondents',
          actionable: true,
          action: {
            label: 'Add Email Field',
            onClick: () => {
              const newField: FormField = {
                id: `field_${Date.now()}`,
                type: 'email',
                label: 'Email Address',
                required: true,
                placeholder: 'Enter your email'
              }
              onFieldAdd?.(newField)
            }
          },
          priority: 'high'
        })
      }

      // Check form length
      if (fields.length > 15) {
        insights.push({
          id: `too-long-${Date.now()}`,
          type: 'analysis',
          content: 'Your form is getting long. Consider splitting it into multiple pages or removing non-essential fields',
          priority: 'medium'
        })
      }

      // Suggest conditional logic
      const hasConditional = fields.some(f => f.conditionalLogic)
      if (!hasConditional && fields.length > 5) {
        insights.push({
          id: `conditional-${Date.now()}`,
          type: 'tip',
          content: 'Use conditional logic to show relevant fields based on previous answers',
          actionable: true,
          priority: 'low'
        })
      }

      // Performance tip
      insights.push({
        id: `performance-${Date.now()}`,
        type: 'optimization',
        content: 'Your form score is 85/100. Adding progress indicators could improve completion rates by 20%',
        actionable: true,
        action: {
          label: 'Apply Optimization',
          onClick: () => onOptimizationApply?.({ type: 'progress_bar' })
        },
        priority: 'high'
      })

      setMessages(prev => [...prev, ...insights])
      setIsTyping(false)
    }, 1500)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: 'question',
      content: inputValue
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        {
          type: 'suggestion' as const,
          content: 'Based on your form structure, I recommend adding a file upload field for document collection',
          actionable: true
        },
        {
          type: 'tip' as const,
          content: 'Try using descriptive placeholder text to guide users on what to enter'
        },
        {
          type: 'analysis' as const,
          content: 'Your form has a good balance of required and optional fields'
        }
      ]

      const response = responses[Math.floor(Math.random() * responses.length)]

      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        ...response,
        content: response.content,
        action: response.actionable ? {
          label: 'Apply Suggestion',
          onClick: () => {
            if (response.content.includes('file upload')) {
              const newField: FormField = {
                id: `field_${Date.now()}`,
                type: 'file',
                label: 'Upload Document',
                required: false
              }
              onFieldAdd?.(newField)
            }
          }
        } : undefined
      }

      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000)
  }

  const getMessageIcon = (type: AIMessage['type']) => {
    switch (type) {
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />
      case 'analysis':
        return <TrendingUp className="w-4 h-4 text-blue-400" />
      case 'optimization':
        return <Zap className="w-4 h-4 text-purple-400" />
      case 'tip':
        return <Sparkles className="w-4 h-4 text-green-400" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const getPriorityBorder = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/50'
      case 'medium':
        return 'border-yellow-500/50'
      case 'low':
        return 'border-green-500/50'
      default:
        return 'border-white/10'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-4 right-4 z-50 ${className}`}
    >
      <div className={`bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-64' : 'w-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Assistant</h3>
              <p className="text-xs text-white/60">Smart form suggestions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4 text-white/60" /> : <Minimize2 className="w-4 h-4 text-white/60" />}
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-xl border ${getPriorityBorder(message.priority)} ${
                      message.actionable ? 'bg-white/5' : 'bg-white/2'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getMessageIcon(message.type)}
                      <div className="flex-1">
                        <p className="text-sm text-white/80">{message.content}</p>
                        {message.action && (
                          <button
                            onClick={message.action.onClick}
                            className="mt-2 px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded-lg text-xs font-medium hover:bg-neon-cyan/30 transition-colors"
                          >
                            {message.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-white/2 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-4 h-4 text-white/60" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask for suggestions..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-neon-cyan/50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="px-3 py-2 bg-neon-cyan text-black rounded-lg hover:bg-neon-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}