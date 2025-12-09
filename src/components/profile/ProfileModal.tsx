'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, User, MapPin, Briefcase, GraduationCap, FileText, Settings,
  Plus, Trash2, Upload, Check, AlertCircle, PenTool, Edit3, 
  File, Image, Calendar, Link, List, Code, Save, Eye, Download
} from 'lucide-react'
import { useProfileStore, getProfileCompleteness } from '@/store/profileStore'
import type { CustomFieldInfo, DocumentInfo, HandwritingInfo, SavedUploadedForm } from '@/store/profileStore'

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'handwriting', label: 'Handwriting', icon: PenTool },
  { id: 'custom', label: 'Custom', icon: Settings },
  { id: 'saved-forms', label: 'Saved Forms', icon: Save },
] as const

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
  'France', 'Japan', 'China', 'India', 'Brazil', 'Saudi Arabia', 'UAE',
  'South Korea', 'Singapore', 'Netherlands', 'Switzerland', 'Egypt', 
  'Turkey', 'Mexico', 'Spain', 'Italy', 'Other'
]

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Media', 'Transportation', 'Energy', 
  'Legal', 'Consulting', 'Government', 'Non-Profit', 'Other'
]

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const DOCUMENT_TYPES = [
  { value: 'cv', label: 'CV / Resume' },
  { value: 'id', label: 'ID Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'license', label: 'License' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
]

const HANDWRITING_TYPES = [
  { value: 'signature', label: 'Signature' },
  { value: 'initials', label: 'Initials' },
  { value: 'handwriting_sample', label: 'Handwriting Sample' },
  { value: 'custom', label: 'Custom Style' },
]

const CUSTOM_FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Edit3 },
  { value: 'number', label: 'Number', icon: Code },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'url', label: 'URL', icon: Link },
  { value: 'file', label: 'File', icon: File },
  { value: 'list', label: 'List', icon: List },
  { value: 'json', label: 'JSON', icon: Code },
]

// Styles
const inputClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none transition-colors"
const selectClass = "w-full px-3 py-2.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-white text-sm focus:border-neon-cyan/50 focus:outline-none appearance-none cursor-pointer"
const labelClass = "block text-xs font-medium text-white/60 mb-1.5"
const buttonClass = "px-4 py-2 rounded-lg text-sm font-medium transition-all"

export function ProfileModal() {
  const {
    profile, isProfileModalOpen, activeProfileTab,
    closeProfileModal, setActiveProfileTab, initProfile,
    updatePersonal, updateAddress, updateProfessional,
    addEducation, updateEducation, removeEducation,
    addDocument, updateDocument, removeDocument,
    addHandwriting, removeHandwriting,
    setCustomField, removeCustomField,
    removeSavedForm
  } = useProfileStore()

  // Local state for form inputs
  const [localPersonal, setLocalPersonal] = useState(profile?.personal || {})
  const [localAddress, setLocalAddress] = useState(profile?.address || {})
  const [localProfessional, setLocalProfessional] = useState(profile?.professional || {})
  
  // Document upload state
  const [docDisplayName, setDocDisplayName] = useState('')
  const [docType, setDocType] = useState<DocumentInfo['type']>('other')
  const [docExpiration, setDocExpiration] = useState('')
  
  // Handwriting upload state
  const [hwName, setHwName] = useState('')
  const [hwType, setHwType] = useState<HandwritingInfo['type']>('signature')
  
  // Custom field state
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldType, setNewFieldType] = useState<CustomFieldInfo['type']>('text')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [newFieldFile, setNewFieldFile] = useState<{data: string; name: string} | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const hwInputRef = useRef<HTMLInputElement>(null)
  const customFileInputRef = useRef<HTMLInputElement>(null)

  // Sync local state when profile changes
  useEffect(() => {
    if (profile) {
      setLocalPersonal(profile.personal)
      setLocalAddress(profile.address)
      setLocalProfessional(profile.professional)
    }
  }, [profile?.personal, profile?.address, profile?.professional])

  useEffect(() => {
    if (isProfileModalOpen && !profile) initProfile()
  }, [isProfileModalOpen, profile, initProfile])

  // Save functions
  const savePersonal = useCallback((updates: any) => {
    setLocalPersonal((prev: any) => ({ ...prev, ...updates }))
    updatePersonal(updates)
  }, [updatePersonal])

  const saveAddress = useCallback((updates: any) => {
    setLocalAddress((prev: any) => ({ ...prev, ...updates }))
    updateAddress(updates)
  }, [updateAddress])

  const saveProfessional = useCallback((updates: any) => {
    setLocalProfessional((prev: any) => ({ ...prev, ...updates }))
    updateProfessional(updates)
  }, [updateProfessional])

  if (!isProfileModalOpen) return null
  const completeness = getProfileCompleteness(profile)

  // Document upload handler
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = () => {
      addDocument({
        name: file.name,
        displayName: docDisplayName || file.name.split('.')[0],
        type: docType,
        data: reader.result as string,
        expirationDate: docExpiration || undefined,
      })
      setDocDisplayName('')
      setDocType('other')
      setDocExpiration('')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handwriting upload handler
  const handleHwUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      addHandwriting({
        name: hwName || hwType,
        type: hwType,
        data: reader.result as string,
      })
      setHwName('')
      setHwType('signature')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Custom field file handler
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = () => {
      setNewFieldFile({
        data: reader.result as string,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Add custom field
  const handleAddCustomField = () => {
    if (!newFieldKey.trim()) return
    
    const field: Omit<CustomFieldInfo, 'key'> = {
      type: newFieldType,
      value: newFieldType === 'file' ? '' : newFieldValue,
      fileData: newFieldType === 'file' ? newFieldFile?.data : undefined,
      fileName: newFieldType === 'file' ? newFieldFile?.name : undefined,
    }
    
    setCustomField(newFieldKey.trim(), field)
    setNewFieldKey('')
    setNewFieldValue('')
    setNewFieldFile(null)
    setNewFieldType('text')
  }

  // Add education
  const handleAddEducation = () => {
    addEducation({ institution: '', degree: '', field: '', startYear: '', endYear: '', gpa: '' })
  }

  // Tab renderers
  const renderPersonalTab = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>First Name</label>
        <input type="text" value={localPersonal.firstName || ''} placeholder="John"
          onChange={(e) => savePersonal({ firstName: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Last Name</label>
        <input type="text" value={localPersonal.lastName || ''} placeholder="Doe"
          onChange={(e) => savePersonal({ lastName: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input type="email" value={localPersonal.email || ''} placeholder="john@example.com"
          onChange={(e) => savePersonal({ email: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Phone</label>
        <input type="tel" value={localPersonal.phone || ''} placeholder="+1 555 123 4567"
          onChange={(e) => savePersonal({ phone: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Date of Birth</label>
        <input type="date" value={localPersonal.dateOfBirth || ''}
          onChange={(e) => savePersonal({ dateOfBirth: e.target.value })}
          className={`${inputClass} [color-scheme:dark]`} />
      </div>
      <div>
        <label className={labelClass}>Nationality</label>
        <select value={localPersonal.nationality || ''} onChange={(e) => savePersonal({ nationality: e.target.value })} 
          className={selectClass} style={{ backgroundColor: '#1a1a2e' }}>
          <option value="" className="bg-[#1a1a2e] text-white">Select...</option>
          {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#1a1a2e] text-white">{c}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Gender</label>
        <select value={localPersonal.gender || ''} onChange={(e) => savePersonal({ gender: e.target.value })} 
          className={selectClass} style={{ backgroundColor: '#1a1a2e' }}>
          <option value="" className="bg-[#1a1a2e] text-white">Select...</option>
          {GENDERS.map(g => <option key={g} value={g} className="bg-[#1a1a2e] text-white">{g}</option>)}
        </select>
      </div>
    </div>
  )

  const renderAddressTab = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className={labelClass}>Street Address</label>
        <input type="text" value={localAddress.street || ''} placeholder="123 Main Street"
          onChange={(e) => saveAddress({ street: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Apt/Suite</label>
        <input type="text" value={localAddress.apartment || ''} placeholder="Apt 4B"
          onChange={(e) => saveAddress({ apartment: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>City</label>
        <input type="text" value={localAddress.city || ''} placeholder="New York"
          onChange={(e) => saveAddress({ city: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>State/Province</label>
        <input type="text" value={localAddress.state || ''} placeholder="NY"
          onChange={(e) => saveAddress({ state: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Postal Code</label>
        <input type="text" value={localAddress.postalCode || ''} placeholder="10001"
          onChange={(e) => saveAddress({ postalCode: e.target.value })} className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className={labelClass}>Country</label>
        <select value={localAddress.country || ''} onChange={(e) => saveAddress({ country: e.target.value })} 
          className={selectClass} style={{ backgroundColor: '#1a1a2e' }}>
          <option value="" className="bg-[#1a1a2e] text-white">Select...</option>
          {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#1a1a2e] text-white">{c}</option>)}
        </select>
      </div>
    </div>
  )

  const renderProfessionalTab = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>Job Title</label>
        <input type="text" value={localProfessional.jobTitle || ''} placeholder="Software Engineer"
          onChange={(e) => saveProfessional({ jobTitle: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Company</label>
        <input type="text" value={localProfessional.company || ''} placeholder="Acme Inc"
          onChange={(e) => saveProfessional({ company: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Industry</label>
        <select value={localProfessional.industry || ''} onChange={(e) => saveProfessional({ industry: e.target.value })} 
          className={selectClass} style={{ backgroundColor: '#1a1a2e' }}>
          <option value="" className="bg-[#1a1a2e] text-white">Select...</option>
          {INDUSTRIES.map(i => <option key={i} value={i} className="bg-[#1a1a2e] text-white">{i}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Department</label>
        <input type="text" value={localProfessional.department || ''} placeholder="Engineering"
          onChange={(e) => saveProfessional({ department: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Years of Experience</label>
        <input type="text" value={localProfessional.yearsExperience || ''} placeholder="5"
          onChange={(e) => saveProfessional({ yearsExperience: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>LinkedIn URL</label>
        <input type="url" value={localProfessional.linkedIn || ''} placeholder="linkedin.com/in/..."
          onChange={(e) => saveProfessional({ linkedIn: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Website</label>
        <input type="url" value={localProfessional.website || ''} placeholder="https://..."
          onChange={(e) => saveProfessional({ website: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Portfolio</label>
        <input type="url" value={localProfessional.portfolio || ''} placeholder="https://..."
          onChange={(e) => saveProfessional({ portfolio: e.target.value })} className={inputClass} />
      </div>
    </div>
  )

  const renderEducationTab = () => (
    <div className="space-y-4">
      {(profile?.education || []).map((edu, idx) => (
        <div key={edu.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">Education #{idx + 1}</span>
            <button onClick={() => removeEducation(edu.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input type="text" placeholder="Institution" value={edu.institution}
                onChange={(e) => updateEducation(edu.id, { institution: e.target.value })} className={inputClass} />
            </div>
            <input type="text" placeholder="Degree" value={edu.degree}
              onChange={(e) => updateEducation(edu.id, { degree: e.target.value })} className={inputClass} />
            <input type="text" placeholder="Field of Study" value={edu.field}
              onChange={(e) => updateEducation(edu.id, { field: e.target.value })} className={inputClass} />
            <input type="text" placeholder="Start Year" value={edu.startYear}
              onChange={(e) => updateEducation(edu.id, { startYear: e.target.value })} className={inputClass} />
            <input type="text" placeholder="End Year" value={edu.endYear}
              onChange={(e) => updateEducation(edu.id, { endYear: e.target.value })} className={inputClass} />
          </div>
        </div>
      ))}
      <button onClick={handleAddEducation}
        className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Education
      </button>
    </div>
  )

  const renderDocumentsTab = () => (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-neon-cyan" /> Upload New Document
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Display Name (e.g., "My CV", "ID Card")</label>
            <input type="text" value={docDisplayName} placeholder="My CV"
              onChange={(e) => setDocDisplayName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentInfo['type'])}
              className={selectClass} style={{ backgroundColor: '#1a1a2e' }}>
              {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#1a1a2e] text-white">{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Expiration Date (optional)</label>
            <input type="date" value={docExpiration}
              onChange={(e) => setDocExpiration(e.target.value)}
              className={`${inputClass} [color-scheme:dark]`} />
          </div>
          <div className="flex items-end">
            <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
              onChange={handleDocUpload} className="hidden" />
            <button onClick={() => docInputRef.current?.click()}
              className={`${buttonClass} w-full bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 flex items-center justify-center gap-2`}>
              <Upload className="w-4 h-4" /> Choose File
            </button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {(profile?.documents || []).map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{doc.displayName || doc.name}</p>
                <p className="text-xs text-white/50">
                  {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                  {doc.expirationDate && ` • Expires: ${doc.expirationDate}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {doc.data && (
                <a href={doc.data} download={doc.name} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white">
                  <Download className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => removeDocument(doc.id)} className="p-1.5 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {(!profile?.documents || profile.documents.length === 0) && (
          <p className="text-center text-white/40 py-6">No documents uploaded yet</p>
        )}
      </div>
    </div>
  )

  const renderHandwritingTab = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 rounded-xl border border-white/10">
        <p className="text-sm text-white/70">
          <PenTool className="w-4 h-4 inline mr-2 text-neon-cyan" />
          Upload samples of your handwriting, signature, or initials. The AI will use these when filling forms that require handwritten text.
        </p>
      </div>

      {/* Upload Section */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
        <h4 className="text-sm font-medium text-white">Add Handwriting Sample</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Name (optional)</label>
            <input type="text" value={hwName} placeholder="My Signature"
              onChange={(e) => setHwName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={hwType} onChange={(e) => setHwType(e.target.value as HandwritingInfo['type'])}
              className={selectClass} style={{ backgroundColor: '#1a1a2e' }}>
              {HANDWRITING_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#1a1a2e] text-white">{t.label}</option>)}
            </select>
          </div>
        </div>
        <input ref={hwInputRef} type="file" accept="image/*" onChange={handleHwUpload} className="hidden" />
        <button onClick={() => hwInputRef.current?.click()}
          className={`${buttonClass} w-full bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 flex items-center justify-center gap-2`}>
          <Image className="w-4 h-4" /> Upload Image
        </button>
      </div>

      {/* Handwriting List */}
      <div className="grid grid-cols-2 gap-3">
        {(profile?.handwriting || []).map((hw) => (
          <div key={hw.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
            {hw.data && (
              <img src={hw.data} alt={hw.name} className="w-full h-20 object-contain bg-white rounded mb-2" />
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{hw.name}</p>
                <p className="text-xs text-white/50">{HANDWRITING_TYPES.find(t => t.value === hw.type)?.label}</p>
              </div>
              <button onClick={() => removeHandwriting(hw.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {(!profile?.handwriting || profile.handwriting.length === 0) && (
        <p className="text-center text-white/40 py-6">No handwriting samples yet</p>
      )}
    </div>
  )

  const renderCustomTab = () => (
    <div className="space-y-4">
      {/* Add Custom Field */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
        <h4 className="text-sm font-medium text-white">Add Custom Field</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Field Name</label>
            <input type="text" value={newFieldKey} placeholder="e.g., Driver's License #"
              onChange={(e) => setNewFieldKey(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as CustomFieldInfo['type'])}
              className={selectClass} style={{ backgroundColor: '#1a1a2e' }}>
              {CUSTOM_FIELD_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#1a1a2e] text-white">{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Value</label>
            {newFieldType === 'file' ? (
              <div className="flex gap-2">
                <input ref={customFileInputRef} type="file" onChange={handleCustomFileUpload} className="hidden" />
                <button onClick={() => customFileInputRef.current?.click()}
                  className={`${inputClass} text-center ${newFieldFile ? 'text-neon-cyan' : 'text-white/50'}`}>
                  {newFieldFile ? newFieldFile.name.slice(0, 15) + '...' : 'Choose file...'}
                </button>
              </div>
            ) : newFieldType === 'date' ? (
              <input type="date" value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                className={`${inputClass} [color-scheme:dark]`} />
            ) : (
              <input type={newFieldType === 'number' ? 'number' : newFieldType === 'url' ? 'url' : 'text'} 
                value={newFieldValue} placeholder="Value..."
                onChange={(e) => setNewFieldValue(e.target.value)} className={inputClass} />
            )}
          </div>
        </div>
        <button onClick={handleAddCustomField} disabled={!newFieldKey.trim()}
          className={`${buttonClass} w-full bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>
          <Plus className="w-4 h-4" /> Add Field
        </button>
      </div>

      {/* Custom Fields List */}
      <div className="space-y-2">
        {Object.entries(profile?.customFields || {}).map(([key, field]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                {CUSTOM_FIELD_TYPES.find(t => t.value === field.type)?.icon && 
                  (() => { const Icon = CUSTOM_FIELD_TYPES.find(t => t.value === field.type)!.icon; return <Icon className="w-4 h-4 text-neon-purple" /> })()
                }
              </div>
              <div>
                <p className="text-sm font-medium text-white">{key}</p>
                <p className="text-xs text-white/50">
                  {field.type === 'file' ? field.fileName : field.value?.toString().slice(0, 30)}
                  {field.value && field.value.toString().length > 30 && '...'}
                </p>
              </div>
            </div>
            <button onClick={() => removeCustomField(key)} className="p-1.5 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {(!profile?.customFields || Object.keys(profile.customFields).length === 0) && (
          <p className="text-center text-white/40 py-6">No custom fields added yet</p>
        )}
      </div>
    </div>
  )

  const renderSavedFormsTab = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 rounded-xl border border-white/10">
        <p className="text-sm text-white/70">
          <Save className="w-4 h-4 inline mr-2 text-neon-cyan" />
          Forms you've uploaded are saved here for future editing or re-processing.
        </p>
      </div>

      <div className="space-y-2">
        {(profile?.savedForms || []).map((form) => (
          <div key={form.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                {form.fileType === 'image' && form.originalFileData ? (
                  <img src={form.originalFileData} alt={form.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{form.name}</p>
                <p className="text-xs text-white/50">
                  {form.originalFileName} • {new Date(form.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {form.originalFileData && (
                <a href={form.originalFileData} download={form.originalFileName} 
                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white" title="Download original">
                  <Download className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => removeSavedForm(form.id)} 
                className="p-1.5 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400" title="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {(!profile?.savedForms || profile.savedForms.length === 0) && (
          <p className="text-center text-white/40 py-6">No saved forms yet. Upload a form to save it here.</p>
        )}
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeProfileTab) {
      case 'personal': return renderPersonalTab()
      case 'address': return renderAddressTab()
      case 'professional': return renderProfessionalTab()
      case 'education': return renderEducationTab()
      case 'documents': return renderDocumentsTab()
      case 'handwriting': return renderHandwritingTab()
      case 'custom': return renderCustomTab()
      case 'saved-forms': return renderSavedFormsTab()
      default: return renderPersonalTab()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && closeProfileModal()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-3xl bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5">
            <div>
              <h2 className="text-lg font-semibold text-white">My Profile</h2>
              <p className="text-sm text-white/50">Your info is stored locally and used for auto-fill</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all"
                    style={{ width: `${completeness}%` }} />
                </div>
                <span className="text-xs text-white/60">{completeness}%</span>
              </div>
              <button onClick={closeProfileModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeProfileTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveProfileTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    isActive 
                      ? 'text-neon-cyan border-neon-cyan bg-neon-cyan/5' 
                      : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/5">
            <p className="text-xs text-white/40">
              <Check className="w-3 h-3 inline mr-1 text-green-400" />
              Auto-saved locally
            </p>
            <button onClick={closeProfileModal}
              className={`${buttonClass} bg-gradient-to-r from-neon-cyan to-neon-purple text-white`}>
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
