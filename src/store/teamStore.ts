/**
 * Team Collaboration Store
 *
 * Manages teams, members, roles, and permissions
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: TeamRole
  status: 'active' | 'pending' | 'inactive'
  invitedAt: Date
  invitedBy: string
  lastActive?: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  createdAt: Date
  ownerId: string
  members: TeamMember[]
  settings: {
    allowInvite: boolean
    requireApproval: boolean
    maxMembers: number
  }
}

export interface TeamInvite {
  id: string
  teamId: string
  email: string
  role: TeamRole
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

export interface ActivityLog {
  id: string
  teamId: string
  userId: string
  action: string
  entityType: 'form' | 'project' | 'team' | 'member'
  entityId: string
  entityName: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface TeamState {
  // Current state
  currentTeam: Team | null
  teams: Team[]
  invites: TeamInvite[]
  activityLogs: ActivityLog[]

  // Actions
  createTeam: (name: string, description?: string) => Team
  updateTeam: (teamId: string, updates: Partial<Team>) => void
  deleteTeam: (teamId: string) => void
  setCurrentTeam: (teamId: string) => void

  // Member management
  addMember: (teamId: string, email: string, role: TeamRole) => Promise<TeamMember>
  updateMemberRole: (teamId: string, memberId: string, role: TeamRole) => void
  removeMember: (teamId: string, memberId: string) => void
  acceptInvite: (inviteId: string) => void
  declineInvite: (inviteId: string) => void

  // Permissions
  canPerformAction: (teamId: string, action: string, userId: string) => boolean
  getMemberRole: (teamId: string, userId: string) => TeamRole | null

  // Activity
  logActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void
  getActivityLogs: (teamId: string, limit?: number) => ActivityLog[]
}

// Role permissions matrix
const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: [
    'create', 'edit', 'delete', 'invite', 'remove', 'change_roles',
    'manage_settings', 'view_analytics', 'export_data', 'manage_integrations'
  ],
  admin: [
    'create', 'edit', 'invite', 'remove', 'change_roles',
    'manage_settings', 'view_analytics', 'export_data', 'manage_integrations'
  ],
  editor: [
    'create', 'edit', 'view_analytics'
  ],
  viewer: [
    'view', 'view_analytics'
  ]
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      currentTeam: null,
      teams: [],
      invites: [],
      activityLogs: [],

      createTeam: (name, description) => {
        const newTeam: Team = {
          id: `team_${Date.now()}`,
          name,
          description,
          createdAt: new Date(),
          ownerId: 'current_user', // Would come from auth
          members: [{
            id: `member_${Date.now()}`,
            userId: 'current_user',
            name: 'Current User',
            email: 'user@example.com',
            role: 'owner',
            status: 'active',
            invitedAt: new Date(),
            invitedBy: 'current_user',
          }],
          settings: {
            allowInvite: true,
            requireApproval: false,
            maxMembers: 10,
          },
        }

        set((state) => ({
          teams: [...state.teams, newTeam],
          currentTeam: newTeam,
        }))

        // Log activity
        get().logActivity({
          teamId: newTeam.id,
          userId: 'current_user',
          action: 'created',
          entityType: 'team',
          entityId: newTeam.id,
          entityName: newTeam.name,
        })

        return newTeam
      },

      updateTeam: (teamId, updates) => {
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === teamId ? { ...team, ...updates } : team
          ),
          currentTeam:
            state.currentTeam?.id === teamId
              ? { ...state.currentTeam, ...updates }
              : state.currentTeam,
        }))
      },

      deleteTeam: (teamId) => {
        set((state) => ({
          teams: state.teams.filter((team) => team.id !== teamId),
          currentTeam:
            state.currentTeam?.id === teamId ? null : state.currentTeam,
        }))
      },

      setCurrentTeam: (teamId) => {
        set((state) => ({
          currentTeam: state.teams.find((team) => team.id === teamId) || null,
        }))
      },

      addMember: async (teamId, email, role) => {
        const state = get()
        const team = state.teams.find((t) => t.id === teamId)

        if (!team) throw new Error('Team not found')

        // Check if member already exists
        const existingMember = team.members.find((m) => m.email === email)
        if (existingMember) {
          throw new Error('User already a member of this team')
        }

        // Check team size limit
        if (team.members.length >= team.settings.maxMembers) {
          throw new Error('Team size limit reached')
        }

        // Create invite
        const invite: TeamInvite = {
          id: `invite_${Date.now()}`,
          teamId,
          email,
          role,
          invitedBy: 'current_user',
          invitedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'pending',
        }

        set((state) => ({
          invites: [...state.invites, invite],
        }))

        // In production, send email invite here
        // await sendInviteEmail(invite)

        // Log activity
        get().logActivity({
          teamId,
          userId: 'current_user',
          action: 'invited',
          entityType: 'member',
          entityId: invite.id,
          entityName: email,
          metadata: { email, role },
        })

        // Simulate adding member (in production, they'd accept invite)
        const newMember: TeamMember = {
          id: `member_${Date.now()}`,
          userId: `user_${Date.now()}`,
          name: email.split('@')[0],
          email,
          role,
          status: 'pending',
          invitedAt: new Date(),
          invitedBy: 'current_user',
        }

        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === teamId
              ? { ...team, members: [...team.members, newMember] }
              : team
          ),
        }))

        return newMember
      },

      updateMemberRole: (teamId, memberId, role) => {
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  members: team.members.map((member) =>
                    member.id === memberId ? { ...member, role } : member
                  ),
                }
              : team
          ),
        }))

        // Log activity
        const team = get().teams.find((t) => t.id === teamId)
        const member = team?.members.find((m) => m.id === memberId)
        if (member) {
          get().logActivity({
            teamId,
            userId: 'current_user',
            action: 'role_changed',
            entityType: 'member',
            entityId: memberId,
            entityName: member.name,
            metadata: { newRole: role, oldRole: member.role },
          })
        }
      },

      removeMember: (teamId, memberId) => {
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  members: team.members.filter((m) => m.id !== memberId),
                }
              : team
          ),
        }))

        // Log activity
        const team = get().teams.find((t) => t.id === teamId)
        const member = team?.members.find((m) => m.id === memberId)
        if (member) {
          get().logActivity({
            teamId,
            userId: 'current_user',
            action: 'removed',
            entityType: 'member',
            entityId: memberId,
            entityName: member.name,
          })
        }
      },

      acceptInvite: (inviteId) => {
        const state = get()
        const invite = state.invites.find((i) => i.id === inviteId)

        if (!invite) return

        set((state) => ({
          invites: state.invites.map((i) =>
            i.id === inviteId ? { ...i, status: 'accepted' } : i
          ),
          teams: state.teams.map((team) =>
            team.id === invite.teamId
              ? {
                  ...team,
                  members: team.members.map((m) =>
                    m.email === invite.email
                      ? { ...m, status: 'active', lastActive: new Date() }
                      : m
                  ),
                }
              : team
          ),
        }))
      },

      declineInvite: (inviteId) => {
        set((state) => ({
          invites: state.invites.map((i) =>
            i.id === inviteId ? { ...i, status: 'declined' } : i
          ),
        }))
      },

      canPerformAction: (teamId, action, userId) => {
        const state = get()
        const team = state.teams.find((t) => t.id === teamId)

        if (!team) return false

        const member = team.members.find((m) => m.userId === userId)
        if (!member) return false

        const permissions = ROLE_PERMISSIONS[member.role]
        return permissions.includes(action)
      },

      getMemberRole: (teamId, userId) => {
        const state = get()
        const team = state.teams.find((t) => t.id === teamId)

        if (!team) return null

        const member = team.members.find((m) => m.userId === userId)
        return member?.role || null
      },

      logActivity: (log) => {
        const activityLog: ActivityLog = {
          ...log,
          id: `log_${Date.now()}_${Math.random()}`,
          timestamp: new Date(),
        }

        set((state) => ({
          activityLogs: [activityLog, ...state.activityLogs].slice(0, 100), // Keep last 100
        }))
      },

      getActivityLogs: (teamId, limit = 50) => {
        const state = get()
        return state.activityLogs
          .filter((log) => log.teamId === teamId)
          .slice(0, limit)
      },
    }),
    {
      name: 'revoforms-team-storage',
      partialize: (state) => ({
        teams: state.teams,
        invites: state.invites,
        activityLogs: state.activityLogs,
      }),
    }
  )
)
