import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

// Profile data structure
export interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  nationality: string
  gender: string
}

export interface AddressInfo {
  street: string
  apartment: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface ProfessionalInfo {
  jobTitle: string
  company: string
  industry: string
  department: string
  yearsExperience: string
  linkedIn: string
  website: string
  portfolio: string
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  field: string
  startYear: string
  endYear: string
  gpa: string
}

export interface DocumentInfo {
  id: string
  name: string
  displayName: string // User-friendly name like "C.V.", "ID Card", "Passport"
  type: 'cv' | 'id' | 'certificate' | 'passport' | 'license' | 'other'
  data: string // base64
  uploadedAt: Date
  expirationDate?: string
  extractedData?: Record<string, string>
}

export interface HandwritingInfo {
  id: string
  name: string
  type: 'signature' | 'initials' | 'handwriting_sample' | 'custom'
  data: string // base64 image
  uploadedAt: Date
}

export interface CustomFieldInfo {
  key: string
  value: string
  type: 'text' | 'number' | 'date' | 'file' | 'url' | 'list' | 'json'
  fileData?: string // base64 if type is 'file'
  fileName?: string
}

export interface UserProfile {
  id: string
  createdAt: Date
  updatedAt: Date
  personal: PersonalInfo
  address: AddressInfo
  professional: ProfessionalInfo
  education: EducationEntry[]
  documents: DocumentInfo[]
  handwriting: HandwritingInfo[]
  customFields: Record<string, CustomFieldInfo>
  savedForms: SavedUploadedForm[]
  preferences: {
    autoFillEnabled: boolean
    rememberFormData: boolean
  }
}

// For saving uploaded forms for future editing
export interface SavedUploadedForm {
  id: string
  name: string
  originalFileName: string
  originalFileData: string // base64
  fileType: 'pdf' | 'image'
  generatedFormId?: string // Link to the generated form
  uploadedAt: Date
  lastEditedAt: Date
}

const defaultProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    gender: ''
  },
  address: {
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  },
  professional: {
    jobTitle: '',
    company: '',
    industry: '',
    department: '',
    yearsExperience: '',
    linkedIn: '',
    website: '',
    portfolio: ''
  },
  education: [],
  documents: [],
  handwriting: [],
  customFields: {},
  savedForms: [],
  preferences: {
    autoFillEnabled: true,
    rememberFormData: true
  }
}

interface ProfileState {
  profile: UserProfile | null
  isProfileModalOpen: boolean
  activeProfileTab: 'personal' | 'address' | 'professional' | 'education' | 'documents' | 'handwriting' | 'custom'
  
  // Actions
  initProfile: () => void
  updatePersonal: (data: Partial<PersonalInfo>) => void
  updateAddress: (data: Partial<AddressInfo>) => void
  updateProfessional: (data: Partial<ProfessionalInfo>) => void
  addEducation: (entry: Omit<EducationEntry, 'id'>) => void
  updateEducation: (id: string, data: Partial<EducationEntry>) => void
  removeEducation: (id: string) => void
  addDocument: (doc: Omit<DocumentInfo, 'id' | 'uploadedAt'>) => void
  updateDocument: (id: string, data: Partial<DocumentInfo>) => void
  removeDocument: (id: string) => void
  addHandwriting: (hw: Omit<HandwritingInfo, 'id' | 'uploadedAt'>) => void
  removeHandwriting: (id: string) => void
  setCustomField: (key: string, field: Omit<CustomFieldInfo, 'key'>) => void
  removeCustomField: (key: string) => void
  addSavedForm: (form: Omit<SavedUploadedForm, 'id' | 'uploadedAt' | 'lastEditedAt'>) => void
  updateSavedForm: (id: string, data: Partial<SavedUploadedForm>) => void
  removeSavedForm: (id: string) => void
  updatePreferences: (prefs: Partial<UserProfile['preferences']>) => void
  clearProfile: () => void
  openProfileModal: () => void
  closeProfileModal: () => void
  setActiveProfileTab: (tab: ProfileState['activeProfileTab']) => void
  
  // Auto-fill helpers
  getFieldValue: (fieldLabel: string, fieldType: string) => string | undefined
  getAutoFillSuggestions: (fields: { label: string; type: string }[]) => Record<string, string>
  getHandwriting: (type?: HandwritingInfo['type']) => HandwritingInfo | undefined
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isProfileModalOpen: false,
      activeProfileTab: 'personal',

      initProfile: () => {
        const existing = get().profile
        if (!existing) {
          set({
            profile: {
              ...defaultProfile,
              id: nanoid(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        } else {
          // Migrate existing profile to include any new fields from defaultProfile
          const migratedProfile = {
            ...existing,
            // Ensure arrays exist (schema migration)
            education: existing.education || [],
            documents: existing.documents || [],
            handwriting: existing.handwriting || [],
            customFields: existing.customFields || {},
            savedForms: existing.savedForms || [],
            preferences: existing.preferences || defaultProfile.preferences,
            updatedAt: new Date()
          }
          
          // Only update if migration was needed
          if (!existing.handwriting || !existing.savedForms || !existing.customFields) {
            set({ profile: migratedProfile })
          }
        }
      },

      updatePersonal: (data) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          personal: { ...state.profile.personal, ...data },
          updatedAt: new Date()
        } : null
      })),

      updateAddress: (data) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          address: { ...state.profile.address, ...data },
          updatedAt: new Date()
        } : null
      })),

      updateProfessional: (data) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          professional: { ...state.profile.professional, ...data },
          updatedAt: new Date()
        } : null
      })),

      addEducation: (entry) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          education: [...state.profile.education, { ...entry, id: nanoid() }],
          updatedAt: new Date()
        } : null
      })),

      updateEducation: (id, data) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          education: state.profile.education.map(e => e.id === id ? { ...e, ...data } : e),
          updatedAt: new Date()
        } : null
      })),

      removeEducation: (id) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          education: state.profile.education.filter(e => e.id !== id),
          updatedAt: new Date()
        } : null
      })),

      addDocument: (doc) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          documents: [...state.profile.documents, { ...doc, id: nanoid(), uploadedAt: new Date() }],
          updatedAt: new Date()
        } : null
      })),

      updateDocument: (id, data) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          documents: state.profile.documents.map(d => d.id === id ? { ...d, ...data } : d),
          updatedAt: new Date()
        } : null
      })),

      removeDocument: (id) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          documents: state.profile.documents.filter(d => d.id !== id),
          updatedAt: new Date()
        } : null
      })),

      addHandwriting: (hw) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          handwriting: [...state.profile.handwriting, { ...hw, id: nanoid(), uploadedAt: new Date() }],
          updatedAt: new Date()
        } : null
      })),

      removeHandwriting: (id) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          handwriting: state.profile.handwriting.filter(h => h.id !== id),
          updatedAt: new Date()
        } : null
      })),

      setCustomField: (key, field) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          customFields: { ...state.profile.customFields, [key]: { ...field, key } },
          updatedAt: new Date()
        } : null
      })),

      removeCustomField: (key) => set((state) => {
        if (!state.profile) return state
        const { [key]: _, ...rest } = state.profile.customFields
        return {
          profile: { ...state.profile, customFields: rest, updatedAt: new Date() }
        }
      }),

      addSavedForm: (form) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          savedForms: [...state.profile.savedForms, { ...form, id: nanoid(), uploadedAt: new Date(), lastEditedAt: new Date() }],
          updatedAt: new Date()
        } : null
      })),

      updateSavedForm: (id, data) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          savedForms: state.profile.savedForms.map(f => f.id === id ? { ...f, ...data, lastEditedAt: new Date() } : f),
          updatedAt: new Date()
        } : null
      })),

      removeSavedForm: (id) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          savedForms: state.profile.savedForms.filter(f => f.id !== id),
          updatedAt: new Date()
        } : null
      })),

      updatePreferences: (prefs) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          preferences: { ...state.profile.preferences, ...prefs },
          updatedAt: new Date()
        } : null
      })),

      clearProfile: () => set({ profile: null }),
      openProfileModal: () => set({ isProfileModalOpen: true }),
      closeProfileModal: () => set({ isProfileModalOpen: false }),
      setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),

      // Smart field matching for auto-fill
      getFieldValue: (fieldLabel, fieldType) => {
        const profile = get().profile
        if (!profile) return undefined
        
        const label = fieldLabel.toLowerCase().trim()
        const { personal, address, professional } = profile
        
        // Personal info matching
        if (label.includes('first') && label.includes('name')) return personal.firstName
        if (label.includes('last') && label.includes('name')) return personal.lastName
        if (label.includes('full') && label.includes('name')) return `${personal.firstName} ${personal.lastName}`.trim()
        if (label === 'name' || label === 'your name') return `${personal.firstName} ${personal.lastName}`.trim()
        if (label.includes('email') || fieldType === 'email') return personal.email
        if (label.includes('phone') || label.includes('mobile') || label.includes('tel') || fieldType === 'phone') return personal.phone
        if (label.includes('birth') || label.includes('dob')) return personal.dateOfBirth
        if (label.includes('national')) return personal.nationality
        if (label.includes('gender') || label.includes('sex')) return personal.gender
        
        // Address matching
        if (label.includes('street') || label.includes('address line 1')) return address.street
        if (label.includes('apt') || label.includes('apartment') || label.includes('suite') || label.includes('address line 2')) return address.apartment
        if (label.includes('city') || label.includes('town')) return address.city
        if (label.includes('state') || label.includes('province') || label.includes('region')) return address.state
        if (label.includes('zip') || label.includes('postal') || label.includes('postcode')) return address.postalCode
        if (label.includes('country')) return address.country
        if (label === 'address') return [address.street, address.apartment, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ')
        
        // Professional matching
        if (label.includes('job') || label.includes('title') || label.includes('position') || label.includes('role')) return professional.jobTitle
        if (label.includes('company') || label.includes('organization') || label.includes('employer')) return professional.company
        if (label.includes('industry') || label.includes('sector')) return professional.industry
        if (label.includes('department') || label.includes('team')) return professional.department
        if (label.includes('experience') || label.includes('years')) return professional.yearsExperience
        if (label.includes('linkedin')) return professional.linkedIn
        if (label.includes('website') || label.includes('url') || label.includes('portfolio')) return professional.website || professional.portfolio
        
        // Check custom fields (now using CustomFieldInfo)
        for (const [key, fieldInfo] of Object.entries(profile.customFields)) {
          if (label.includes(key.toLowerCase()) && fieldInfo.type === 'text') {
            return fieldInfo.value
          }
        }
        
        return undefined
      },

      getAutoFillSuggestions: (fields) => {
        const suggestions: Record<string, string> = {}
        const { getFieldValue } = get()
        
        for (const field of fields) {
          const value = getFieldValue(field.label, field.type)
          if (value) {
            suggestions[field.label] = value
          }
        }
        
        return suggestions
      },

      getHandwriting: (type) => {
        const profile = get().profile
        if (!profile || profile.handwriting.length === 0) return undefined
        
        if (type) {
          return profile.handwriting.find(h => h.type === type)
        }
        // Default to signature if available, otherwise first handwriting
        return profile.handwriting.find(h => h.type === 'signature') || profile.handwriting[0]
      }
    }),
    {
      name: 'revoforms-profile',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)

// Helper to get profile completeness percentage
export const getProfileCompleteness = (profile: UserProfile | null): number => {
  if (!profile) return 0
  
  const fields = [
    profile.personal.firstName,
    profile.personal.lastName,
    profile.personal.email,
    profile.personal.phone,
    profile.address.city,
    profile.address.country,
    profile.professional.jobTitle,
    profile.professional.company
  ]
  
  const filled = fields.filter(f => f && f.trim() !== '').length
  return Math.round((filled / fields.length) * 100)
}
