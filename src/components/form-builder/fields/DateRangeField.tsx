'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'

interface DateRangeFieldProps {
  field: any
  value?: { start?: string; end?: string }
  onChange?: (value: { start?: string; end?: string }) => void
  error?: string
  disabled?: boolean
}

interface DateRange {
  start?: Date
  end?: Date
}

export function DateRangeField({ field, value = {}, onChange, error, disabled }: DateRangeFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingEnd, setSelectingEnd] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    start: value.start ? new Date(value.start) : undefined,
    end: value.end ? new Date(value.end) : undefined,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)

  const {
    showTime = false,
    minDate,
    maxDate,
    format = 'MM/DD/YYYY',
    allowSameDate = false,
    defaultRange = 7,
    presets = [],
  } = field

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update selected range when value prop changes
  useEffect(() => {
    setSelectedRange({
      start: value.start ? new Date(value.start) : undefined,
      end: value.end ? new Date(value.end) : undefined,
    })
  }, [value])

  const formatDate = (date: Date | undefined): string => {
    if (!date) return ''

    if (showTime) {
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
  }

  const isDateSelectable = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (minDate && date < new Date(minDate)) return false
    if (maxDate && date > new Date(maxDate)) return false

    return true
  }

  const isDateInRange = (date: Date): boolean => {
    if (!selectedRange.start || !selectedRange.end) return false
    return date >= selectedRange.start && date <= selectedRange.end
  }

  const isDateHovered = (date: Date): boolean => {
    if (!selectedRange.start || !hoveredDate) return false
    if (selectedRange.end) return false

    return date >= selectedRange.start && date <= hoveredDate
  }

  const handleDateClick = (date: Date) => {
    if (!isDateSelectable(date) || disabled) return

    const newRange = { ...selectedRange }

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start new selection
      newRange.start = date
      newRange.end = undefined
      setSelectingEnd(true)
    } else {
      // Complete selection
      if (date < selectedRange.start) {
        // If clicked date is before start, swap them
        newRange.end = selectedRange.start
        newRange.start = date
      } else if (!allowSameDate && date.getTime() === selectedRange.start.getTime()) {
        // Same date not allowed, ignore
        return
      } else {
        newRange.end = date
      }
      setSelectingEnd(false)
      setIsOpen(false)
    }

    setSelectedRange(newRange)
    onChange?.({
      start: newRange.start?.toISOString(),
      end: newRange.end?.toISOString(),
    })
  }

  const handleInputChange = (type: 'start' | 'end', inputValue: string) => {
    const date = new Date(inputValue)
    if (!isNaN(date.getTime())) {
      const newRange = { ...selectedRange, [type]: date }
      setSelectedRange(newRange)
      onChange?.({
        start: newRange.start?.toISOString(),
        end: newRange.end?.toISOString(),
      })
    }
  }

  const handlePresetClick = (preset: any) => {
    const end = new Date()
    const start = new Date()

    switch (preset.type) {
      case 'days':
        start.setDate(end.getDate() - preset.value)
        break
      case 'weeks':
        start.setDate(end.getDate() - (preset.value * 7))
        break
      case 'months':
        start.setMonth(end.getMonth() - preset.value)
        break
      case 'years':
        start.setFullYear(end.getFullYear() - preset.value)
        break
      case 'custom':
        if (preset.start && preset.end) {
          start.setTime(new Date(preset.start).getTime())
          end.setTime(new Date(preset.end).getTime())
        }
        break
    }

    const newRange = { start, end }
    setSelectedRange(newRange)
    onChange?.({
      start: start.toISOString(),
      end: end.toISOString(),
    })
    setIsOpen(false)
  }

  const clearSelection = () => {
    setSelectedRange({})
    onChange?.({})
  }

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isSelectable = isDateSelectable(date)
      const isSelected = isDateInRange(date)
      const isHovered = isDateHovered(date)
      const isStart = selectedRange.start?.toDateString() === date.toDateString()
      const isEnd = selectedRange.end?.toDateString() === date.toDateString()
      const isToday = new Date().toDateString() === date.toDateString()

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
          disabled={!isSelectable || disabled}
          className={`
            relative p-2 text-sm rounded-lg transition-all
            ${isSelectable ? 'hover:bg-white/10 cursor-pointer' : 'opacity-30 cursor-not-allowed'}
            ${isSelected || isHovered ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-white/80'}
            ${isStart ? 'rounded-l-lg' : ''}
            ${isEnd ? 'rounded-r-lg' : ''}
            ${isToday ? 'ring-2 ring-neon-cyan/50' : ''}
          `}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`} ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/90">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {selectedRange.start && (
          <button
            onClick={clearSelection}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Date Input Fields */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-white/60 mb-1">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={startDateInputRef}
              type={showTime ? 'datetime-local' : 'date'}
              value={selectedRange.start ? formatDate(selectedRange.start) : ''}
              onChange={(e) => handleInputChange('start', e.target.value)}
              onFocus={() => {
                setIsOpen(true)
                setSelectingEnd(false)
              }}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-neon-cyan/50 disabled:opacity-50"
              placeholder="Select start date"
            />
          </div>
        </div>

        <div className="flex items-center justify-center pt-6">
          <div className="w-8 h-px bg-white/20" />
        </div>

        <div className="flex-1">
          <label className="block text-xs text-white/60 mb-1">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={endDateInputRef}
              type={showTime ? 'datetime-local' : 'date'}
              value={selectedRange.end ? formatDate(selectedRange.end) : ''}
              onChange={(e) => handleInputChange('end', e.target.value)}
              onFocus={() => {
                setIsOpen(true)
                setSelectingEnd(true)
              }}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-neon-cyan/50 disabled:opacity-50"
              placeholder="Select end date"
            />
          </div>
        </div>
      </div>

      {/* Preset Options */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset: any, index: number) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-xs text-white/80 transition-colors disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 p-4 mt-2 bg-space-light border border-white/20 rounded-xl shadow-2xl"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-sm font-medium text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>

              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-white/50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  const now = new Date()
                  handlePresetClick({ type: 'days', value: 0 })
                }}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setDate(end.getDate() - defaultRange)
                  handlePresetClick({ type: 'custom', start: start.toISOString(), end: end.toISOString() })
                }}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
              >
                Last {defaultRange} Days
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40">{field.helpText}</p>
      )}

      {/* Selected Range Display */}
      {selectedRange.start && selectedRange.end && (
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Selected Range:</span>
            <span className="text-white/80">
              {formatDate(selectedRange.start)} - {formatDate(selectedRange.end)}
            </span>
          </div>
          {showTime && (
            <div className="mt-2 text-xs text-white/50">
              Duration: {Math.round((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
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
    </div>
  )
}