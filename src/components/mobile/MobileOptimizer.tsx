'use client'

import React, { useState, useEffect } from 'react'
import {
  Smartphone,
  Tablet,
  Monitor,
  Settings,
  Check,
  X,
  Info,
  Zap,
  Hand,
  Type,
  Maximize2,
  Layers,
  Eye
} from 'lucide-react'

interface MobileSettings {
  enabled: boolean
  breakPoints: {
    mobile: number
    tablet: number
    desktop: number
  }
  touchTargets: {
    minSize: number
    spacing: number
  }
  fontScaling: {
    enabled: boolean
    minScale: number
    maxScale: number
  }
  gestures: {
    swipeNavigation: boolean
    pinchZoom: boolean
    pullToRefresh: boolean
  }
  performance: {
    lazyLoad: boolean
    compressImages: boolean
    optimizeAnimations: boolean
  }
  layout: {
    stackOnMobile: boolean
    collapseMenus: boolean
    stickyHeader: boolean
  }
}

interface MobileOptimizerProps {
  settings: MobileSettings
  onChange: (settings: MobileSettings) => void
}

export function MobileOptimizer({ settings, onChange }: MobileOptimizerProps) {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isAnimating, setIsAnimating] = useState(false)

  const deviceBreakpoints = {
    mobile: 375,
    tablet: 768,
    desktop: 1024
  }

  const currentWidth = deviceBreakpoints[previewMode]

  const getPreviewStyle = () => {
    const baseStyle: React.CSSProperties = {
      transition: 'all 0.3s ease',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#1a1a2e'
    }

    switch (previewMode) {
      case 'mobile':
        return {
          ...baseStyle,
          width: '375px',
          height: '667px',
          maxWidth: '90vw',
          maxHeight: '80vh'
        }
      case 'tablet':
        return {
          ...baseStyle,
          width: '768px',
          height: '1024px',
          maxWidth: '80vw',
          maxHeight: '70vh'
        }
      case 'desktop':
        return {
          ...baseStyle,
          width: '100%',
          height: '600px'
        }
    }
  }

  const runMobileOptimization = () => {
    setIsAnimating(true)

    // Simulate optimization process
    setTimeout(() => {
      const optimizedSettings: MobileSettings = {
        ...settings,
        touchTargets: {
          minSize: 44,
          spacing: 8
        },
        fontScaling: {
          enabled: true,
          minScale: 0.875,
          maxScale: 1.125
        },
        gestures: {
          swipeNavigation: true,
          pinchZoom: false,
          pullToRefresh: false
        },
        performance: {
          lazyLoad: true,
          compressImages: true,
          optimizeAnimations: true
        },
        layout: {
          stackOnMobile: true,
          collapseMenus: true,
          stickyHeader: true
        }
      }

      onChange(optimizedSettings)
      setIsAnimating(false)
    }, 2000)
  }

  const optimizeForDevice = (device: 'mobile' | 'tablet') => {
    const deviceSettings: Partial<MobileSettings> = {
      touchTargets: device === 'mobile' ? {
        minSize: 48,
        spacing: 12
      } : {
        minSize: 40,
        spacing: 8
      },
      fontScaling: device === 'mobile' ? {
        enabled: true,
        minScale: 0.875,
        maxScale: 1.125
      } : {
        enabled: true,
        minScale: 0.9375,
        maxScale: 1.0625
      },
      layout: {
        stackOnMobile: device === 'mobile',
        collapseMenus: true,
        stickyHeader: device === 'mobile'
      }
    }

    onChange({ ...settings, ...deviceSettings })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-neon-cyan" />
            Mobile Optimization
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Optimize your forms for mobile devices
          </p>
        </div>
        <button
          onClick={runMobileOptimization}
          disabled={isAnimating}
          className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isAnimating ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Auto-Optimize
            </>
          )}
        </button>
      </div>

      {/* Preview Controls */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Preview:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`p-2 rounded transition-colors ${
                  previewMode === 'tablet'
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-xs text-white/40">
            {currentWidth}px width
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex justify-center">
          <div style={getPreviewStyle()}>
            <div className="p-4 h-full">
              {/* Mobile Preview Content */}
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/60">Sample Form Fields</p>
                </div>
                {previewMode === 'mobile' && (
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="w-full h-10 bg-white/10 rounded"></div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="w-full h-10 bg-white/10 rounded"></div>
                    </div>
                    <button className="w-full h-12 bg-neon-cyan rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">Submit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => optimizeForDevice('mobile')}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
        >
          <Smartphone className="w-4 h-4 text-neon-cyan mb-1" />
          <p className="text-sm font-medium text-white">Optimize for Mobile</p>
          <p className="text-xs text-white/40">44px touch targets</p>
        </button>
        <button
          onClick={() => optimizeForDevice('tablet')}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
        >
          <Tablet className="w-4 h-4 text-neon-purple mb-1" />
          <p className="text-sm font-medium text-white">Optimize for Tablet</p>
          <p className="text-xs text-white/40">40px touch targets</p>
        </button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Touch Targets */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Hand className="w-4 h-4" />
            Touch Targets
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/60">Minimum Size</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="40"
                  max="60"
                  value={settings.touchTargets.minSize}
                  onChange={(e) => onChange({
                    ...settings,
                    touchTargets: {
                      ...settings.touchTargets,
                      minSize: Number(e.target.value)
                    }
                  })}
                  className="flex-1"
                />
                <span className="text-xs text-white/80 w-12">
                  {settings.touchTargets.minSize}px
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60">Spacing</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={settings.touchTargets.spacing}
                  onChange={(e) => onChange({
                    ...settings,
                    touchTargets: {
                      ...settings.touchTargets,
                      spacing: Number(e.target.value)
                    }
                  })}
                  className="flex-1"
                />
                <span className="text-xs text-white/80 w-12">
                  {settings.touchTargets.spacing}px
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Font Scaling */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font Scaling
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.fontScaling.enabled}
                onChange={(e) => onChange({
                  ...settings,
                  fontScaling: {
                    ...settings.fontScaling,
                    enabled: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Enable responsive fonts</span>
            </label>
            {settings.fontScaling.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Min Scale</label>
                  <select
                    value={settings.fontScaling.minScale}
                    onChange={(e) => onChange({
                      ...settings,
                      fontScaling: {
                        ...settings.fontScaling,
                        minScale: Number(e.target.value)
                      }
                    })}
                    className="w-full mt-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white"
                  >
                    <option value="0.75">75%</option>
                    <option value="0.875">87.5%</option>
                    <option value="0.9375">93.75%</option>
                    <option value="1">100%</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Max Scale</label>
                  <select
                    value={settings.fontScaling.maxScale}
                    onChange={(e) => onChange({
                      ...settings,
                      fontScaling: {
                        ...settings.fontScaling,
                        maxScale: Number(e.target.value)
                      }
                    })}
                    className="w-full mt-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white"
                  >
                    <option value="1">100%</option>
                    <option value="1.0625">106.25%</option>
                    <option value="1.125">112.5%</option>
                    <option value="1.25">125%</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Layout Options */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Layout Options
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.layout.stackOnMobile}
                onChange={(e) => onChange({
                  ...settings,
                  layout: {
                    ...settings.layout,
                    stackOnMobile: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Stack fields on mobile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.layout.collapseMenus}
                onChange={(e) => onChange({
                  ...settings,
                  layout: {
                    ...settings.layout,
                    collapseMenus: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Collapse menus on mobile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.layout.stickyHeader}
                onChange={(e) => onChange({
                  ...settings,
                  layout: {
                    ...settings.layout,
                    stickyHeader: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Sticky header on scroll</span>
            </label>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.performance.lazyLoad}
                onChange={(e) => onChange({
                  ...settings,
                  performance: {
                    ...settings.performance,
                    lazyLoad: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Lazy load images</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.performance.compressImages}
                onChange={(e) => onChange({
                  ...settings,
                  performance: {
                    ...settings.performance,
                    compressImages: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Auto-compress images</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.performance.optimizeAnimations}
                onChange={(e) => onChange({
                  ...settings,
                  performance: {
                    ...settings.performance,
                    optimizeAnimations: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Optimize animations for mobile</span>
            </label>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200">
            <p className="font-medium mb-1">Mobile Best Practices</p>
            <ul className="space-y-1 text-blue-200/80">
              <li>• Use at least 44px touch targets for better accessibility</li>
              <li>• Ensure readable font sizes on small screens</li>
              <li>• Optimize images and animations for faster loading</li>
              <li>• Test on actual mobile devices for best results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}