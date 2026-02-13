'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Link2, Code, QrCode, Share2, Copy, Check, 
  ExternalLink, Facebook, Twitter, Linkedin, Mail,
  Download, Settings, Smartphone, Monitor, Tablet
} from 'lucide-react'
import type { CanvasForm } from '@/types/form'
import QRCode from 'qrcode'

interface ShareModalProps {
  form: CanvasForm
  isOpen: boolean
  onClose: () => void
}

type ShareTab = 'link' | 'embed' | 'qr' | 'social'
type EmbedMode = 'inline' | 'popup' | 'slider' | 'modal'
type EmbedTrigger = 'button' | 'time' | 'scroll' | 'exit'

export function ShareModal({ form, isOpen, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>('link')
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [embedMode, setEmbedMode] = useState<EmbedMode>('inline')
  const [embedTrigger, setEmbedTrigger] = useState<EmbedTrigger>('button')
  const [embedWidth, setEmbedWidth] = useState('100%')
  const [embedHeight, setEmbedHeight] = useState('500')
  const [buttonText, setButtonText] = useState('Open Form')
  const qrRef = useRef<HTMLCanvasElement>(null)
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://revoforms.dev'
  const formUrl = `${baseUrl}/f/${form.id}`

  // Generate QR code when tab changes or form changes
  useEffect(() => {
    if (activeTab === 'qr' && form.id) {
      generateQRCode()
    }
  }, [activeTab, form.id])

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(formUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#06b6d4',
          light: '#0a0a14'
        },
        errorCorrectionLevel: 'H'
      })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error('QR generation error:', err)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `${form.name || 'form'}-qr-code.png`
    link.href = qrDataUrl
    link.click()
  }

  const generateEmbedCode = (): string => {
    const scriptUrl = `${baseUrl}/embed.js`
    
    let attrs = `data-form-id="${form.id}" data-mode="${embedMode}"`
    
    if (embedMode !== 'inline') {
      attrs += ` data-trigger="${embedTrigger}"`
      attrs += ` data-button-text="${buttonText}"`
    }
    
    if (embedWidth !== '100%') attrs += ` data-width="${embedWidth}"`
    if (embedHeight !== 'auto' && embedHeight !== '500') attrs += ` data-height="${embedHeight}px"`
    
    return `<!-- RevoForms Embed -->\n<script src="${scriptUrl}" ${attrs}></script>`
  }

  const generateIframeCode = (): string => {
    return `<iframe 
  src="${formUrl}?embed=true" 
  width="${embedWidth}" 
  height="${embedHeight}" 
  frameborder="0" 
  style="border:none;border-radius:16px;"
  title="${form.name || 'Form'}"
></iframe>`
  }

  const tabs = [
    { id: 'link' as ShareTab, label: 'Link', icon: Link2 },
    { id: 'embed' as ShareTab, label: 'Embed', icon: Code },
    { id: 'qr' as ShareTab, label: 'QR Code', icon: QrCode },
    { id: 'social' as ShareTab, label: 'Social', icon: Share2 },
  ]

  const socialLinks = [
    { 
      name: 'Twitter/X', 
      icon: Twitter, 
      color: 'bg-black hover:bg-gray-900',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(formUrl)}&text=${encodeURIComponent(`Check out this form: ${form.name}`)}`
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(formUrl)}`
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(formUrl)}`
    },
    { 
      name: 'Email', 
      icon: Mail, 
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(`Form: ${form.name}`)}&body=${encodeURIComponent(`I wanted to share this form with you: ${formUrl}`)}`
    },
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-[#0a0a14] border border-white/10 rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">Share Form</h2>
              <p className="text-sm text-white/50">{form.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 min-h-[300px]">
            {/* Link Tab */}
            {activeTab === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Form URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(formUrl)}
                      className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
                        copied 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Form in New Tab
                </a>

                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white mb-2">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-neon-cyan">{form.fields?.length || 0}</p>
                      <p className="text-xs text-white/50">Fields</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-neon-purple">--</p>
                      <p className="text-xs text-white/50">Responses</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Embed Tab */}
            {activeTab === 'embed' && (
              <div className="space-y-4">
                {/* Embed Mode Selection */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Embed Style</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['inline', 'popup', 'slider', 'modal'] as EmbedMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setEmbedMode(mode)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all ${
                          embedMode === mode
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trigger for popup/slider/modal */}
                {embedMode !== 'inline' && (
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Trigger</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['button', 'time', 'scroll', 'exit'] as EmbedTrigger[]).map(trigger => (
                        <button
                          key={trigger}
                          onClick={() => setEmbedTrigger(trigger)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all ${
                            embedTrigger === trigger
                              ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {trigger}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Button Text (for button trigger) */}
                {embedMode !== 'inline' && embedTrigger === 'button' && (
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Button Text</label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={e => setButtonText(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                )}

                {/* Size Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Width</label>
                    <input
                      type="text"
                      value={embedWidth}
                      onChange={e => setEmbedWidth(e.target.value)}
                      placeholder="100% or 400px"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Height</label>
                    <input
                      type="text"
                      value={embedHeight}
                      onChange={e => setEmbedHeight(e.target.value)}
                      placeholder="500 or auto"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                {/* Embed Code */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Embed Code (Recommended)</label>
                  <div className="relative">
                    <pre className="p-4 bg-black/50 border border-white/10 rounded-xl text-xs text-green-400 overflow-x-auto">
                      {generateEmbedCode()}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(generateEmbedCode())}
                      className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                    </button>
                  </div>
                </div>

                {/* iFrame fallback */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">iFrame (Fallback)</label>
                  <div className="relative">
                    <pre className="p-4 bg-black/50 border border-white/10 rounded-xl text-xs text-blue-400 overflow-x-auto">
                      {generateIframeCode()}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(generateIframeCode())}
                      className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                    >
                      <Copy className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-white/60 text-center">
                  Scan this QR code to open the form on any device
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={downloadQR}
                    disabled={!qrDataUrl}
                    className="flex items-center gap-2 px-6 py-3 bg-neon-cyan/20 text-neon-cyan rounded-xl hover:bg-neon-cyan/30 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                  <button
                    onClick={() => copyToClipboard(formUrl)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    Copy Link
                  </button>
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <p className="text-sm text-white/60">Share your form on social media</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map(social => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all ${social.color}`}
                    >
                      <social.icon className="w-5 h-5" />
                      {social.name}
                    </a>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-white/5 rounded-xl">
                  <h4 className="text-sm font-medium text-white mb-3">Share Message</h4>
                  <textarea
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm resize-none"
                    rows={3}
                    defaultValue={`Check out this form I created: ${form.name}\n${formUrl}`}
                  />
                  <button
                    onClick={() => copyToClipboard(`Check out this form I created: ${form.name}\n${formUrl}`)}
                    className="mt-2 w-full py-2 bg-white/10 text-white/80 rounded-lg text-sm hover:bg-white/20 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy Message'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
