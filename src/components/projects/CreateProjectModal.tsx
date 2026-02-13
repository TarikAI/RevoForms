'use client'

import { useState } from 'react'
import { X, FolderPlus, Briefcase, Users, ShoppingBag, GraduationCap, Heart, Code, Megaphone } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'

// Icon mapping from string to component
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Briefcase,
  ShoppingBag,
  GraduationCap,
  Heart,
  Code,
  Megaphone,
}

const PROJECT_TEMPLATES = [
  {
    name: 'Business',
    icon: 'Briefcase',
    color: '#3B82F6',
    description: 'Forms for business operations, HR, and internal processes',
    tags: ['HR', 'Operations', 'Management']
  },
  {
    name: 'E-commerce',
    icon: 'ShoppingBag',
    color: '#10B981',
    description: 'Product forms, customer feedback, and order management',
    tags: ['Products', 'Customers', 'Orders']
  },
  {
    name: 'Education',
    icon: 'GraduationCap',
    color: '#8B5CF6',
    description: 'Course registration, surveys, and academic forms',
    tags: ['Courses', 'Surveys', 'Assessments']
  },
  {
    name: 'Healthcare',
    icon: 'Heart',
    color: '#EF4444',
    description: 'Patient forms, appointments, and medical records',
    tags: ['Patients', 'Appointments', 'Records']
  },
  {
    name: 'Technology',
    icon: 'Code',
    color: '#06B6D4',
    description: 'Bug reports, feature requests, and feedback forms',
    tags: ['Bug Reports', 'Features', 'Feedback']
  },
  {
    name: 'Marketing',
    icon: 'Megaphone',
    color: '#F59E0B',
    description: 'Campaign forms, lead generation, and market research',
    tags: ['Campaigns', 'Leads', 'Research']
  }
]

const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#EF4444', // red
  '#06B6D4', // cyan
  '#F59E0B', // amber
  '#EC4899', // pink
  '#6366F1', // indigo
]

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess: (projectId: string) => void
}

export function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<typeof PROJECT_TEMPLATES[0] | null>(null)
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [allowExport, setAllowExport] = useState(true)

  const createProject = useProjectStore((state) => state.createProject)

  const handleTemplateSelect = (template: typeof PROJECT_TEMPLATES[0]) => {
    setSelectedTemplate(template)
    setProjectName(`My ${template.name} Project`)
    setSelectedColor(template.color)
    setTags(template.tags)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) return

    const projectId = createProject({
      name: projectName.trim(),
      description: description.trim(),
      color: selectedColor,
      icon: selectedTemplate?.icon,
      formIds: [],
      tags,
      isPublic,
      allowExport,
      status: 'active',
    })

    onSuccess(projectId)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-space-light rounded-xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Templates */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Start with a template</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PROJECT_TEMPLATES.map((template) => {
                const Icon = ICON_MAP[template.icon!] || FolderPlus
                return (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate?.name === template.name
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: template.color }} />
                    </div>
                    <h4 className="font-medium text-white mb-1">{template.name}</h4>
                    <p className="text-xs text-white/60">{template.description}</p>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTemplate === null
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-white/10">
                  <FolderPlus className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Blank Project</h4>
                <p className="text-xs text-white/60">Start from scratch</p>
              </button>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project..."
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Color</label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-10 h-10 rounded-lg transition-all"
                    style={{
                      backgroundColor: color,
                      opacity: selectedColor === color ? 1 : 0.3,
                      transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded-lg text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-neon-cyan/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags (press Enter)"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-neon-cyan bg-white/5 border-white/20 rounded focus:ring-neon-cyan focus:ring-2"
                />
                <span className="text-white/80">Make project public</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowExport}
                  onChange={(e) => setAllowExport(e.target.checked)}
                  className="w-4 h-4 text-neon-cyan bg-white/5 border-white/20 rounded focus:ring-neon-cyan focus:ring-2"
                />
                <span className="text-white/80">Allow form export</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}