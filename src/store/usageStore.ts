/**
 * Usage Tracking Store
 *
 * Tracks usage metrics for forms and responses
 * All plans have unlimited forms and responses
 * Differentiation based on features (branding, integrations, team size)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PlanType = 'free' | 'pro' | 'team' | 'enterprise'

export interface PlanLimits {
  forms: number // -1 = unlimited
  responses: number // -1 = unlimited
  storage: number // in MB, -1 = unlimited
  teamMembers: number // -1 = unlimited
  customBranding: boolean
  removePoweredBy: boolean
  advancedIntegrations: boolean
  apiAccess: boolean
  prioritySupport: boolean
  customDomain: boolean
  ssoSaml: boolean
}

export interface UsageStats {
  forms: number
  responses: number
  storage: number // in MB
  teamMembers: number
}

export interface FormUsage {
  formId: string
  formName: string
  views: number
  starts: number
  completions: number
  dropoffs: number
  averageCompletionTime: number // in seconds
  lastActivity: Date
  created: Date
}

export interface UsageRecord {
  id: string
  type: 'form_created' | 'form_viewed' | 'form_started' | 'form_completed' | 'storage_used'
  formId?: string
  formName?: string
  timestamp: Date
  metadata?: Record<string, any>
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    forms: -1, // Unlimited
    responses: -1, // Unlimited
    storage: 100,
    teamMembers: 1,
    customBranding: false,
    removePoweredBy: false,
    advancedIntegrations: false,
    apiAccess: false,
    prioritySupport: false,
    customDomain: false,
    ssoSaml: false,
  },
  pro: {
    forms: -1, // Unlimited
    responses: -1, // Unlimited
    storage: 1000,
    teamMembers: 3,
    customBranding: true,
    removePoweredBy: true,
    advancedIntegrations: true,
    apiAccess: false,
    prioritySupport: true,
    customDomain: true,
    ssoSaml: false,
  },
  team: {
    forms: -1, // Unlimited
    responses: -1, // Unlimited
    storage: 5000,
    teamMembers: -1, // Unlimited
    customBranding: true,
    removePoweredBy: true,
    advancedIntegrations: true,
    apiAccess: true,
    prioritySupport: true,
    customDomain: true,
    ssoSaml: false,
  },
  enterprise: {
    forms: -1, // Unlimited
    responses: -1, // Unlimited
    storage: -1, // Unlimited
    teamMembers: -1, // Unlimited
    customBranding: true,
    removePoweredBy: true,
    advancedIntegrations: true,
    apiAccess: true,
    prioritySupport: true,
    customDomain: true,
    ssoSaml: true,
  },
}

interface UsageState {
  // Current state
  currentPlan: PlanType
  usageStats: UsageStats
  formUsage: Map<string, FormUsage>
  usageHistory: UsageRecord[]
  billingCycleStart: Date
  billingCycleEnd: Date

  // Actions
  setCurrentPlan: (plan: PlanType) => void
  getPlanLimits: (plan?: PlanType) => PlanLimits

  // Usage tracking
  trackFormCreated: (formId: string, formName: string) => void
  trackFormViewed: (formId: string, formName: string) => void
  trackFormStarted: (formId: string, formName: string) => void
  trackFormCompleted: (formId: string, formName: string, completionTime: number) => void
  trackStorageUsed: (amount: number) => void

  // Stats and calculations
  getUsageStats: () => UsageStats
  getFormUsage: (formId: string) => FormUsage | null
  getCompletionRate: (formId: string) => number
  getDropoffRate: (formId: string) => number
  resetBillingCycle: () => void

  // Plan comparison
  canUpgrade: (toPlan: PlanType) => boolean
  getUpgradeMessage: (currentPlan: PlanType, toPlan: PlanType) => string

  // Feature checks
  hasFeature: (feature: keyof PlanLimits) => boolean
  isOverLimit: (feature: keyof UsageStats) => boolean
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      currentPlan: 'free',
      usageStats: {
        forms: 0,
        responses: 0,
        storage: 0,
        teamMembers: 1,
      },
      formUsage: new Map(),
      usageHistory: [],
      billingCycleStart: new Date(),
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now

      setCurrentPlan: (plan) => {
        set({ currentPlan: plan })
      },

      getPlanLimits: (plan) => {
        return PLAN_LIMITS[plan || get().currentPlan]
      },

      trackFormCreated: (formId, formName) => {
        const state = get()
        const newFormUsage: FormUsage = {
          formId,
          formName,
          views: 0,
          starts: 0,
          completions: 0,
          dropoffs: 0,
          averageCompletionTime: 0,
          lastActivity: new Date(),
          created: new Date(),
        }

        const record: UsageRecord = {
          id: `usage_${Date.now()}`,
          type: 'form_created',
          formId,
          formName,
          timestamp: new Date(),
        }

        set({
          formUsage: new Map(state.formUsage).set(formId, newFormUsage),
          usageStats: {
            ...state.usageStats,
            forms: state.usageStats.forms + 1,
          },
          usageHistory: [record, ...state.usageHistory],
        })
      },

      trackFormViewed: (formId, formName) => {
        const state = get()
        const existingForm = state.formUsage.get(formId)

        const updatedForm: FormUsage = existingForm
          ? {
              ...existingForm,
              views: existingForm.views + 1,
              lastActivity: new Date(),
            }
          : {
              formId,
              formName,
              views: 1,
              starts: 0,
              completions: 0,
              dropoffs: 0,
              averageCompletionTime: 0,
              lastActivity: new Date(),
              created: new Date(),
            }

        const record: UsageRecord = {
          id: `usage_${Date.now()}`,
          type: 'form_viewed',
          formId,
          formName,
          timestamp: new Date(),
        }

        set({
          formUsage: new Map(state.formUsage).set(formId, updatedForm),
          usageHistory: [record, ...state.usageHistory].slice(0, 1000),
        })
      },

      trackFormStarted: (formId, formName) => {
        const state = get()
        const existingForm = state.formUsage.get(formId)

        if (existingForm) {
          const updatedForm = {
            ...existingForm,
            starts: existingForm.starts + 1,
            lastActivity: new Date(),
          }

          const record: UsageRecord = {
            id: `usage_${Date.now()}`,
            type: 'form_started',
            formId,
            formName,
            timestamp: new Date(),
          }

          set({
            formUsage: new Map(state.formUsage).set(formId, updatedForm),
            usageHistory: [record, ...state.usageHistory],
          })
        }
      },

      trackFormCompleted: (formId, formName, completionTime) => {
        const state = get()
        const existingForm = state.formUsage.get(formId)

        if (existingForm) {
          const totalTime =
            existingForm.averageCompletionTime * existingForm.completions + completionTime
          const newCompletions = existingForm.completions + 1

          const updatedForm = {
            ...existingForm,
            completions: newCompletions,
            averageCompletionTime: totalTime / newCompletions,
            lastActivity: new Date(),
          }

          const record: UsageRecord = {
            id: `usage_${Date.now()}`,
            type: 'form_completed',
            formId,
            formName,
            timestamp: new Date(),
            metadata: { completionTime },
          }

          set({
            formUsage: new Map(state.formUsage).set(formId, updatedForm),
            usageStats: {
              ...state.usageStats,
              responses: state.usageStats.responses + 1,
            },
            usageHistory: [record, ...state.usageHistory],
          })
        }
      },

      trackStorageUsed: (amount) => {
        const state = get()
        set({
          usageStats: {
            ...state.usageStats,
            storage: state.usageStats.storage + amount,
          },
        })
      },

      getUsageStats: () => {
        return get().usageStats
      },

      getFormUsage: (formId) => {
        return get().formUsage.get(formId) || null
      },

      getCompletionRate: (formId) => {
        const form = get().formUsage.get(formId)
        if (!form || form.starts === 0) return 0
        return (form.completions / form.starts) * 100
      },

      getDropoffRate: (formId) => {
        const form = get().formUsage.get(formId)
        if (!form || form.starts === 0) return 0
        return 100 - (form.completions / form.starts) * 100
      },

      resetBillingCycle: () => {
        const now = new Date()
        set({
          billingCycleStart: now,
          billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          usageStats: {
            forms: 0,
            responses: 0,
            storage: 0,
            teamMembers: 1,
          },
          formUsage: new Map(),
          usageHistory: [],
        })
      },

      canUpgrade: (toPlan) => {
        const planOrder: PlanType[] = ['free', 'pro', 'team', 'enterprise']
        const currentPlanIndex = planOrder.indexOf(get().currentPlan)
        const toPlanIndex = planOrder.indexOf(toPlan)
        return toPlanIndex > currentPlanIndex
      },

      getUpgradeMessage: (currentPlan, toPlan) => {
        const messages: Record<string, string> = {
          free_to_pro: 'Upgrade to Pro to remove "Powered by" badge, enable custom branding, and get priority support!',
          free_to_team: 'Upgrade to Team for unlimited collaboration, API access, and advanced integrations!',
          free_to_enterprise: 'Upgrade to Enterprise for SSO/SAML, dedicated support, and unlimited everything!',
          pro_to_team: 'Upgrade to Team for unlimited team members and API access!',
          pro_to_enterprise: 'Upgrade to Enterprise for SSO/SAML and HIPAA compliance!',
          team_to_enterprise: 'Upgrade to Enterprise for SSO/SAML, HIPAA compliance, and SLA guarantees!',
        }

        const key = `${currentPlan}_to_${toPlan}`
        return messages[key] || `Upgrade to ${toPlan.charAt(0).toUpperCase() + toPlan.slice(1)} for more features!`
      },

      hasFeature: (feature) => {
        const state = get()
        const limits = PLAN_LIMITS[state.currentPlan]
        return limits[feature] === true
      },

      isOverLimit: (feature) => {
        const state = get()
        const limits = PLAN_LIMITS[state.currentPlan]
        const limit = limits[feature]

        // -1 means unlimited
        if (limit === -1) return false

        const usage = state.usageStats[feature]
        return usage > limit
      },
    }),
    {
      name: 'revoforms-usage-storage',
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        usageStats: state.usageStats,
        formUsage: Array.from(state.formUsage.entries()),
        usageHistory: state.usageHistory.slice(0, 100),
        billingCycleStart: state.billingCycleStart,
        billingCycleEnd: state.billingCycleEnd,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert array back to Map
        if (state) {
          state.formUsage = new Map(state.formUsage)
        }
      },
    }
  )
)
