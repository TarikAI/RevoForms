'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, Check, Search } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useFormStore } from '@/store/formStore'

interface FormProjectModalProps {
  isOpen: boolean
  onClose: () => void
  formId: string
}

export function FormProjectModal({ isOpen, onClose, formId }: FormProjectModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const projects = useProjectStore((state) => state.projects)
  const forms = useFormStore((state) => state.forms)
  const addFormToProject = useProjectStore((state) => state.addFormToProject)
  const removeFormFromProject = useProjectStore((state) => state.removeFormFromProject)

  const form = forms.find(f => f.id === formId)
  const currentProjectId = projects.find(p => p.formIds.includes(formId))?.id

  // Filter projects based on search
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Set current project on mount
  useEffect(() => {
    if (currentProjectId) {
      setSelectedProjectId(currentProjectId)
    } else {
      setSelectedProjectId(null)
    }
  }, [currentProjectId, isOpen])

  const handleAssignProject = async () => {
    if (!selectedProjectId) return

    setIsLoading(true)

    try {
      // Remove from current project if assigned
      if (currentProjectId && currentProjectId !== selectedProjectId) {
        removeFormFromProject(currentProjectId, formId)
      }

      // Add to new project if different
      if (!currentProjectId || currentProjectId !== selectedProjectId) {
        addFormToProject(selectedProjectId, formId)
      }

      onClose()
    } catch (error) {
      console.error('Failed to assign project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromProject = async () => {
    if (!currentProjectId) return

    setIsLoading(true)

    try {
      removeFormFromProject(currentProjectId, formId)
      setSelectedProjectId(null)
      onClose()
    } catch (error) {
      console.error('Failed to remove from project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !form) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-start justify-center pt-20 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-space-light rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Assign to Project</h2>
              <p className="text-sm text-white/60">Organize "{form.name}" into a project</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
          </div>

          {/* Projects List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {/* Unassigned Option */}
              <button
                onClick={() => setSelectedProjectId(null)}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  selectedProjectId === null
                    ? 'bg-red-500/10 border-red-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedProjectId === null ? 'bg-red-500/20' : 'bg-white/10'
                  }`}>
                    <FolderPlus className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      selectedProjectId === null ? 'text-red-400' : 'text-white'
                    }`}>
                      Remove from Project
                    </p>
                    <p className="text-sm text-white/40">Form will be unassigned</p>
                  </div>
                  {selectedProjectId === null && (
                    <Check className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </button>

              {/* Project Options */}
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${
                    selectedProjectId === project.id
                      ? 'bg-neon-cyan/10 border-neon-cyan/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      {project.icon ? <project.icon /> : <FolderPlus />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        selectedProjectId === project.id ? 'text-neon-cyan' : 'text-white'
                      }`}>
                        {project.name}
                      </p>
                      {project.description && (
                        <p className="text-sm text-white/40 line-clamp-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-white/40">
                          {project.formIds.length} forms
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    {selectedProjectId === project.id && (
                      <Check className="w-5 h-5 text-neon-cyan" />
                    )}
                  </div>
                </button>
              ))}

              {filteredProjects.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/60">No projects found</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <div>
              {currentProjectId && (
                <button
                  onClick={handleRemoveFromProject}
                  disabled={isLoading}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  Remove from current project
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignProject}
                disabled={isLoading || selectedProjectId === currentProjectId}
                className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Assigning...' : selectedProjectId === currentProjectId ? 'No changes' : 'Assign'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}