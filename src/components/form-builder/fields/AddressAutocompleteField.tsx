'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Home, Building, Package, X, Loader2, Map } from 'lucide-react'
import Script from 'next/script'

interface AddressAutocompleteFieldProps {
  field: any
  value?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    formatted?: string
    lat?: number
    lng?: number
    placeId?: string
  }
  onChange?: (value: any) => void
  error?: string
  disabled?: boolean
}

interface GooglePlaceResult {
  address_components: GoogleAddressComponent[]
  formatted_address: string
  place_id: string
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export function AddressAutocompleteField({ field, value = {}, onChange, error, disabled }: AddressAutocompleteFieldProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<GooglePlaceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState(value?.formatted || value?.street || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)

  const {
    apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    countries = [],
    types = ['address'],
    enableCoordinates = true,
    enableManualEntry = true,
    placeholder = 'Start typing your address...',
    showMap = false,
    language = 'en'
  } = field

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsScriptLoaded(true)
      initializeAutocomplete()
    }
  }, [])

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return

    const autocompleteInstance = new (window.google as any).maps.places.Autocomplete(
      inputRef.current,
      {
        types: types,
        fields: ['address_components', 'formatted_address', 'place_id', 'geometry'],
        componentRestrictions: countries.length > 0 ? { country: countries } : undefined,
        language
      }
    )

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      if (place && place.address_components) {
        handlePlaceSelected(place)
      }
    })

    setAutocomplete(autocompleteInstance)
  }

  const handlePlaceSelected = (place: GooglePlaceResult) => {
    const addressData = parseAddressComponents(place.address_components)
    const finalValue = {
      ...addressData,
      formatted: place.formatted_address,
      placeId: place.place_id,
      lat: place.geometry?.location.lat(),
      lng: place.geometry?.location.lng()
    }

    onChange?.(finalValue)
    setQuery(place.formatted_address)
    setShowSuggestions(false)
    setIsLoading(false)
  }

  const parseAddressComponents = (components: GoogleAddressComponent[]) => {
    const address: any = {}

    components.forEach(component => {
      const types = component.types

      if (types.includes('street_number')) {
        address.street = `${component.long_name} ${address.street || ''}`.trim()
      } else if (types.includes('route')) {
        address.street = `${address.street || ''} ${component.long_name}`.trim()
      } else if (types.includes('locality')) {
        address.city = component.long_name
      } else if (types.includes('administrative_area_level_1')) {
        address.state = component.short_name
      } else if (types.includes('postal_code')) {
        address.postalCode = component.long_name
      } else if (types.includes('country')) {
        address.country = component.short_name
      } else if (types.includes('subpremise')) {
        address.street = `${address.street || ''} Apt ${component.long_name}`.trim()
      }
    })

    return address
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsLoading(true)

    if (value.length > 2) {
      // Simulate API call (replace with actual Google Places API)
      setTimeout(() => {
        setSuggestions([]) // Replace with actual suggestions
        setIsLoading(false)
        setShowSuggestions(false)
      }, 500)
    } else {
      setSuggestions([])
      setIsLoading(false)
      setShowSuggestions(false)
    }
  }

  const handleManualFieldChange = (field: string, val: string) => {
    const updatedValue = {
      ...value,
      [field]: val,
      formatted: `${value.street || ''}, ${value.city || ''}, ${value.state || ''} ${value.postalCode || ''}`.trim()
    }
    onChange?.(updatedValue)
  }

  const handleSuggestionClick = (suggestion: GooglePlaceResult) => {
    handlePlaceSelected(suggestion)
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/90">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {enableManualEntry && (
          <button
            onClick={() => setIsManualMode(!isManualMode)}
            className={`text-xs px-3 py-1 rounded-lg transition-colors ${
              isManualMode
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {isManualMode ? 'Use Autocomplete' : 'Enter Manually'}
          </button>
        )}
      </div>

      {!isManualMode ? (
        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              disabled={disabled}
              placeholder={placeholder}
              className={`w-full pl-10 pr-10 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none transition-colors ${
                error ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan/50'
              } disabled:opacity-50`}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan animate-spin" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                ref={suggestionRef}
                className="absolute z-10 w-full mt-2 p-2 bg-space-light border border-white/20 rounded-xl shadow-xl max-h-64 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors flex items-start gap-2"
                  >
                    <MapPin className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <span>{suggestion.formatted_address}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={value?.street || ''}
            onChange={(e) => handleManualFieldChange('street', e.target.value)}
            disabled={disabled}
            placeholder="Street Address"
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none transition-colors ${
              error ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan/50'
            }`}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value?.city || ''}
              onChange={(e) => handleManualFieldChange('city', e.target.value)}
              disabled={disabled}
              placeholder="City"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none transition-colors ${
                error ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan/50'
              }`}
            />
            <input
              type="text"
              value={value?.state || ''}
              onChange={(e) => handleManualFieldChange('state', e.target.value)}
              disabled={disabled}
              placeholder="State"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none transition-colors ${
                error ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan/50'
              }`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value?.postalCode || ''}
              onChange={(e) => handleManualFieldChange('postalCode', e.target.value)}
              disabled={disabled}
              placeholder="ZIP/Postal Code"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none transition-colors ${
                error ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan/50'
              }`}
            />
            <input
              type="text"
              value={value?.country || ''}
              onChange={(e) => handleManualFieldChange('country', e.target.value)}
              disabled={disabled}
              placeholder="Country"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none transition-colors ${
                error ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan/50'
              }`}
            />
          </div>
        </div>
      )}

      {/* Address Preview */}
      {value?.formatted && (
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-start gap-2">
            <Home className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
            <div className="text-sm text-white/80">
              <p className="font-medium">Selected Address:</p>
              <p className="text-white/60">{value.formatted}</p>
              {enableCoordinates && value.lat && value.lng && (
                <p className="text-xs text-white/40 mt-1">
                  Coordinates: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Address Types */}
      {!isManualMode && (
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'home', label: 'Home', icon: Home },
            { type: 'work', label: 'Work', icon: Building },
            { type: 'other', label: 'Other', icon: Package }
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                value?.addressType === type
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              onClick={() => onChange?.({ ...value, addressType: type })}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-400"
        >
          <X className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40">{field.helpText}</p>
      )}

      {/* Google Maps Script */}
      {apiKey && !isScriptLoaded && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${language}`}
          onLoad={() => setIsScriptLoaded(true)}
          onError={() => console.error('Failed to load Google Maps API')}
        />
      )}
    </div>
  )
}

// Extend window interface for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (element: HTMLInputElement, options: any) => {
            getPlace: () => GooglePlaceResult
            addListener: (eventName: string, handler: () => void) => void
          }
        }
      }
    }
  }
}