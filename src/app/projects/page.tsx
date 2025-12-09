'use client'

import { Header } from '@/components/ui/Header'
import { ProjectsDashboard } from '@/components/projects/ProjectsDashboard'
import { ProfileModal } from '@/components/profile'

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-space overflow-auto">
      <Header />
      <ProjectsDashboard />
      <ProfileModal />
    </div>
  )
}