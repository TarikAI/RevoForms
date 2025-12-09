'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X, Sparkles, CheckCircle2, Clock, Bug, Rocket } from 'lucide-react'

// Version info - update these for each release
export const APP_VERSION = '1.0.0'
export const VERSION_DATE = '2024-12-10'
export const VERSION_CODENAME = 'Genesis'

interface ChangelogEntry {
  version: string
  date: string
  codename: string
  changes: {
    type: 'feature' | 'improvement' | 'fix' | 'breaking'
    description: string
  }[]
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2024-12-10',
    codename: 'Genesis',
    changes: [
      { type: 'feature', description: 'AI-powered form generation via natural conversation' },
      { type: 'feature', description: 'Voice input for hands-free form creation' },
      { type: 'feature', description: 'AI Avatar assistant with real-time interactions' },
      { type: 'feature', description: 'Infinite canvas with drag-and-drop form editing' },
      { type: 'feature', description: 'PDF and image-to-form extraction' },
      { type: 'feature', description: 'Multi-format export (WordPress, HTML, React, JSON, PDF)' },
      { type: 'feature', description: 'User profile system for AI auto-fill' },
      { type: 'feature', description: '10+ pre-built templates' },
      { type: 'feature', description: 'Custom CSS styling with 20+ targetable classes' },
      { type: 'feature', description: 'Glassmorphism design theme' },
      { type: 'improvement', description: 'Response collection backend with analytics' },
      { type: 'improvement', description: 'Form sharing with QR codes' },
    ]
  }
]

export function VersionBadge() {
  const [showChangelog, setShowChangelog] = useState(false)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
      case 'improvement': return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
      case 'fix': return <Bug className="w-3.5 h-3.5 text-amber-400" />
      case 'breaking': return <Rocket className="w-3.5 h-3.5 text-red-400" />
      default: return <Info className="w-3.5 h-3.5 text-white/50" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-neon-cyan/20 text-neon-cyan'
      case 'improvement': return 'bg-green-500/20 text-green-400'
      case 'fix': return 'bg-amber-500/20 text-amber-400'
      case 'breaking': return 'bg-red-500/20 text-red-400'
      default: return 'bg-white/10 text-white/50'
    }
  }

  return (
    <>
      {/* Version Badge - Fixed bottom right */}
      <motion.button
        onClick={() => setShowChangelog(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-space-light/80 backdrop-blur-xl border border-white/10 rounded-full text-xs text-white/60 hover:text-white hover:border-neon-cyan/30 transition-all shadow-lg"
      >
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span>v{APP_VERSION}</span>
        <span className="text-white/30">|</span>
        <span className="text-neon-cyan">{VERSION_CODENAME}</span>
      </motion.button>

      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChangelog(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[80vh] bg-space-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-neon-cyan" />
                      RevoForms
                    </h2>
                    <p className="text-sm text-white/50 mt-1">
                      Version {APP_VERSION} • {VERSION_CODENAME}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowChangelog(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>
              </div>

              {/* Changelog Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {changelog.map((entry) => (
                    <div key={entry.version} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs font-mono rounded">
                          v{entry.version}
                        </span>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {entry.date}
                        </span>
                        <span className="text-xs text-neon-purple font-medium">
                          {entry.codename}
                        </span>
                      </div>
                      
                      <div className="space-y-2 pl-2 border-l border-white/10">
                        {entry.changes.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-2 py-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${getTypeColor(change.type)}`}>
                              {change.type}
                            </span>
                            <span className="text-sm text-white/70 flex-1">
                              {change.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <p className="text-xs text-center text-white/40">
                  Built with ❤️ by RevoForms Team • 
                  <a href="#" className="text-neon-cyan hover:underline ml-1">Report Bug</a> • 
                  <a href="#" className="text-neon-cyan hover:underline ml-1">Request Feature</a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
