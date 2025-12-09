'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplet, Eye, EyeOff, Palette, Copy, Check, X } from 'lucide-react'

interface ColorFieldProps {
  field: any
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff6b6b',
  '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9',
  '#74b9ff', '#a29bfe', '#ffb3ba', '#ffecb3',
  '#c9ada7', '#b8a9c9', '#a8dadc', '#fadbd8',
  '#45b7d1', '#fdcb6e', '#e17055', '#f4a261',
  '#e76f51', '#2ecc71', '#3498db', '#9b59b6',
  '#1abc9c', '#16a085', '#27ae60', '#2980b9',
  '#8e44ad', '#2c3e50', '#f39c12', '#d35400',
  '#c0392b', '#e74c3c', '#7f8c8d', '#95a5a6',
]

const COLOR_FORMATS = [
  { label: 'HEX', value: 'hex', example: '#FF5733' },
  { label: 'RGB', value: 'rgb', example: 'rgb(255,87,51)' },
  { label: 'RGBA', value: 'rgba', example: 'rgba(255,87,51,0.5)' },
  { label: 'HSL', value: 'hsl', example: 'hsl(9,100%,64%)' },
  { label: 'HSLA', value: 'hsla', example: 'hsla(9,100%,64%,0.5)' },
]

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  const h = diff === 0 ? 0 :
           max === r ? (g - b) / diff + (g < b ? 6 : 0) :
           max === g ? (b - r) / diff + 2 :
           (r - g) / diff + 4

  const l = (max + min) / 2
  const s = diff === 0 ? 0 : l < 0.5 ? diff / (max + min) : diff / (2 - max - min)

  return { h: h * 60, s, l }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return { r, g, b }
}

function colorToString(color: { r: number; g: number; b: number }, format: string, alpha?: number): string {
  if (format === 'hex') {
    return rgbToHex(color.r, color.g, color.b)
  } else if (format === 'rgb') {
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  } else if (format === 'rgba') {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha || 1})`
  } else if (format === 'hsl') {
    const hsl = rgbToHsl(color.r, color.g, color.b)
    return `hsl(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
  } else if (format === 'hsla') {
    const hsl = rgbToHsl(color.r, color.g, color.b)
    return `hsla(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${alpha || 1})`
  }
  return rgbToHex(color.r, color.g, color.b)
}

function parseColor(colorStr: string): { color: { r: number; g: number; b: number }; alpha?: number; format: string } | null {
  colorStr = colorStr.trim()

  // HEX format
  if (colorStr.startsWith('#')) {
    if (colorStr.length === 4) {
      const expanded = colorStr.slice(1).split('').map(c => c + c).join('')
      const rgb = hexToRgb(expanded)
      return rgb ? { color: rgb, format: 'hex' } : null
    } else if (colorStr.length === 7) {
      const rgb = hexToRgb(colorStr)
      return rgb ? { color: rgb, format: 'hex' } : null
    } else if (colorStr.length === 9) {
      const rgb = hexToRgb(colorStr.slice(0, 7))
      const alpha = parseInt(colorStr.slice(7), 16) / 255
      return rgb ? { color: rgb, alpha, format: 'hex' } : null
    }
  }

  // RGB format
  const rgbMatch = colorStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i)
  if (rgbMatch) {
    const color = { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) }
    const alpha = rgbMatch[5] ? parseFloat(rgbMatch[5]) : undefined
    return { color, alpha, format: colorStr.startsWith('rgba') ? 'rgba' : 'rgb' }
  }

  // HSL format
  const hslMatch = colorStr.match(/^hsla?\((\d+),\s*(\d+)%,?\s*(\d+)%(?:,\s*([\d.]+))?\)$/i)
  if (hslMatch) {
    const h = parseInt(hslMatch[1])
    const s = parseInt(hslMatch[2])
    const l = parseInt(hslMatch[3])
    const rgb = hslToRgb(h, s / 100, l / 100)
    const alpha = hslMatch[5] ? parseFloat(hslMatch[5]) : undefined
    return { color: rgb, alpha, format: colorStr.startsWith('hsla') ? 'hsla' : 'hsl' }
  }

  return null
}

export function ColorField({ field, value = '', onChange, error, disabled }: ColorFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [colorFormat, setColorFormat] = useState('hex')
  const [currentColor, setCurrentColor] = useState(value || '#000000')
  const [showCopied, setShowCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const { allowAlpha = false, showPresets = true, showColorPicker = true, showEyeDropper = false } = field

  const parsedColor = parseColor(currentColor)
  const rgbColor = parsedColor?.color || { r: 0, g: 0, b: 0 }
  const alpha = parsedColor?.alpha || 1

  useEffect(() => {
    if (value !== currentColor) {
      setCurrentColor(value)
    }
  }, [value, currentColor])

  const handleColorChange = (color: string) => {
    setCurrentColor(color)
    onChange?.(toString(rgbColor, colorFormat, alpha))
    setShowCopied(false)
  }

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value)
    const rgb = hslToRgb(h, 100, 50)
    handleColorChange(toString(rgb, colorFormat, alpha))
  }

  const handleSaturationLightnessChange = (s: number, l: number) => {
    const { h } = rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b)
    const rgb = hslToRgb(h, s, l)
    handleColorChange(toString(rgb, colorFormat, alpha))
  }

  const handleAlphaChange = (alpha: number) => {
    handleColorChange(toString(rgbColor, colorFormat, alpha))
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentColor)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  const applyPreset = (preset: string) => {
    handleColorChange(preset)
    setIsOpen(false)
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/90">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {showCopied && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg"
            >
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Copied!</span>
            </motion.div>
          )}
          <button
            onClick={copyToClipboard}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Copy color"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Color picker"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Color Display */}
      <div className="flex items-center gap-3">
        <div
          className="relative w-16 h-16 rounded-lg border-2 border-white/20 cursor-pointer overflow-hidden group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div
            className="w-full h-full"
            style={{ backgroundColor: currentColor }}
          />
          {allowAlpha && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.1) 52%)`
            }} />
          )}
        </div>

        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={currentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            placeholder="Pick a color or enter a color code"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 disabled:opacity-50"
          />

          {error && (
            <p className="text-sm text-red-400 mt-1">{error}</p>
          )}
        </div>
      </div>

      {/* Color Format Selector */}
      <div className="flex gap-2">
        {COLOR_FORMATS.map((format) => (
          <button
            key={format.value}
            onClick={() => {
              setColorFormat(format.value)
              if (parsedColor) {
                setCurrentColor(toString(parsedColor.color, format.value, parsedColor.alpha))
              }
            }}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              colorFormat === format.value
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {format.label}
          </button>
        ))}
      </div>

      {/* Color Picker Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 bg-space-light border border-white/10 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Color Picker</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Color Preview */}
              <div className="mb-4 p-4 bg-white/5 rounded-xl">
                <div
                  className="w-full h-20 rounded-lg"
                  style={{ backgroundColor: currentColor }}
                />
                <p className="text-xs text-white/60 mt-2 text-center font-mono">
                  {currentColor.toUpperCase()}
                </p>
              </div>

              {/* Hue Slider */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">Hue</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b).h}
                  onChange={handleHueChange}
                  className="w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Saturation Slider */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Saturation: {Math.round(rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b).s * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b).s * 100}
                  onChange={(e) => handleSaturationLightnessChange(parseInt(e.target.value), rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b).l * 100)}
                  className="w-full accent-neon-cyan"
                />
              </div>

              {/* Lightness Slider */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Lightness: {Math.round(rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b).l * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b).l * 100}
                  onChange={(e) => handleSaturationLightChange(rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b).s, parseInt(e.target.value))}
                  className="w-full accent-neon-cyan"
                />
              </div>

              {/* Alpha Slider */}
              {allowAlpha && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Alpha: {Math.round(alpha * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={alpha * 100}
                    onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
                    className="w-full accent-neon-cyan"
                  />
                </div>
              )}

              {/* Preset Colors */}
              {showPresets && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Preset Colors</label>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => applyPreset(color)}
                        className="w-8 h-8 rounded-lg border-2 border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
                    applyPreset(randomColor)
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  <Droplet className="w-4 h-4 inline mr-2" />
                  Random
                </button>
                <button
                  onClick={() => applyPreset('#000000')}
                  className="px-4 py-2 bg-black border border-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  Black
                </button>
                <button
                  onClick={() => applyPreset('#ffffff')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg transition-colors text-sm"
                >
                  White
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40">{field.helpText}</p>
      )}

      {/* Format Examples */}
      <div className="text-xs text-white/30">
        <p>Supported formats: HEX (#RRGGBB), RGB, RGBA, HSL, HSLA</p>
      </div>
    </div>
  )
}