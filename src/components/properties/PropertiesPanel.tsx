'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Settings, Palette, List, Code,
  Trash2, GripVertical, Plus, X, Check, Copy, RotateCcw,
  Type, AlignLeft, Square, Circle
} from 'lucide-react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFormStore, useSelectedForm } from '@/store/formStore'
import { THEME_PRESETS, type ThemePreset, type FormField, type FieldType } from '@/types/form'
import { ThemeBuilder } from '@/components/theme/ThemeBuilder'

interface PropertiesPanelProps {
  isExpanded: boolean
  onToggle: () => void
}

type PanelTab = 'form' | 'fields' | 'style' | 'css'

const FIELD_ICONS: Record<string, string> = {
  text: '📝', email: '✉️', phone: '📱', number: '#️⃣', url: '🔗',
  textarea: '📄', select: '📋', multiselect: '☑️', radio: '🔘', checkbox: '☑️',
  date: '📅', time: '⏰', daterange: '📆', file: '📎', file_upload: '📁',
  rating: '⭐', range: '📊', signature: '✍️', matrix: '🔲',
  divider: '➖', heading: '📌', paragraph: '📃', html: '🌐',
  address: '🏠', country: '🌍', currency: '💰', payment: '💳',
  calculation: '🧮', password: '🔐', name: '👤', hidden: '🚫', pagebreak: '📄'
}

const THEME_NAMES: Record<ThemePreset, { emoji: string; label: string }> = {
  'modern-dark': { emoji: '🌙', label: 'Dark' },
  'modern-light': { emoji: '☀️', label: 'Light' }, 
  'minimal': { emoji: '⬜', label: 'Minimal' },
  'bold': { emoji: '🔥', label: 'Bold' },
  'corporate': { emoji: '💼', label: 'Corporate' },
  'playful': { emoji: '🎨', label: 'Playful' },
  'glassmorphism': { emoji: '✨', label: 'Glass' },
  'neon': { emoji: '💚', label: 'Neon' },
  'nature': { emoji: '🌿', label: 'Nature' },
  'ocean': { emoji: '🌊', label: 'Ocean' },
  'sunset': { emoji: '🌅', label: 'Sunset' },
  'custom': { emoji: '🎯', label: 'Custom' }
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'email', label: 'Email', icon: '✉️' },
  { type: 'phone', label: 'Phone', icon: '📱' },
  { type: 'number', label: 'Number', icon: '#️⃣' },
  { type: 'textarea', label: 'Text Area', icon: '📄' },
  { type: 'select', label: 'Dropdown', icon: '📋' },
  { type: 'multiselect', label: 'Multi Select', icon: '☑️' },
  { type: 'radio', label: 'Radio', icon: '🔘' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'time', label: 'Time', icon: '⏰' },
  { type: 'datetime', label: 'Date Time', icon: '📅' },
  { type: 'daterange', label: 'Date Range', icon: '📆' },
  { type: 'color', label: 'Color', icon: '🎨' },
  { type: 'richtext', label: 'Rich Text', icon: '📝' },
  { type: 'file', label: 'File', icon: '📎' },
  { type: 'file_upload', label: 'File Upload', icon: '📁' },
  { type: 'rating', label: 'Rating', icon: '⭐' },
  { type: 'range', label: 'Range Slider', icon: '📊' },
  { type: 'signature', label: 'Signature', icon: '✍️' },
  { type: 'matrix', label: 'Matrix', icon: '🔲' },
  { type: 'payment', label: 'Payment', icon: '💳' },
  { type: 'calculation', label: 'Calculation', icon: '🧮' },
  { type: 'url', label: 'URL', icon: '🔗' },
  { type: 'password', label: 'Password', icon: '🔐' },
  { type: 'divider', label: 'Divider', icon: '➖' },
  { type: 'heading', label: 'Heading', icon: '📌' },
  { type: 'paragraph', label: 'Paragraph', icon: '📃' },
  { type: 'html', label: 'HTML', icon: '🌐' },
  { type: 'address', label: 'Address', icon: '🏠' },
  { type: 'country', label: 'Country', icon: '🌍' },
  { type: 'currency', label: 'Currency', icon: '💰' },
  { type: 'name', label: 'Name', icon: '👤' },
]

// Default styling values
const DEFAULT_COLORS = {
  primary: '#06b6d4', secondary: '#a855f7', background: 'rgba(15, 15, 26, 0.8)',
  surface: 'rgba(255, 255, 255, 0.05)', text: '#ffffff', textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.1)', error: '#f87171', success: '#4ade80', accent: '#a855f7'
}

const DEFAULT_BORDER_RADIUS = { input: '12px', button: '12px', form: '20px' }
const DEFAULT_FONT_SIZE = { label: '14px', input: '16px', button: '16px', heading: '24px' }
const DEFAULT_SPACING = { fieldGap: '20px', padding: '24px' }

// Sortable Field Item Component
function SortableFieldItem({ 
  field, isEditing, onEdit, onDelete, onUpdate 
}: { 
  field: FormField; isEditing: boolean; onEdit: () => void
  onDelete: () => void; onUpdate: (updates: Partial<FormField>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 100 : 'auto' }

  return (
    <div ref={setNodeRef} style={style}
      className={`p-2.5 rounded-lg border transition-colors ${isDragging ? 'bg-neon-cyan/20 border-neon-cyan/50 shadow-lg' : isEditing ? 'bg-neon-cyan/10 border-neon-cyan/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <span className="text-base">{FIELD_ICONS[field.type] || '📝'}</span>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <p className="text-sm text-white truncate">{field.label}</p>
          <p className="text-[10px] text-white/40">{field.type}{field.required ? ' • Required' : ''}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-1 hover:bg-red-500/20 rounded text-white/30 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mt-2 pt-2 border-t border-white/10 space-y-2">
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Label</label>
              <input type="text" value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-neon-cyan/50" />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Placeholder</label>
              <input type="text" value={field.placeholder || ''} onChange={(e) => onUpdate({ placeholder: e.target.value })} onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-neon-cyan/50" />
            </div>
            {['select', 'radio', 'checkbox'].includes(field.type) && (
              <div>
                <label className="block text-[10px] text-white/50 mb-0.5">Options (one per line)</label>
                <textarea value={(field.options || []).join('\n')} onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(o => o.trim()) })}
                  onClick={(e) => e.stopPropagation()} rows={3}
                  className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-neon-cyan/50 resize-none" />
              </div>
            )}
            <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={field.required} onChange={(e) => onUpdate({ required: e.target.checked })} className="w-3 h-3 rounded" />
              Required field
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Main Properties Panel Component
export function PropertiesPanel({ isExpanded, onToggle }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('form')
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [showAddField, setShowAddField] = useState(false)
  const [copiedCSS, setCopiedCSS] = useState(false)
  const [cssHeight, setCssHeight] = useState(120)
  const [showThemeBuilder, setShowThemeBuilder] = useState(false)
  
  const { updateForm, updateField, removeField } = useFormStore()
  const selectedForm = useSelectedForm()

  // Safe accessors for styling properties
  const colors = selectedForm?.styling?.colors || DEFAULT_COLORS
  const borderRadius = selectedForm?.styling?.borderRadius || DEFAULT_BORDER_RADIUS
  const fontSize = selectedForm?.styling?.fontSize || DEFAULT_FONT_SIZE
  const spacing = selectedForm?.styling?.spacing || DEFAULT_SPACING
  const currentTheme = selectedForm?.styling?.theme || 'glassmorphism'

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!selectedForm || !over || active.id === over.id) return
    const oldIndex = selectedForm.fields.findIndex(f => f.id === active.id)
    const newIndex = selectedForm.fields.findIndex(f => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      const newFields = arrayMove(selectedForm.fields, oldIndex, newIndex)
      updateForm(selectedForm.id, { fields: newFields })
    }
  }, [selectedForm, updateForm])

  const handleAddField = useCallback((type: FieldType) => {
    if (!selectedForm) return
    const newField: FormField = {
      id: `f_${Date.now()}`, type, required: false, placeholder: '',
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    }
    updateForm(selectedForm.id, { fields: [...selectedForm.fields, newField] })
    setShowAddField(false)
    setEditingFieldId(newField.id)
  }, [selectedForm, updateForm])

  // Apply theme preset
  const handleThemeChange = useCallback((theme: ThemePreset) => {
    if (!selectedForm) return
    const preset = THEME_PRESETS[theme]
    if (preset) {
      updateForm(selectedForm.id, { 
        styling: { ...selectedForm.styling, theme, ...preset } 
      })
    }
  }, [selectedForm, updateForm])

  // Apply color change IMMEDIATELY
  const handleColorChange = useCallback((key: string, value: string) => {
    if (!selectedForm) return
    updateForm(selectedForm.id, {
      styling: { 
        ...selectedForm.styling, 
        theme: 'custom', // Switch to custom when manually editing colors
        colors: { ...colors, [key]: value } 
      }
    })
  }, [selectedForm, updateForm, colors])

  // Apply border radius change
  const handleBorderRadiusChange = useCallback((key: string, value: number) => {
    if (!selectedForm) return
    updateForm(selectedForm.id, {
      styling: { ...selectedForm.styling, borderRadius: { ...borderRadius, [key]: `${value}px` } }
    })
  }, [selectedForm, updateForm, borderRadius])

  // Apply font size change
  const handleFontSizeChange = useCallback((key: string, value: number) => {
    if (!selectedForm) return
    updateForm(selectedForm.id, {
      styling: { ...selectedForm.styling, fontSize: { ...fontSize, [key]: `${value}px` } }
    })
  }, [selectedForm, updateForm, fontSize])

  // Apply spacing change
  const handleSpacingChange = useCallback((key: string, value: number) => {
    if (!selectedForm) return
    updateForm(selectedForm.id, {
      styling: { ...selectedForm.styling, spacing: { ...spacing, [key]: `${value}px` } }
    })
  }, [selectedForm, updateForm, spacing])

  const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<FormField>) => {
    if (!selectedForm) return
    updateField(selectedForm.id, fieldId, updates)
  }, [selectedForm, updateField])

  const tabs = [
    { id: 'form' as const, label: 'Form', icon: Settings },
    { id: 'fields' as const, label: 'Fields', icon: List },
    { id: 'style' as const, label: 'Style', icon: Palette },
    { id: 'css' as const, label: 'CSS', icon: Code },
  ]

  // Form Tab
  const renderFormTab = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-1">Form Name</label>
        <input type="text" value={selectedForm?.name || ''} onChange={(e) => selectedForm && updateForm(selectedForm.id, { name: e.target.value })}
          className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-1">Description</label>
        <textarea value={selectedForm?.description || ''} onChange={(e) => selectedForm && updateForm(selectedForm.id, { description: e.target.value })} rows={2}
          className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none focus:border-neon-cyan/50 focus:outline-none" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-1">Submit Button</label>
        <input type="text" value={selectedForm?.settings?.submitButtonText || ''} 
          onChange={(e) => selectedForm && updateForm(selectedForm.id, { settings: { ...selectedForm.settings, submitButtonText: e.target.value } })}
          className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-1">Success Message</label>
        <textarea value={selectedForm?.settings?.successMessage || ''} rows={2}
          onChange={(e) => selectedForm && updateForm(selectedForm.id, { settings: { ...selectedForm.settings, successMessage: e.target.value } })}
          className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none focus:border-neon-cyan/50 focus:outline-none" />
      </div>
    </div>
  )

  // Fields Tab with DnD
  const renderFieldsTab = () => (
    <div className="space-y-2">
      <div className="relative">
        <button onClick={() => setShowAddField(!showAddField)}
          className={`w-full py-2 text-xs rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${showAddField ? 'bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
          {showAddField ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAddField ? 'Cancel' : 'Add Field'}
        </button>
        <AnimatePresence>
          {showAddField && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
              <div className="grid grid-cols-2 gap-1 p-2 bg-black/30 rounded-lg border border-white/10">
                {FIELD_TYPES.map(({ type, label, icon }) => (
                  <button key={type} onClick={() => handleAddField(type)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] bg-white/5 hover:bg-neon-cyan/20 rounded text-white/70 hover:text-white transition-colors">
                    <span>{icon}</span><span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {selectedForm?.fields.length === 0 ? (
        <div className="text-center py-6 text-white/40">
          <List className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
          <p className="text-xs">No fields yet</p>
          <p className="text-[10px] mt-0.5">Click "Add Field" or ask AI</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedForm?.fields.map(f => f.id) || []} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {selectedForm?.fields.map((field) => (
                <SortableFieldItem key={field.id} field={field} isEditing={editingFieldId === field.id}
                  onEdit={() => setEditingFieldId(editingFieldId === field.id ? null : field.id)}
                  onDelete={() => removeField(selectedForm.id, field.id)}
                  onUpdate={(updates) => handleFieldUpdate(field.id, updates)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )

  // Improved Style Tab
  const renderStyleTab = () => {
    if (showThemeBuilder && selectedForm?.styling) {
      return (
        <ThemeBuilder
          theme={selectedForm.styling}
          onChange={(newTheme) => updateForm(selectedForm.id, { styling: newTheme })}
        />
      )
    }

    return (
      <div className="space-y-4">
        {/* Theme Presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-medium text-white/60">Theme Preset</label>
            <button
              onClick={() => setShowThemeBuilder(!showThemeBuilder)}
              className="px-2 py-1 text-[9px] bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded transition-colors flex items-center gap-1"
            >
              <Palette className="w-3 h-3" />
              Advanced
            </button>
          </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(THEME_NAMES) as ThemePreset[]).map(theme => (
            <button key={theme} onClick={() => handleThemeChange(theme)}
              className={`px-2 py-1.5 text-[9px] rounded-lg transition-all flex items-center gap-1 ${currentTheme === theme ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 shadow-lg shadow-neon-cyan/20' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}>
              <span>{THEME_NAMES[theme].emoji}</span>
              <span className="truncate">{THEME_NAMES[theme].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Pickers - Improved with visual feedback */}
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-2">Colors</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'primary', label: 'Primary' },
            { key: 'secondary', label: 'Secondary' },
            { key: 'background', label: 'Background' },
            { key: 'text', label: 'Text' },
            { key: 'border', label: 'Border' },
            { key: 'accent', label: 'Accent' },
          ].map(({ key, label }) => {
            const colorValue = colors[key as keyof typeof colors] || '#ffffff'
            const isRgba = colorValue.includes('rgba')
            return (
              <div key={key} className="flex items-center gap-2 p-1.5 bg-white/5 rounded-lg border border-white/10">
                <div className="relative">
                  <input type="color" 
                    value={isRgba ? '#ffffff' : colorValue}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white/20 overflow-hidden"
                    style={{ backgroundColor: colorValue }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/70">{label}</p>
                  <input type="text" value={colorValue}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-full bg-transparent text-[9px] text-white/50 font-mono focus:outline-none focus:text-white"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-2">Typography</label>
        <div className="space-y-2">
          {[
            { key: 'label', label: 'Labels', icon: Type },
            { key: 'input', label: 'Inputs', icon: AlignLeft },
            { key: 'button', label: 'Button', icon: Square },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] text-white/60 w-12">{label}</span>
              <input type="range" min="10" max="24" value={parseInt(fontSize[key as keyof typeof fontSize] || '14')}
                onChange={(e) => handleFontSizeChange(key, parseInt(e.target.value))}
                className="flex-1 accent-neon-cyan h-1" />
              <span className="text-[9px] text-white/40 w-8">{fontSize[key as keyof typeof fontSize] || '14px'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-2">Corners</label>
        <div className="space-y-2">
          {['input', 'button', 'form'].map(key => (
            <div key={key} className="flex items-center gap-2">
              <Circle className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] text-white/60 w-12 capitalize">{key}</span>
              <input type="range" min="0" max="24" value={parseInt(borderRadius[key as keyof typeof borderRadius] || '12')}
                onChange={(e) => handleBorderRadiusChange(key, parseInt(e.target.value))}
                className="flex-1 accent-neon-cyan h-1" />
              <span className="text-[9px] text-white/40 w-8">{borderRadius[key as keyof typeof borderRadius] || '12px'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <label className="block text-[10px] font-medium text-white/60 mb-2">Spacing</label>
        <div className="space-y-2">
          {[
            { key: 'fieldGap', label: 'Field Gap' },
            { key: 'padding', label: 'Padding' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-white/60 w-16">{label}</span>
              <input type="range" min="8" max="40" value={parseInt(spacing[key as keyof typeof spacing] || '20')}
                onChange={(e) => handleSpacingChange(key, parseInt(e.target.value))}
                className="flex-1 accent-neon-cyan h-1" />
              <span className="text-[9px] text-white/40 w-8">{spacing[key as keyof typeof spacing] || '20px'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    )
  }

  // Improved CSS Tab with visual options
  const renderCSSTab = () => {
    const generateCSS = () => {
      if (!selectedForm?.styling) return '/* No form selected */'
      const s = selectedForm.styling
      const c = s.colors || DEFAULT_COLORS
      const br = s.borderRadius || DEFAULT_BORDER_RADIUS
      const fs = s.fontSize || DEFAULT_FONT_SIZE
      const sp = s.spacing || DEFAULT_SPACING

      return `/* RevoForms Generated CSS */
.revoform {
  background: ${c.background};
  padding: ${sp.padding};
  border-radius: ${br.form};
  font-family: ${s.fontFamily || 'Inter, sans-serif'};
}

.revoform label {
  color: ${c.text};
  font-size: ${fs.label};
  margin-bottom: 6px;
  display: block;
}

.revoform input,
.revoform textarea,
.revoform select {
  width: 100%;
  background: ${c.surface};
  border: 1px solid ${c.border};
  border-radius: ${br.input};
  color: ${c.text};
  font-size: ${fs.input};
  padding: 12px 16px;
}

.revoform input:focus,
.revoform textarea:focus,
.revoform select:focus {
  outline: none;
  border-color: ${c.primary};
  box-shadow: 0 0 0 3px ${c.primary}33;
}

.revoform button[type="submit"] {
  background: linear-gradient(135deg, ${c.primary}, ${c.secondary});
  border-radius: ${br.button};
  color: white;
  font-size: ${fs.button};
  font-weight: 600;
  padding: 14px 28px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.revoform button[type="submit"]:hover {
  opacity: 0.9;
}

.revoform .field-error {
  color: ${c.error};
  font-size: 12px;
  margin-top: 4px;
}`
    }

    const handleCopyCSS = () => {
      navigator.clipboard.writeText(generateCSS())
      setCopiedCSS(true)
      setTimeout(() => setCopiedCSS(false), 2000)
    }

    return (
      <div className="space-y-3">
        {/* Quick CSS Toggles */}
        <div>
          <label className="block text-[10px] font-medium text-white/60 mb-2">Quick Styles</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
              <input type="checkbox" checked={selectedForm?.styling?.shadows ?? true}
                onChange={(e) => selectedForm && updateForm(selectedForm.id, { styling: { ...selectedForm.styling, shadows: e.target.checked } })}
                className="w-3 h-3 rounded accent-neon-cyan" />
              <span className="text-[10px] text-white/70">Shadows</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
              <input type="checkbox" checked={selectedForm?.styling?.animation ?? true}
                onChange={(e) => selectedForm && updateForm(selectedForm.id, { styling: { ...selectedForm.styling, animation: e.target.checked } })}
                className="w-3 h-3 rounded accent-neon-cyan" />
              <span className="text-[10px] text-white/70">Animations</span>
            </label>
          </div>
        </div>

        {/* Generated CSS Preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-medium text-white/60">Generated CSS</label>
            <button onClick={handleCopyCSS}
              className="text-[10px] text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1 transition-colors">
              {copiedCSS ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedCSS ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-2 bg-black/50 border border-white/10 rounded-lg text-[9px] text-white/60 font-mono overflow-auto max-h-40 scrollbar-thin">
            {generateCSS()}
          </pre>
        </div>

        {/* Custom CSS Override - Resizable */}
        <div>
          <label className="block text-[10px] font-medium text-white/60 mb-1">Custom CSS Override</label>
          <textarea
            value={selectedForm?.styling?.customCSS || ''}
            onChange={(e) => selectedForm && updateForm(selectedForm.id, { styling: { ...selectedForm.styling, customCSS: e.target.value } })}
            placeholder={`/* Target form elements with these classes:
.revoform-input { background: #333; }
.revoform-select { border-color: red; }
.revoform-textarea { min-height: 100px; }
.revoform-submit { background: blue !important; }
.revoform-label { color: gold; }
.revoform-rating .revoform-star { font-size: 30px; }
*/`}
            style={{ height: cssHeight, minHeight: 80 }}
            onMouseDown={(e) => {
              const startY = e.clientY
              const startHeight = cssHeight
              const onMouseMove = (e: MouseEvent) => setCssHeight(Math.max(80, startHeight + e.clientY - startY))
              const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
              document.addEventListener('mousemove', onMouseMove)
              document.addEventListener('mouseup', onMouseUp)
            }}
            className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-[10px] text-white font-mono focus:outline-none focus:border-neon-cyan/50 resize-y cursor-ns-resize"
          />
          <p className="text-[9px] text-white/30 mt-1">Drag bottom edge to resize</p>
        </div>

        {/* Reset Button */}
        <button onClick={() => selectedForm && handleThemeChange('glassmorphism')}
          className="w-full py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white flex items-center justify-center gap-1.5 transition-colors">
          <RotateCcw className="w-3 h-3" /> Reset to Default
        </button>
      </div>
    )
  }

  // Main Render
  return (
    <motion.div initial={false} animate={{ width: isExpanded ? 280 : 44 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative h-full bg-space-light/50 backdrop-blur-xl border-r border-white/10 flex flex-col z-20">
      
      {/* Toggle Button */}
      <button onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-6 h-10 bg-space-light border border-white/10 rounded-r-lg flex items-center justify-center hover:bg-white/10 transition-colors">
        {isExpanded ? <ChevronLeft className="w-3.5 h-3.5 text-white/70" /> : <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
      </button>

      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-2.5 border-b border-white/10">
              <h2 className="text-xs font-semibold text-white">Properties</h2>
              {selectedForm ? (
                <p className="text-[10px] text-white/50 truncate">{selectedForm.name}</p>
              ) : (
                <p className="text-[10px] text-white/40">No form selected</p>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex-1 py-1.5 text-[10px] transition-colors ${activeTab === id ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' : 'text-white/50 hover:text-white/80'}`}>
                  <Icon className="w-3 h-3 mx-auto mb-0.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2.5 scrollbar-thin">
              {!selectedForm ? (
                <div className="text-center py-6 text-white/40">
                  <Settings className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs">Select a form</p>
                  <p className="text-[10px] mt-0.5">to edit properties</p>
                </div>
              ) : (
                <>
                  {activeTab === 'form' && renderFormTab()}
                  {activeTab === 'fields' && renderFieldsTab()}
                  {activeTab === 'style' && renderStyleTab()}
                  {activeTab === 'css' && renderCSSTab()}
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-3 gap-2">
            {tabs.map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => { onToggle(); setActiveTab(id) }}
                className={`p-1.5 rounded-lg transition-colors ${activeTab === id ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-white/50 hover:bg-white/10'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
