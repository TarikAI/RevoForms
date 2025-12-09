'use client'

import React, { useState, useEffect } from 'react'
import {
  Palette,
  Type,
  Layout,
  Sparkles,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Sliders
} from 'lucide-react'
import { FormStyling, ThemePreset, ThemeColors } from '@/types/form'

interface ThemeBuilderProps {
  theme: FormStyling
  onChange: (theme: FormStyling) => void
  onPreview?: (theme: FormStyling) => void
}

const DEFAULT_THEMES: Record<ThemePreset, FormStyling> = {
  'modern-dark': {
    theme: 'modern-dark',
    colors: {
      primary: '#00FFFF',
      secondary: '#8A2BE2',
      background: '#0A0E27',
      surface: '#141B42',
      text: '#FFFFFF',
      textMuted: 'rgba(255,255,255,0.7)',
      border: 'rgba(255,255,255,0.12)',
      error: '#FF4444',
      success: '#44FF44',
      accent: '#FF1493'
    },
    fontFamily: 'Inter',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '24px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '8px',
      button: '8px',
      form: '16px'
    },
    shadows: true,
    animation: true
  },
  'modern-light': {
    theme: 'modern-light',
    colors: {
      primary: '#2563EB',
      secondary: '#7C3AED',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      textMuted: '#64748B',
      border: '#E2E8F0',
      error: '#EF4444',
      success: '#10B981',
      accent: '#F59E0B'
    },
    fontFamily: 'Inter',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '24px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '8px',
      button: '8px',
      form: '16px'
    },
    shadows: true,
    animation: true
  },
  'minimal': {
    theme: 'minimal',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#000000',
      textMuted: '#666666',
      border: '#E0E0E0',
      error: '#DC2626',
      success: '#059669',
      accent: '#0891B2'
    },
    fontFamily: 'system-ui',
    fontSize: {
      label: '12px',
      input: '14px',
      button: '12px',
      heading: '20px'
    },
    spacing: {
      fieldGap: '12px',
      padding: '20px'
    },
    borderRadius: {
      input: '4px',
      button: '4px',
      form: '8px'
    },
    shadows: false,
    animation: false
  },
  'bold': {
    theme: 'bold',
    colors: {
      primary: '#FF6B35',
      secondary: '#004E89',
      background: '#1A1A2E',
      surface: '#16213E',
      text: '#FFFFFF',
      textMuted: '#B8BCC8',
      border: '#0F3460',
      error: '#E63946',
      success: '#06FFA5',
      accent: '#FFD60A'
    },
    fontFamily: 'Poppins',
    fontSize: {
      label: '16px',
      input: '18px',
      button: '16px',
      heading: '28px'
    },
    spacing: {
      fieldGap: '20px',
      padding: '32px'
    },
    borderRadius: {
      input: '12px',
      button: '12px',
      form: '20px'
    },
    shadows: true,
    animation: true
  },
  'corporate': {
    theme: 'corporate',
    colors: {
      primary: '#1E3A8A',
      secondary: '#6366F1',
      background: '#FFFFFF',
      surface: '#F3F4F6',
      text: '#111827',
      textMuted: '#6B7280',
      border: '#D1D5DB',
      error: '#DC2626',
      success: '#059669',
      accent: '#7C2D12'
    },
    fontFamily: 'Georgia',
    fontSize: {
      label: '14px',
      input: '15px',
      button: '14px',
      heading: '22px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '28px'
    },
    borderRadius: {
      input: '6px',
      button: '6px',
      form: '12px'
    },
    shadows: true,
    animation: false
  },
  'playful': {
    theme: 'playful',
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      background: '#FEF3C7',
      surface: '#FDE68A',
      text: '#451A03',
      textMuted: '#78350F',
      border: '#F59E0B',
      error: '#EF4444',
      success: '#10B981',
      accent: '#14B8A6'
    },
    fontFamily: 'Comic Sans MS',
    fontSize: {
      label: '16px',
      input: '18px',
      button: '16px',
      heading: '26px'
    },
    spacing: {
      fieldGap: '18px',
      padding: '24px'
    },
    borderRadius: {
      input: '16px',
      button: '16px',
      form: '24px'
    },
    shadows: true,
    animation: true
  },
  'glassmorphism': {
    theme: 'glassmorphism',
    colors: {
      primary: '#00D4FF',
      secondary: '#FF006E',
      background: 'rgba(255,255,255,0.05)',
      surface: 'rgba(255,255,255,0.1)',
      text: '#FFFFFF',
      textMuted: 'rgba(255,255,255,0.7)',
      border: 'rgba(255,255,255,0.2)',
      error: '#FF4757',
      success: '#00D2D3',
      accent: '#FFA502'
    },
    fontFamily: 'Inter',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '24px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '12px',
      button: '12px',
      form: '20px'
    },
    shadows: true,
    animation: true
  },
  'neon': {
    theme: 'neon',
    colors: {
      primary: '#39FF14',
      secondary: '#FF10F0',
      background: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textMuted: '#B0B0B0',
      border: '#333333',
      error: '#FF0033',
      success: '#00FF88',
      accent: '#FFFF00'
    },
    fontFamily: 'Orbitron',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '26px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '4px',
      button: '4px',
      form: '8px'
    },
    shadows: true,
    animation: true
  },
  'nature': {
    theme: 'nature',
    colors: {
      primary: '#059669',
      secondary: '#0891B2',
      background: '#F0FDF4',
      surface: '#DCFCE7',
      text: '#064E3B',
      textMuted: '#047857',
      border: '#BBF7D0',
      error: '#DC2626',
      success: '#059669',
      accent: '#EA580C'
    },
    fontFamily: 'Verdana',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '22px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '8px',
      button: '8px',
      form: '12px'
    },
    shadows: false,
    animation: false
  },
  'ocean': {
    theme: 'ocean',
    colors: {
      primary: '#0891B2',
      secondary: '#0E7490',
      background: '#F0F9FF',
      surface: '#E0F2FE',
      text: '#0C4A6E',
      textMuted: '#075985',
      border: '#BAE6FD',
      error: '#E11D48',
      success: '#059669',
      accent: '#7C3AED'
    },
    fontFamily: 'Arial',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '24px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '12px',
      button: '12px',
      form: '16px'
    },
    shadows: true,
    animation: true
  },
  'sunset': {
    theme: 'sunset',
    colors: {
      primary: '#F97316',
      secondary: '#DC2626',
      background: '#FFF7ED',
      surface: '#FED7AA',
      text: '#7C2D12',
      textMuted: '#9A3412',
      border: '#FDBA74',
      error: '#DC2626',
      success: '#059669',
      accent: '#7C3AED'
    },
    fontFamily: 'Trebuchet MS',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '24px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '12px',
      button: '12px',
      form: '16px'
    },
    shadows: true,
    animation: false
  },
  'custom': {
    theme: 'custom',
    colors: {
      primary: '#00FFFF',
      secondary: '#8A2BE2',
      background: '#0A0E27',
      surface: '#141B42',
      text: '#FFFFFF',
      textMuted: 'rgba(255,255,255,0.7)',
      border: 'rgba(255,255,255,0.12)',
      error: '#FF4444',
      success: '#44FF44',
      accent: '#FF1493'
    },
    fontFamily: 'Inter',
    fontSize: {
      label: '14px',
      input: '16px',
      button: '14px',
      heading: '24px'
    },
    spacing: {
      fieldGap: '16px',
      padding: '24px'
    },
    borderRadius: {
      input: '8px',
      button: '8px',
      form: '16px'
    },
    shadows: true,
    animation: true
  }
}

export function ThemeBuilder({ theme, onChange, onPreview }: ThemeBuilderProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'typography' | 'layout' | 'advanced'>('presets')
  const [isPreview, setIsPreview] = useState(false)

  const handlePresetSelect = (preset: ThemePreset) => {
    onChange(DEFAULT_THEMES[preset])
  }

  const handleColorChange = (colorKey: keyof ThemeColors, value: string) => {
    onChange({
      ...theme,
      colors: {
        ...theme.colors,
        [colorKey]: value
      }
    })
  }

  const exportTheme = () => {
    const dataStr = JSON.stringify(theme, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `theme-${theme.theme}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const importedTheme = JSON.parse(event.target?.result as string)
          onChange(importedTheme)
        } catch (error) {
          console.error('Invalid theme file')
        }
      }
      reader.readAsText(file)
    }
  }

  const resetTheme = () => {
    onChange(DEFAULT_THEMES['modern-dark'])
  }

  return (
    <div className="h-full flex flex-col bg-space-light border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-neon-cyan" />
          Theme Builder
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-white/10">
        {[
          { id: 'presets', icon: Sparkles, label: 'Presets' },
          { id: 'colors', icon: Palette, label: 'Colors' },
          { id: 'typography', icon: Type, label: 'Typography' },
          { id: 'layout', icon: Layout, label: 'Layout' },
          { id: 'advanced', icon: Sliders, label: 'Advanced' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-3 border-b border-white/10">
        <button
          onClick={resetTheme}
          className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center gap-2 text-white text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={exportTheme}
          className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center gap-2 text-white text-sm"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <label className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center gap-2 text-white text-sm cursor-pointer">
          <Upload className="w-4 h-4" />
          Import
          <input type="file" accept=".json" onChange={importTheme} className="hidden" />
        </label>
        <button
          onClick={() => {
            setIsPreview(!isPreview)
            onPreview?.(theme)
          }}
          className={`py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
            isPreview
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {isPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'presets' && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DEFAULT_THEMES).map(([preset, themeData]) => (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset as ThemePreset)}
                className={`p-3 rounded-lg border transition-all ${
                  theme.theme === preset
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {preset === 'modern-dark' && '🌙'}
                    {preset === 'modern-light' && '☀️'}
                    {preset === 'minimal' && '⬜'}
                    {preset === 'bold' && '🔥'}
                    {preset === 'corporate' && '💼'}
                    {preset === 'playful' && '🎨'}
                    {preset === 'glassmorphism' && '✨'}
                    {preset === 'neon' && '💚'}
                    {preset === 'nature' && '🌿'}
                    {preset === 'ocean' && '🌊'}
                    {preset === 'sunset' && '🌅'}
                  </span>
                  <span className="text-xs text-white/80 capitalize">
                    {preset.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Object.values(themeData.colors).slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">Color Palette</h3>
            {Object.entries(theme.colors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="text-xs text-white/60 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    className="w-12 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    className="flex-1 px-3 py-1 bg-white/5 border border-white/20 rounded text-white text-sm font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">Typography</h3>

            <div className="space-y-2">
              <label className="text-xs text-white/60">Font Family</label>
              <select
                value={theme.fontFamily}
                onChange={(e) => onChange({ ...theme, fontFamily: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Poppins">Poppins</option>
                <option value="Orbitron">Orbitron</option>
                <option value="system-ui">System UI</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>

            <div className="space-y-3">
              {Object.entries(theme.fontSize).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs text-white/60 capitalize">
                    {key} Size
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange({
                      ...theme,
                      fontSize: {
                        ...theme.fontSize,
                        [key]: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">Layout & Spacing</h3>

            <div className="space-y-3">
              {Object.entries(theme.spacing).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs text-white/60 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange({
                      ...theme,
                      spacing: {
                        ...theme.spacing,
                        [key]: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs text-white/60">Border Radius</h4>
              {Object.entries(theme.borderRadius).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs text-white/40 capitalize">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange({
                      ...theme,
                      borderRadius: {
                        ...theme.borderRadius,
                        [key]: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">Advanced Options</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={theme.shadows}
                onChange={(e) => onChange({ ...theme, shadows: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-neon-cyan"
              />
              <span className="text-sm text-white/80">Enable Shadows</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={theme.animation}
                onChange={(e) => onChange({ ...theme, animation: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-neon-cyan"
              />
              <span className="text-sm text-white/80">Enable Animations</span>
            </label>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs text-white/60 mb-3">Custom CSS</h4>
              <textarea
                placeholder="Add custom CSS rules..."
                className="w-full h-32 px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm font-mono resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}