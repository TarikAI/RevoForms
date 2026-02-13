'use client'

import { ReactNode } from 'react'
import type { FormField, FormSettings } from '@/types/form'

interface FormLayoutProps {
  fields: FormField[]
  settings: FormSettings
  children: (field: FormField, index: number) => ReactNode
  className?: string
}

export function FormLayout({ fields, settings, children, className = '' }: FormLayoutProps) {
  const layout = settings.layout || { type: 'single', columns: 1 }
  const { type, columns = 1, gap = '4', responsive } = layout

  // Single column layout
  if (type === 'single' || columns === 1) {
    return (
      <div className={`space-y-${gap} ${className}`}>
        {fields.map((field, index) => (
          <div key={field.id}>{children(field, index)}</div>
        ))}
      </div>
    )
  }

  // Multi-column layout
  const getGridColumnClass = (field: FormField) => {
    if (field.columnSpan) {
      return `col-span-${Math.min(field.columnSpan, columns)}`
    }

    switch (field.width) {
      case 'quarter':
        return 'col-span-1'
      case 'third':
        return columns >= 3 ? 'col-span-1' : 'col-span-2'
      case 'half':
        return columns >= 2 ? `col-span-${Math.ceil(columns / 2)}` : 'col-span-full'
      case 'full':
      default:
        return 'col-span-full'
    }
  }

  const getResponsiveClasses = () => {
    if (!responsive) return ''

    const classes = []

    if (responsive.mobile && responsive.mobile !== columns) {
      classes.push(`grid-cols-${responsive.mobile}`)
    }

    if (responsive.tablet && responsive.tablet !== responsive.mobile) {
      classes.push(`md:grid-cols-${responsive.tablet}`)
    }

    if (responsive.desktop && responsive.desktop !== columns) {
      classes.push(`lg:grid-cols-${responsive.desktop}`)
    }

    return classes.join(' ')
  }

  const gridClass = type === 'grid'
    ? `grid grid-cols-${columns} gap-${gap} ${getResponsiveClasses()}`
    : `flex flex-wrap -m-${gap}`

  const flexWidthClass = (field: FormField) => {
    if (type !== 'grid') {
      switch (field.width) {
        case 'quarter':
          return `w-1/4 p-${gap}`
        case 'third':
          return `w-1/3 p-${gap}`
        case 'half':
          return `w-1/2 p-${gap}`
        case 'full':
        default:
          return `w-full p-${gap}`
      }
    }
    return ''
  }

  return (
    <div className={`${gridClass} ${className}`}>
      {fields.map((field, index) => {
        if (type === 'grid') {
          return (
            <div
              key={field.id}
              className={`${getGridColumnClass(field)} ${field.rowSpan ? `row-span-${field.rowSpan}` : ''}`}
            >
              {children(field, index)}
            </div>
          )
        } else {
          return (
            <div key={field.id} className={flexWidthClass(field)}>
              {children(field, index)}
            </div>
          )
        }
      })}
    </div>
  )
}

// Helper function to organize fields into rows for grid layout
export function organizeFieldsIntoRows(
  fields: FormField[],
  columns: number
): FormField[][] {
  const rows: FormField[][] = []
  let currentRow: FormField[] = []

  fields.forEach((field) => {
    const span = field.columnSpan || 1

    // Check if field fits in current row
    const currentSpan = currentRow.reduce(
      (total, f) => total + (f.columnSpan || 1),
      0
    )

    if (currentSpan + span > columns) {
      // Start new row
      if (currentRow.length > 0) {
        rows.push(currentRow)
      }
      currentRow = [field]
    } else {
      currentRow.push(field)
    }
  })

  // Add last row if not empty
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  return rows
}

// Layout preview component for form builder
export function LayoutPreview({
  layout,
  onLayoutChange
}: {
  layout: FormSettings['layout']
  onLayoutChange: (layout: FormSettings['layout']) => void
}) {
  const handleTypeChange = (type: 'single' | 'multi-column' | 'grid') => {
    onLayoutChange({
      ...layout,
      type,
      columns: type === 'single' ? 1 : layout?.columns || 2,
    })
  }

  const handleColumnsChange = (columns: number) => {
    onLayoutChange({
      ...layout,
      type: layout?.type || 'single',
      columns,
    })
  }

  const handleGapChange = (gap: string) => {
    onLayoutChange({
      ...layout,
      type: layout?.type || 'single',
      gap,
    })
  }

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
      <h3 className="text-lg font-semibold text-white">Form Layout</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Layout Type
          </label>
          <div className="flex gap-2">
            {[
              { value: 'single', label: 'Single Column' },
              { value: 'multi-column', label: 'Multi Column' },
              { value: 'grid', label: 'Grid' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleTypeChange(option.value as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  layout?.type === option.value
                    ? 'bg-neon-cyan text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {layout?.type !== 'single' && (
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Columns: {layout?.columns || 2}
            </label>
            <input
              type="range"
              min="2"
              max="12"
              value={layout?.columns || 2}
              onChange={(e) => handleColumnsChange(Number(e.target.value))}
              className="w-full accent-neon-cyan"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>2</span>
              <span>12</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Gap Between Fields
          </label>
          <select
            value={layout?.gap || '4'}
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

      {/* Preview */}
      <div className="mt-4 p-4 bg-black/30 rounded-lg">
        <p className="text-xs text-white/50 mb-2">Preview:</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${layout?.columns || 1}, 1fr)` }}>
          {Array.from({ length: Math.min(6, (layout?.columns || 1) * 2) }).map((_, i) => (
            <div
              key={i}
              className="h-8 bg-white/10 rounded border border-white/20"
            />
          ))}
        </div>
      </div>
    </div>
  )
}