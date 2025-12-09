'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Grid3X3, Magnet, Focus } from 'lucide-react'
import type { CanvasForm } from '@/types/form'
import { FormCard } from '../form-builder/FormCard'
import { useFormStore } from '@/store/formStore'

interface InfiniteCanvasProps {
  onFormDoubleClick?: (formId: string) => void
}

export function InfiniteCanvas({ onFormDoubleClick }: InfiniteCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  const GRID_SIZE = 20

  const { selectForm, updateFormPosition, openPreview, canvasFocusTarget, clearFocusTarget, forms } = useFormStore()

  // Ensure forms is always an array
  const safeForms = Array.isArray(forms) ? forms : []

  // Handle hydration
  useEffect(() => { setMounted(true) }, [])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle focus target changes - animate to form position
  useEffect(() => {
    if (canvasFocusTarget && canvasRef.current) {
      const form = safeForms.find(f => f.id === canvasFocusTarget.formId)
      if (form) {
        const rect = canvasRef.current.getBoundingClientRect()
        const formWidth = form.size?.width || 380
        const formHeight = 400 // Estimated height
        
        // Calculate pan to center the form
        const targetX = rect.width / 2 - (form.position.x + formWidth / 2) * zoom
        const targetY = rect.height / 2 - (form.position.y + formHeight / 2) * zoom
        
        // Animate to position
        const startX = pan.x
        const startY = pan.y
        const startTime = Date.now()
        const duration = 500
        
        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // Ease out cubic
          
          setPan({
            x: startX + (targetX - startX) * eased,
            y: startY + (targetY - startY) * eased
          })
          
          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            clearFocusTarget()
          }
        }
        
        animate()
      }
    }
  }, [canvasFocusTarget, safeForms, zoom, clearFocusTarget])
  
  // Snap position to grid
  const snapPosition = (pos: { x: number; y: number }) => {
    if (!snapToGrid) return pos
    return {
      x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE
    }
  }
  
  // Update form position with snapping
  const handleFormPositionChange = (formId: string, pos: { x: number; y: number }) => {
    updateFormPosition(formId, snapPosition(pos))
  }

  // Smooth wheel zoom with momentum
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    if (e.ctrlKey || e.metaKey) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const delta = e.deltaY > 0 ? 0.92 : 1.08
      const newZoom = Math.min(Math.max(zoom * delta, 0.1), 4)
      
      const zoomRatio = newZoom / zoom
      const newPanX = mouseX - (mouseX - pan.x) * zoomRatio
      const newPanY = mouseY - (mouseY - pan.y) * zoomRatio
      
      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
    } else {
      setPan(p => ({ x: p.x - e.deltaX * 0.8, y: p.y - e.deltaY * 0.8 }))
    }
  }, [zoom, pan])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Touch handling for mobile
  const touchRef = useRef<{ startX: number; startY: number; startDist: number; startZoom: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y }
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      touchRef.current = { startX: (e.touches[0].clientX + e.touches[1].clientX) / 2, startY: (e.touches[0].clientY + e.touches[1].clientY) / 2, startDist: Math.hypot(dx, dy), startZoom: zoom }
    }
  }, [pan.x, pan.y, zoom])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x
      const dy = e.touches[0].clientY - dragStartRef.current.y
      setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy })
    } else if (e.touches.length === 2 && touchRef.current) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.hypot(dx, dy)
      const newZoom = Math.min(Math.max(touchRef.current.startZoom * (dist / touchRef.current.startDist), 0.3), 3)
      setZoom(newZoom)
    }
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    touchRef.current = null
  }, [])

  // Mouse handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target === canvasRef.current || target.classList.contains('canvas-grid')) {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      selectForm(null)
    }
  }, [pan.x, pan.y, selectForm])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = requestAnimationFrame(() => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy })
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
  }, [])

  useEffect(() => {
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current) }
  }, [])

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }
  const zoomIn = () => setZoom(z => Math.min(z * 1.15, 4))
  const zoomOut = () => setZoom(z => Math.max(z * 0.85, 0.1))

  // Focus on first form
  const focusFirstForm = () => {
    if (mounted && safeForms && safeForms.length > 0) {
      const form = safeForms[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setPan({
          x: rect.width / 2 - (form.position.x + 190) * zoom,
          y: rect.height / 2 - (form.position.y + 200) * zoom
        })
        selectForm(form.id)
      }
    }
  }

  const handleFormDoubleClick = (formId: string) => {
    if (onFormDoubleClick) onFormDoubleClick(formId)
    else openPreview(formId)
  }

  return (
    <div
      ref={canvasRef}
      className={`flex-1 overflow-hidden bg-space relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Canvas Grid Background */}
      {showGrid && !isMobile && (
        <div className="absolute inset-0 canvas-grid pointer-events-none"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0',
            backgroundSize: `${40}px ${40}px`, opacity: Math.min(zoom, 1) * 0.5 }} />
      )}

      {/* Forms Container */}
      <div className="absolute will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        <AnimatePresence>
          {mounted && safeForms && safeForms.map((form) => (
            <FormCard key={form.id} form={form} zoom={zoom}
              onPositionChange={(pos) => handleFormPositionChange(form.id, pos)}
              onDoubleClick={() => handleFormDoubleClick(form.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {mounted && (!safeForms || safeForms.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
          <div className="text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center border border-white/10">
              <span className="text-3xl md:text-4xl">✨</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white mb-2">Your canvas is empty</h2>
            <p className="text-sm md:text-base text-white/50 max-w-sm">
              {isMobile ? 'Tap the chat button to create your first form' : 'Start by telling the AI what kind of form you want to create'}
            </p>
          </div>
        </div>
      )}

      {/* Zoom Controls - Responsive */}
      <div className={`absolute ${isMobile ? 'bottom-4 left-1/2 -translate-x-1/2' : 'bottom-6 left-6'} flex items-center gap-1.5 md:gap-2 glass-panel p-1.5 md:p-2 rounded-xl`}>
        <button onClick={zoomOut} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors" title="Zoom out">
          <ZoomOut className="w-4 h-4 text-white/70" />
        </button>
        <button onClick={resetView} className="text-xs text-white/50 w-12 md:w-14 text-center hover:text-white/70 transition-colors py-1" title="Reset view">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={zoomIn} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors" title="Zoom in">
          <ZoomIn className="w-4 h-4 text-white/70" />
        </button>
        
        {!isMobile && (
          <>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button onClick={resetView} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Fit to screen">
              <Maximize2 className="w-4 h-4 text-white/70" />
            </button>
            <button onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`} title="Toggle grid">
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded-lg transition-colors ${snapToGrid ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-white/40 hover:text-white/70'}`} title="Snap to grid">
              <Magnet className="w-4 h-4" />
            </button>
          </>
        )}
        
        {mounted && safeForms && safeForms.length > 0 && (
          <>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button onClick={focusFirstForm} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors" title="Focus on form">
              <Focus className="w-4 h-4 text-white/70" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
