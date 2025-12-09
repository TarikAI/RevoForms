'use client'

import React, { useState, useEffect } from 'react'
import {
  Zap,
  Workflow,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  TestTube,
  Play, ChevronRight
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  service: 'zapier' | 'n8n' | 'webhook'
  status: 'active' | 'inactive' | 'error'
  trigger: 'form_submission' | 'form_updated' | 'payment_completed'
  targetUrl?: string
  workflowId?: string
  fields: string[]
  filters: Record<string, any>
  lastTrigger?: string
  totalTriggers: number
}

interface IntegrationManagerProps {
  formId: string
  integrations: Integration[]
  onIntegrationChange: (integrations: Integration[]) => void
}

export function IntegrationManager({ formId, integrations, onIntegrationChange }: IntegrationManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null)
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<'zapier' | 'n8n' | 'webhook' | null>(null)

  const handleAddIntegration = async (service: 'zapier' | 'n8n' | 'webhook', config: any) => {
    const newIntegration: Integration = {
      id: `int_${Date.now()}`,
      name: `${service} Integration`,
      service,
      status: 'active',
      trigger: config.trigger || 'form_submission',
      targetUrl: config.targetUrl,
      workflowId: config.workflowId,
      fields: config.fields || [],
      filters: config.filters || {},
      totalTriggers: 0
    }

    onIntegrationChange([...integrations, newIntegration])
    setShowAddModal(false)
  }

  const handleUpdateIntegration = (updated: Integration) => {
    onIntegrationChange(
      integrations.map(i => i.id === updated.id ? updated : i)
    )
    setEditingIntegration(null)
  }

  const handleDeleteIntegration = (id: string) => {
    onIntegrationChange(integrations.filter(i => i.id !== id))
  }

  const handleTestIntegration = async (integration: Integration) => {
    setTestingIntegration(integration.id)

    try {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test submission'
      }

      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration,
          data: testData
        })
      })

      const result = await response.json()

      if (result.success) {
        // Show success message
        console.log('Test successful')
      } else {
        // Show error message
        console.error('Test failed:', result.error)
      }
    } catch (error) {
      console.error('Test error:', error)
    } finally {
      setTestingIntegration(null)
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'zapier':
        return <Zap className="w-4 h-4" />
      case 'n8n':
        return <Workflow className="w-4 h-4" />
      default:
        return <ExternalLink className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Integrations</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg transition-colors flex items-center gap-2 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add Integration
        </button>
      </div>

      {/* Integrations List */}
      <div className="space-y-2">
        {integrations.length === 0 ? (
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-sm text-white/60">No integrations configured</p>
            <p className="text-xs text-white/40 mt-1">Connect your forms to Zapier, n8n, or custom webhooks</p>
          </div>
        ) : (
          integrations.map((integration) => (
            <div
              key={integration.id}
              className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getServiceIcon(integration.service)}
                  <div>
                    <p className="text-sm font-medium text-white">{integration.name}</p>
                    <p className="text-xs text-white/60 capitalize">{integration.service}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(integration.status)}
                  <button
                    onClick={() => setEditingIntegration(integration)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <Edit className="w-3 h-3 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleTestIntegration(integration)}
                    disabled={testingIntegration === integration.id}
                    className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                  >
                    {testingIntegration === integration.id ? (
                      <div className="w-3 h-3 animate-spin rounded-full border border-neon-cyan border-t-transparent" />
                    ) : (
                      <TestTube className="w-3 h-3 text-white/60" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteIntegration(integration.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-white/40">
                <p>Trigger: {integration.trigger.replace('_', ' ')}</p>
                {integration.targetUrl && (
                  <p className="truncate">URL: {integration.targetUrl}</p>
                )}
                {integration.workflowId && (
                  <p>Workflow: {integration.workflowId}</p>
                )}
                {integration.lastTrigger && (
                  <p>Last triggered: {new Date(integration.lastTrigger).toLocaleString()}</p>
                )}
                <p>Total triggers: {integration.totalTriggers}</p>
              </div>

              {/* Selected Fields */}
              {integration.fields.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-1">Fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {integration.fields.map(field => (
                      <span
                        key={field}
                        className="px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 p-4 z-50">
          <div className="bg-space-light p-6 rounded-xl border border-white/20 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Add Integration</h3>

            {selectedService ? (
              <IntegrationConfigForm
                service={selectedService}
                onBack={() => setSelectedService(null)}
                onSave={(config) => {
                  handleAddIntegration(selectedService, config)
                  setSelectedService(null)
                  setShowAddModal(false)
                }}
              />
            ) : (
              <div className="space-y-3">
                {/* Zapier */}
                <button
                  onClick={() => setSelectedService('zapier')}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Zapier</p>
                    <p className="text-xs text-white/60">Connect to 5000+ apps</p>
                  </div>
                </button>

                {/* n8n */}
                <button
                  onClick={() => setSelectedService('n8n')}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Workflow className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">n8n</p>
                    <p className="text-xs text-white/60">Open source workflow automation</p>
                  </div>
                </button>

                {/* Webhook */}
                <button
                  onClick={() => setSelectedService('webhook')}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Custom Webhook</p>
                    <p className="text-xs text-white/60">Send data to any URL</p>
                  </div>
                </button>
              </div>
            )}

            {!selectedService && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Integration Modal */}
      {editingIntegration && (
        <IntegrationEditModal
          integration={editingIntegration}
          onSave={handleUpdateIntegration}
          onCancel={() => setEditingIntegration(null)}
        />
      )}
    </div>
  )
}

// Integration Edit Modal Component
function IntegrationEditModal({
  integration,
  onSave,
  onCancel
}: {
  integration: Integration
  onSave: (integration: Integration) => void
  onCancel: () => void
}) {
  const [config, setConfig] = useState(integration)

  const handleSave = () => {
    onSave(config)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 p-4 z-50">
      <div className="bg-space-light p-6 rounded-xl border border-white/20 max-w-md w-full">
        <h3 className="text-lg font-semibold text-white mb-4">Edit Integration</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
            />
          </div>

          {(integration.service === 'zapier' || integration.service === 'webhook') && (
            <div>
              <label className="block text-sm text-white/60 mb-1">Webhook URL</label>
              <input
                type="url"
                value={config.targetUrl || ''}
                onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                placeholder="https://hooks.zapier.com/..."
              />
            </div>
          )}

          {integration.service === 'n8n' && (
            <div>
              <label className="block text-sm text-white/60 mb-1">n8n Instance URL</label>
              <input
                type="url"
                value={config.targetUrl || ''}
                onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                placeholder="https://n8n.example.com"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// Integration Configuration Form Component
function IntegrationConfigForm({
  service,
  onBack,
  onSave
}: {
  service: 'zapier' | 'n8n' | 'webhook'
  onBack: () => void
  onSave: (config: any) => void
}) {
  const [config, setConfig] = useState({
    name: `${service.charAt(0).toUpperCase() + service.slice(1)} Integration`,
    trigger: 'form_submission' as const,
    targetUrl: '',
    workflowId: '',
    fields: []
  })

  const handleSubmit = () => {
    onSave(config)
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </button>

      <div>
        <label className="block text-sm text-white/60 mb-1">Integration Name</label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">Trigger</label>
        <select
          value={config.trigger}
          onChange={(e) => setConfig({ ...config, trigger: e.target.value as any })}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
        >
          <option value="form_submission">On Form Submission</option>
          <option value="form_updated">On Form Update</option>
          <option value="payment_completed">On Payment Completed</option>
        </select>
      </div>

      {(service === 'zapier' || service === 'webhook') && (
        <div>
          <label className="block text-sm text-white/60 mb-1">Webhook URL</label>
          <input
            type="url"
            value={config.targetUrl}
            onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
            placeholder={service === 'zapier' ? "https://hooks.zapier.com/..." : "https://your-webhook-url.com/..."}
          />
        </div>
      )}

      {service === 'n8n' && (
        <>
          <div>
            <label className="block text-sm text-white/60 mb-1">n8n Instance URL</label>
            <input
              type="url"
              value={config.targetUrl}
              onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              placeholder="https://n8n.example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Workflow ID</label>
            <input
              type="text"
              value={config.workflowId}
              onChange={(e) => setConfig({ ...config, workflowId: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              placeholder="workflow-id"
            />
          </div>
        </>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          className="flex-1 px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
        >
          Save Integration
        </button>
      </div>
    </div>
  )
}
