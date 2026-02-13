'use client'

import { Header } from '@/components/ui/Header'
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas'
import { FloatingAvatar } from '@/components/avatar/FloatingAvatar'
import { AvatarSidebar } from '@/components/avatar/AvatarSidebar'
import { PropertiesPanel } from '@/components/properties/PropertiesPanel'
import { ProfileModal } from '@/components/profile'
import { FormPreview } from '@/components/form-builder/FormPreview'
import { ExportModal } from '@/components/form-builder/ExportModal'
import { VersionBadge } from '@/components/ui/VersionBadge'
import { useFormStore } from '@/store/formStore'
import { useChatStore } from '@/store/chatStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MultiFileUploadZone } from '@/components/upload/MultiFileUploadZone'

function FormExport() {
  const exportFormId = useFormStore((state) => state.exportFormId)
  const closeExport = useFormStore((state) => state.closeExport)
  const forms = useFormStore((state) => state.forms)
  const form = forms.find((f) => f.id === exportFormId) || null

  return (
    <ExportModal
      form={form}
      isOpen={!!exportFormId}
      onClose={closeExport}
    />
  )
}

function FormPreviewWrapper() {
  const previewFormId = useFormStore((state) => state.previewFormId)
  const closePreview = useFormStore((state) => state.closePreview)
  const forms = useFormStore((state) => state.forms)
  const form = forms.find((f) => f.id === previewFormId) || null

  return (
    <FormPreview
      form={form}
      isOpen={!!previewFormId}
      onClose={closePreview}
    />
  )
}

export default function Home() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [showMultiUpload, setShowMultiUpload] = useState(false)
  const [showMultiUpload, setShowMultiUpload] = useState(false)

  const propertiesPanelOpen = useFormStore((state) => state.propertiesPanelOpen)
  const togglePropertiesPanel = useFormStore((state) => state.togglePropertiesPanel)
  const isAvatarFloating = useChatStore((state) => state.isAvatarFloating)

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ enabled: true })

  return (
    <div className="min-h-screen bg-space">
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Properties Panel */}
          <PropertiesPanel
            isExpanded={propertiesPanelOpen}
            onToggle={togglePropertiesPanel}
          />

          {/* Main Canvas */}
          <InfiniteCanvas />

          {/* Right Sidebar - Avatar/Chat */}
          {!isAvatarFloating && (
            <AvatarSidebar
              isExpanded={isSidebarExpanded}
              onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
            />
          )}
        </div>
      </div>

      {/* Floating Avatar */}
      <AnimatePresence>
        {isAvatarFloating && (
          <FloatingAvatar
            onOpenSidebar={() => setIsSidebarExpanded(true)}
            onUploadClick={() => {}}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <ProfileModal />
      <FormPreviewWrapper />
      <FormExport />
      
      {/* Version Badge */}
      <VersionBadge />

      {/* Multi-File Upload Modal */}
      <MultiFileUploadZone
        isOpen={showMultiUpload}
        onClose={() => setShowMultiUpload(false)}
        onFormCreated={(formData) => {
          // Import form to store
          const { addForm } = require('@/store/formStore').default.getState() as any
          addForm(formData)
          // Focus on the newly created form
          if (formData.id) {
            const { selectForm } = require('@/store/formStore').default.getState() as any
            selectForm(formData.id)
          }
        }}
      />
    </div>
  )
}
