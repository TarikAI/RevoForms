'use client'

import React, { useState } from 'react'
import {
  Briefcase,
  Users,
  Calendar,
  CheckSquare,
  MessageSquare,
  Code2,
  FolderOpen,
  Plus,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit
} from 'lucide-react'

interface ProjectTool {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  category: 'task' | 'communication' | 'development' | 'documentation'
  status: 'connected' | 'disconnected' | 'coming-soon'
  color: string
  config?: any
}

interface ProjectManagementProps {
  formId: string
  tools: ProjectTool[]
  onToolChange: (tools: ProjectTool[]) => void
}

export function ProjectManagement({ formId, tools, onToolChange }: ProjectManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const availableTools: ProjectTool[] = [
    // Task Management
    {
      id: 'jira',
      name: 'Jira',
      icon: <CheckSquare className="w-5 h-5" />,
      description: 'Create tickets from form submissions',
      category: 'task',
      status: 'disconnected',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'trello',
      name: 'Trello',
      icon: <FolderOpen className="w-5 h-5" />,
      description: 'Add cards to boards from submissions',
      category: 'task',
      status: 'disconnected',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'asana',
      name: 'Asana',
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Create tasks in projects automatically',
      category: 'task',
      status: 'coming-soon',
      color: 'from-pink-500 to-purple-500'
    },
    {
      id: 'monday',
      name: 'Monday.com',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Update boards and create items',
      category: 'task',
      status: 'coming-soon',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'notion',
      name: 'Notion',
      icon: <FolderOpen className="w-5 h-5" />,
      description: 'Add entries to Notion databases',
      category: 'task',
      status: 'disconnected',
      color: 'from-gray-600 to-gray-800'
    },
    {
      id: 'clickup',
      name: 'ClickUp',
      icon: <CheckSquare className="w-5 h-5" />,
      description: 'Create tasks and manage workflows',
      category: 'task',
      status: 'coming-soon',
      color: 'from-purple-600 to-pink-600'
    },

    // Communication
    {
      id: 'slack',
      name: 'Slack',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Send notifications to channels',
      category: 'communication',
      status: 'disconnected',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'msteams',
      name: 'Microsoft Teams',
      icon: <Users className="w-5 h-5" />,
      description: 'Post messages to teams',
      category: 'communication',
      status: 'coming-soon',
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Send alerts to Discord channels',
      category: 'communication',
      status: 'disconnected',
      color: 'from-indigo-500 to-purple-600'
    },

    // Development
    {
      id: 'github',
      name: 'GitHub',
      icon: <Code2 className="w-5 h-5" />,
      description: 'Create issues from form data',
      category: 'development',
      status: 'disconnected',
      color: 'from-gray-700 to-gray-900'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: <Code2 className="w-5 h-5" />,
      description: 'Create issues in GitLab projects',
      category: 'development',
      status: 'coming-soon',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'bitbucket',
      name: 'Bitbucket',
      icon: <Code2 className="w-5 h-5" />,
      description: 'Integrate with Bitbucket repositories',
      category: 'development',
      status: 'coming-soon',
      color: 'from-blue-400 to-blue-600'
    },

    // Documentation
    {
      id: 'confluence',
      name: 'Confluence',
      icon: <FolderOpen className="w-5 h-5" />,
      description: 'Create pages from submissions',
      category: 'documentation',
      status: 'coming-soon',
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'sharepoint',
      name: 'SharePoint',
      icon: <FolderOpen className="w-5 h-5" />,
      description: 'Upload to SharePoint libraries',
      category: 'documentation',
      status: 'coming-soon',
      color: 'from-blue-600 to-blue-800'
    }
  ]

  const categories = [
    { id: 'all', label: 'All Tools', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'task', label: 'Task Management', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'communication', label: 'Communication', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'development', label: 'Development', icon: <Code2 className="w-4 h-4" /> },
    { id: 'documentation', label: 'Documentation', icon: <FolderOpen className="w-4 h-4" /> }
  ]

  const filteredTools = selectedCategory === 'all'
    ? availableTools
    : availableTools.filter(tool => tool.category === selectedCategory)

  const connectedTools = tools.filter(t => t.status === 'connected').length

  const handleToolToggle = (tool: ProjectTool) => {
    const existingTool = tools.find(t => t.id === tool.id)

    if (existingTool) {
      // Disconnect
      onToolChange(tools.filter(t => t.id !== tool.id))
    } else {
      // Connect
      onToolChange([...tools, { ...tool, status: 'connected' as const }])
    }
  }

  const handleConfigure = (tool: ProjectTool) => {
    // Open configuration modal
    console.log('Configure tool:', tool.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-neon-cyan" />
            Project Management
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Connect forms to your favorite project tools
          </p>
        </div>
        <div className="text-sm text-white/40">
          {connectedTools} of {availableTools.length} connected
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {category.icon}
            <span className="hidden sm:inline">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const isConnected = tools.some(t => t.id === tool.id && t.status === 'connected')
          const existingTool = tools.find(t => t.id === tool.id)

          return (
            <div
              key={tool.id}
              className={`bg-white/5 border rounded-xl p-4 transition-all hover:border-white/20 ${
                isConnected ? 'border-neon-cyan/50' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-white`}>
                    {tool.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{tool.name}</h4>
                    <p className="text-xs text-white/50 mt-0.5">{tool.description}</p>
                  </div>
                </div>
                {tool.status === 'coming-soon' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded">Soon</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${
                  isConnected
                    ? 'bg-green-500/20 text-green-400'
                    : tool.status === 'coming-soon'
                    ? 'bg-gray-500/20 text-gray-400'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {isConnected ? 'Connected' : tool.status === 'coming-soon' ? 'Coming Soon' : 'Available'}
                </span>

                <div className="flex gap-1">
                  {isConnected && (
                    <button
                      onClick={() => handleConfigure(tool)}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      title="Configure"
                    >
                      <Settings className="w-3 h-3 text-white/60" />
                    </button>
                  )}
                  <button
                    onClick={() => tool.status !== 'coming-soon' && handleToolToggle(tool)}
                    disabled={tool.status === 'coming-soon'}
                    className={`p-1.5 rounded transition-colors ${
                      tool.status === 'coming-soon'
                        ? 'cursor-not-allowed opacity-50'
                        : isConnected
                        ? 'hover:bg-red-500/20 text-red-400'
                        : 'hover:bg-neon-cyan/20 text-neon-cyan'
                    }`}
                    title={isConnected ? 'Disconnect' : 'Connect'}
                  >
                    {isConnected ? (
                      <Trash2 className="w-3 h-3" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Configuration Details */}
              {isConnected && existingTool?.config && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                  {existingTool.config.workspace && (
                    <p className="text-xs text-white/40">
                      Workspace: {existingTool.config.workspace}
                    </p>
                  )}
                  {existingTool.config.board && (
                    <p className="text-xs text-white/40">
                      Board: {existingTool.config.board}
                    </p>
                  )}
                  {existingTool.config.channel && (
                    <p className="text-xs text-white/40">
                      Channel: {existingTool.config.channel}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h4 className="text-sm font-medium text-white mb-3">Quick Setup Tips</h4>
        <ul className="space-y-2 text-xs text-blue-200/80">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <span>Connect multiple tools to create powerful automation workflows</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <span>Use field mapping to send specific form data to the right places</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <span>Set up custom webhooks for tools not listed here</span>
          </li>
        </ul>
      </div>
    </div>
  )
}