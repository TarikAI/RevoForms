'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  History,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Download,
  Upload,
  Tag,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Compare,
  GitMerge,
  GitCommit,
  Clock,
  FileText,
  Shield,
  Users,
  Lock,
  Unlock
} from 'lucide-react'
import type { CanvasForm } from '@/types/form'

interface FormVersion {
  id: string
  version: string
  name: string
  description?: string
  form: CanvasForm
  createdAt: string
  createdBy: string
  changes: {
    type: 'create' | 'update' | 'delete' | 'restore'
    field?: string
    description: string
    timestamp: string
  }[]
  isPublished: boolean
  isCurrent: boolean
  tags: string[]
  metrics?: {
    views: number
    submissions: number
    conversionRate: number
  }
  status: 'draft' | 'published' | 'archived' | 'deleted'
}

interface FormVersioningProps {
  formId: string
  formName: string
  onVersionRestore: (version: FormVersion) => void
  onVersionCompare: (version1Id: string, version2Id: string) => void
  autoSave?: boolean
  maxVersions?: number
}

export function FormVersioning({
  formId,
  formName,
  onVersionRestore,
  onVersionCompare,
  autoSave = true,
  maxVersions = 50
}: FormVersioningProps) {
  const [versions, setVersions] = useState<FormVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersions, setCompareVersions] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(autoSave)
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

  // Mock data - in real app, this would come from API
  const mockVersions: FormVersion[] = [
    {
      id: 'v1',
      version: '1.0.0',
      name: 'Initial Version',
      description: 'First version of the contact form',
      form: {} as CanvasForm,
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'John Doe',
      changes: [
        {
          type: 'create',
          description: 'Created form with basic fields',
          timestamp: '2024-01-15T10:00:00Z'
        }
      ],
      isPublished: false,
      isCurrent: false,
      tags: ['initial', 'draft'],
      status: 'archived',
      metrics: { views: 245, submissions: 67, conversionRate: 27.3 }
    },
    {
      id: 'v2',
      version: '1.1.0',
      name: 'Added Phone Field',
      description: 'Added phone number field for better contact',
      form: {} as CanvasForm,
      createdAt: '2024-01-18T14:30:00Z',
      createdBy: 'Jane Smith',
      changes: [
        {
          type: 'update',
          field: 'Phone',
          description: 'Added phone number field',
          timestamp: '2024-01-18T14:30:00Z'
        }
      ],
      isPublished: true,
      isCurrent: false,
      tags: ['phone', 'contact'],
      status: 'published',
      metrics: { views: 1890, submissions: 534, conversionRate: 28.3 }
    },
    {
      id: 'v3',
      version: '1.2.0',
      name: 'Company Information Update',
      description: 'Added company name and job title fields',
      form: {} as CanvasForm,
      createdAt: '2024-01-22T09:15:00Z',
      createdBy: 'John Doe',
      changes: [
        {
          type: 'update',
          field: 'Company Name',
          description: 'Added company name field',
          timestamp: '2024-01-22T09:15:00Z'
        },
        {
          type: 'update',
          field: 'Job Title',
          description: 'Added job title field',
          timestamp: '2024-01-22T09:16:00Z'
        }
      ],
      isPublished: false,
      isCurrent: true,
      tags: ['company', 'professional'],
      status: 'draft',
      metrics: { views: 123, submissions: 12, conversionRate: 9.8 }
    }
  ]

  const activeVersions = versions.length > 0 ? versions : mockVersions

  const createVersion = (name: string, description?: string, tags: string[] = []) => {
    const newVersion: FormVersion = {
      id: `v${Date.now()}`,
      version: generateVersionNumber(),
      name,
      description,
      form: {} as CanvasForm, // Current form state
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      changes: [{
        type: 'update',
        description: name,
        timestamp: new Date().toISOString()
      }],
      isPublished: false,
      isCurrent: true,
      tags,
      status: 'draft'
    }

    // Mark previous versions as not current
    const updatedVersions = activeVersions.map(v => ({ ...v, isCurrent: false }))

    // Add new version at the beginning
    const allVersions = [newVersion, ...updatedVersions].slice(0, maxVersions)

    setVersions(allVersions)
  }

  const generateVersionNumber = () => {
    if (activeVersions.length === 0) return '1.0.0'

    const latestVersion = activeVersions[0]
    const [major, minor, patch] = latestVersion.version.split('.').map(Number)

    // Simple version increment logic
    return `${major}.${minor}.${patch + 1}`
  }

  const restoreVersion = (version: FormVersion) => {
    // Mark all as not current
    const updatedVersions = activeVersions.map(v => ({ ...v, isCurrent: false }))

    // Mark restored version as current and create new version
    const restoredVersion = {
      ...version,
      id: `v${Date.now()}`,
      version: generateVersionNumber(),
      name: `Restored from ${version.version}`,
      isCurrent: true,
      isPublished: false,
      status: 'draft' as const,
      changes: [
        {
          type: 'restore',
          description: `Restored from version ${version.version}`,
          timestamp: new Date().toISOString()
        },
        ...version.changes
      ]
    }

    setVersions([restoredVersion, ...updatedVersions])
    onVersionRestore(version)
  }

  const publishVersion = (versionId: string) => {
    const updatedVersions = activeVersions.map(v => ({
      ...v,
      isPublished: v.id === versionId ? true : v.isPublished
    }))
    setVersions(updatedVersions)
  }

  const deleteVersion = (versionId: string) => {
    const updatedVersions = activeVersions.filter(v => v.id !== versionId)
    setVersions(updatedVersions)
    if (selectedVersion === versionId) {
      setSelectedVersion(null)
    }
  }

  const duplicateVersion = (version: FormVersion) => {
    const duplicatedVersion: FormVersion = {
      ...version,
      id: `v${Date.now()}`,
      version: generateVersionNumber(),
      name: `${version.name} (Copy)`,
      isPublished: false,
      isCurrent: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
      changes: [{
        type: 'create',
        description: `Duplicated from version ${version.version}`,
        timestamp: new Date().toISOString()
      }]
    }

    setVersions([duplicatedVersion, ...activeVersions])
  }

  const archiveVersion = (versionId: string) => {
    const updatedVersions = activeVersions.map(v =>
      v.id === versionId ? { ...v, status: 'archived' as const } : v
    )
    setVersions(updatedVersions)
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'create': return <Plus className="w-3 h-3 text-green-400" />
      case 'update': return <Edit className="w-3 h-3 text-blue-400" />
      case 'delete': return <Trash2 className="w-3 h-3 text-red-400" />
      case 'restore': return <RotateCcw className="w-3 h-3 text-yellow-400" />
      default: return <GitCommit className="w-3 h-3 text-white/40" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400'
      case 'draft': return 'text-yellow-400'
      case 'archived': return 'text-gray-400'
      case 'deleted': return 'text-red-400'
      default: return 'text-white/60'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20'
      case 'draft': return 'bg-yellow-500/20'
      case 'archived': return 'bg-gray-500/20'
      case 'deleted': return 'bg-red-500/20'
      default: return 'bg-white/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white">Version History</h3>
          <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">
            {activeVersions.length} versions
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              compareMode
                ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <Compare className="w-4 h-4" />
            Compare
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Version
          </button>
        </div>
      </div>

      {/* Auto-save Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-blue-100 font-medium">Auto-save is {autoSaveEnabled ? 'enabled' : 'disabled'}</p>
            <p className="text-blue-200/70 text-sm">
              Automatically save versions when significant changes are made
            </p>
          </div>
        </div>
        <button
          onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            autoSaveEnabled
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-white/10 text-white/60'
          }`}
        >
          {autoSaveEnabled ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </button>
      </div>

      {/* Compare Mode */}
      <AnimatePresence>
        {compareMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl"
          >
            <h4 className="text-purple-100 font-medium mb-3">Select versions to compare</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm text-purple-200/70">From version</label>
                <select
                  value={compareVersions.from}
                  onChange={(e) => setCompareVersions(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="">Select...</option>
                  {activeVersions.map(v => (
                    <option key={v.id} value={v.id}>{v.version} - {v.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-purple-200/70">To version</label>
                <select
                  value={compareVersions.to}
                  onChange={(e) => setCompareVersions(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="">Select...</option>
                  {activeVersions.map(v => (
                    <option key={v.id} value={v.id}>{v.version} - {v.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    if (compareVersions.from && compareVersions.to) {
                      onVersionCompare(compareVersions.from, compareVersions.to)
                    }
                  }}
                  disabled={!compareVersions.from || !compareVersions.to}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Compare
                </button>
                <button
                  onClick={() => setCompareMode(false)}
                  className="px-4 py-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version List */}
      <div className="space-y-3">
        {activeVersions.map((version, index) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 bg-white/5 border rounded-lg transition-all ${
              selectedVersion === version.id
                ? 'border-neon-cyan/50 bg-neon-cyan/5'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Version Header */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => {
                      setExpandedVersions(prev => {
                        const next = new Set(prev)
                        if (next.has(version.id)) {
                          next.delete(version.id)
                        } else {
                          next.add(version.id)
                        }
                        return next
                      })
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {expandedVersions.has(version.id) ? (
                      <ChevronDown className="w-4 h-4 text-white/60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    )}
                  </button>

                  <div>
                    <h5 className="font-medium text-white flex items-center gap-2">
                      v{version.version} - {version.name}
                      {version.isCurrent && (
                        <span className="px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan rounded-full text-xs">
                          Current
                        </span>
                      )}
                      {version.isPublished && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                          Published
                        </span>
                      )}
                    </h5>
                    <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{version.createdBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitCommit className="w-3 h-3" />
                        <span>{version.changes.length} changes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {version.description && (
                  <p className="text-sm text-white/70 mb-3">{version.description}</p>
                )}

                {/* Tags */}
                {version.tags.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {version.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/60">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Changes (Expanded) */}
                <AnimatePresence>
                  {expandedVersions.has(version.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-3 pl-7"
                    >
                      <h6 className="text-sm font-medium text-white/60 mb-2">Changes:</h6>
                      <div className="space-y-1">
                        {version.changes.map((change, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {getChangeIcon(change.type)}
                            <span className="text-white/70">{change.description}</span>
                            <span className="text-white/40">
                              {new Date(change.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Metrics */}
                {version.metrics && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-white/60">Views</p>
                      <p className="text-sm font-medium text-white">
                        {version.metrics.views.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60">Submissions</p>
                      <p className="text-sm font-medium text-white">
                        {version.metrics.submissions.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60">Conversion</p>
                      <p className="text-sm font-medium text-white">
                        {version.metrics.conversionRate}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {version.isCurrent ? (
                  <div className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded text-xs font-medium">
                    Active
                  </div>
                ) : (
                  <button
                    onClick={() => restoreVersion(version)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                    title="Restore this version"
                  >
                    <RotateCcw className="w-4 h-4 text-white/60 group-hover:text-neon-cyan" />
                  </button>
                )}

                {!version.isPublished && version.status !== 'deleted' && (
                  <button
                    onClick={() => publishVersion(version.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Publish this version"
                  >
                    <Upload className="w-4 h-4 text-white/60" />
                  </button>
                )}

                <button
                  onClick={() => duplicateVersion(version)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Duplicate version"
                >
                  <Copy className="w-4 h-4 text-white/60" />
                </button>

                <button
                  onClick={() => downloadVersion(version)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Download version"
                >
                  <Download className="w-4 h-4 text-white/60" />
                </button>

                {version.status !== 'deleted' && version.status !== 'archived' && (
                  <button
                    onClick={() => archiveVersion(version.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Archive version"
                  >
                    <Lock className="w-4 h-4 text-white/60" />
                  </button>
                )}

                <button
                  onClick={() => deleteVersion(version.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                  title="Delete version"
                >
                  <Trash2 className="w-4 h-4 text-white/60 group-hover:text-red-400" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {activeVersions.length === 0 && (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No versions yet</h3>
          <p className="text-white/60 mb-4">Save your first version to start tracking changes</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create First Version
          </button>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-neon-cyan mt-0.5" />
        <div className="text-sm">
          <p className="text-white/80">
            Version history helps you track changes, restore previous versions, and maintain multiple variations of your form.
            Each version saves a complete snapshot of your form at that moment.
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper function for downloading version
function downloadVersion(version: FormVersion) {
  const data = {
    version: version.version,
    name: version.name,
    description: version.description,
    form: version.form,
    createdAt: version.createdAt,
    changes: version.changes
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${formName}_v${version.version}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}