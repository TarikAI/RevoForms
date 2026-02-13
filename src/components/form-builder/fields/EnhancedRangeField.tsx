'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Volume1, VolumeX, Zap, Target, TrendingUp, Info } from 'lucide-react'

interface EnhancedRangeFieldProps {
  field: any
  value?: number | number[]
  onChange?: (value: number | number[]) => void
  error?: string
  disabled?: boolean
}

interface RangeMark {
  value: number
  label?: string
  description?: string
  color?: string
}

export function EnhancedRangeField({ field, value = field.defaultValue || 50, onChange, error, disabled }: EnhancedRangeFieldProps) {
  const [currentValue, setCurrentValue] = useState<number | number[]>(value)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredMark, setHoveredMark] = useState<number | null>(null)
  const rangeRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const {
    min = 0,
    max = 100,
    step = 1,
    showValue = true,
    showTooltip = true,
    showMarks = true,
    showLabels = true,
    showScale = false,
    vertical = false,
    inverted = false,
    color = 'neon-cyan',
    size = 'md', // sm, md, lg
    marks = [],
    marksList = [] as RangeMark[],
    enableSnap = false,
    showPercentage = false,
    prefix = '',
    suffix = '',
    icons = [], // Array of icons to show at different positions
    transitionColors = false, // Change color based on value
    threshold = [], // Array of {value: number, color: string, label: string}
    dualHandle = false, // For range selection
    valueIndicator = 'tooltip' // tooltip, label, bubble, none
  } = field

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  const getPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100
  }

  const getColor = (val: number) => {
    if (transitionColors && threshold.length > 0) {
      const activeThreshold = threshold
        .filter((t: any) => val >= t.value)
        .sort((a: any, b: any) => b.value - a.value)[0]
      return activeThreshold?.color || color
    }
    return color
  }

  const getGradient = () => {
    if (!transitionColors || threshold.length === 0) return null

    const sortedThresholds = [...threshold].sort((a, b) => a.value - b.value)
    const gradientStops = sortedThresholds.map(t => {
      const percentage = getPercentage(t.value)
      return `${t.color} ${percentage}%`
    })

    return `linear-gradient(to right, ${gradientStops.join(', ')})`
  }

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const percentage = vertical
      ? 1 - ((e.clientY - rect.top) / rect.height)
      : ((e.clientX - rect.left) / rect.width)

    let newValue = min + (percentage * (max - min))

    if (enableSnap && marks.length > 0) {
      const nearestMark = marks.reduce((prev: number, curr: number) => {
        return Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev
      })
      newValue = nearestMark
    } else {
      newValue = Math.round(newValue / step) * step
    }

    newValue = Math.max(min, Math.min(max, newValue))

    if (inverted) {
      newValue = max + min - newValue
    }

    setCurrentValue(newValue)
    onChange?.(newValue)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return
    handleTrackClick(e as any)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const renderMark = (mark: number | RangeMark, index: number) => {
    const markValue = typeof mark === 'number' ? mark : mark.value
    const markLabel = typeof mark === 'object' ? mark.label : undefined
    const markColor = typeof mark === 'object' ? mark.color : undefined
    const percentage = getPercentage(markValue)

    return (
      <div
        key={index}
        className={`absolute ${vertical ? 'bottom-[var(--position)]' : 'left-[var(--position)]'} -translate-x-1/2`}
        style={{ '--position': `${percentage}%` } as any}
      >
        <div
          className={`w-3 h-3 rounded-full border-2 border-white/20 ${
            markColor ? 'bg-[var(--color)]' : 'bg-white/40'
          }`}
          style={{ '--color': markColor } as any}
        />
        {showLabels && markLabel && (
          <div className={`absolute ${vertical ? 'left-full ml-2 top-1/2 -translate-y-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'} text-xs text-white/60 whitespace-nowrap`}>
            {markLabel}
          </div>
        )}
      </div>
    )
  }

  const renderIcon = (icon: any, position: number, index: number) => {
    const percentage = getPercentage(position)
    const Icon = icon.component

    return (
      <div
        key={index}
        className={`absolute ${vertical ? 'bottom-[var(--position)]' : 'left-[var(--position)]'} -translate-x-1/2 -translate-y-1/2`}
        style={{ '--position': `${percentage}%` } as any}
      >
        <div
          className={`p-1 rounded-lg ${icon.color ? 'text-[var(--color)]' : 'text-white/40'}`}
          style={{ '--color': icon.color } as any}
          title={icon.label || ''}
        >
          <Icon className="w-3 h-3" />
        </div>
      </div>
    )
  }

  const getValueDisplay = () => {
    const val = Array.isArray(currentValue) ? currentValue[0] : currentValue
    let display = `${prefix}${val}${suffix}`

    if (showPercentage) {
      display += ` (${Math.round(getPercentage(val))}%)`
    }

    if (transitionColors && threshold.length > 0) {
      const activeThreshold = threshold
        .filter((t: any) => val >= t.value)
        .sort((a: any, b: any) => b.value - a.value)[0]
      if (activeThreshold?.label) {
        display += ` - ${activeThreshold.label}`
      }
    }

    return display
  }

  const getSizeClasses = () => {
    const sizeClasses: Record<string, string> = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    }
    return sizeClasses[size] || sizeClasses.md
  }

  const currentColor = Array.isArray(currentValue) ? color : getColor(currentValue)

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-sm font-medium text-white/90">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className={`${vertical ? 'flex justify-center' : ''}`}>
        <div
          ref={rangeRef}
          className={`relative ${vertical ? 'h-48 w-8' : 'w-full'} ${getSizeClasses()} bg-white/10 rounded-full overflow-hidden cursor-pointer`}
          onClick={handleTrackClick}
          onMouseDown={handleMouseDown}
        >
          {/* Gradient Background for Transitions */}
          {transitionColors && getGradient() && (
            <div
              className="absolute inset-0"
              style={{ background: getGradient() || undefined }}
            />
          )}

          {/* Track */}
          <div
            ref={trackRef}
            className={`absolute inset-0 ${!transitionColors ? `bg-${currentColor}/20` : ''} rounded-full`}
          />

          {/* Progress Fill */}
          <motion.div
            className={`absolute ${vertical ? 'bottom-0 left-0 right-0' : 'top-0 left-0 bottom-0'} bg-${currentColor} rounded-full`}
            style={{
              [vertical ? 'height' : 'width']: `${getPercentage(Array.isArray(currentValue) ? currentValue[0] : currentValue)}%`,
              backgroundColor: `rgb(var(--${currentColor}-rgb))`
            }}
            animate={{ [vertical ? 'height' : 'width']: `${getPercentage(Array.isArray(currentValue) ? currentValue[0] : currentValue)}%` }}
            transition={{ duration: 0.2 }}
          />

          {/* Marks */}
          {showMarks && marks.map(renderMark)}
          {showMarks && marksList.map(renderMark)}

          {/* Icons */}
          {icons.map(renderIcon)}

          {/* Handle */}
          <motion.div
            className={`absolute ${vertical ? 'left-1/2 -translate-x-1/2 -translate-y-1/2' : 'top-1/2 -translate-y-1/2 -translate-x-1/2'} w-4 h-4 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing border-2 border-${currentColor}`}
            style={{
              [vertical ? 'bottom' : 'left']: `${getPercentage(Array.isArray(currentValue) ? currentValue[0] : currentValue)}%`,
              borderColor: `rgb(var(--${currentColor}-rgb))`
            }}
            animate={{ [vertical ? 'bottom' : 'left']: `${getPercentage(Array.isArray(currentValue) ? currentValue[0] : currentValue)}%` }}
            transition={{ duration: 0.2 }}
            whileTap={{ scale: 1.2 }}
          />

          {/* Tooltip */}
          {showTooltip && !disabled && (
            <motion.div
              className={`absolute ${vertical ? 'left-full ml-2' : 'top-full mt-4 left-1/2 -translate-x-1/2'} px-3 py-1 bg-${currentColor} text-white text-sm rounded-lg shadow-lg pointer-events-none whitespace-nowrap`}
              animate={{ opacity: isDragging ? 1 : 0 }}
              style={{ [vertical ? 'left' : 'top']: isDragging ? '100%' : '110%', backgroundColor: `rgb(var(--${currentColor}-rgb))` }}
            >
              {getValueDisplay()}
            </motion.div>
          )}
        </div>
      </div>

      {/* Value Display */}
      {showValue && (
        <div className="text-center">
          <div className={`text-2xl font-bold text-${currentColor}`}>
            {getValueDisplay()}
          </div>
          {showScale && (
            <div className="flex justify-between text-xs text-white/40 mt-2">
              <span>{min}</span>
              <span>{Math.round((max + min) / 2)}</span>
              <span>{max}</span>
            </div>
          )}
        </div>
      )}

      {/* Range Display for Dual Handle */}
      {dualHandle && Array.isArray(currentValue) && (
        <div className="flex justify-between text-sm text-white/60">
          <span>Min: {prefix}{currentValue[0]}{suffix}</span>
          <span>Max: {prefix}{currentValue[1]}{suffix}</span>
        </div>
      )}

      {/* Threshold Labels */}
      {transitionColors && threshold.length > 0 && (
        <div className="flex justify-between text-xs">
          {threshold.map((t: any, i: number) => (
            <span
              key={i}
              className={`text-${t.color} ${
                Array.isArray(currentValue) ? currentValue[0] >= t.value : currentValue >= t.value
                  ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}

      {/* Additional Controls */}
      {field.showControls && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              const newVal = Math.max(min, (currentValue as number) - step)
              setCurrentValue(newVal)
              onChange?.(newVal)
            }}
            disabled={disabled}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
          >
            -
          </button>
          <button
            onClick={() => {
              const newVal = Math.min(max, (currentValue as number) + step)
              setCurrentValue(newVal)
              onChange?.(newVal)
            }}
            disabled={disabled}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
          >
            +
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-400"
        >
          <Info className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40">{field.helpText}</p>
      )}
    </div>
  )
}