'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Copy, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import type { FormField, FieldType } from '@/types/form'

interface FieldPopupEditorProps {
  field: FormField
  position: { x: number; y: number }
  onUpdate: (updates: Partial<FormField>) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onClose: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

const FIELD_TYPE_OPTIONS: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'number', label: 'Number' },
  { type: 'url', label: 'URL' },
  { type: 'textarea', label: 'Text Area' },
  { type: 'select', label: 'Dropdown' },
  { type: 'radio', label: 'Radio Buttons' },
  { type: 'checkbox', label: 'Checkboxes' },
  { type: 'date', label: 'Date' },
  { type: 'time', label: 'Time' },
  { type: 'file', label: 'File Upload' },
  { type: 'rating', label: 'Rating' },
  { type: 'range', label: 'Slider' },
]

export function FieldPopupEditor({
  field, position, onUpdate, onDelete, onDuplicate,
  onMoveUp, onMoveDown, onClose, canMoveUp, canMoveDown
}: FieldPopupEditorProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<'basic' | 'options' | 'validation'>('basic')

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type)

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      style={{ left: position.x, top: position.y }}
      className="fixed z-50 w-72 bg-[#0f0f1a] border border-white/20 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/30" />
          <span className="text-sm text-white font-medium">Edit Field</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={!canMoveUp}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronUp className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronDown className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-white/10">
        {['basic', 'options', 'validation'].map((section) => (
          <button key={section} onClick={() => setActiveSection(section as any)}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wide transition-colors ${
              activeSection === section ? 'text-neon-cyan border-b border-neon-cyan' : 'text-white/40 hover:text-white/60'
            } ${section === 'options' && !hasOptions ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={section === 'options' && !hasOptions}>
            {section}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 max-h-64 overflow-y-auto space-y-3">
        {activeSection === 'basic' && (
          <>
            <div>
              <label className="block text-[10px] text-white/50 mb-1">Label</label>
              <input type="text" value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1">Field Type</label>
              <select value={field.type} onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
                className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none">
                {FIELD_TYPE_OPTIONS.map(opt => (
                  <option key={opt.type} value={opt.type}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1">Placeholder</label>
              <input type="text" value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1">Help Text</label>
              <input type="text" value={field.helpText || ''}
                onChange={(e) => onUpdate({ helpText: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 rounded accent-neon-cyan" />
              <span className="text-sm text-white/70">Required field</span>
            </label>
          </>
        )}

        {activeSection === 'options' && hasOptions && (
          <div>
            <label className="block text-[10px] text-white/50 mb-1">Options (one per line)</label>
            <textarea 
              value={(field.options || []).join('\n')}
              onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(o => o.trim()) })}
              rows={6}
              className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none resize-none font-mono"
              placeholder="Option 1&#10;Option 2&#10;Option 3" />
            <p className="text-[9px] text-white/30 mt-1">Enter each option on a new line</p>
          </div>
        )}

        {activeSection === 'validation' && (
          <>
            {['text', 'email', 'phone', 'url', 'textarea'].includes(field.type) && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">Min Length</label>
                    <input type="number" value={field.validation?.minLength || ''}
                      onChange={(e) => onUpdate({ validation: { ...field.validation, minLength: parseInt(e.target.value) || undefined } })}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">Max Length</label>
                    <input type="number" value={field.validation?.maxLength || ''}
                      onChange={(e) => onUpdate({ validation: { ...field.validation, maxLength: parseInt(e.target.value) || undefined } })}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 mb-1">Regex Pattern</label>
                  <input type="text" value={field.validation?.pattern || ''} placeholder="^[A-Za-z]+$"
                    onChange={(e) => onUpdate({ validation: { ...field.validation, pattern: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:border-neon-cyan/50 focus:outline-none" />
                </div>
              </>
            )}
            {['number', 'range'].includes(field.type) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/50 mb-1">Min Value</label>
                  <input type="number" value={field.validation?.min || ''}
                    onChange={(e) => onUpdate({ validation: { ...field.validation, min: parseFloat(e.target.value) || undefined } })}
                    className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 mb-1">Max Value</label>
                  <input type="number" value={field.validation?.max || ''}
                    onChange={(e) => onUpdate({ validation: { ...field.validation, max: parseFloat(e.target.value) || undefined } })}
                    className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[10px] text-white/50 mb-1">Error Message</label>
              <input type="text" value={field.validation?.message || ''} placeholder="Please enter a valid value"
                onChange={(e) => onUpdate({ validation: { ...field.validation, message: e.target.value } })}
                className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none" />
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-3 py-2 bg-white/5 border-t border-white/10 flex justify-between">
        <button onClick={onDuplicate}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors">
          <Copy className="w-3 h-3" /> Duplicate
        </button>
        <button onClick={onDelete}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors">
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </motion.div>
  )
}
