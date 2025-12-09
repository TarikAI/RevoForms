// Chat & Conversation Types

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isVoice?: boolean
  attachments?: Array<{
    type: 'image' | 'pdf' | 'file'
    name: string
    preview?: string
  }>
}

export type AvatarState = 
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'

export interface ConversationContext {
  currentFormId?: string
  intent?: 'create' | 'edit' | 'style' | 'help' | 'preview'
  extractedInfo: Record<string, unknown>
}

export type AIActionType = 
  | 'create_form'
  | 'update_form'
  | 'add_fields'
  | 'remove_fields'
  | 'update_field'
  | 'update_styling'
  | 'duplicate_form'
  | 'fill_form'
  | 'none'

export interface AIResponse {
  message: string
  action?: {
    type: AIActionType
    payload?: unknown
  }
  suggestions?: string[]
  _provider?: string
}
