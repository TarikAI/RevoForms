import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { CanvasForm, FormField } from '@/types/form'

// Default Glass styling that will be applied to all new forms
export const DEFAULT_GLASS_STYLING = {
  theme: 'glass',
  colors: {
    primary: '#06b6d4',
    secondary: '#a855f7',
    background: 'rgba(15, 15, 26, 0.8)',
    surface: 'rgba(255, 255, 255, 0.05)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    accent: '#06b6d4',
    error: '#ef4444',
    success: '#22c55e',
  },
  borderRadius: { input: 12, button: 12, form: 20 },
  fontSize: { label: 14, input: 16, button: 16, heading: 24 },
  spacing: { fieldGap: 20, padding: 24 },
}

// Calculate viewport center for form placement - IMPROVED VERSION
const getViewportCenter = (existingForms: CanvasForm[] = []): { x: number; y: number } => {
  if (typeof window === 'undefined') return { x: 400, y: 200 }
  
  // UI element dimensions
  const propertiesWidth = 280 // Left properties panel
  const sidebarWidth = 380   // Right sidebar when expanded  
  const headerHeight = 56    // Top header
  const formWidth = 420      // Default form width
  const formHeight = 500     // Default form height
  
  const totalWidth = window.innerWidth
  const totalHeight = window.innerHeight
  
  // Calculate the visible canvas area (between panels)
  const canvasStartX = propertiesWidth
  const canvasEndX = totalWidth - sidebarWidth
  const canvasWidth = Math.max(canvasEndX - canvasStartX, 400) // Minimum 400px
  const canvasHeight = Math.max(totalHeight - headerHeight, 400)
  
  // Center position in canvas area - ensure form is fully visible
  let x = canvasStartX + (canvasWidth / 2) - (formWidth / 2)
  let y = headerHeight + (canvasHeight / 2) - (formHeight / 2)
  
  // Clamp to reasonable bounds
  x = Math.max(propertiesWidth + 30, Math.min(x, canvasEndX - formWidth - 30))
  y = Math.max(headerHeight + 30, Math.min(y, totalHeight - formHeight - 30))
  
  // If there are existing forms, offset to avoid overlap
  if (existingForms.length > 0) {
    const offset = (existingForms.length % 5) * 50
    x += offset
    y += offset
    // Re-clamp after offset
    x = Math.max(propertiesWidth + 30, x)
    y = Math.max(headerHeight + 30, y)
  }
  
  return { x: Math.round(x), y: Math.round(y) }
}

interface FormState {
  forms: CanvasForm[]
  selectedFormId: string | null
  selectedFieldId: string | null
  previewFormId: string | null
  exportFormId: string | null
  propertiesPanelOpen: boolean
  propertiesPanelWidth: number
  canvasFocusTarget: { formId: string; timestamp: number } | null
  _hasHydrated: boolean

  // Actions
  addForm: (form: Omit<CanvasForm, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateForm: (id: string, updates: Partial<CanvasForm>) => void
  deleteForm: (id: string) => void
  selectForm: (id: string | null) => void
  selectField: (fieldId: string | null) => void
  addField: (formId: string, field: Omit<FormField, 'id'>) => void
  updateField: (formId: string, fieldId: string, updates: Partial<FormField>) => void
  removeField: (formId: string, fieldId: string) => void
  reorderFields: (formId: string, fromIndex: number, toIndex: number) => void
  updateFormPosition: (formId: string, position: { x: number; y: number }) => void
  openPreview: (formId: string) => void
  closePreview: () => void
  openExport: (formId: string) => void
  closeExport: () => void
  togglePropertiesPanel: () => void
  setPropertiesPanelWidth: (width: number) => void
  focusOnForm: (formId: string) => void
  clearFocusTarget: () => void
  setHasHydrated: (state: boolean) => void
  centerFormInView: (formId: string) => void
  duplicateForm: (formId: string) => string | null
}

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      forms: [],
      selectedFormId: null,
      selectedFieldId: null,
      previewFormId: null,
      exportFormId: null,
      propertiesPanelOpen: true,
      propertiesPanelWidth: 300,
      canvasFocusTarget: null,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addForm: (form) => {
        const id = nanoid()
        const existingForms = get().forms
        // Apply default glass styling if no styling provided
        const styling = form.styling || DEFAULT_GLASS_STYLING
        // Center form in viewport if no position specified
        const position = form.position || getViewportCenter(existingForms)
        const newForm: CanvasForm = { 
          ...form, 
          id, 
          styling, 
          position, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
        set((state) => ({ 
          forms: [...state.forms, newForm], 
          selectedFormId: id,
          // Auto-focus on new form
          canvasFocusTarget: { formId: id, timestamp: Date.now() }
        }))
        return id
      },

      updateForm: (id, updates) => {
        set((state) => ({
          forms: state.forms.map((form) => 
            form.id === id ? { ...form, ...updates, updatedAt: new Date() } : form
          ),
        }))
      },

      deleteForm: (id) => {
        set((state) => ({
          forms: state.forms.filter((form) => form.id !== id),
          selectedFormId: state.selectedFormId === id ? null : state.selectedFormId,
        }))
      },

      selectForm: (id) => set({ selectedFormId: id, selectedFieldId: null }),
      selectField: (fieldId) => set({ selectedFieldId: fieldId }),

      addField: (formId, field) => {
        const fieldId = nanoid()
        set((state) => ({
          forms: state.forms.map((form) =>
            form.id === formId 
              ? { ...form, fields: [...form.fields, { ...field, id: fieldId }], updatedAt: new Date() } 
              : form
          ),
        }))
      },

      updateField: (formId, fieldId, updates) => {
        set((state) => ({
          forms: state.forms.map((form) =>
            form.id === formId 
              ? { ...form, fields: form.fields.map((f) => f.id === fieldId ? { ...f, ...updates } : f), updatedAt: new Date() } 
              : form
          ),
        }))
      },

      removeField: (formId, fieldId) => {
        set((state) => ({
          forms: state.forms.map((form) =>
            form.id === formId 
              ? { ...form, fields: form.fields.filter((f) => f.id !== fieldId), updatedAt: new Date() } 
              : form
          ),
          selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
        }))
      },

      reorderFields: (formId, fromIndex, toIndex) => {
        set((state) => ({
          forms: state.forms.map((form) => {
            if (form.id !== formId) return form
            const fields = [...form.fields]
            const [removed] = fields.splice(fromIndex, 1)
            fields.splice(toIndex, 0, removed)
            return { ...form, fields, updatedAt: new Date() }
          }),
        }))
      },

      updateFormPosition: (formId, position) => {
        set((state) => ({ 
          forms: state.forms.map((form) => 
            form.id === formId ? { ...form, position } : form
          ) 
        }))
      },

      openPreview: (formId) => set({ previewFormId: formId }),
      closePreview: () => set({ previewFormId: null }),
      openExport: (formId) => set({ exportFormId: formId }),
      closeExport: () => set({ exportFormId: null }),
      togglePropertiesPanel: () => set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
      setPropertiesPanelWidth: (width) => set({ propertiesPanelWidth: width }),
      
      focusOnForm: (formId) => set({ 
        canvasFocusTarget: { formId, timestamp: Date.now() }, 
        selectedFormId: formId 
      }),
      
      clearFocusTarget: () => set({ canvasFocusTarget: null }),
      
      // New: Center a specific form in view
      centerFormInView: (formId) => {
        const form = get().forms.find(f => f.id === formId)
        if (form) {
          const centerPos = getViewportCenter([])
          set((state) => ({
            forms: state.forms.map(f => 
              f.id === formId ? { ...f, position: centerPos } : f
            ),
            canvasFocusTarget: { formId, timestamp: Date.now() }
          }))
        }
      },

      // Duplicate a form with all its fields
      duplicateForm: (formId) => {
        const form = get().forms.find(f => f.id === formId)
        if (!form) return null
        
        const newId = nanoid()
        const existingForms = get().forms
        const newPosition = getViewportCenter(existingForms)
        
        const duplicatedForm: CanvasForm = {
          ...form,
          id: newId,
          name: `${form.name} (Copy)`,
          position: { 
            x: newPosition.x + 50, 
            y: newPosition.y + 50 
          },
          fields: form.fields.map(field => ({
            ...field,
            id: nanoid()
          })),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        set((state) => ({
          forms: [...state.forms, duplicatedForm],
          selectedFormId: newId,
          canvasFocusTarget: { formId: newId, timestamp: Date.now() }
        }))
        
        return newId
      },
    }),
    {
      name: 'revoforms-forms',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ forms: state.forms }),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true) },
    }
  )
)

// Selector helpers
export const useSelectedForm = () => {
  const forms = useFormStore((state) => state.forms)
  const selectedFormId = useFormStore((state) => state.selectedFormId)
  return forms.find((f) => f.id === selectedFormId) || null
}

export const usePreviewForm = () => {
  const forms = useFormStore((state) => state.forms)
  const previewFormId = useFormStore((state) => state.previewFormId)
  return forms.find((f) => f.id === previewFormId) || null
}

export const useExportForm = () => {
  const forms = useFormStore((state) => state.forms)
  const exportFormId = useFormStore((state) => state.exportFormId)
  return forms.find((f) => f.id === exportFormId) || null
}

// Hydration hook
export const useFormStoreHydration = () => useFormStore((state) => state._hasHydrated)
