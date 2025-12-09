import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface FormResponse {
  id: string
  formId: string
  data: Record<string, any>
  submittedAt: Date
  isPartial: boolean
  resumeToken?: string
  completionTime?: number
  fieldTimes?: Record<string, number>
}

export interface FormAnalytics {
  formId: string
  views: number
  starts: number
  completions: number
  partials: number
  averageTime: number
}

interface ResponseState {
  responses: FormResponse[]
  analytics: Record<string, FormAnalytics>
  
  // Actions
  addResponse: (response: Omit<FormResponse, 'id' | 'submittedAt'>) => string
  updateResponse: (id: string, data: Partial<FormResponse>) => void
  getFormResponses: (formId: string) => FormResponse[]
  getFormAnalytics: (formId: string) => FormAnalytics
  incrementView: (formId: string) => void
  incrementStart: (formId: string) => void
  exportResponses: (formId: string, format: 'json' | 'csv') => string
  clearFormResponses: (formId: string) => void
}

const defaultAnalytics: FormAnalytics = {
  formId: '',
  views: 0,
  starts: 0,
  completions: 0,
  partials: 0,
  averageTime: 0
}

export const useResponseStore = create<ResponseState>()(
  persist(
    (set, get) => ({
      responses: [],
      analytics: {},

      addResponse: (response) => {
        const id = nanoid()
        const newResponse: FormResponse = {
          ...response,
          id,
          submittedAt: new Date()
        }
        
        set((state) => {
          // Update analytics
          const formAnalytics = state.analytics[response.formId] || { ...defaultAnalytics, formId: response.formId }
          if (response.isPartial) {
            formAnalytics.partials++
          } else {
            formAnalytics.completions++
            // Update average time
            if (response.completionTime) {
              const totalResponses = formAnalytics.completions
              formAnalytics.averageTime = Math.round(
                ((formAnalytics.averageTime * (totalResponses - 1)) + response.completionTime) / totalResponses
              )
            }
          }
          
          return {
            responses: [...state.responses, newResponse],
            analytics: { ...state.analytics, [response.formId]: formAnalytics }
          }
        })
        
        return id
      },

      updateResponse: (id, data) => {
        set((state) => ({
          responses: state.responses.map(r => 
            r.id === id ? { ...r, ...data } : r
          )
        }))
      },

      getFormResponses: (formId) => {
        return get().responses.filter(r => r.formId === formId)
      },

      getFormAnalytics: (formId) => {
        return get().analytics[formId] || { ...defaultAnalytics, formId }
      },

      incrementView: (formId) => {
        set((state) => {
          const analytics = state.analytics[formId] || { ...defaultAnalytics, formId }
          return {
            analytics: {
              ...state.analytics,
              [formId]: { ...analytics, views: analytics.views + 1 }
            }
          }
        })
      },

      incrementStart: (formId) => {
        set((state) => {
          const analytics = state.analytics[formId] || { ...defaultAnalytics, formId }
          return {
            analytics: {
              ...state.analytics,
              [formId]: { ...analytics, starts: analytics.starts + 1 }
            }
          }
        })
      },

      exportResponses: (formId, format) => {
        const responses = get().responses.filter(r => r.formId === formId && !r.isPartial)
        
        if (format === 'json') {
          return JSON.stringify(responses, null, 2)
        }
        
        // CSV format
        if (responses.length === 0) return ''
        
        const headers = ['id', 'submittedAt', ...Object.keys(responses[0].data)]
        const rows = responses.map(r => [
          r.id,
          new Date(r.submittedAt).toISOString(),
          ...Object.values(r.data).map(v => `"${String(v).replace(/"/g, '""')}"`)
        ])
        
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      },

      clearFormResponses: (formId) => {
        set((state) => ({
          responses: state.responses.filter(r => r.formId !== formId),
          analytics: {
            ...state.analytics,
            [formId]: { ...defaultAnalytics, formId }
          }
        }))
      }
    }),
    {
      name: 'revoforms-responses',
      partialize: (state) => ({ 
        responses: state.responses,
        analytics: state.analytics
      })
    }
  )
)
