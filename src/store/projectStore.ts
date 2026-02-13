import React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon?: string // Store icon name as string (e.g., 'Folder', 'Briefcase', 'Zap')
  formIds: string[]
  collaborators?: string[]
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  allowExport: boolean
  customDomain?: string
  tags?: string[]
  status: 'active' | 'archived' | 'draft'
}

export interface ProjectFormData {
  id: string
  projectId: string
  formId: string
  addedAt: Date
  status: 'draft' | 'published' | 'archived'
}

interface ProjectStore {
  projects: Project[]
  projectForms: Record<string, ProjectFormData[]>
  selectedProjectId: string | null

  // Actions
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  selectProject: (id: string | null) => void
  addFormToProject: (projectId: string, formId: string) => void
  removeFormFromProject: (projectId: string, formId: string) => void
  moveFormToProject: (formId: string, fromProjectId: string, toProjectId: string) => void
  getProjectForms: (projectId: string) => ProjectFormData[]
  updateFormStatus: (projectId: string, formId: string, status: 'draft' | 'published' | 'archived') => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      projectForms: {},
      selectedProjectId: null,

      createProject: (projectData) => {
        const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()
        const project: Project = {
          ...projectData,
          id,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          projects: [...state.projects, project],
          projectForms: {
            ...state.projectForms,
            [id]: [],
          },
        }))

        return id
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }))
      },

      deleteProject: (id) => {
        set((state) => {
          const { [id]: removed, ...restProjectForms } = state.projectForms
          return {
            projects: state.projects.filter((p) => p.id !== id),
            projectForms: restProjectForms,
            selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
          }
        })
      },

      selectProject: (id) => {
        set({ selectedProjectId: id })
      },

      addFormToProject: (projectId, formId) => {
        const formLink: ProjectFormData = {
          id: `${projectId}_${formId}`,
          projectId,
          formId,
          addedAt: new Date(),
          status: 'draft',
        }

        set((state) => ({
          projectForms: {
            ...state.projectForms,
            [projectId]: [...(state.projectForms[projectId] || []), formLink],
          },
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, formIds: [...p.formIds, formId], updatedAt: new Date() } : p
          ),
        }))
      },

      removeFormFromProject: (projectId, formId) => {
        set((state) => ({
          projectForms: {
            ...state.projectForms,
            [projectId]: state.projectForms[projectId]?.filter((f) => f.formId !== formId) || [],
          },
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, formIds: p.formIds.filter((id) => id !== formId), updatedAt: new Date() } : p
          ),
        }))
      },

      moveFormToProject: (formId, fromProjectId, toProjectId) => {
        get().removeFormFromProject(fromProjectId, formId)
        get().addFormToProject(toProjectId, formId)
      },

      getProjectForms: (projectId) => {
        return get().projectForms[projectId] || []
      },

      updateFormStatus: (projectId, formId, status) => {
        set((state) => ({
          projectForms: {
            ...state.projectForms,
            [projectId]: state.projectForms[projectId]?.map((f) =>
              f.formId === formId ? { ...f, status } : f
            ) || [],
          },
        }))
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
        projectForms: state.projectForms,
      }),
    }
  )
)

// Helper hooks
export const useSelectedProject = () => {
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId)
  const projects = useProjectStore((state) => state.projects)
  return selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : null
}

export const useProjectsWithFormCount = () => {
  const projects = useProjectStore((state) => state.projects)
  const projectForms = useProjectStore((state) => state.projectForms)

  return projects.map((project) => ({
    ...project,
    formCount: projectForms[project.id]?.length || 0,
    publishedCount: projectForms[project.id]?.filter((f) => f.status === 'published').length || 0,
    draftCount: projectForms[project.id]?.filter((f) => f.status === 'draft').length || 0,
  }))
}