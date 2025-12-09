'use client'

import React, { useEffect } from 'react'
import { FormStyling } from '@/types/form'

interface ThemeApplierProps {
  theme: FormStyling
  children: React.ReactNode
}

export function ThemeApplier({ theme, children }: ThemeApplierProps) {
  useEffect(() => {
    // Generate CSS custom properties from theme
    const root = document.documentElement
    const colors = theme.colors

    // Apply color variables
    root.style.setProperty('--theme-primary', colors.primary)
    root.style.setProperty('--theme-secondary', colors.secondary)
    root.style.setProperty('--theme-background', colors.background)
    root.style.setProperty('--theme-surface', colors.surface)
    root.style.setProperty('--theme-text', colors.text)
    root.style.setProperty('--theme-text-muted', colors.textMuted)
    root.style.setProperty('--theme-border', colors.border)
    root.style.setProperty('--theme-error', colors.error)
    root.style.setProperty('--theme-success', colors.success)
    root.style.setProperty('--theme-accent', colors.accent)

    // Apply font family
    root.style.setProperty('--theme-font-family', theme.fontFamily)

    // Apply font sizes
    root.style.setProperty('--theme-font-size-label', theme.fontSize.label)
    root.style.setProperty('--theme-font-size-input', theme.fontSize.input)
    root.style.setProperty('--theme-font-size-button', theme.fontSize.button)
    root.style.setProperty('--theme-font-size-heading', theme.fontSize.heading)

    // Apply spacing
    root.style.setProperty('--theme-field-gap', theme.spacing.fieldGap)
    root.style.setProperty('--theme-padding', theme.spacing.padding)

    // Apply border radius
    root.style.setProperty('--theme-border-radius-input', theme.borderRadius.input)
    root.style.setProperty('--theme-border-radius-button', theme.borderRadius.button)
    root.style.setProperty('--theme-border-radius-form', theme.borderRadius.form)

    // Apply theme class
    document.body.setAttribute('data-theme', theme.theme)

    // Apply utility classes
    if (theme.shadows) {
      document.body.classList.add('theme-shadows')
    } else {
      document.body.classList.remove('theme-shadows')
    }

    if (theme.animation) {
      document.body.classList.add('theme-animations')
    } else {
      document.body.classList.remove('theme-animations')
    }
  }, [theme])

  return <>{children}</>
}