import { useEffect, useCallback } from 'react'
import { useFormStore } from '@/store/formStore'

interface KeyboardShortcutsOptions {
  enabled?: boolean
}

/**
 * Keyboard shortcuts for the form builder canvas
 * 
 * Shortcuts:
 * - Ctrl/Cmd + D: Duplicate selected form
 * - Delete/Backspace: Delete selected form
 * - Ctrl/Cmd + S: Save (triggers persist)
 * - Ctrl/Cmd + Z: Undo (placeholder)
 * - Ctrl/Cmd + Shift + Z: Redo (placeholder)
 * - Escape: Deselect / Close modals
 * - Ctrl/Cmd + N: New form
 * - Ctrl/Cmd + E: Export selected form
 * - Ctrl/Cmd + P: Preview selected form
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { enabled = true } = options
  
  const {
    selectedFormId,
    duplicateForm,
    deleteForm,
    selectForm,
    addForm,
    openPreview,
    openExport
  } = useFormStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

    // Duplicate: Ctrl/Cmd + D
    if (cmdOrCtrl && e.key === 'd') {
      e.preventDefault()
      if (selectedFormId) {
        duplicateForm(selectedFormId)
      }
      return
    }

    // Delete: Delete or Backspace
    if ((e.key === 'Delete' || e.key === 'Backspace') && !cmdOrCtrl) {
      e.preventDefault()
      if (selectedFormId) {
        if (confirm('Delete this form?')) {
          deleteForm(selectedFormId)
        }
      }
      return
    }

    // Save: Ctrl/Cmd + S
    if (cmdOrCtrl && e.key === 's') {
      e.preventDefault()
      // Forms are auto-saved via Zustand persist, but we can trigger a manual save notification
      console.log('Forms saved!')
      return
    }

    // New Form: Ctrl/Cmd + N
    if (cmdOrCtrl && e.key === 'n') {
      e.preventDefault()
      addForm({
        name: 'New Form',
        description: '',
        fields: [],
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Thank you!',
          collectEmails: false
        },
        styling: {
          theme: 'modern-dark',
          colors: {
            primary: '#06b6d4',
            secondary: '#8b5cf6',
            background: '#0f0f1a',
            surface: '#1a1a2e',
            text: '#ffffff',
            textMuted: '#a0a0a0',
            border: '#333333',
            error: '#ef4444',
            success: '#22c55e',
            accent: '#06b6d4'
          },
          fontFamily: 'Inter',
          fontSize: { label: '14px', input: '14px', button: '14px', heading: '18px' },
          spacing: { fieldGap: '16px', padding: '20px' },
          borderRadius: { input: '8px', button: '8px', form: '12px' },
          shadows: true,
          animation: true
        },
        position: { x: 100, y: 100 },
        size: { width: 400, height: 500 }
      })
      return
    }

    // Preview: Ctrl/Cmd + P (when form selected)
    if (cmdOrCtrl && e.key === 'p') {
      e.preventDefault()
      if (selectedFormId) {
        openPreview(selectedFormId)
      }
      return
    }

    // Export: Ctrl/Cmd + E
    if (cmdOrCtrl && e.key === 'e') {
      e.preventDefault()
      if (selectedFormId) {
        openExport(selectedFormId)
      }
      return
    }

    // Escape: Deselect
    if (e.key === 'Escape') {
      selectForm(null as any)
      return
    }

    // Undo: Ctrl/Cmd + Z (placeholder)
    if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      console.log('Undo - not yet implemented')
      return
    }

    // Redo: Ctrl/Cmd + Shift + Z (placeholder)
    if (cmdOrCtrl && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      console.log('Redo - not yet implemented')
      return
    }
  }, [selectedFormId, duplicateForm, deleteForm, selectForm, addForm, openPreview, openExport])

  useEffect(() => {
    if (!enabled) return
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}

/**
 * Display keyboard shortcuts help
 */
export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'D'], action: 'Duplicate form', mac: ['⌘', 'D'] },
  { keys: ['Delete'], action: 'Delete form', mac: ['⌫'] },
  { keys: ['Ctrl', 'N'], action: 'New form', mac: ['⌘', 'N'] },
  { keys: ['Ctrl', 'P'], action: 'Preview form', mac: ['⌘', 'P'] },
  { keys: ['Ctrl', 'E'], action: 'Export form', mac: ['⌘', 'E'] },
  { keys: ['Ctrl', 'S'], action: 'Save', mac: ['⌘', 'S'] },
  { keys: ['Esc'], action: 'Deselect', mac: ['Esc'] },
]
