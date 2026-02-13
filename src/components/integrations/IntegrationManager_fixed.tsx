'use client'

import { useState } from 'react'

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
        className="mb-4 text-sm text-white/60 hover:text-white transition-colors"
      >
        ← Back to services
      </button>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Integration Name
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
        />
      </div>

      {service === 'zapier' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Zapier Webhook URL
          </label>
          <input
            type="url"
            value={config.targetUrl}
            onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
            placeholder="https://hooks.zapier.com/hooks/catch/123/456/"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>
      )}

      {service === 'n8n' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            n8n Webhook URL
          </label>
          <input
            type="url"
            value={config.targetUrl}
            onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
            placeholder="http://localhost:5678/webhook/test"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>
      )}

      {service === 'webhook' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Webhook URL
          </label>
          <input
            type="url"
            value={config.targetUrl}
            onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
            placeholder="https://your-api.com/webhook"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
          />
          <p className="text-xs text-white/40 mt-1">
            We'll send a POST request with the form data to this URL
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}