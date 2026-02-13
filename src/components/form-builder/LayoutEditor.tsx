'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layout, Columns, Plus, Minus, Grid3x3, List } from 'lucide-react'
import type { FormSettings, FormField } from '@/types/form'

interface LayoutEditorProps {
  settings: FormSettings
  fields: FormField[]
  onUpdateSettings: (settings: FormSettings) => void
  onFieldUpdate?: (fieldId: string, updates: Partial<FormField>) => void
}

export function LayoutEditor({ settings, fields, onUpdateSettings, onFieldUpdate }: LayoutEditorProps) {
  const layout = settings.layout || { type: 'single', columns: 1, gap: '4' }
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  const handleLayoutTypeChange = (type: 'single' | 'multi-column' | 'grid') => {
    onUpdateSettings({
      ...settings,
      layout: {
        ...layout,
        type,
        columns: type === 'single' ? 1 : layout.columns || 2,
      },
    })
  }

  const handleColumnsChange = (value: number) => {
    onUpdateSettings({
      ...settings,
      layout: {
        ...layout,
        columns: value,
      },
    })
  }

  const handleGapChange = (gap: string) => {
    onUpdateSettings({
      ...settings,
      layout: {
        ...layout,
        gap,
      },
    })
  }

  const handleResponsiveChange = (breakpoint: 'mobile' | 'tablet' | 'desktop', columns: number) => {
    onUpdateSettings({
      ...settings,
      layout: {
        ...layout,
        responsive: {
          mobile: layout.responsive?.mobile || 1,
          tablet: layout.responsive?.tablet || 2,
          desktop: layout.responsive?.desktop || 3,
          [breakpoint]: columns,
        },
      },
    })
  }

  const handleFieldWidthChange = (fieldId: string, width: FormField['width']) => {
    onFieldUpdate?.(fieldId, { width })
  }

  const handleFieldSpanChange = (fieldId: string, span: number) => {
    onFieldUpdate?.(fieldId, { columnSpan: span })
  }

  const getFieldPreviewStyle = (field: FormField) => {
    const width = field.width || 'full'
    const span = field.columnSpan || 1

    if (layout.type === 'grid') {
      return {
        gridColumn: `span ${Math.min(span, layout.columns || 1)}`,
      }
    }

    const widthMap = {
      full: '100%',
      half: '50%',
      third: '33.333%',
      quarter: '25%',
      custom: `${(span / (layout.columns || 1)) * 100}%`,
    }

    return {
      width: widthMap[width] || widthMap.full,
    }
  }

  return (
    <div className="space-y-6">
      {/* Layout Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Form Layout
        </h3>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: 'single', label: 'Single Column', icon: List },
            { value: 'multi-column', label: 'Multi Column', icon: Columns },
            { value: 'grid', label: 'Grid', icon: Grid3x3 },
          ].map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleLayoutTypeChange(option.value as any)}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  layout.type === option.value
                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Column Settings */}
      {layout.type !== 'single' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Number of Columns: {layout.columns}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleColumnsChange(Math.max(2, (layout.columns || 2) - 1))}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="2"
                max="12"
                value={layout.columns || 2}
                onChange={(e) => handleColumnsChange(Number(e.target.value))}
                className="flex-1 accent-neon-cyan"
              />
              <button
                onClick={() => handleColumnsChange(Math.min(12, (layout.columns || 2) + 1))}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Gap Between Fields
            </label>
            <select
              value={layout.gap || '4'}
              onChange={(e) => handleGapChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="2">Small</option>
              <option value="4">Medium</option>
              <option value="6">Large</option>
              <option value="8">Extra Large</option>
            </select>
          </div>
        </div>
      )}

      {/* Responsive Settings */}
      {layout.type !== 'single' && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white/80">Responsive Layout</h4>
          {[
            { breakpoint: 'mobile' as const, label: 'Mobile', max: 1 },
            { breakpoint: 'tablet' as const, label: 'Tablet', max: 6 },
            { breakpoint: 'desktop' as const, label: 'Desktop', max: 12 },
          ].map((bp) => (
            <div key={bp.breakpoint}>
              <label className="block text-xs text-white/60 mb-1">
                {bp.label}: {layout.responsive?.[bp.breakpoint] || 'auto'}
              </label>
              <input
                type="range"
                min="1"
                max={bp.max}
                value={layout.responsive?.[bp.breakpoint] || 1}
                onChange={(e) => handleResponsiveChange(bp.breakpoint, Number(e.target.value))}
                className="w-full accent-neon-cyan/50"
              />
            </div>
          ))}
        </div>
      )}

      {/* Field Width Settings */}
      {layout.type !== 'single' && fields.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white/80">Individual Field Widths</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {fields.filter(f => !['divider', 'heading', 'paragraph'].includes(f.type)).map((field) => (
              <div
                key={field.id}
                className={`p-3 bg-white/5 rounded-lg border cursor-pointer transition-all ${
                  selectedFieldId === field.id
                    ? 'border-neon-cyan'
                    : 'border-transparent hover:border-white/20'
                }`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">{field.label}</span>
                  <span className="text-xs text-white/50">{field.type}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={field.width || 'full'}
                    onChange={(e) => handleFieldWidthChange(field.id, e.target.value as FormField['width'])}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                  >
                    <option value="full">Full Width</option>
                    <option value="half">Half Width</option>
                    <option value="third">Third Width</option>
                    <option value="quarter">Quarter Width</option>
                  </select>

                  {layout.type === 'grid' && (
                    <>
                      <span className="text-xs text-white/50">Span:</span>
                      <input
                        type="number"
                        min="1"
                        max={layout.columns || 12}
                        value={field.columnSpan || 1}
                        onChange={(e) => handleFieldSpanChange(field.id, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white/80">Live Preview</h4>
        <div className="p-4 bg-black/30 rounded-xl border border-white/10">
          <div
            className={
              layout.type === 'grid'
                ? `grid gap-${layout.gap || 4}`
                : 'flex flex-wrap gap-2'
            }
            style={
              layout.type === 'grid'
                ? { gridTemplateColumns: `repeat(${layout.columns || 1}, 1fr)` }
                : undefined
            }
          >
            {fields.slice(0, 6).map((field, index) => (
              <motion.div
                key={field.id}
                layout
                style={getFieldPreviewStyle(field)}
                className="h-20 bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 rounded-lg border border-white/20 flex items-center justify-center"
              >
                <span className="text-xs text-white/60 truncate px-2">{field.label || field.type}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}