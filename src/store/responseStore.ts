/**
 * Response Store - Client-side response management
 * Syncs with server API and provides local caching
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FormResponse {
  id: string
  formId: string
  data: Record<string, any>
  submittedAt: string
  status: 'complete' | 'partial'
  metadata?: {
    completionTime?: number
    userAgent?: string
    referrer?: string
  }
}

export interface FormAnalytics {
  views: number
  starts: number
  completions: number
  averageTime: number
  lastUpdated: string
}

interface ResponseState {
  responses: FormResponse[]
  analytics: Record<string, FormAnalytics>
  isLoading: boolean
  error: string | null
  
  // Actions
  addResponse: (response: FormResponse) => void
  getResponsesByForm: (formId: string) => FormResponse[]
  getAnalytics: (formId: string) => FormAnalytics
  incrementAnalytics: (formId: string, field: 'views' | 'starts' | 'completions') => void
  clearFormResponses: (formId: string) => void
  fetchResponses: (formId: string) => Promise<void>
  submitResponse: (formId: string, data: Record<string, any>, isPartial?: boolean) => Promise<{ success: boolean; id?: string; error?: string }>
  exportResponses: (formId: string, format: 'json' | 'csv') => string
}

export const useResponseStore = create<ResponseState>()(
  persist(
    (set, get) => ({
      responses: [],
      analytics: {},
      isLoading: false,
      error: null,

      addResponse: (response) => {
        set((state) => ({
          responses: [...state.responses, response]
        }))
        
        // Update analytics
        get().incrementAnalytics(response.formId, response.status === 'complete' ? 'completions' : 'starts')
      },

      getResponsesByForm: (formId) => {
        return get().responses
          .filter(r => r.formId === formId)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      },

      getAnalytics: (formId) => {
        const analytics = get().analytics[formId]
        if (analytics) return analytics
        
        // Calculate from responses if not cached
        const responses = get().responses.filter(r => r.formId === formId)
        const completions = responses.filter(r => r.status === 'complete').length
        const starts = responses.length
        const totalTime = responses
          .filter(r => r.metadata?.completionTime)
          .reduce((sum, r) => sum + (r.metadata?.completionTime || 0), 0)
        
        return {
          views: Math.max(starts, Math.floor(starts * 1.5)),
          starts,
          completions,
          averageTime: starts > 0 ? Math.round(totalTime / starts) : 0,
          lastUpdated: new Date().toISOString()
        }
      },

      incrementAnalytics: (formId, field) => {
        set((state) => {
          const current = state.analytics[formId] || {
            views: 0,
            starts: 0,
            completions: 0,
            averageTime: 0,
            lastUpdated: new Date().toISOString()
          }
          
          return {
            analytics: {
              ...state.analytics,
              [formId]: {
                ...current,
                [field]: current[field] + 1,
                lastUpdated: new Date().toISOString()
              }
            }
          }
        })
      },

      clearFormResponses: (formId) => {
        set((state) => ({
          responses: state.responses.filter(r => r.formId !== formId),
          analytics: {
            ...state.analytics,
            [formId]: {
              views: 0,
              starts: 0,
              completions: 0,
              averageTime: 0,
              lastUpdated: new Date().toISOString()
            }
          }
        }))
      },

      fetchResponses: async (formId) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/submit/${formId}?includePartial=true`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch responses')
          }
          
          const data = await response.json()
          
          if (data.success) {
            // Merge with existing responses (avoid duplicates)
            set((state) => {
              const existingIds = new Set(state.responses.map(r => r.id))
              const newResponses = data.responses.filter((r: FormResponse) => !existingIds.has(r.id))
              
              return {
                responses: [...state.responses, ...newResponses],
                analytics: {
                  ...state.analytics,
                  [formId]: {
                    views: data.analytics?.totalViews || 0,
                    starts: data.analytics?.totalResponses || 0,
                    completions: data.analytics?.totalResponses || 0,
                    averageTime: 0,
                    lastUpdated: new Date().toISOString()
                  }
                },
                isLoading: false
              }
            })
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      submitResponse: async (formId, data, isPartial = false) => {
        try {
          const response = await fetch(`/api/submit/${formId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data,
              isPartial,
              metadata: {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                referrer: typeof document !== 'undefined' ? document.referrer : undefined,
              }
            })
          })

          const result = await response.json()

          if (result.success) {
            // Add to local store
            get().addResponse({
              id: result.submissionId,
              formId,
              data,
              submittedAt: new Date().toISOString(),
              status: isPartial ? 'partial' : 'complete',
            })

            return { success: true, id: result.submissionId }
          }

          return { success: false, error: result.error }
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      },

      exportResponses: (formId, format) => {
        const responses = get().getResponsesByForm(formId)
        
        if (format === 'json') {
          return JSON.stringify(responses, null, 2)
        }
        
        // CSV format
        if (responses.length === 0) return ''
        
        // Get all unique keys from all responses
        const allKeys = new Set<string>()
        responses.forEach(r => {
          Object.keys(r.data).forEach(k => allKeys.add(k))
        })
        
        const headers = ['ID', 'Submitted At', 'Status', ...Array.from(allKeys)]
        const rows = responses.map(r => {
          const row = [
            r.id,
            r.submittedAt,
            r.status,
            ...Array.from(allKeys).map(k => {
              const value = r.data[k]
              // Escape CSV values
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value ?? ''
            })
          ]
          return row.join(',')
        })
        
        return [headers.join(','), ...rows].join('\n')
      }
    }),
    {
      name: 'revoforms-responses',
      partialize: (state) => ({
        responses: state.responses,
        analytics: state.analytics,
      }),
    }
  )
)

// Export helper function for use outside React
export function exportResponses(formId: string, format: 'json' | 'csv'): string {
  return useResponseStore.getState().exportResponses(formId, format)
}
