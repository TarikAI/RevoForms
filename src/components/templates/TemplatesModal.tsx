'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Sparkles } from 'lucide-react'
import { formTemplates, getTemplateCategories, type FormTemplate } from '@/data/templates'
import { useFormStore } from '@/store/formStore'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FormTemplate['category'] | 'all'>('all')
  const { addForm } = useFormStore()
  const categories = getTemplateCategories()

  const getCategoryIcon = (category: FormTemplate['category']) => {
    return categories.find(c => c.id === category)?.icon || '📄'
  }

  const filteredTemplates = formTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSelectTemplate = (template: FormTemplate) => {
    const fieldsWithIds = template.fields.map((field, index) => ({
      ...field,
      id: `f_${Date.now()}_${index}`
    }))

    addForm({
      name: template.name,
      description: template.description,
      fields: fieldsWithIds,
      settings: {
        submitButtonText: template.settings?.submitText || 'Submit',
        successMessage: template.settings?.successMessage || 'Thank you!',
        collectEmails: true
      },
      styling: {
        theme: 'modern-dark',
        colors: {
          primary: '#06b6d4',
          secondary: '#8b5cf6',
          background: '#0f0f1a',
          surface: '#1a1a2e',
          text: '#ffffff',
          textMuted: '#a0a0a0',
          border: '#333333',
          error: '#ef4444',
          success: '#22c55e',
          accent: '#06b6d4'
        },
        fontFamily: 'Inter',
        fontSize: { label: '14px', input: '14px', button: '14px', heading: '18px' },
        spacing: { fieldGap: '16px', padding: '20px' },
        borderRadius: { input: '8px', button: '8px', form: '12px' },
        shadows: true,
        animation: true
      },
      size: { width: 420, height: 500 },
      position: { x: 0, y: 0 } // Let the store calculate the correct position
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-x-0 top-14 bottom-0 z-[999999] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[calc(100vh-8rem)] bg-space-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Form Templates</h2>
                  <p className="text-sm text-white/50">Choose a template to get started quickly</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="Search templates..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50" />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedCategory === 'all' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}>
                All Templates
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id as FormTemplate['category'] | 'all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${selectedCategory === cat.id ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}>
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <motion.button key={template.id} onClick={() => handleSelectTemplate(template)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-cyan/30 hover:bg-white/10 transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white group-hover:text-neon-cyan transition-colors truncate">{template.name}</h3>
                      <p className="text-xs text-white/50 line-clamp-2 mt-0.5">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">{template.fields.length} fields</span>
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-white/50">{template.category}</span>
                  </div>
                </motion.button>
              ))}
            </div>
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-white/40"><p>No templates found matching your search</p></div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
