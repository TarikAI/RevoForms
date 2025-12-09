'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Languages,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Eye,
  EyeOff,
  Play,
  Pause,
  RefreshCw,
  Flag,
  Translate,
  Mic,
  Volume2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Currency,
  FileText,
  Check,
  X
} from 'lucide-react'

interface Translation {
  fieldId: string
  locale: string
  translations: {
    label?: string
    placeholder?: string
    description?: string
    errorMessage?: string
    successMessage?: string
    options?: { value: string; label: string }[]
    [key: string]: any
  }
}

interface RegionalSettings {
  locale: string
  timezone: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY'
  timeFormat: '12h' | '24h'
  currency: string
  numberFormat: '1,234.56' | '1.234,56' | '1234.56' | '1 234.56'
  weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
  rtl: boolean
}

interface LocalizationConfig {
  enabledLocales: string[]
  defaultLocale: string
  autoDetect: boolean
  fallbackLocale: string
  showLocaleSelector: boolean
  regionalSettings: RegionalSettings
  translations: Translation[]
}

interface FormLocalizationProps {
  formId: string
  formFields: any[]
  onLocalizationChange: (config: LocalizationConfig) => void
  initialConfig?: Partial<LocalizationConfig>
}

const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false }
]

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 0 },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: -5 },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -8 },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 0 },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 1 },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: 1 },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 9 },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 8 },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 4 },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 5.5 },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 10 }
]

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' }
]

export function FormLocalization({
  formId,
  formFields,
  onLocalizationChange,
  initialConfig = {}
}: FormLocalizationProps) {
  const [config, setConfig] = useState<LocalizationConfig>({
    enabledLocales: ['en'],
    defaultLocale: 'en',
    autoDetect: true,
    fallbackLocale: 'en',
    showLocaleSelector: true,
    regionalSettings: {
      locale: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      numberFormat: '1,234.56',
      weekStartsOn: 0,
      rtl: false
    },
    translations: [],
    ...initialConfig
  })

  const [selectedLocale, setSelectedLocale] = useState<string | null>(null)
  const [translationMode, setTranslationMode] = useState<'manual' | 'ai'>('manual')
  const [showImportExport, setShowImportExport] = useState(false)

  const enabledLocaleDetails = useMemo(() => {
    return SUPPORTED_LOCALES.filter(locale => config.enabledLocales.includes(locale.code))
  }, [config.enabledLocales])

  const addLocale = (localeCode: string) => {
    if (!config.enabledLocales.includes(localeCode)) {
      const newConfig = {
        ...config,
        enabledLocales: [...config.enabledLocales, localeCode]
      }
      setConfig(newConfig)
      onLocalizationChange(newConfig)
    }
  }

  const removeLocale = (localeCode: string) => {
    if (config.enabledLocales.length > 1) {
      const newConfig = {
        ...config,
        enabledLocales: config.enabledLocales.filter(l => l !== localeCode),
        translations: config.translations.filter(t => t.locale !== localeCode)
      }
      setConfig(newConfig)
      onLocalizationChange(newConfig)
    }
  }

  const updateTranslation = (fieldId: string, locale: string, key: string, value: any) => {
    let translation = config.translations.find(
      t => t.fieldId === fieldId && t.locale === locale
    )

    if (!translation) {
      translation = {
        fieldId,
        locale,
        translations: {}
      }
      config.translations.push(translation)
    }

    translation.translations[key] = value

    const newConfig = { ...config, translations: [...config.translations] }
    setConfig(newConfig)
    onLocalizationChange(newConfig)
  }

  const autoTranslate = async (fieldId: string, fromLocale: string, toLocale: string) => {
    // Mock AI translation - in real app, this would call translation API
    const field = formFields.find(f => f.id === fieldId)
    if (!field) return

    const mockTranslations = {
      es: {
        label: `${field.label} (es)`,
        placeholder: field.placeholder ? `${field.placeholder} (es)` : undefined,
        description: field.description ? `${field.description} (es)` : undefined
      },
      fr: {
        label: `${field.label} (fr)`,
        placeholder: field.placeholder ? `${field.placeholder} (fr)` : undefined,
        description: field.description ? `${field.description} (fr)` : undefined
      },
      de: {
        label: `${field.label} (de)`,
        placeholder: field.placeholder ? `${field.placeholder} (de)` : undefined,
        description: field.description ? `${field.description} (de)` : undefined
      }
    }

    const translations = mockTranslations[toLocale as keyof typeof mockTranslations]
    if (translations) {
      Object.entries(translations).forEach(([key, value]) => {
        if (value) {
          updateTranslation(fieldId, toLocale, key, value)
        }
      })
    }
  }

  const bulkTranslate = async (fromLocale: string, toLocales: string[]) => {
    for (const locale of toLocales) {
      for (const field of formFields) {
        await autoTranslate(field.id, fromLocale, locale)
      }
    }
  }

  const exportTranslations = () => {
    const data = {
      config,
      formFields,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form_${formId}_translations.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importTranslations = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.translations) {
          const newConfig = {
            ...config,
            translations: data.translations
          }
          setConfig(newConfig)
          onLocalizationChange(newConfig)
        }
      } catch (error) {
        console.error('Invalid translation file', error)
      }
    }
    reader.readAsText(file)
  }

  const getProgress = () => {
    const totalTranslations = formFields.length * config.enabledLocales.length
    const completedTranslations = config.translations.length
    return totalTranslations > 0 ? Math.round((completedTranslations / totalTranslations) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white">Form Localization</h3>
          <div className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded-full text-xs font-medium">
            {config.enabledLocales.length} locales
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportExport(true)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Import/Export
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">Translation Progress</span>
          <span className="text-sm font-medium text-white">{getProgress()}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white">Localization Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/60">Default Locale</label>
            <select
              value={config.defaultLocale}
              onChange={(e) => {
                const newConfig = { ...config, defaultLocale: e.target.value }
                setConfig(newConfig)
                onLocalizationChange(newConfig)
              }}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              {enabledLocaleDetails.map(locale => (
                <option key={locale.code} value={locale.code}>
                  {locale.flag} {locale.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Fallback Locale</label>
            <select
              value={config.fallbackLocale}
              onChange={(e) => {
                const newConfig = { ...config, fallbackLocale: e.target.value }
                setConfig(newConfig)
                onLocalizationChange(newConfig)
              }}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              {SUPPORTED_LOCALES.map(locale => (
                <option key={locale.code} value={locale.code}>
                  {locale.flag} {locale.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-white/80">Auto-detect user locale</label>
            <button
              onClick={() => {
                const newConfig = { ...config, autoDetect: !config.autoDetect }
                setConfig(newConfig)
                onLocalizationChange(newConfig)
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                config.autoDetect
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {config.autoDetect ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-white/80">Show locale selector</label>
            <button
              onClick={() => {
                const newConfig = { ...config, showLocaleSelector: !config.showLocaleSelector }
                setConfig(newConfig)
                onLocalizationChange(newConfig)
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                config.showLocaleSelector
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {config.showLocaleSelector ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-4">Regional Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/60">Timezone</label>
            <select
              value={config.regionalSettings.timezone}
              onChange={(e) => {
                const newConfig = {
                  ...config,
                  regionalSettings: { ...config.regionalSettings, timezone: e.target.value }
                }
                setConfig(newConfig)
                onLocalizationChange(newConfig)
              }}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  (UTC{tz.offset >= 0 ? '+' : ''}{tz.offset}) {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Date Format</label>
            <select
              value={config.regionalSettings.dateFormat}
              onChange={(e) => {
                const newConfig = {
                  ...config,
                  regionalSettings: { ...config.regionalSettings, dateFormat: e.target.value as any }
                }
                setConfig(newConfig)
                onLocalizationChange(newConfig)
              }}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Currency</label>
            <select
              value={config.regionalSettings.currency}
              onChange={(e) => {
                const newConfig = {
                  ...config,
                  regionalSettings: { ...config.regionalSettings, currency: e.target.value }
                }
                setConfig(newConfig)
                onLocalizationChange(newConfig)
              }}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enabled Locales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white">Enabled Locales</h4>
          <button
            onClick={() => setTranslationMode(translationMode === 'manual' ? 'ai' : 'manual')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              translationMode === 'ai'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-white/5 text-white/60'
            }`}
          >
            <Translate className="w-4 h-4" />
            {translationMode === 'ai' ? 'AI Translation' : 'Manual'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUPPORTED_LOCALES.map(locale => {
            const isEnabled = config.enabledLocales.includes(locale.code)
            return (
              <div
                key={locale.code}
                className={`p-3 border rounded-lg transition-all ${
                  isEnabled
                    ? 'border-neon-cyan/50 bg-neon-cyan/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{locale.flag}</span>
                    <div>
                      <p className="text-white font-medium">{locale.name}</p>
                      <p className="text-xs text-white/60">{locale.nativeName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => isEnabled ? removeLocale(locale.code) : addLocale(locale.code)}
                    className={`p-2 rounded-lg transition-colors ${
                      isEnabled
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {isEnabled ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {isEnabled && translationMode === 'ai' && (
                  <button
                    onClick={() => bulkTranslate(config.defaultLocale, [locale.code])}
                    className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Auto-Translate All Fields
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Field Translations */}
      {config.enabledLocales.length > 1 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Field Translations</h4>

          {/* Locale Tabs */}
          <div className="flex gap-2 border-b border-white/10">
            {enabledLocaleDetails.map(locale => (
              <button
                key={locale.code}
                onClick={() => setSelectedLocale(selectedLocale === locale.code ? null : locale.code)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  selectedLocale === locale.code
                    ? 'text-neon-cyan border-neon-cyan'
                    : 'text-white/50 border-transparent hover:text-white/80'
                }`}
              >
                <span>{locale.flag}</span>
                {locale.code}
              </button>
            ))}
          </div>

          {/* Translation Fields */}
          <AnimatePresence>
            {selectedLocale && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                {formFields.map(field => {
                  const translation = config.translations.find(
                    t => t.fieldId === field.id && t.locale === selectedLocale
                  )

                  return (
                    <div key={field.id} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <h5 className="text-sm font-medium text-white mb-3">
                        {field.label || `Field ${field.id}`}
                      </h5>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-white/60">Label</label>
                          <input
                            type="text"
                            value={translation?.translations.label || ''}
                            onChange={(e) => updateTranslation(field.id, selectedLocale, 'label', e.target.value)}
                            placeholder="Enter translated label..."
                            className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                          />
                        </div>

                        {field.placeholder && (
                          <div>
                            <label className="text-xs text-white/60">Placeholder</label>
                            <input
                              type="text"
                              value={translation?.translations.placeholder || ''}
                              onChange={(e) => updateTranslation(field.id, selectedLocale, 'placeholder', e.target.value)}
                              placeholder="Enter translated placeholder..."
                              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                            />
                          </div>
                        )}

                        {field.description && (
                          <div>
                            <label className="text-xs text-white/60">Description</label>
                            <textarea
                              value={translation?.translations.description || ''}
                              onChange={(e) => updateTranslation(field.id, selectedLocale, 'description', e.target.value)}
                              placeholder="Enter translated description..."
                              rows={2}
                              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                            />
                          </div>
                        )}

                        {field.options && (
                          <div>
                            <label className="text-xs text-white/60">Options</label>
                            <div className="space-y-2 mt-1">
                              {field.options.map((option: any, idx: number) => (
                                <input
                                  key={idx}
                                  type="text"
                                  value={translation?.translations.options?.[idx]?.label || ''}
                                  onChange={(e) => {
                                    const options = translation?.translations.options || []
                                    options[idx] = { value: option.value || idx.toString(), label: e.target.value }
                                    updateTranslation(field.id, selectedLocale, 'options', options)
                                  }}
                                  placeholder={`Option ${idx + 1}...`}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {translationMode === 'ai' && (
                          <button
                            onClick={() => autoTranslate(field.id, config.defaultLocale, selectedLocale)}
                            className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            <Mic className="w-4 h-4" />
                            Auto-Translate Field
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Import/Export Modal */}
      <AnimatePresence>
        {showImportExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowImportExport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-space-light border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Import/Export Translations</h3>

              <div className="space-y-3">
                <button
                  onClick={exportTranslations}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Translations
                </button>

                <div>
                  <label className="block mb-2 text-sm text-white/60">Import Translations</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        importTranslations(file)
                        setShowImportExport(false)
                      }
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-neon-cyan/20 file:text-neon-cyan"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowImportExport(false)}
                className="w-full mt-4 py-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-100 font-medium mb-1">Localization Tips</p>
          <p className="text-blue-200/70">
            Enable multiple languages to reach a global audience. Use AI translation for quick setup, then
            refine manually for accuracy. Regional settings ensure dates, times, and numbers display correctly for each locale.
          </p>
        </div>
      </div>
    </div>
  )
}