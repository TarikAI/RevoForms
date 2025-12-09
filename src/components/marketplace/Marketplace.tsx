'use client'

import React, { useState, useEffect } from 'react'
import {
  Store,
  Search,
  Filter,
  Star,
  Download,
  ShoppingCart,
  Eye,
  Heart,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Zap,
  Shield,
  Sparkles,
  Crown,
  Package,
  Code2,
  Palette,
  Globe,
  CreditCard,
  FileText,
  Minus
} from 'lucide-react'

interface Plugin {
  id: string
  name: string
  description: string
  category: 'template' | 'field' | 'integration' | 'theme' | 'automation' | 'analytics'
  icon: React.ReactNode
  author: {
    name: string
    avatar?: string
    verified: boolean
  }
  price: {
    type: 'free' | 'paid' | 'premium'
    amount?: number
    currency?: string
  }
  rating: {
    average: number
    count: number
  }
  downloads: number
  featured: boolean
  new: boolean
  tags: string[]
  screenshots: string[]
  version: string
  lastUpdated: string
  compatibility: string[]
  documentation?: string
  demoUrl?: string
  installed: boolean
  purchased: boolean
}

interface MarketplaceProps {
  onInstall: (plugin: Plugin) => void
  installedPlugins: string[]
}

export function Marketplace({ onInstall, installedPlugins }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'price'>('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: 'all', label: 'All', icon: <Package className="w-4 h-4" /> },
    { id: 'template', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
    { id: 'field', label: 'Custom Fields', icon: <Code2 className="w-4 h-4" /> },
    { id: 'integration', label: 'Integrations', icon: <Zap className="w-4 h-4" /> },
    { id: 'theme', label: 'Themes', icon: <Palette className="w-4 h-4" /> },
    { id: 'automation', label: 'Automation', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <Globe className="w-4 h-4" /> }
  ]

  useEffect(() => {
    // Load plugins (in production, fetch from API)
    const mockPlugins: Plugin[] = [
      {
        id: 'advanced-calculations',
        name: 'Advanced Calculations',
        description: 'Create complex form calculations with formulas and conditional logic',
        category: 'field',
        icon: <Package className="w-5 h-5" />,
        author: { name: 'RevoForms Team', verified: true },
        price: { type: 'premium', amount: 19.99, currency: 'USD' },
        rating: { average: 4.8, count: 234 },
        downloads: 5421,
        featured: true,
        new: false,
        tags: ['calculation', 'formula', 'math'],
        screenshots: ['/screenshots/calc1.png', '/screenshots/calc2.png'],
        version: '2.1.0',
        lastUpdated: '2024-01-15',
        compatibility: ['1.0.0', '1.1.0', '1.2.0'],
        installed: false,
        purchased: false
      },
      {
        id: 'elegant-themes-pack',
        name: 'Elegant Themes Pack',
        description: '10 professionally designed themes for modern forms',
        category: 'theme',
        icon: <Palette className="w-5 h-5" />,
        author: { name: 'Theme Masters', verified: true },
        price: { type: 'paid', amount: 49.99, currency: 'USD' },
        rating: { average: 4.9, count: 567 },
        downloads: 12843,
        featured: true,
        new: false,
        tags: ['themes', 'design', 'professional'],
        screenshots: ['/screenshots/theme1.png', '/screenshots/theme2.png'],
        version: '1.5.0',
        lastUpdated: '2024-01-10',
        compatibility: ['1.0.0'],
        installed: false,
        purchased: false
      },
      {
        id: 'stripe-payments-pro',
        name: 'Stripe Payments Pro',
        description: 'Advanced payment processing with subscriptions and installments',
        category: 'integration',
        icon: <CreditCard className="w-5 h-5" />,
        author: { name: 'Payment Experts', verified: true },
        price: { type: 'premium', amount: 29.99, currency: 'USD' },
        rating: { average: 4.7, count: 189 },
        downloads: 3256,
        featured: true,
        new: false,
        tags: ['payment', 'stripe', 'subscription'],
        screenshots: ['/screenshots/stripe1.png'],
        version: '3.0.0',
        lastUpdated: '2024-01-20',
        compatibility: ['1.0.0'],
        installed: true,
        purchased: true
      },
      {
        id: 'lead-gen-templates',
        name: 'Lead Generation Templates',
        description: 'High-converting templates optimized for lead capture',
        category: 'template',
        icon: <Store className="w-5 h-5" />,
        author: { name: 'Conversion Pros', verified: false },
        price: { type: 'free' },
        rating: { average: 4.5, count: 123 },
        downloads: 8921,
        featured: false,
        new: true,
        tags: ['templates', 'lead-gen', 'conversion'],
        screenshots: ['/screenshots/lead1.png'],
        version: '1.0.0',
        lastUpdated: '2024-01-25',
        compatibility: ['1.2.0'],
        installed: false,
        purchased: false
      }
    ]

    setTimeout(() => {
      setPlugins(mockPlugins)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads
      case 'newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'rating':
        return b.rating.average - a.rating.average
      case 'price':
        return (a.price.type === 'free' ? 0 : a.price.amount || 0) - (b.price.type === 'free' ? 0 : b.price.amount || 0)
      default:
        return 0
    }
  })

  const handleInstall = (plugin: Plugin) => {
    if (plugin.installed) {
      // Uninstall
      onInstall(plugin)
    } else {
      // Install or Purchase
      if (plugin.price.type === 'free') {
        onInstall(plugin)
      } else {
        // Show purchase modal
        console.log('Purchase:', plugin.id)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-neon-cyan" />
            Marketplace
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Extend your forms with plugins and templates
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gradient-to-r from-neon-purple to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Become a Seller
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
            <option value="price">Price</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Featured Section */}
      {searchQuery === '' && selectedCategory === 'all' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white/80">Featured Plugins</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlugins.filter(p => p.featured).slice(0, 6).map(plugin => (
              <FeaturedPluginCard
                key={plugin.id}
                plugin={plugin}
                onSelect={() => setSelectedPlugin(plugin)}
                onInstall={() => handleInstall(plugin)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Plugins Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-full mb-1"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlugins.map(plugin => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onSelect={() => setSelectedPlugin(plugin)}
                onInstall={() => handleInstall(plugin)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <PluginDetailModal
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onInstall={() => {
            handleInstall(selectedPlugin)
            setSelectedPlugin(null)
          }}
        />
      )}
    </div>
  )
}

// Featured Plugin Card
function FeaturedPluginCard({ plugin, onSelect, onInstall }: {
  plugin: Plugin
  onSelect: () => void
  onInstall: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/30 rounded-xl p-4 cursor-pointer hover:border-neon-cyan/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white">
            {plugin.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors">
              {plugin.name}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                {plugin.rating.average}
              </span>
              <span className="text-xs text-white/40">
                ({plugin.rating.count})
              </span>
            </div>
          </div>
        </div>
        {plugin.new && (
          <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded-full">New</span>
        )}
      </div>

      <p className="text-xs text-white/60 mb-3 line-clamp-2">{plugin.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-0.5">
            <Download className="w-3 h-3" />
            {plugin.downloads.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {plugin.author.name}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onInstall()
          }}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            plugin.installed
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : plugin.price.type === 'free'
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30'
          }`}
        >
          {plugin.installed ? 'Installed' : plugin.price.type === 'free' ? 'Free' : `$${plugin.price.amount}`}
        </button>
      </div>
    </div>
  )
}

// Regular Plugin Card
function PluginCard({ plugin, onSelect, onInstall }: {
  plugin: Plugin
  onSelect: () => void
  onInstall: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
            {plugin.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">
              {plugin.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {plugin.author.verified && (
                <Shield className="w-3 h-3 text-blue-400" />
              )}
              <span className="text-xs text-white/40">
                {plugin.author.name}
              </span>
            </div>
          </div>
        </div>
        {plugin.new && (
          <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded-full">New</span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-yellow-400 flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-current" />
          {plugin.rating.average}
        </span>
        <span className="text-xs text-white/40">({plugin.rating.count})</span>
      </div>

      <p className="text-xs text-white/60 mb-3 line-clamp-2">{plugin.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {plugin.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 bg-white/10 text-white/50 rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-white/40">
          <Download className="inline w-3 h-3 mr-1" />
          {plugin.downloads.toLocaleString()}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onInstall()
          }}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            plugin.installed
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : plugin.price.type === 'free'
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30'
          }`}
        >
          {plugin.installed ? 'Installed' : plugin.price.type === 'free' ? 'Free' : `$${plugin.price.amount}`}
        </button>
      </div>
    </div>
  )
}

// Plugin Detail Modal
function PluginDetailModal({ plugin, onClose, onInstall }: {
  plugin: Plugin
  onClose: () => void
  onInstall: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-space-light rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-space-light border-b border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white text-2xl">
                {plugin.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{plugin.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-yellow-400 flex items-center gap-0.5">
                    <Star className="w-4 h-4 fill-current" />
                    {plugin.rating.average}
                  </span>
                  <span className="text-white/40">({plugin.rating.count} reviews)</span>
                  <Download className="w-4 h-4 text-white/40" />
                  <span className="text-white/40">{plugin.downloads.toLocaleString()} downloads</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Minus className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Description</h3>
              <p className="text-sm text-white/60">{plugin.description}</p>
            </div>

            {/* Screenshots */}
            {plugin.screenshots.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Screenshots</h3>
                <div className="grid grid-cols-3 gap-2">
                  {plugin.screenshots.map((screenshot, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg aspect-video"></div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Details</h4>
                <ul className="space-y-1 text-sm text-white/60">
                  <li>Version: {plugin.version}</li>
                  <li>Last Updated: {plugin.lastUpdated}</li>
                  <li>Category: {plugin.category}</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Compatibility</h4>
                <ul className="space-y-1 text-sm text-white/60">
                  {plugin.compatibility.map(version => (
                    <li key={version}>RevoForms v{version}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {plugin.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-white">Price</h4>
                <p className="text-2xl font-bold text-neon-cyan">
                  {plugin.price.type === 'free' ? 'Free' : `$${plugin.price.amount}`}
                </p>
              </div>
              <div className="flex gap-2">
                {plugin.documentation && (
                  <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onInstall}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    plugin.installed
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : plugin.price.type === 'free'
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-neon-cyan text-black hover:bg-neon-cyan/90'
                  }`}
                >
                  {plugin.installed ? 'Uninstall' : plugin.price.type === 'free' ? 'Install Free' : `Buy $${plugin.price.amount}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}