'use client'

import React, { useState, useEffect } from 'react'
import {
  Image,
  Upload,
  Palette,
  Gradient,
  Video,
  X,
  Check,
  Sparkles,
  Zap
} from 'lucide-react'

interface BackgroundOption {
  id: string
  name: string
  type: 'color' | 'gradient' | 'image' | 'video' | 'pattern'
  value: any
  preview?: string
}

interface FormBackgroundProps {
  background?: {
    type: 'color' | 'gradient' | 'image' | 'video' | 'pattern'
    value: any
    overlay?: {
      enabled: boolean
      color: string
      opacity: number
    }
  }
  onChange: (background: any) => void
}

const PRESET_BACKGROUNDS: BackgroundOption[] = [
  // Solid Colors
  { id: 'white', name: 'White', type: 'color', value: '#FFFFFF' },
  { id: 'gray', name: 'Light Gray', type: 'color', value: '#F3F4F6' },
  { id: 'dark', name: 'Dark', type: 'color', value: '#1F2937' },
  { id: 'black', name: 'Black', type: 'color', value: '#000000' },
  { id: 'blue', name: 'Ocean Blue', type: 'color', value: '#0EA5E9' },
  { id: 'purple', name: 'Royal Purple', type: 'color', value: '#7C3AED' },
  { id: 'green', name: 'Forest Green', type: 'color', value: '#059669' },
  { id: 'red', name: 'Sunset Red', type: 'color', value: '#DC2626' },

  // Gradients
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'gradient',
    value: {
      type: 'linear',
      direction: 'to right',
      colors: ['#FF6B35', '#F7931E', '#FDC830']
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'gradient',
    value: {
      type: 'linear',
      direction: '135deg',
      colors: ['#667eea', '#764ba2', '#f093fb']
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'gradient',
    value: {
      type: 'linear',
      direction: 'to bottom',
      colors: ['#134E5E', '#71B280']
    }
  },
  {
    id: 'candy',
    name: 'Candy',
    type: 'gradient',
    value: {
      type: 'radial',
      colors: ['#FF9A9E', '#FECFEF', '#FECFEF']
    }
  },

  // Patterns
  {
    id: 'dots',
    name: 'Dot Pattern',
    type: 'pattern',
    value: {
      type: 'dots',
      color: '#E5E7EB',
      backgroundColor: '#FFFFFF',
      size: 20
    }
  },
  {
    id: 'grid',
    name: 'Grid Pattern',
    type: 'pattern',
    value: {
      type: 'grid',
      color: '#D1D5DB',
      backgroundColor: '#F9FAFB',
      size: 30
    }
  },
  {
    id: 'lines',
    name: 'Line Pattern',
    type: 'pattern',
    value: {
      type: 'lines',
      color: '#E5E7EB',
      backgroundColor: '#FFFFFF',
      size: 10,
      angle: 45
    }
  }
]

export function FormBackground({ background, onChange }: FormBackgroundProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const [selectedType, setSelectedType] = useState(background?.type || 'color')
  const [customValue, setCustomValue] = useState<any>(() => {
    if (background?.type === 'gradient') {
      return background.value || PRESET_BACKGROUNDS.find(b => b.id === 'sunset')?.value
    } else if (background?.type === 'color') {
      return background.value || '#FFFFFF'
    }
    return null
  })
  const [overlayEnabled, setOverlayEnabled] = useState(background?.overlay?.enabled || false)
  const [overlayColor, setOverlayColor] = useState(background?.overlay?.color || '#000000')
  const [overlayOpacity, setOverlayOpacity] = useState(background?.overlay?.opacity || 0.3)

  useEffect(() => {
    if (background) {
      setSelectedType(background.type)
      setCustomValue(background.value)
      setOverlayEnabled(background.overlay?.enabled || false)
      setOverlayColor(background.overlay?.color || '#000000')
      setOverlayOpacity(background.overlay?.opacity || 0.3)
    }
  }, [background])

  const handleBackgroundSelect = (option: BackgroundOption) => {
    onChange({
      type: option.type,
      value: option.value,
      overlay: {
        enabled: overlayEnabled,
        color: overlayColor,
        opacity: overlayOpacity
      }
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        onChange({
          type: 'image',
          value: {
            url: result,
            fit: 'cover',
            position: 'center'
          },
          overlay: {
            enabled: true,
            color: '#000000',
            opacity: 0.3
          }
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const generateBackgroundStyle = () => {
    if (background?.type === 'color') {
      return { backgroundColor: background.value }
    } else if (background?.type === 'gradient') {
      const gradient = background.value
      if (gradient.type === 'linear') {
        return {
          background: `linear-gradient(${gradient.direction}, ${gradient.colors.join(', ')})`
        }
      } else if (gradient.type === 'radial') {
        return {
          background: `radial-gradient(circle, ${gradient.colors.join(', ')})`
        }
      }
    } else if (background?.type === 'image') {
      return {
        backgroundImage: `url(${background.value.url})`,
        backgroundSize: background.value.fit,
        backgroundPosition: background.value.position,
        backgroundRepeat: 'no-repeat'
      }
    } else if (background?.type === 'pattern') {
      // Generate SVG pattern
      const pattern = background.value
      let svgPattern = ''

      if (pattern.type === 'dots') {
        svgPattern = `<svg width="${pattern.size * 2}" height="${pattern.size * 2}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${pattern.backgroundColor}"/>
          <circle cx="${pattern.size}" cy="${pattern.size}" r="${pattern.size / 4}" fill="${pattern.color}"/>
        </svg>`
      } else if (pattern.type === 'grid') {
        svgPattern = `<svg width="${pattern.size}" height="${pattern.size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${pattern.backgroundColor}"/>
          <path d="M ${pattern.size} 0 L 0 0 0 ${pattern.size}" fill="none" stroke="${pattern.color}" stroke-width="1"/>
        </svg>`
      } else if (pattern.type === 'lines') {
        svgPattern = `<svg width="${pattern.size * 2}" height="${pattern.size * 2}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${pattern.backgroundColor}"/>
          <path d="M0,${pattern.size} L${pattern.size * 2},0" stroke="${pattern.color}" stroke-width="1"/>
        </svg>`
      }

      const encodedSvg = encodeURIComponent(svgPattern)
      return {
        backgroundImage: `url("data:image/svg+xml,${encodedSvg}")`,
        backgroundRepeat: 'repeat'
      }
    }
    return {}
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Form Background</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'presets'
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'custom'
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg border border-white/20">
        <div
          className="w-full h-24 rounded flex items-center justify-center relative overflow-hidden"
          style={generateBackgroundStyle()}
        >
          {background?.overlay?.enabled && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: background.overlay.color,
                opacity: background.overlay.opacity
              }}
            />
          )}
          <span className="text-xs font-medium bg-black/50 text-white px-2 py-1 rounded">
            Preview
          </span>
        </div>
      </div>

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          {/* Type Filter */}
          <div className="flex gap-1">
            {[
              { type: 'color', icon: Palette, label: 'Colors' },
              { type: 'gradient', icon: Gradient, label: 'Gradients' },
              { type: 'pattern', icon: Zap, label: 'Patterns' }
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 py-1.5 px-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  selectedType === type
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Background Options */}
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {PRESET_BACKGROUNDS.filter(bg => bg.type === selectedType).map(option => (
              <button
                key={option.id}
                onClick={() => handleBackgroundSelect(option)}
                className={`relative p-3 rounded-lg border transition-all group ${
                  background?.type === option.type &&
                  ((background.type !== 'pattern' && background.value === option.value) ||
                   (background.type === 'pattern' && JSON.stringify(background.value) === JSON.stringify(option.value)))
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                }`}
              >
                {/* Preview */}
                <div className="w-full h-12 rounded mb-2 relative overflow-hidden">
                  {option.type === 'color' && (
                    <div className="w-full h-full" style={{ backgroundColor: option.value }} />
                  )}
                  {option.type === 'gradient' && (
                    <div
                      className="w-full h-full"
                      style={{
                        background: option.value.type === 'linear'
                          ? `linear-gradient(${option.value.direction}, ${option.value.colors.join(', ')})`
                          : `radial-gradient(circle, ${option.value.colors.join(', ')})`
                      }}
                    />
                  )}
                  {option.type === 'pattern' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: option.value.backgroundColor,
                        backgroundImage: option.value.type === 'dots'
                          ? `radial-gradient(circle, ${option.value.color} 25%, transparent 25%)`
                          : option.value.type === 'lines'
                          ? `repeating-linear-gradient(${option.value.angle || 45}deg, transparent, transparent ${option.value/2}px, ${option.value.color} ${option.value/2}px, ${option.value.color} ${option.value}px)`
                          : `linear-gradient(${option.value.color} 1px, transparent 1px), linear-gradient(90deg, ${option.value.color} 1px, transparent 1px)`,
                        backgroundSize: option.value.type === 'dots'
                          ? `${option.value.size}px ${option.value.size}px`
                          : option.value.type === 'lines'
                          ? `${option.value.size}px ${option.value.size}px`
                          : `${option.value.size}px ${option.value.size}px`
                      }}
                    />
                  )}

                  {/* Selected indicator */}
                  {background?.type === option.type &&
                   ((background.type !== 'pattern' && background.value === option.value) ||
                    (background.type === 'pattern' && JSON.stringify(background.value) === JSON.stringify(option.value))) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <span className="text-xs text-white/80">{option.name}</span>
              </button>
            ))}
          </div>

          {/* Custom Upload */}
          <div className="pt-3 border-t border-white/10">
            <label className="flex flex-col items-center gap-2 p-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors">
              <Upload className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Custom Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          {/* Custom Gradient Builder */}
          <div>
            <label className="block text-xs text-white/60 mb-2">Custom Gradient</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customValue?.colors?.[0] || '#000000'}
                  onChange={(e) => setCustomValue(prev => ({
                    ...prev,
                    type: 'linear',
                    direction: 'to right',
                    colors: [e.target.value, prev?.colors?.[1] || '#FFFFFF']
                  }))}
                  className="w-8 h-8 rounded border border-white/20"
                />
                <input
                  type="color"
                  value={customValue?.colors?.[1] || '#FFFFFF'}
                  onChange={(e) => setCustomValue(prev => ({
                    ...prev,
                    colors: [prev?.colors?.[0] || '#000000', e.target.value]
                  }))}
                  className="w-8 h-8 rounded border border-white/20"
                />
                <button
                  onClick={() => onChange({
                    type: 'gradient',
                    value: customValue,
                    overlay: {
                      enabled: overlayEnabled,
                      color: overlayColor,
                      opacity: overlayOpacity
                    }
                  })}
                  className="flex-1 px-3 py-1 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded text-xs transition-colors"
                >
                  Apply Gradient
                </button>
              </div>
            </div>
          </div>

          {/* Overlay Settings */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="overlay"
                checked={overlayEnabled}
                onChange={(e) => {
                  setOverlayEnabled(e.target.checked)
                  if (background) {
                    onChange({
                      ...background,
                      overlay: {
                        enabled: e.target.checked,
                        color: overlayColor,
                        opacity: overlayOpacity
                      }
                    })
                  }
                }}
                className="w-3 h-3 rounded"
              />
              <label htmlFor="overlay" className="text-xs text-white/60">
                Add Overlay
              </label>
            </div>

            {overlayEnabled && (
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={overlayColor}
                    onChange={(e) => {
                      setOverlayColor(e.target.value)
                      if (background) {
                        onChange({
                          ...background,
                          overlay: {
                            ...background.overlay!,
                            color: e.target.value
                          }
                        })
                      }
                    }}
                    className="w-8 h-8 rounded border border-white/20"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlayOpacity * 100}
                    onChange={(e) => {
                      const opacity = Number(e.target.value) / 100
                      setOverlayOpacity(opacity)
                      if (background) {
                        onChange({
                          ...background,
                          overlay: {
                            ...background.overlay!,
                            opacity
                          }
                        })
                      }
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-white/60 w-8">
                    {Math.round(overlayOpacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}