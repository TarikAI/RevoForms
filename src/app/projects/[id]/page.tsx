'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Settings, Edit, Trash2, FileText, BarChart3, Users, Lock, Globe, Calendar, Tag } from 'lucide-react'
import { Header } from '@/components/ui/Header'
import { ProfileModal } from '@/components/profile'
import { useProjectStore, useSelectedProject } from '@/store/projectStore'
import { useFormStore } from '@/store/formStore'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [mounted, setMounted] = useState(false)

  const project = useSelectedProject()
  const forms = useFormStore((state) => state.forms)
  const selectProject = useProjectStore((state) => state.selectProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const removeFormFromProject = useProjectStore((state) => state.removeFormFromProject)

  useEffect(() => {
    setMounted(true)
    if (projectId) {
      selectProject(projectId)
    }
  }, [projectId, selectProject])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-space-black">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="text-white/60">Loading project...</div>
        </div>
        <ProfileModal />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-space-black">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
            <button
              onClick={() => router.push('/projects')}
              className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
        <ProfileModal />
      </div>
    )
  }

  const projectForms = forms.filter(form => project.formIds.includes(form.id))

  const handleDeleteProject = () => {
    if (confirm(`Are you sure you want to delete "${project.name}"? Forms will remain unassigned.`)) {
      deleteProject(project.id)
      router.push('/projects')
    }
  }

  const handleRemoveForm = (formId: string) => {
    if (confirm('Remove this form from the project?')) {
      removeFormFromProject(project.id, formId)
    }
  }

  return (
    <div className="min-h-screen bg-space-black overflow-auto">
      <Header />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/projects')}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${project.color}20`, color: project.color }}
              >
                {project.icon ? <project.icon /> : <FileText />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    {project.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span className="capitalize">{project.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Edit className="w-5 h-5 text-white/60" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-white/60" />
              </button>
              <button
                onClick={handleDeleteProject}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          {project.description && (
            <p className="text-white/80 mb-4">{project.description}</p>
          )}

          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-white/60" />
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-neon-cyan" />
              <div>
                <p className="text-2xl font-bold text-white">{projectForms.length}</p>
                <p className="text-sm text-white/60">Total Forms</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{project.collaborators?.length || 0}</p>
                <p className="text-sm text-white/60">Collaborators</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-sm text-white/60">Submissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forms List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Forms in this Project</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Add Form
            </button>
          </div>

          {projectForms.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
              <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">No forms in this project yet</p>
              <button className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors">
                Create First Form
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {projectForms.map((form) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{form.name}</h3>
                        <p className="text-sm text-white/60">{form.fields?.length || 0} fields</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-white/60" />
                      </button>
                      <button
                        onClick={() => handleRemoveForm(form.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProfileModal />
    </div>
  )
}