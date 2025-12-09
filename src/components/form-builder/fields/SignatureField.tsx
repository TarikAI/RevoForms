'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Pen, Type, RotateCcw, Download, CheckCircle } from 'lucide-react'

interface SignatureFieldProps {
  field: any
  value?: string | null
  onChange?: (value: string | null) => void
  error?: string
  disabled?: boolean
  onSignatureEnd?: (signatureData: { image: string; data: any }) => void
}

export function SignatureField({ field, value, onChange, error, disabled, onSignatureEnd }: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw')
  const [penColor, setPenColor] = useState('#000000')
  const [penWidth, setPenWidth] = useState(2)

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image()
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d')!
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
        setIsEmpty(false)
      }
      img.src = value
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || disabled) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvasRef.current.getContext('2d')!

    if (signatureMode === 'type') {
      // Start typed signature
      const font = `${Math.max(16, penWidth * 8)}px ${getFontFamily()}`
      ctx.font = font
      ctx.fillStyle = penColor
      ctx.textBaseline = 'middle'

      // Add text cursor
      const cursorX = x + 2
      const cursorY = y
      ctx.fillRect(cursorX, cursorY - 1, 1, 14)
    } else {
      // Start drawing
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineWidth = penWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = penColor
    }

    setIsDrawing(true)
    setIsEmpty(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || disabled) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvasRef.current.getContext('2d')!

    if (signatureMode === 'type') {
      // Clear and redraw typed signature
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      // Redraw signature value if exists
      if (value) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
        }
        img.src = value
      }

      // Add new character
      const font = `${Math.max(16, penWidth * 8)}px ${getFontFamily()}`
      ctx.font = font
      ctx.fillStyle = penColor
      ctx.textBaseline = 'middle'

      const char = prompt('Type character:') || ''
      if (char) {
        const currentText = getCurrentTypedText(ctx, canvasRef.current.width)
        const textWidth = ctx.measureText(currentText + char).width

        // Position cursor at mouse position
        ctx.fillText(char, x, y)
      }
    } else {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)

    if (canvasRef.current && !isEmpty) {
      const imageData = canvasRef.current.toDataURL('image/png')
      onChange?.( imageData )
      onSignatureEnd?.({
        image: imageData,
        data: {
          mode: signatureMode,
          penColor,
          penWidth,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  const getCurrentTypedText = (ctx: CanvasRenderingContext2D, width: number): string => {
    // This would need to be implemented to track typed characters
    // For now, return empty string
    return ''
  }

  const getFontFamily = (): string => {
    const fonts = ['Brush Script MT', 'Dancing Script', 'Lobster', 'Pacifico', 'Caveat']
    return fonts[Math.floor(Math.random() * fonts.length)]
  }

  const clearSignature = () => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    onChange?.( null )
    setIsEmpty(true)
  }

  const undoLastStroke = () => {
    // This would need to implement undo history
    // For now, just clear
    clearSignature()
  }

  const downloadSignature = () => {
    if (!canvasRef.current || isEmpty) return

    const link = document.createElement('a')
    link.download = `signature_${field.id || 'signature'}_${Date.now()}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/90">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {/* Drawing mode toggle */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setSignatureMode('draw')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                signatureMode === 'draw'
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'text-white/50 hover:text-white'
              }`}
              title="Draw signature"
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSignatureMode('type')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                signatureMode === 'type'
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'text-white/50 hover:text-white'
              }`}
              title="Type signature"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {/* Pen controls */}
          {signatureMode === 'draw' && (
            <>
              <div className="flex items-center gap-2">
                {/* Pen color */}
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  title="Pen color"
                />

                {/* Pen width */}
                <select
                  value={penWidth}
                  onChange={(e) => setPenWidth(Number(e.target.value))}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-neon-cyan/50"
                  title="Pen size"
                >
                  <option value="1">Thin</option>
                  <option value="2">Medium</option>
                  <option value="3">Thick</option>
                  <option value="5">Extra Thick</option>
                </select>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={undoLastStroke}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={clearSignature}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={downloadSignature}
              disabled={isEmpty}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-br from-neon-cyan/10 via-purple-500/10 to-pink-500/10"></div>
        <motion.canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="relative w-full h-48 bg-white rounded-xl border-2 border-white/20 cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />

        {/* Signature indicator */}
        {!isEmpty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 p-1 bg-green-500/20 rounded-lg"
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
          </motion.div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <span>{error}</span>
        </div>
      )}

      {/* Help text */}
      {field.helpText && (
        <p className="text-xs text-white/40">{field.helpText}</p>
      )}

      {/* Instructions */}
      <div className="text-xs text-white/40">
        {signatureMode === 'draw'
          ? 'Click and drag to draw your signature. Use the controls above to customize.'
          : 'Click to position cursor and type your signature.'}
      </div>
    </div>
  )
}