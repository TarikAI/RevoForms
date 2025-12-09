import { useState, useEffect } from 'react'
import { createTranslation } from 'next-intl/server'

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'ja' | 'zh' | 'ko' | 'ar' | 'hi' | 'ru'

export const defaultLocale: Locale = 'en'

export const locales: Locale[] = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl',
  'ja', 'zh', 'ko', 'ar', 'hi', 'ru'
]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  ar: 'العربية',
  hi: 'हिंदी',
  ru: 'Русский'
}

// Translation cache
const translations: Record<string, Record<string, string>> = {}

// Load translations dynamically
export async function getTranslations(locale: Locale = defaultLocale) {
  if (translations[locale]) {
    return translations[locale]
  }

  try {
    const translationsModule = await import(`../messages/${locale}.json`)
    translations[locale] = translationsModule.default
    return translations[locale]
  } catch (error) {
    console.warn(`Translations not found for locale: ${locale}, falling back to English`)
    const englishTranslations = await import('../messages/en.json')
    translations[locale] = englishTranslations.default
    return englishTranslations.default
  }
}

// Translation hook for components
export function useTranslations(locale: Locale = defaultLocale) {
  const [t, setT] = useState<Record<string, string>>({})

  useEffect(() => {
    getTranslations(locale).then(setT)
  }, [locale])

  return t
}

// Helper function to get translated text
export function t(key: string, locale: Locale = defaultLocale, params?: Record<string, string>) {
  const translation = translations[locale]?.[key] || key

  if (params) {
    return Object.entries(params).reduce(
      (str, [param, value]) => str.replace(`{{${param}}}`, value),
      translation
    )
  }

  return translation
}

// Format utilities for different locales
export const formatUtils = {
  // Format date based on locale
  formatDate: (date: Date, locale: Locale = defaultLocale): string => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  },

  // Format number based on locale
  formatNumber: (num: number, locale: Locale = defaultLocale): string => {
    return new Intl.NumberFormat(locale).format(num)
  },

  // Format currency based on locale
  formatCurrency: (
    amount: number,
    currency: string = 'USD',
    locale: Locale = defaultLocale
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount)
  },

  // Format time based on locale
  formatTime: (date: Date, locale: Locale = defaultLocale): string => {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  },

  // Get text direction for RTL languages
  getTextDirection: (locale: Locale): 'ltr' | 'rtl' => {
    return ['ar'].includes(locale) ? 'rtl' : 'ltr'
  },

  // Get locale-specific validation patterns
  getValidationPatterns: (locale: Locale) => {
    const patterns = {
      phone: {
        en: /^\+?[\d\s-()]+$/,
        es: /^\+?[\d\s-()]+$/,
        fr: /^\+?[\d\s-()]+$/,
        de: /^\+?[\d\s-()]+$/,
        it: /^\+?[\d\s-()]+$/,
        pt: /^\+?[\d\s-()]+$/,
        nl: /^\+?[\d\s-()]+$/,
        ja: /^[\d-]+$/,
        zh: /^[\d-]+$/,
        ko: /^[\d-]+$/,
        ar: /^[\d-٠-٩]+$/,
        hi: /^[\d-]+$/,
        ru: /^\+?[\d\s-()]+$/
      },
      postalCode: {
        en: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
        es: /^\d{5}$/,
        fr: /^\d{5}$/,
        de: /^\d{5}$/,
        it: /^\d{5}$/,
        pt: /^\d{4}-\d{3}$/,
        nl: /^\d{4}\s?[A-Z]{2}$/,
        ja: /^\d{3}-\d{4}$/,
        zh: /^\d{6}$/,
        ko: /^\d{5}$/,
        ar: /^\d{5}$/,
        hi: /^\d{6}$/,
        ru: /^\d{6}$/
      }
    }

    return patterns
  }
}

// Server-side translation helper
export async function getServerTranslations(locale: Locale = defaultLocale) {
  const t = await createTranslation({ locale })
  return t
}