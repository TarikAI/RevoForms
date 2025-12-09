'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FolderPlus,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Plus,
  Star,
  Archive,
  Clock,
  TrendingUp,
  Users,
  Lock,
  Globe,
  Edit,
  Trash2,
  Copy,
  FileText,
  BarChart3
} from 'lucide-react'
import { useProjectStore, useProjectsWithFormCount, type Project } from '@/store/projectStore'
import { useFormStore } from '@/store/formStore'
import { CreateProjectModal } from './CreateProjectModal'

export function ProjectsDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived' | 'draft'>('all')

  const projects = useProjectsWithFormCount()
  const forms = useFormStore((state) => state.forms)
  const selectProject = useProjectStore((state) => state.selectProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Get recent projects
  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  // Get forms without projects (unassigned)
  const unassignedForms = forms.filter(form => {
    const isAssigned = projects.some(project =>
      project.formIds.includes(form.id)
    )
    return !isAssigned
  })

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId)
    window.location.href = `/projects/${projectId}`
  }

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this project? Forms will remain unassigned.')) {
      deleteProject(projectId)
    }
  }

  const ProjectCard = ({ project }: { project: Project & { formCount: number; publishedCount: number; draftCount: number } }) => {
    const [showMenu, setShowMenu] = useState(false)

    return (
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/10 transition-all duration-200"
        onClick={() => handleProjectClick(project.id)}
      >
        {/* Project Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              <FolderPlus />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-neon-cyan transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {project.isPublic ? <Globe className="w-3 h-3 text-white/60" /> : <Lock className="w-3 h-3 text-white/60" />}
                <span className="text-xs text-white/40 capitalize">{project.status}</span>
              </div>
            </div>
          </div>

          {/* More Options Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-white/60" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-space-light rounded-lg border border-white/10 shadow-xl z-50">
                <button className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-white/5 text-white/80 text-sm">
                  <Edit className="w-4 h-4" />
                  Edit Project
                </button>
                <button className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-white/5 text-white/80 text-sm">
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-red-500/10 text-red-400 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project Description */}
        {project.description && (
          <p className="text-sm text-white/60 mb-4 line-clamp-2">{project.description}</p>
        )}

        {/* Project Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-2xl font-bold text-white">{project.formCount}</p>
            <p className="text-xs text-white/40">Total Forms</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{project.publishedCount}</p>
            <p className="text-xs text-white/40">Published</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">{project.draftCount}</p>
            <p className="text-xs text-white/40">Drafts</p>
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-white/10 rounded text-xs text-white/60"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/40">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-space-black overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Projects</h1>
              <p className="text-white/60">Organize and manage your forms by projects</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                  <p className="text-xs text-white/60">Total Projects</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{forms.length}</p>
                  <p className="text-xs text-white/60">Total Forms</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-white/60">Collaborators</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-white/60">Submissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="flex bg-white/5 border border-white/10 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && searchQuery === '' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* All Projects */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {searchQuery || filterStatus !== 'all' ? 'Search Results' : 'All Projects'}
          </h2>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderPlus className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">No projects found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Unassigned Forms */}
        {unassignedForms.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Unassigned Forms</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-400 mb-2">You have {unassignedForms.length} unassigned form(s)</p>
              <button className="text-sm text-yellow-400 hover:text-yellow-300 underline">
                Organize them into projects
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(projectId) => {
            setShowCreateModal(false)
            handleProjectClick(projectId)
          }}
        />
      )}
    </div>
  )
}