'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Settings, MessageSquare, Eye, Edit3, Lock, Unlock,
  Send, Share2, Copy, Mail, Clock, Activity, FileText, CheckCircle,
  AlertCircle, X, ChevronDown, Search, Filter, Star, MoreHorizontal,
  Video, Mic, MicOff, VideoOff, ScreenShare, Hand, Zap
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  status: 'online' | 'offline' | 'away' | 'busy'
  cursor?: {
    x: number
    y: number
    fieldId?: string
  }
  color: string
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: Date
  fieldId?: string
  resolved: boolean
  replies: Comment[]
}

interface Change {
  id: string
  userId: string
  userName: string
  type: 'add' | 'edit' | 'delete' | 'move'
  description: string
  timestamp: Date
  fieldId?: string
}

interface Version {
  id: string
  name: string
  description: string
  createdAt: Date
  createdBy: string
  changes: number
}

export function FormCollaboration() {
  const [activeTab, setActiveTab] = useState<'people' | 'comments' | 'history' | 'versions'>('people')
  const [collaborators, setCollaborators] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'JD',
      role: 'owner',
      status: 'online',
      color: '#3B82F6'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'JS',
      role: 'editor',
      status: 'online',
      cursor: { x: 200, y: 150, fieldId: 'field_1' },
      color: '#10B981'
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      avatar: 'BJ',
      role: 'viewer',
      status: 'away',
      color: '#F59E0B'
    },
    {
      id: '4',
      name: 'Alice Brown',
      email: 'alice@example.com',
      avatar: 'AB',
      role: 'commenter',
      status: 'offline',
      color: '#EF4444'
    }
  ])

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Jane Smith',
      userAvatar: 'JS',
      content: 'Should we make this field required?',
      timestamp: new Date(Date.now() - 5 * 60000),
      fieldId: 'field_1',
      resolved: false,
      replies: [
        {
          id: '1-1',
          userId: '1',
          userName: 'John Doe',
          userAvatar: 'JD',
          content: 'Yes, I think it should be required for better data quality.',
          timestamp: new Date(Date.now() - 3 * 60000),
          resolved: false,
          replies: []
        }
      ]
    },
    {
      id: '2',
      userId: '3',
      userName: 'Bob Johnson',
      userAvatar: 'BJ',
      content: 'The validation message could be clearer.',
      timestamp: new Date(Date.now() - 15 * 60000),
      fieldId: 'field_2',
      resolved: true,
      replies: []
    }
  ])

  const [changes, setChanges] = useState<Change[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Jane Smith',
      type: 'edit',
      description: 'Updated field label in "Contact Information"',
      timestamp: new Date(Date.now() - 2 * 60000),
      fieldId: 'field_1'
    },
    {
      id: '2',
      userId: '1',
      userName: 'John Doe',
      type: 'add',
      description: 'Added new field "Email Address"',
      timestamp: new Date(Date.now() - 5 * 60000),
      fieldId: 'field_3'
    },
    {
      id: '3',
      userId: '3',
      userName: 'Bob Johnson',
      type: 'move',
      description: 'Reordered fields in section 2',
      timestamp: new Date(Date.now() - 10 * 60000)
    }
  ])

  const [versions, setVersions] = useState<Version[]>([
    {
      id: '1',
      name: 'v2.0 - Customer Feedback',
      description: 'Added customer feedback section and improved validation',
      createdAt: new Date(Date.now() - 60 * 60000),
      createdBy: 'John Doe',
      changes: 15
    },
    {
      id: '2',
      name: 'v1.9 - Minor Updates',
      description: 'Fixed typos and updated descriptions',
      createdAt: new Date(Date.now() - 120 * 60000),
      createdBy: 'Jane Smith',
      changes: 5
    }
  ])

  const [newComment, setNewComment] = useState('')
  const [selectedComment, setSelectedComment] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer' | 'commenter'>('viewer')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const commentEndRef = useRef<HTMLDivElement>(null)

  const tabs = [
    { id: 'people', label: 'People', icon: Users, count: collaborators.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.filter(c => !c.resolved).length },
    { id: 'history', label: 'History', icon: Clock, count: changes.length },
    { id: 'versions', label: 'Versions', icon: FileText, count: versions.length }
  ]

  const rolePermissions = {
    owner: { canEdit: true, canComment: true, canView: true, canManage: true },
    editor: { canEdit: true, canComment: true, canView: true, canManage: false },
    commenter: { canEdit: false, canComment: true, canView: true, canManage: false },
    viewer: { canEdit: false, canComment: false, canView: true, canManage: false }
  }

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-400'
    }
  }

  const getChangeIcon = (type: Change['type']) => {
    switch (type) {
      case 'add': return CheckCircle
      case 'edit': return Edit3
      case 'delete': return X
      case 'move': return Share2
    }
  }

  const getChangeColor = (type: Change['type']) => {
    switch (type) {
      case 'add': return 'text-green-600 bg-green-100'
      case 'edit': return 'text-blue-600 bg-blue-100'
      case 'delete': return 'text-red-600 bg-red-100'
      case 'move': return 'text-purple-600 bg-purple-100'
    }
  }

  const handleSendInvite = () => {
    if (!inviteEmail) return

    const newCollaborator: User = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      avatar: inviteEmail.substring(0, 2).toUpperCase(),
      role: inviteRole,
      status: 'offline',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    }

    setCollaborators(prev => [...prev, newCollaborator])
    setInviteEmail('')
    setShowInviteModal(false)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      userId: '1',
      userName: 'John Doe',
      userAvatar: 'JD',
      content: newComment,
      timestamp: new Date(),
      resolved: false,
      replies: []
    }

    setComments(prev => [comment, ...prev])
    setNewComment('')
    setSelectedComment(null)
  }

  const handleReply = (commentId: string) => {
    if (!replyText.trim()) return

    const reply: Comment = {
      id: `${commentId}-${Date.now()}`,
      userId: '1',
      userName: 'John Doe',
      userAvatar: 'JD',
      content: replyText,
      timestamp: new Date(),
      resolved: false,
      replies: []
    }

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...comment.replies, reply]
        }
      }
      return comment
    }))

    setReplyText('')
  }

  const handleResolveComment = (commentId: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, resolved: !comment.resolved }
      }
      return comment
    }))
  }

  const updateCollaboratorRole = (userId: string, role: User['role']) => {
    setCollaborators(prev => prev.map(user =>
      user.id === userId ? { ...user, role } : user
    ))
  }

  const removeCollaborator = (userId: string) => {
    setCollaborators(prev => prev.filter(user => user.id !== userId))
  }

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="w-10 h-10" />
            Form Collaboration
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Real-time collaboration with your team
          </p>
        </div>

        {/* Live Collaboration Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6" />
                <span className="font-semibold">Live Collaboration</span>
              </div>
              <div className="flex -space-x-3">
                {collaborators.filter(u => u.status === 'online').slice(0, 5).map(user => (
                  <div
                    key={user.id}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 border-white shadow-lg"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.avatar}
                  </div>
                ))}
                {collaborators.filter(u => u.status === 'online').length > 5 && (
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-semibold border-2 border-white shadow-lg">
                    +{collaborators.filter(u => u.status === 'online').length - 5}
                  </div>
                )}
              </div>
              <span className="text-sm opacity-90">
                {collaborators.filter(u => u.status === 'online').length} people online
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsVideoCall(!isVideoCall)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
              >
                {isVideoCall ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                Video Call
              </button>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLiveMode}
                  onChange={(e) => setIsLiveMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Video Call Modal */}
        <AnimatePresence>
          {isVideoCall && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 rounded-xl w-full max-w-6xl h-[600px] flex flex-col">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Video Call</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2 rounded-lg ${isMuted ? 'bg-red-600' : 'bg-slate-700'} text-white`}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`p-2 rounded-lg ${isVideoOff ? 'bg-red-600' : 'bg-slate-700'} text-white`}
                    >
                      {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                    <button className="p-2 bg-slate-700 rounded-lg text-white">
                      <ScreenShare className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-slate-700 rounded-lg text-white">
                      <Hand className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsVideoCall(false)}
                      className="px-4 py-2 bg-red-600 rounded-lg text-white font-medium"
                    >
                      Leave Call
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 grid grid-cols-3 gap-4">
                  {collaborators.filter(u => u.status === 'online').map((user, index) => (
                    <div key={user.id} className="bg-slate-800 rounded-lg flex items-center justify-center h-full">
                      {!isVideoOff && index === 0 ? (
                        <div className="text-white">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold mb-3">
                            {user.avatar}
                          </div>
                          <p className="text-center">{user.name}</p>
                        </div>
                      ) : (
                        <div className="text-white text-center">
                          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-bold mb-3">
                            {user.avatar}
                          </div>
                          <p>{user.name}</p>
                          <p className="text-sm text-slate-400 mt-1">Camera off</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex space-x-1 p-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 relative ${
                      activeTab === tab.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'people' && (
                <motion.div
                  key="people"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Team Members ({collaborators.length})
                    </h3>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite People
                    </button>
                  </div>

                  <div className="space-y-3">
                    {collaborators.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${getStatusColor(user.status)}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              {user.name}
                              {user.role === 'owner' && <Lock className="w-4 h-4 text-slate-400" />}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={user.role}
                            onChange={(e) => updateCollaboratorRole(user.id, e.target.value as User['role'])}
                            disabled={user.role === 'owner'}
                            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                          >
                            <option value="viewer">Can View</option>
                            <option value="commenter">Can Comment</option>
                            <option value="editor">Can Edit</option>
                            <option value="owner">Owner</option>
                          </select>

                          {user.role !== 'owner' && (
                            <button
                              onClick={() => removeCollaborator(user.id)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'comments' && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                            {comment.userAvatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{comment.userName}</p>
                                <p className="text-xs text-slate-500 mt-1">{comment.timestamp.toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleResolveComment(comment.id)}
                                  className={`text-xs px-3 py-1 rounded-full border ${
                                    comment.resolved
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {comment.resolved ? 'Resolved' : 'Resolve'}
                                </button>
                                <button className="text-slate-400 hover:text-slate-600">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <p className="mt-2 text-slate-700 dark:text-slate-300">{comment.content}</p>

                            {comment.replies.length > 0 && (
                              <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                {comment.replies.map(reply => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                      {reply.userAvatar}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{reply.userName}</p>
                                      <p className="text-sm text-slate-700 dark:text-slate-300">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {!comment.resolved && (
                              <div className="mt-3 flex gap-2">
                                <input
                                  type="text"
                                  value={selectedComment === comment.id ? replyText : ''}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onFocus={() => setSelectedComment(comment.id)}
                                  placeholder="Reply..."
                                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                                />
                                {selectedComment === comment.id && (
                                  <button
                                    onClick={() => handleReply(comment.id)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                  >
                                    Reply
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={commentEndRef} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {changes.map(change => {
                      const Icon = getChangeIcon(change.type)
                      return (
                        <div key={change.id} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getChangeColor(change.type)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-900 dark:text-slate-100">{change.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>{change.userName}</span>
                              <span>•</span>
                              <span>{change.timestamp.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'versions' && (
                <motion.div
                  key="versions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="space-y-4">
                    {versions.map(version => (
                      <div key={version.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{version.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{version.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span>Created by {version.createdBy}</span>
                              <span>•</span>
                              <span>{version.createdAt.toLocaleString()}</span>
                              <span>•</span>
                              <span>{version.changes} changes</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                              Restore
                            </button>
                            <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                              Compare
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Invite Team Members</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="viewer">Can View</option>
                    <option value="commenter">Can Comment</option>
                    <option value="editor">Can Edit</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}