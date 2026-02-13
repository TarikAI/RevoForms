'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Trash2, Eye, Download, Copy, MoreVertical, GripHorizontal, Settings, FolderPlus } from 'lucide-react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CanvasForm, FormField } from '@/types/form'
import { useFormStore } from '@/store/formStore'
import { useProjectStore } from '@/store/projectStore'
import { FieldPopupEditor } from './FieldPopupEditor'
import { RichTextField } from './fields/RichTextField'
import { AddressAutocompleteField } from './fields/AddressAutocompleteField'
import { EnhancedRangeField } from './fields/EnhancedRangeField'
import { EnhancedFileField } from './fields/EnhancedFileField'
import { CalculationField } from './fields/CalculationField'
import { FormProjectModal } from '@/components/projects/FormProjectModal'

interface FormCardProps {
  form: CanvasForm
  zoom: number
  onPositionChange: (pos: { x: number; y: number }) => void
  onDoubleClick?: () => void
}

function normalizeOption(opt: string | { value: string; label: string }, index: number) {
  if (typeof opt === 'string') return { key: `opt-${index}-${opt}`, value: opt, label: opt }
  return { key: `opt-${index}-${opt.value}`, value: opt.value, label: opt.label }
}

// Draggable Field Wrapper
function DraggableField({ field, children, onEdit, isSelected }: { 
  field: FormField; children: React.ReactNode; onEdit: (e: React.MouseEvent) => void; isSelected: boolean 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 100 : 'auto' }

  return (
    <div ref={setNodeRef} style={style}
      className={`relative group ${isDragging ? 'ring-2 ring-neon-cyan/50 rounded-lg' : ''} ${isSelected ? 'ring-2 ring-neon-purple/50 rounded-lg' : ''}`}>
      <div className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button {...attributes} {...listeners} className="p-1 bg-white/10 hover:bg-white/20 rounded cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3 text-white/60" />
        </button>
        <button onClick={onEdit} className="p-1 bg-white/10 hover:bg-neon-cyan/30 rounded">
          <Settings className="w-3 h-3 text-white/60" />
        </button>
      </div>
      {children}
    </div>
  )
}

export function FormCard({ form, zoom, onPositionChange, onDoubleClick }: FormCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [ratingHover, setRatingHover] = useState<Record<string, number>>({})
  const [editingField, setEditingField] = useState<{ field: FormField; position: { x: number; y: number } } | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [formSize, setFormSize] = useState({ width: form.size?.width || 380 })
  const [isResizing, setIsResizing] = useState(false)

  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, isDragging: false })
  const resizeRef = useRef({ startX: 0, startWidth: 380 })
  const positionRef = useRef({ x: form.position.x, y: form.position.y })

  const { selectForm, deleteForm, selectedFormId, openPreview, openExport, updateForm, updateField, removeField } = useFormStore()
  const projects = useProjectStore((state) => state.projects)
  const isSelected = selectedFormId === form.id

  // Get current project of this form
  const currentProject = projects.find(p => p.formIds.includes(form.id))

  // Initialize form data from defaultValues
  useEffect(() => {
    const initialData: Record<string, any> = {}
    form.fields.forEach(field => {
      if (field.defaultValue !== undefined) initialData[field.id] = field.defaultValue
    })
    if (Object.keys(initialData).length > 0) setFormData(prev => ({ ...initialData, ...prev }))
  }, [form.fields])

  // Sync position ref when form position changes externally
  useEffect(() => {
    positionRef.current = { x: form.position.x, y: form.position.y }
  }, [form.position.x, form.position.y])

  // DnD sensors for field reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Field reorder handler
  const handleFieldDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = form.fields.findIndex(f => f.id === active.id)
    const newIndex = form.fields.findIndex(f => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) updateForm(form.id, { fields: arrayMove(form.fields, oldIndex, newIndex) })
  }, [form.fields, form.id, updateForm])

  const handleChange = (fieldId: string, value: any) => setFormData(prev => ({ ...prev, [fieldId]: value }))
  
  const handleCheckboxChange = (fieldId: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const current = prev[fieldId] || []
      return checked ? { ...prev, [fieldId]: [...current, value] } : { ...prev, [fieldId]: current.filter((v: string) => v !== value) }
    })
  }

  // Field editing
  const handleFieldEdit = (field: FormField, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setEditingField({ field, position: { x: Math.min(rect.right + 10, window.innerWidth - 300), y: Math.min(rect.top, window.innerHeight - 350) } })
    setSelectedFieldId(field.id)
  }

  const handleFieldUpdate = (updates: Partial<FormField>) => {
    if (editingField) {
      updateField(form.id, editingField.field.id, updates)
      setEditingField({ ...editingField, field: { ...editingField.field, ...updates } })
    }
  }

  const handleFieldDelete = () => { if (editingField) { removeField(form.id, editingField.field.id); setEditingField(null); setSelectedFieldId(null) } }
  
  const handleFieldDuplicate = () => {
    if (editingField) {
      const newField = { ...editingField.field, id: `f_${Date.now()}`, label: `${editingField.field.label} (Copy)` }
      const idx = form.fields.findIndex(f => f.id === editingField.field.id)
      const newFields = [...form.fields]; newFields.splice(idx + 1, 0, newField)
      updateForm(form.id, { fields: newFields }); setEditingField(null)
    }
  }

  const handleFieldMove = (dir: 'up' | 'down') => {
    if (!editingField) return
    const idx = form.fields.findIndex(f => f.id === editingField.field.id)
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx >= 0 && newIdx < form.fields.length) updateForm(form.id, { fields: arrayMove(form.fields, idx, newIdx) })
  }

  // Smooth form dragging with document-level listeners
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragRef.current.startX) / zoom
      const dy = (e.clientY - dragRef.current.startY) / zoom
      // No grid snapping during drag for maximum smoothness
      const newX = dragRef.current.startPosX + dx
      const newY = dragRef.current.startPosY + dy
      
      if (Math.abs(newX - positionRef.current.x) > 0.5 || Math.abs(newY - positionRef.current.y) > 0.5) {
        positionRef.current = { x: newX, y: newY }
        onPositionChange({ x: Math.round(newX), y: Math.round(newY) })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // Snap to 10px grid on release
      const snappedX = Math.round(positionRef.current.x / 10) * 10
      const snappedY = Math.round(positionRef.current.y / 10) * 10
      onPositionChange({ x: snappedX, y: snappedY })
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, zoom, onPositionChange])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: form.position.x, startPosY: form.position.y, isDragging: true }
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    }
  }, [form.position])

  // Resize handling
  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizeRef.current.startX) / zoom
      setFormSize({ width: Math.max(280, Math.min(700, resizeRef.current.startWidth + dx)) })
    }
    const onUp = () => { setIsResizing(false); document.body.style.cursor = ''; updateForm(form.id, { size: { width: formSize.width, height: 'auto' } }) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isResizing, zoom, form.id, formSize.width, updateForm])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    resizeRef.current = { startX: e.clientX, startWidth: formSize.width }
    document.body.style.cursor = 'ew-resize'
  }

  const renderField = (field: FormField) => {
    // Base classes with targetable revoform- classes for custom CSS
    const inputClass = "revoform-input w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:border-neon-cyan/50 focus:outline-none transition-colors"
    const selectClass = "revoform-select w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none transition-colors"
    const textareaClass = "revoform-textarea w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:border-neon-cyan/50 focus:outline-none transition-colors resize-none"
    const radioClass = "revoform-radio w-4 h-4 accent-neon-cyan"
    const checkboxClass = "revoform-checkbox w-4 h-4 rounded accent-neon-cyan"
    const labelClass = "revoform-option-label text-sm text-white/80"
    
    const options = field.options || []
    const value = formData[field.id] ?? field.defaultValue ?? ''

    switch (field.type) {
      case 'text': case 'email': case 'phone': case 'url': case 'password':
        return <input type={field.type === 'phone' ? 'tel' : field.type} placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={inputClass} />
      case 'number':
        return <input type="number" placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={inputClass} />
      case 'textarea':
        return <textarea placeholder={field.placeholder} rows={field.rows || 3} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={textareaClass} />
      case 'select':
        return (
          <select value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={selectClass}>
            <option value="">{field.placeholder || 'Select...'}</option>
            {options.map((opt, i) => { const o = normalizeOption(opt, i); return <option key={o.key} value={o.value}>{o.label}</option> })}
          </select>
        )
      case 'radio':
        return (
          <div className="revoform-radio-group space-y-2">
            {options.map((opt, i) => { const o = normalizeOption(opt, i); return (
              <label key={o.key} className="revoform-option flex items-center gap-2 cursor-pointer"><input type="radio" name={field.id} value={o.value} checked={value === o.value} onChange={(e) => handleChange(field.id, e.target.value)} className={radioClass} /><span className={labelClass}>{o.label}</span></label>
            )})}
          </div>
        )
      case 'checkbox':
        return (
          <div className="revoform-checkbox-group space-y-2">
            {options.map((opt, i) => { const o = normalizeOption(opt, i); const checked = (formData[field.id] || []).includes(o.value); return (
              <label key={o.key} className="revoform-option flex items-center gap-2 cursor-pointer"><input type="checkbox" value={o.value} checked={checked} onChange={(e) => handleCheckboxChange(field.id, o.value, e.target.checked)} className={checkboxClass} /><span className={labelClass}>{o.label}</span></label>
            )})}
          </div>
        )
      case 'date': return <input type="date" value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
      case 'time': return <input type="time" value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={inputClass} />
      case 'file': return <input type="file" accept={field.accept} multiple={field.multiple} className={`revoform-file ${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-neon-cyan/20 file:text-neon-cyan file:text-sm`} />
      case 'rating':
        const maxStars = field.maxStars || 5; const currentRating = value || 0; const hoverRating = ratingHover[field.id] || 0
        return (
          <div className="revoform-rating flex gap-1">
            {Array.from({ length: maxStars }).map((_, i) => (
              <button key={i} type="button" onClick={() => handleChange(field.id, i + 1)} onMouseEnter={() => setRatingHover(p => ({ ...p, [field.id]: i + 1 }))} onMouseLeave={() => setRatingHover(p => ({ ...p, [field.id]: 0 }))}
                className={`revoform-star text-2xl transition-colors ${i < (hoverRating || currentRating) ? 'text-yellow-400' : 'text-white/20'}`}>★</button>
            ))}
          </div>
        )
      case 'range':
        return (
          <div className="revoform-range flex items-center gap-3">
            <input type="range" min={field.validation?.min || 0} max={field.validation?.max || 100} value={value || 50} onChange={(e) => handleChange(field.id, e.target.value)} className="revoform-slider flex-1 accent-neon-cyan" />
            <span className="revoform-range-value text-sm text-white/60 w-10 text-right">{value || 50}</span>
          </div>
        )
      case 'signature':
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-white/60 text-center">Signature Field</p>
          </div>
        )
      case 'matrix':
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-white/60 text-center">Matrix Field ({(field.rows as any) || 0}x{(field.columns as any) || 0})</p>
          </div>
        )
      case 'daterange':
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-white/60 text-center">Date Range Field</p>
          </div>
        )
      case 'color':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border-2 border-white/20" style={{ backgroundColor: value || '#000000' }} />
            <input type="text" value={value || '#000000'} onChange={(e) => handleChange(field.id, e.target.value)} className={`${inputClass} font-mono`} placeholder="#000000" />
          </div>
        )
      case 'richtext':
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-white/60 text-center">Rich Text Editor</p>
          </div>
        )

      case 'calculation':
        return (
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/60">Calculation: </p>
              <p className="text-lg font-bold text-green-400">0.00</p>
            </div>
          </div>
        )
      case 'address':
        return (
          <div className="space-y-2">
            <input type="text" placeholder="Street Address" className={inputClass} />
            <div className="flex gap-2">
              <input type="text" placeholder="City" className={`${inputClass} flex-1`} />
              <input type="text" placeholder="State" className={`${inputClass} w-24`} />
              <input type="text" placeholder="ZIP" className={`${inputClass} w-24`} />
            </div>
          </div>
        )
      case 'file_upload':
        return <input type="file" accept={field.accept} multiple={field.multiple} className={`revoform-file ${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-neon-cyan/20 file:text-neon-cyan file:text-sm`} />
      case 'country':
        return (
          <select value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={selectClass}>
            <option value="">Select country...</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
          </select>
        )
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">{field.currency || '$'}</span>
            <input type="number" step="0.01" placeholder="0.00" value={value || ''} onChange={(e) => handleChange(field.id, e.target.value)} className={`${inputClass} pl-8`} />
          </div>
        )
      case 'payment':
        return (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-sm text-white/60 text-center">Payment Field</p>
          </div>
        )
      case 'name':
        return <input type="text" placeholder="Full Name" value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={inputClass} />
      case 'datetime':
        return <input type="datetime-local" value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: field.content || '' }} className="text-sm text-white/70" />
      case 'pagebreak':
        return <div className="border-t-2 border-dashed border-white/20 my-4" />
      case 'divider': return <hr className="revoform-divider border-white/20" />
      case 'heading': const Tag = field.headingLevel || 'h3'; return <Tag className="revoform-heading text-lg font-semibold text-white">{field.label}</Tag>
      case 'paragraph': return <p className="revoform-paragraph text-sm text-white/70">{field.content || field.label}</p>
      default: return <input type="text" placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} className={inputClass} />
    }
  }

  const styling = form.styling || {}
  const colors = styling.colors || {}
  const borderRadius = styling.borderRadius || {}
  const basePadding = styling.spacing?.padding || 16
  const paddingValue = typeof basePadding === 'string' ? parseInt(basePadding) || 16 : basePadding
  const customCSS = styling.customCSS || ''

  // Generate unique class for this form
  const formClassName = `revoform revoform-${form.id}`

  return (
    <>
      {/* Inject Custom CSS */}
      {customCSS && (
        <style dangerouslySetInnerHTML={{ 
          __html: customCSS
            .replace(/\.revoform\s/g, `.revoform-${form.id} `)
            .replace(/\.revoform{/g, `.revoform-${form.id}{`)
            .replace(/\.revoform:/g, `.revoform-${form.id}:`)
        }} />
      )}
      <div
        style={{ left: form.position.x, top: form.position.y, width: formSize.width }}
        className={`absolute select-none ${formClassName} ${isDragging ? 'z-50 cursor-grabbing' : 'z-10'}`}
        onMouseDown={handleDragStart}
        onClick={() => selectForm(form.id)}
        onDoubleClick={onDoubleClick}
      >
        <div className={`relative rounded-2xl overflow-hidden transition-shadow ${isSelected ? 'ring-2 ring-neon-cyan shadow-lg shadow-neon-cyan/20' : 'ring-1 ring-white/10'}`}
          style={{ background: colors.background || 'rgba(15, 15, 26, 0.9)', borderRadius: borderRadius.form || '20px' }}>
          
          {/* Header */}
          <div className="drag-handle px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-white/30" />
              <h3 className="text-sm font-medium text-white truncate max-w-[180px]">{form.name}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); openPreview(form.id) }} className="p-1.5 hover:bg-white/10 rounded-lg" title="Preview"><Eye className="w-4 h-4 text-white/50" /></button>
              <button onClick={(e) => { e.stopPropagation(); openExport(form.id) }} className="p-1.5 hover:bg-white/10 rounded-lg" title="Export"><Download className="w-4 h-4 text-white/50" /></button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }} className="p-1.5 hover:bg-white/10 rounded-lg"><MoreVertical className="w-4 h-4 text-white/50" /></button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 py-1 w-44 bg-[#0f0f1a] border border-white/10 rounded-lg shadow-xl z-50">
                    <button onClick={(e) => { e.stopPropagation(); setShowProjectModal(true); setShowMenu(false) }} className="w-full px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 flex items-center gap-2">
                      <FolderPlus className="w-3 h-3" />
                      {currentProject ? `Project: ${currentProject.name}` : 'Add to Project'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(form)); setShowMenu(false) }} className="w-full px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 flex items-center gap-2"><Copy className="w-3 h-3" /> Duplicate</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteForm(form.id); setShowMenu(false) }} className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body with DnD fields - using individual padding properties to avoid conflict */}
          <div className="revoform-body space-y-4" style={{ paddingTop: paddingValue, paddingRight: paddingValue, paddingBottom: paddingValue, paddingLeft: 32 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
              <SortableContext items={form.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {form.fields.map((field) => (
                  <DraggableField key={field.id} field={field} isSelected={selectedFieldId === field.id} onEdit={(e) => handleFieldEdit(field, e)}>
                    <div className="revoform-field space-y-1">
                      {!['divider', 'heading', 'paragraph'].includes(field.type) && (
                        <label className="revoform-label block text-sm font-medium" style={{ color: colors.text || '#ffffff' }}>
                          {field.label}{field.required && <span className="revoform-required text-red-400 ml-1">*</span>}
                        </label>
                      )}
                      {renderField(field)}
                      {field.helpText && <p className="revoform-help text-xs text-white/40">{field.helpText}</p>}
                    </div>
                  </DraggableField>
                ))}
              </SortableContext>
            </DndContext>

            {form.fields.length === 0 && (
              <div className="py-8 text-center text-white/30"><p className="text-sm">No fields yet</p><p className="text-xs mt-1">Use AI chat or Properties panel</p></div>
            )}

            {form.fields.length > 0 && (
              <button type="button" className="revoform-submit w-full py-3 font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${colors.primary || '#06b6d4'}, ${colors.secondary || '#a855f7'})`, borderRadius: borderRadius.button || '12px' }}>
                {form.settings?.submitButtonText || 'Submit'}
              </button>
            )}
          </div>

          {/* Resize Handle */}
          <div onMouseDown={handleResizeStart} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-neon-cyan/20 transition-colors group">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-full group-hover:bg-neon-cyan/50" />
          </div>
        </div>

        {isResizing && <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 rounded text-[10px] text-white/60">{Math.round(formSize.width)}px</div>}
      </div>

      {/* Field Popup Editor */}
      <AnimatePresence>
        {editingField && (
          <FieldPopupEditor field={editingField.field} position={editingField.position}
            onUpdate={handleFieldUpdate} onDelete={handleFieldDelete} onDuplicate={handleFieldDuplicate}
            onMoveUp={() => handleFieldMove('up')} onMoveDown={() => handleFieldMove('down')}
            onClose={() => { setEditingField(null); setSelectedFieldId(null) }}
            canMoveUp={form.fields.findIndex(f => f.id === editingField.field.id) > 0}
            canMoveDown={form.fields.findIndex(f => f.id === editingField.field.id) < form.fields.length - 1} />
        )}
      </AnimatePresence>

      {/* Form Project Modal */}
      <FormProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        formId={form.id}
      />
    </>
  )
}
