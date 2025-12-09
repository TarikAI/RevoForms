'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Heart,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Users,
  Zap,
  Grid3X3,
  List,
  ArrowRight,
  Tag,
  TrendingUp,
  Crown,
  Sparkles
} from 'lucide-react'
import type { CanvasForm } from '@/types/form'

interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  preview: string
  fields: any[]
  thumbnail: string
  author: string
  authorAvatar: string
  rating: number
  downloads: number
  likes: number
  isPro: boolean
  isNew: boolean
  isTrending: boolean
  createdAt: string
  lastUpdated: string
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void
  onClose: () => void
}

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Grid3X3 },
  { id: 'contact', name: 'Contact Forms', icon: Users },
  { id: 'survey', name: 'Surveys', icon: TrendingUp },
  { id: 'application', name: 'Applications', icon: Copy },
  { id: 'feedback', name: 'Feedback', icon: Star },
  { id: 'registration', name: 'Registration', icon: Check },
  { id: 'order', name: 'Order Forms', icon: ArrowRight },
  { id: 'quiz', name: 'Quizzes', icon: Zap },
  { id: 'event', name: 'Events', icon: Calendar },
  { id: 'other', name: 'Other', icon: Tag }
]

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Customer Feedback Survey',
    description: 'Collect valuable customer feedback with ratings and comments',
    category: 'feedback',
    tags: ['customer', 'feedback', 'satisfaction', 'nps'],
    preview: '/templates/feedback-preview.png',
    fields: [
      { type: 'rating', label: 'How satisfied are you?', required: true },
      { type: 'textarea', label: 'Tell us more about your experience', required: false },
      { type: 'radio', label: 'Would you recommend us?', options: ['Yes', 'Maybe', 'No'], required: true },
      { type: 'text', label: 'Email (optional)', required: false }
    ],
    thumbnail: '/templates/feedback-thumb.jpg',
    author: 'RevoForms Team',
    authorAvatar: '/avatars/team.jpg',
    rating: 4.8,
    downloads: 15234,
    likes: 892,
    isPro: false,
    isNew: true,
    isTrending: true,
    createdAt: '2024-01-15',
    lastUpdated: '2024-01-20'
  },
  {
    id: '2',
    name: 'Job Application Form',
    description: 'Comprehensive job application with resume upload and references',
    category: 'application',
    tags: ['hr', 'recruitment', 'jobs', 'application'],
    preview: '/templates/job-preview.png',
    fields: [
      { type: 'text', label: 'Full Name', required: true },
      { type: 'email', label: 'Email', required: true },
      { type: 'phone', label: 'Phone', required: true },
      { type: 'file', label: 'Resume/CV', required: true },
      { type: 'textarea', label: 'Cover Letter', required: false },
      { type: 'url', label: 'LinkedIn Profile', required: false }
    ],
    thumbnail: '/templates/job-thumb.jpg',
    author: 'Sarah Johnson',
    authorAvatar: '/avatars/sarah.jpg',
    rating: 4.9,
    downloads: 23456,
    likes: 1456,
    isPro: true,
    isNew: false,
    isTrending: false,
    createdAt: '2023-12-01',
    lastUpdated: '2024-01-10'
  },
  {
    id: '3',
    name: 'Event Registration',
    description: 'Register attendees for your event with ticket selection',
    category: 'registration',
    tags: ['event', 'registration', 'tickets', 'attendees'],
    preview: '/templates/event-preview.png',
    fields: [
      { type: 'text', label: 'First Name', required: true },
      { type: 'text', label: 'Last Name', required: true },
      { type: 'email', label: 'Email', required: true },
      { type: 'select', label: 'Ticket Type', options: ['General', 'VIP', 'Student'], required: true },
      { type: 'checkbox', label: 'Dietary Restrictions', options: ['Vegetarian', 'Vegan', 'Gluten-Free'], required: false }
    ],
    thumbnail: '/templates/event-thumb.jpg',
    author: 'Mike Chen',
    authorAvatar: '/avatars/mike.jpg',
    rating: 4.7,
    downloads: 9876,
    likes: 567,
    isPro: false,
    isNew: false,
    isTrending: true,
    createdAt: '2024-01-05',
    lastUpdated: '2024-01-18'
  }
]

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'name'>('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const filteredTemplates = useMemo(() => {
    let filtered = [...MOCK_TEMPLATES]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(t =>
        selectedTags.every(tag => t.tags.includes(tag))
      )
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads)
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return filtered
  }, [selectedCategory, searchQuery, sortBy, selectedTags])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    MOCK_TEMPLATES.forEach(template => {
      template.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-7xl max-h-[90vh] bg-space-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Template Gallery</h2>
                <p className="text-sm text-white/60">Choose from professional form templates</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-white/60 rotate-45" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  showFilters || selectedTags.length > 0
                    ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {selectedTags.length > 0 && (
                  <span className="px-2 py-0.5 bg-neon-cyan/30 rounded-full text-xs">
                    {selectedTags.length}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 focus:outline-none focus:border-neon-cyan/50"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Alphabetical</option>
              </select>

              <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/50'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {CATEGORIES.map(category => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              )
            })}
          </div>

          {/* Tag Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <p className="text-sm font-medium text-white/60 mb-3">Filter by tags:</p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Templates Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
              <p className="text-white/60">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredTemplates.map(template => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-neon-cyan/50 transition-all ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Template Preview */}
                  <div className={`relative ${
                    viewMode === 'list' ? 'w-48 h-32' : 'h-48'
                  } bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10`}>
                    {template.isPro && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3 text-black" />
                          <span className="text-xs font-semibold text-black">PRO</span>
                        </div>
                      </div>
                    )}
                    {template.isNew && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="px-2 py-1 bg-green-500 rounded-full">
                          <span className="text-xs font-semibold text-white">NEW</span>
                        </div>
                      </div>
                    )}
                    {template.isTrending && (
                      <div className="absolute top-2 right-2 z-10" style={{ top: template.isPro ? '40px' : '8px' }}>
                        <div className="px-2 py-1 bg-red-500 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-white" />
                          <span className="text-xs font-semibold text-white">TRENDING</span>
                        </div>
                      </div>
                    )}
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <Grid3X3 className="w-12 h-12" />
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4 flex-1">
                    <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">{template.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Author and Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-neon-cyan">
                            {template.author.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-white/60">{template.author}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{template.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{template.downloads.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectTemplate(template)}
                        className="flex-1 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        Use Template
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-white/60" />
                      </button>
                      <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <Heart className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}