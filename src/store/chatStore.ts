import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { ChatMessage, AvatarState, ConversationContext } from '@/types/chat'

interface ChatState {
  messages: ChatMessage[]
  avatarState: AvatarState
  isRecording: boolean
  context: ConversationContext
  isInitialized: boolean
  shouldFocusInput: boolean
  voiceOnlyMode: boolean
  isAvatarFloating: boolean
  avatarPosition: { x: number; y: number }
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setAvatarState: (state: AvatarState) => void
  setIsRecording: (isRecording: boolean) => void
  updateContext: (updates: Partial<ConversationContext>) => void
  clearMessages: () => void
  initialize: () => void
  focusInput: () => void
  clearFocusInput: () => void
  setVoiceOnlyMode: (enabled: boolean) => void
  setAvatarFloating: (floating: boolean) => void
  setAvatarPosition: (position: { x: number; y: number }) => void
}

const WELCOME_MESSAGE = "Hi! 👋 I'm your AI form assistant powered by **GLM-4.6**. Tell me what kind of form you'd like to create!\n\nTry:\n• \"Create a contact form\"\n• \"Build a customer survey\"\n• \"Make a registration form\""

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  avatarState: 'idle',
  isRecording: false,
  isInitialized: false,
  shouldFocusInput: false,
  voiceOnlyMode: false,
  isAvatarFloating: false,
  avatarPosition: { x: 100, y: 100 },
  context: {
    extractedInfo: {},
  },

  initialize: () => {
    if (get().isInitialized) return
    set({
      isInitialized: true,
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date(),
        },
      ],
    })
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: nanoid(),
          timestamp: new Date(),
        },
      ],
    }))
  },

  setAvatarState: (avatarState) => set({ avatarState }),
  setIsRecording: (isRecording) => set({ isRecording }),

  updateContext: (updates) => {
    set((state) => ({
      context: { ...state.context, ...updates },
    }))
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date(),
        },
      ],
      context: { extractedInfo: {} },
    })
  },
  
  focusInput: () => set({ shouldFocusInput: true }),
  clearFocusInput: () => set({ shouldFocusInput: false }),
  
  setVoiceOnlyMode: (enabled) => set({ voiceOnlyMode: enabled }),
  setAvatarFloating: (floating) => set({ isAvatarFloating: floating }),
  setAvatarPosition: (position) => set({ avatarPosition: position }),
}))
