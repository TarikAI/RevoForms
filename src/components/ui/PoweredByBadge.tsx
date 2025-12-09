'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'

interface PoweredByBadgeProps {
  variant?: 'default' | 'minimal' | 'dark' | 'light'
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center'
  showOnHover?: boolean
  clickable?: boolean
  formName?: string
}

/**
 * PoweredByBadge - Viral growth mechanism
 * 
 * This badge appears on forms created with the free tier.
 * Clicking it leads to the RevoForms signup page.
 * 
 * According to Tally's data, this feature accounts for
 * 40% of their 35,000 weekly new users!
 */
export function PoweredByBadge({
  variant = 'default',
  position = 'bottom-right',
  showOnHover = false,
  clickable = true,
  formName
}: PoweredByBadgeProps) {
  const positionClasses = {
    'bottom-left': 'left-4',
    'bottom-right': 'right-4',
    'bottom-center': 'left-1/2 -translate-x-1/2'
  }

  const variantStyles = {
    default: {
      bg: 'bg-gradient-to-r from-[#0a0a14]/90 to-[#0f0f1a]/90',
      border: 'border-neon-cyan/30',
      text: 'text-white',
      accent: 'text-neon-cyan',
      glow: 'shadow-lg shadow-neon-cyan/20'
    },
    minimal: {
      bg: 'bg-black/50',
      border: 'border-white/10',
      text: 'text-white/70',
      accent: 'text-white',
      glow: ''
    },
    dark: {
      bg: 'bg-[#0a0a14]',
      border: 'border-white/20',
      text: 'text-white',
      accent: 'text-neon-cyan',
      glow: 'shadow-xl shadow-black/50'
    },
    light: {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-600',
      accent: 'text-cyan-600',
      glow: 'shadow-lg shadow-gray-200/50'
    }
  }

  const style = variantStyles[variant]
  const signupUrl = `https://revoforms.dev/signup?ref=badge${formName ? `&form=${encodeURIComponent(formName)}` : ''}`

  const handleClick = () => {
    if (clickable) {
      window.open(signupUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <motion.div
      initial={{ opacity: showOnHover ? 0 : 1, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`fixed bottom-4 ${positionClasses[position]} z-40`}
    >
      <button
        onClick={handleClick}
        disabled={!clickable}
        className={`
          group flex items-center gap-2 px-3 py-1.5 rounded-full
          ${style.bg} ${style.border} border ${style.glow}
          backdrop-blur-xl transition-all duration-300
          ${clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
        `}
      >
        {/* Logo */}
        <div className="relative">
          <div className={`w-5 h-5 rounded-md bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center`}>
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          {/* Pulse effect */}
          <span className="absolute inset-0 rounded-md bg-neon-cyan/30 animate-ping opacity-0 group-hover:opacity-100" />
        </div>

        {/* Text */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${style.text}`}>
            Made with
          </span>
          <span className={`text-xs font-bold ${style.accent}`}>
            RevoForms
          </span>
        </div>

        {/* Arrow on hover */}
        {clickable && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="hidden group-hover:block"
          >
            <Zap className={`w-3 h-3 ${style.accent}`} />
          </motion.div>
        )}
      </button>
    </motion.div>
  )
}

/**
 * Inline Badge - For embedding in form footer
 */
export function PoweredByInline({ 
  variant = 'default',
  clickable = true 
}: Pick<PoweredByBadgeProps, 'variant' | 'clickable'>) {
  const signupUrl = 'https://revoforms.dev/signup?ref=inline-badge'

  const variantStyles = {
    default: 'text-white/50 hover:text-neon-cyan',
    minimal: 'text-gray-400 hover:text-gray-600',
    dark: 'text-white/40 hover:text-white',
    light: 'text-gray-400 hover:text-cyan-600'
  }

  const Wrapper = clickable ? 'a' : 'span'
  const props = clickable ? { 
    href: signupUrl, 
    target: '_blank', 
    rel: 'noopener noreferrer' 
  } : {}

  return (
    <Wrapper
      {...props}
      className={`
        inline-flex items-center gap-1.5 text-xs transition-colors
        ${variantStyles[variant]}
        ${clickable ? 'cursor-pointer' : ''}
      `}
    >
      <Sparkles className="w-3 h-3" />
      <span>Made with <strong>RevoForms</strong></span>
    </Wrapper>
  )
}

/**
 * Embed Code Generator - For users who want to add badge manually
 */
export function generateBadgeEmbedCode(options: {
  variant?: string
  position?: string
  formName?: string
}): string {
  const { variant = 'default', position = 'bottom-right', formName } = options
  
  return `<!-- RevoForms Badge -->
<a href="https://revoforms.dev/signup?ref=embed${formName ? `&form=${encodeURIComponent(formName)}` : ''}" 
   target="_blank" 
   rel="noopener noreferrer"
   style="
     position: fixed;
     bottom: 16px;
     ${position === 'bottom-left' ? 'left: 16px;' : position === 'bottom-center' ? 'left: 50%; transform: translateX(-50%);' : 'right: 16px;'}
     display: inline-flex;
     align-items: center;
     gap: 8px;
     padding: 6px 12px;
     background: ${variant === 'light' ? '#ffffff' : 'rgba(10, 10, 20, 0.9)'};
     border: 1px solid ${variant === 'light' ? '#e5e7eb' : 'rgba(6, 182, 212, 0.3)'};
     border-radius: 9999px;
     font-family: system-ui, -apple-system, sans-serif;
     font-size: 12px;
     color: ${variant === 'light' ? '#4b5563' : '#ffffff'};
     text-decoration: none;
     z-index: 1000;
     transition: transform 0.2s;
   "
   onmouseover="this.style.transform='scale(1.05)'"
   onmouseout="this.style.transform='scale(1)'"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${variant === 'light' ? '#0891b2' : '#06b6d4'}" stroke-width="2">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    <path d="M5 19l1 3 3-1-1-3-3 1z" opacity="0.5"/>
    <path d="M19 19l-1 3-3-1 1-3 3 1z" opacity="0.5"/>
  </svg>
  <span>Made with <strong style="color: ${variant === 'light' ? '#0891b2' : '#06b6d4'}">RevoForms</strong></span>
</a>`
}
