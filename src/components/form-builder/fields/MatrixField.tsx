'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, X, Check, Minus } from 'lucide-react'

interface MatrixFieldProps {
  field: any
  value?: Record<string, any>
  onChange?: (value: Record<string, any>) => void
  error?: string
  disabled?: boolean
}

export function MatrixField({ field, value = {}, onChange, error, disabled }: MatrixFieldProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  const rows = field.rows || []
  const columns = field.columns || []
  const allowMultiple = field.allowMultiple || false
  const matrixType = field.matrixType || 'radio' // radio, checkbox, rating, text

  const handleCellChange = (rowId: string, columnId: string, cellValue: any) => {
    const newValue = { ...value }

    if (matrixType === 'radio' || !allowMultiple) {
      // Single selection per row
      newValue[rowId] = columnId
    } else if (matrixType === 'checkbox') {
      // Multiple selections per row
      if (!newValue[rowId]) newValue[rowId] = []
      if (cellValue) {
        newValue[rowId] = [...new Set([...newValue[rowId], columnId])]
      } else {
        newValue[rowId] = newValue[rowId].filter((id: string) => id !== columnId)
      }
    } else if (matrixType === 'rating') {
      // Rating selection
      newValue[rowId] = cellValue
    } else if (matrixType === 'text') {
      // Text input
      newValue[rowId] = { ...newValue[rowId], [columnId]: cellValue }
    }

    onChange?.(newValue)
  }

  const getCellChecked = (rowId: string, columnId: string) => {
    if (matrixType === 'radio' || !allowMultiple) {
      return value[rowId] === columnId
    } else if (matrixType === 'checkbox') {
      return value[rowId]?.includes(columnId) || false
    } else if (matrixType === 'text') {
      return value[rowId]?.[columnId] || ''
    }
    return false
  }

  const renderCell = (rowId: string, column: any) => {
    const cellKey = `${rowId}-${column.id}`
    const isChecked = getCellChecked(rowId, column.id)

    if (matrixType === 'text') {
      return (
        <input
          type="text"
          value={isChecked}
          onChange={(e) => handleCellChange(rowId, column.id, e.target.value)}
          disabled={disabled}
          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-neon-cyan/50 disabled:opacity-50"
          placeholder="..."
        />
      )
    }

    if (matrixType === 'rating') {
      const icons = column.icons || ['😞', '😐', '🙂', '😊', '😄']
      const iconIndex = isChecked || 0

      return (
        <button
          type="button"
          onClick={() => handleCellChange(rowId, column.id, column.value || iconIndex)}
          disabled={disabled}
          className="text-2xl hover:scale-110 transition-transform disabled:opacity-50"
        >
          {icons[iconIndex] || icons[0]}
        </button>
      )
    }

    if (allowMultiple || matrixType === 'checkbox') {
      return (
        <button
          type="button"
          onClick={() => handleCellChange(rowId, column.id, !isChecked)}
          disabled={disabled}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isChecked
              ? 'bg-neon-cyan border-neon-cyan'
              : 'border-white/40 hover:border-white/60'
          } disabled:opacity-50`}
        >
          {isChecked && <Check className="w-3 h-3 text-black" />}
        </button>
      )
    }

    // Radio button style
    return (
      <button
        type="button"
        onClick={() => handleCellChange(rowId, column.id, column.value || column.id)}
        disabled={disabled}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isChecked
            ? 'border-neon-cyan'
            : 'border-white/40 hover:border-white/60'
        } disabled:opacity-50`}
      >
        {isChecked && (
          <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan" />
        )}
      </button>
    )
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/90">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {field.helpText && (
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-white/50 cursor-help" />
            <div className="absolute right-0 bottom-6 w-64 p-3 bg-black/90 border border-white/20 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <p className="text-xs text-white/80">{field.helpText}</p>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-white/70 border-b border-white/10">
                {/* Empty corner cell */}
              </th>
              {columns.map((column: any) => (
                <th
                  key={column.id}
                  className="py-3 px-4 text-sm font-medium text-white/70 text-center border-b border-white/10"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, rowIndex: number) => (
              <tr
                key={row.id}
                className="group hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-white/80 border-b border-white/5">
                  {row.label}
                  {row.required && <span className="text-red-400 ml-1">*</span>}
                </td>
                {columns.map((column: any) => {
                  const cellKey = `${row.id}-${column.id}`
                  const isHovered = hoveredCell === cellKey

                  return (
                    <td
                      key={column.id}
                      className="py-3 px-4 border-b border-white/5"
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className="flex justify-center items-center min-h-[40px]">
                        {renderCell(row.id, column)}
                      </div>
                      {matrixType !== 'text' && column.description && isHovered && (
                        <div className="absolute z-10 px-2 py-1 mt-1 text-xs text-white bg-black/80 rounded whitespace-nowrap">
                          {column.description}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matrix type indicator */}
      <div className="flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-4">
          <span>Type: {matrixType}</span>
          {allowMultiple && <span>• Multiple selections allowed</span>}
        </div>
        {matrixType === 'rating' && (
          <span>Click to rate each row</span>
        )}
        {matrixType === 'text' && (
          <span>Type your response in each cell</span>
        )}
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-400"
        >
          <X className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Summary of selections */}
      {Object.keys(value).length > 0 && matrixType !== 'text' && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-white/60 mb-2">Summary:</p>
          <div className="space-y-1">
            {rows.map((row: any) => {
              const selection = value[row.id]
              if (!selection) return null

              if (Array.isArray(selection)) {
                const selectedColumns = columns
                  .filter((c: any) => selection.includes(c.id))
                  .map((c: any) => c.label)
                return (
                  <div key={row.id} className="text-xs text-white/80">
                    <span className="font-medium">{row.label}:</span> {selectedColumns.join(', ')}
                  </div>
                )
              } else {
                const selectedColumn = columns.find((c: any) => c.id === selection)
                return (
                  <div key={row.id} className="text-xs text-white/80">
                    <span className="font-medium">{row.label}:</span> {selectedColumn?.label || selection}
                  </div>
                )
              }
            })}
          </div>
        </div>
      )}
    </div>
  )
}