'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Plus,
  Settings,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
  Mail,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  AlertCircle,
  GitBranch,
  Activity,
  MessageSquare,
  Calendar,
  Search,
  Filter,
  Download,
  Share,
  Copy,
  ExternalLink
} from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canShare: boolean
    canViewAnalytics: boolean
    canManageTeam: boolean
  }
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
  joinedAt: string
}

interface TeamActivity {
  id: string
  userId: string
  userName: string
  action: string
  target: string
  timestamp: string
  details?: any
}

interface TeamCollaborationProps {
  formId: string
  members: TeamMember[]
  activities: TeamActivity[]
  onMembersChange: (members: TeamMember[]) => void
  onAddMember: (email: string, role: TeamMember['role']) => void
}

export function TeamCollaboration({
  formId,
  members,
  activities,
  onMembersChange,
  onAddMember
}: TeamCollaborationProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('editor')
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'settings'>('members')

  const roleHierarchy = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleLabels = {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer'
  }

  const rolePermissions = {
    owner: {
      canEdit: true,
      canDelete: true,
      canShare: true,
      canViewAnalytics: true,
      canManageTeam: true
    },
    admin: {
      canEdit: true,
      canDelete: true,
      canShare: true,
      canViewAnalytics: true,
      canManageTeam: false
    },
    editor: {
      canEdit: true,
      canDelete: false,
      canShare: true,
      canViewAnalytics: false,
      canManageTeam: false
    },
    viewer: {
      canEdit: false,
      canDelete: false,
      canShare: false,
      canViewAnalytics: true,
      canManageTeam: false
    }
  }

  const handleInvite = () => {
    if (inviteEmail && inviteEmail.includes('@')) {
      onAddMember(inviteEmail, inviteRole)
      setInviteEmail('')
      setInviteRole('editor')
      setShowInviteModal(false)
    }
  }

  const updateMemberRole = (memberId: string, newRole: TeamMember['role']) => {
    onMembersChange(
      members.map(m =>
        m.id === memberId
          ? { ...m, role: newRole, permissions: rolePermissions[newRole] }
          : m
      )
    )
  }

  const removeMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      onMembersChange(members.filter(m => m.id !== memberId))
    }
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('created') || action.includes('added')) {
      return <Plus className="w-4 h-4 text-green-400" />
    }
    if (action.includes('updated') || action.includes('edited')) {
      return <Edit className="w-4 h-4 text-blue-400" />
    }
    if (action.includes('deleted') || action.includes('removed')) {
      return <Trash2 className="w-4 h-4 text-red-400" />
    }
    if (action.includes('shared') || action.includes('invited')) {
      return <Share className="w-4 h-4 text-purple-400" />
    }
    return <Activity className="w-4 h-4 text-white/60" />
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-cyan" />
            Team Collaboration
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Manage team members and track collaboration
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60">Total Members</span>
          </div>
          <p className="text-2xl font-bold text-white">{members.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/60">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {members.filter(m => m.status === 'active').length}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-white/60">Admins</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60">Viewers</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {members.filter(m => m.role === 'viewer').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'members'
              ? 'bg-neon-cyan/20 text-neon-cyan'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          Members
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'activity'
              ? 'bg-neon-cyan/20 text-neon-cyan'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          Activity
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-neon-cyan/20 text-neon-cyan'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center text-white/30" />
                <p className="text-sm text-white/40">No team members found</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {member.status === 'active' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-space-light" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            member.role === 'owner'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : member.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-400'
                              : member.role === 'editor'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {roleLabels[member.role]}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">{member.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last active {formatTimestamp(member.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMember(member)
                          setShowMemberModal(true)
                        }}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        title="Edit member"
                      >
                        <Edit className="w-3 h-3 text-white/60" />
                      </button>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-sm font-medium text-white mb-3">Recent Activity</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-center text-white/40 py-8">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                    <div className="p-1.5 bg-white/10 rounded-full">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">
                        <span className="font-medium">{activity.userName}</span>
                        <span className="mx-1 text-white/40">•</span>
                        {activity.action}
                      </p>
                      {activity.target && (
                        <p className="text-xs text-white/40 mt-1">
                          {activity.target}
                        </p>
                      )}
                      <p className="text-xs text-white/30 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-sm font-medium text-white mb-4">Team Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 rounded accent-neon-cyan"
                />
                <div>
                  <p className="text-sm text-white/70">Allow members to share forms externally</p>
                  <p className="text-xs text-white/40">Members with Editor+ permissions can share forms</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="w-4 h-4 rounded accent-neon-cyan"
                />
                <div>
                  <p className="text-sm text-white/70">Require approval for new members</p>
                  <p className="text-xs text-white/40">Admin must approve join requests</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 rounded accent-neon-cyan"
                />
                <div>
                  <p className="text-sm text-white/70">Enable activity logging</p>
                  <p className="text-xs text-white/40">Track all team member actions</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-sm font-medium text-white mb-4">Role Permissions</h4>
            <div className="space-y-3">
              {Object.entries(rolePermissions).map(([role, permissions]) => (
                <div key={role} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      role === 'owner'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : role === 'admin'
                        ? 'bg-blue-500/20 text-blue-400'
                        : role === 'editor'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {roleLabels[role as keyof typeof roleLabels]}
                    </span>
                    <div className="flex gap-3 text-xs text-white/60">
                      <span className={permissions.canEdit ? 'text-green-400' : 'text-white/30'}>Edit</span>
                      <span className={permissions.canDelete ? 'text-green-400' : 'text-white/30'}>Delete</span>
                      <span className={permissions.canShare ? 'text-green-400' : 'text-white/30'}>Share</span>
                      <span className={permissions.canViewAnalytics ? 'text-green-400' : 'text-white/30'}>Analytics</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-space-light p-6 rounded-xl border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Invite Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="flex-1 py-2 px-4 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Edit Modal */}
      {showMemberModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-space-light p-6 rounded-xl border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Name</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Email</label>
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Role</label>
                <select
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as TeamMember['role'] })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    updateMemberRole(editingMember.id, editingMember.role)
                    setShowMemberModal(false)
                    setEditingMember(null)
                  }}
                  className="flex-1 py-2 px-4 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowMemberModal(false)
                    setEditingMember(null)
                  }}
                  className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}