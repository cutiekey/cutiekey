export type ModerationLogPayloads = {
  assignRole: {
    expiresAt: string | null
    roleId: string
    roleName: string
    userHost: string | null
    userId: string
    userUsername: string
  }
  clearQueue: Record<string, never>
  createAvatarDecoration: {
    avatarDecoration: any
    avatarDecorationId: string
  }
  createCustomEmoji: {
    emoji: any
    emojiId: string
  }
  createGlobalAnnouncement: {
    announcement: any
    announcementId: string
  }
  createInvitation: {
    invitations: any[]
  }
  createRole: {
    role: any
    roleId: string
  }
  createUserAnnouncement: {
    announcement: any
    announcementId: string
    userHost: string | null
    userId: string
    userUsername: string
  }
  deleteAvatarDecoration: {
    avatarDecoration: any
    avatarDecorationId: string
  }
  deleteCustomEmoji: {
    emoji: any
    emojiId: string
  }
  deleteDriveFile: {
    fileId: string
    fileUserHost: string | null
    fileUserId: string | null
    fileUserUsername: string | null
  }
  deleteGlobalAnnouncement: {
    announcement: any
    announcementId: string
  }
  deleteNote: {
    note: any
    noteId: string
    noteUserHost: string | null
    noteUserId: string
    noteUserUsername: string
  }
  deleteRole: {
    role: any
    roleId: string
  }
  deleteUserAnnouncement: {
    announcement: any
    announcementId: string
    userHost: string | null
    userId: string
    userUsername: string
  }
  markSensitiveDriveFile: {
    fileId: string
    fileUserHost: string | null
    fileUserId: string | null
    fileUserUsername: string | null
  }
  promoteQueue: Record<string, never>
  resetPassword: {
    userHost: string | null
    userId: string
    userUsername: string
  }
  resolveAbuseReport: {
    forwarded: boolean
    report: any
    reportId: string
  }
  suspend: {
    userHost: string | null
    userId: string
    userUsername: string
  }
  suspendRemoteInstance: {
    id: string
    host: string
  }
  unassignRole: {
    roleId: string
    roleName: string
    userHost: string | null
    userId: string
    userUsername: string
  }
  unmarkSensitiveDriveFile: {
    fileId: string
    fileUserHost: string | null
    fileUserId: string | null
    fileUserUsername: string | null
  }
  unsetUserAvatar: {
    fileId: string
    userHost: string | null
    userId: string
    userUsername: string
  }
  unsetUserBanner: {
    fileId: string
    userHost: string | null
    userId: string
    userUsername: string
  }
  unsuspend: {
    userHost: string | null
    userId: string
    userUsername: string
  }
  unsuspendRemoteInstance: {
    id: string
    host: string
  }
  updateAvatarDecoration: {
    after: any
    avatarDecorationId: string
    before: any
  }
  updateCustomEmoji: {
    after: any
    before: any
    emojiId: string
  }
  updateGlobalAnnouncement: {
    after: any
    announcementId: string
    before: any
  }
  updateRole: {
    after: any
    before: any
    roleId: string
  }
  updateServerSettings: {
    after: any | null
    before: any | null
  }
  updateUserAnnouncement: {
    after: any
    announcementId: string
    before: any
    userHost: string | null
    userId: string
    userUsername: string
  }
  updateUserNote: {
    after: string | null
    before: string | null
    userHost: string | null
    userId: string
    userUsername: string
  }
}

export const followersVisibilities = [
  'followers',
  'private',
  'public'
] as const

export const followingVisibilities = [
  'followers',
  'private',
  'public'
] as const

export const moderationLogTypes = [
  'assignRole',
  'clearQueue',
  'createAvatarDecoration',
  'createCustomEmoji',
  'createGlobalAnnouncement',
  'createInvitation',
  'createRole',
  'createUserAnnouncement',
  'deleteAvatarDecoration',
  'deleteCustomEmoji',
  'deleteDriveFile',
  'deleteGlobalAnnouncement',
  'deleteNote',
  'deleteRole',
  'deleteUserAnnouncement',
  'markSensitiveDriveFile',
  'promoteQueue',
  'resetPassword',
  'resolveAbuseReport',
  'suspend',
  'suspendRemoteInstance',
  'unassignRole',
  'unmarkSensitiveDriveFile',
  'unsetUserAvatar',
  'unsetUserBanner',
  'unsuspend',
  'unsuspendRemoteInstance',
  'updateAvatarDecoration',
  'updateCustomEmoji',
  'updateGlobalAnnouncement',
  'updateRole',
  'updateServerSettings',
  'updateUserAnnouncement',
  'updateUserNote'
] as const

export const mutedNoteReasons = [
  'manual',
  'other',
  'spam',
  'word'
] as const

export const noteVisibilities = [
  'followers',
  'home',
  'public',
  'specified'
] as const

export const notificationTypes = [
  'achievementEarned',
  'app',
  'follow',
  'followRequestAccepted',
  'groupInvited',
  'mention',
  'note',
  'pollEnded',
  'pollVote',
  'quote',
  'reaction',
  'receiveFollowRequest',
  'renote',
  'reply',
  'roleAssigned'
] as const

export const permissions = [
  'read:account',
  'read:admin:abuse-user-reports',
  'read:admin:account',
  'read:admin:announcements',
  'read:admin:avatar-decorations',
  'read:admin:drive',
  'read:admin:emoji',
  'read:admin:index-stats',
  'read:admin:invite-codes',
  'read:admin:meta',
  'read:admin:queue',
  'read:admin:relays',
  'read:admin:roles',
  'read:admin:server-info',
  'read:admin:show-moderation-log',
  'read:admin:show-user',
  'read:admin:show-users',
  'read:admin:table-stats',
  'read:admin:user-ips',
  'read:blocks',
  'read:channels',
  'read:clip-favorite',
  'read:drive',
  'read:favorites',
  'read:federation',
  'read:flash',
  'read:flash-likes',
  'read:following',
  'read:gallery',
  'read:gallery-likes',
  'read:invite-codes',
  'read:messaging',
  'read:mutes',
  'read:notifications',
  'read:page-likes',
  'read:pages',
  'read:reactions',
  'read:user-groups',
  'write:account',
  'write:admin:account',
  'write:admin:announcements',
  'write:admin:avatar-decorations',
  'write:admin:delete-account',
  'write:admin:delete-all-files-of-a-user',
  'write:admin:drive',
  'write:admin:emoji',
  'write:admin:federation',
  'write:admin:invite-codes',
  'write:admin:meta',
  'write:admin:promo',
  'write:admin:queue',
  'write:admin:relays',
  'write:admin:reset-password',
  'write:admin:resolve-abuse-user-report',
  'write:admin:roles',
  'write:admin:send-email',
  'write:admin:suspend-user',
  'write:admin:unset-user-avatar',
  'write:admin:unset-user-banner',
  'write:admin:unsuspend-user',
  'write:admin:user-note',
  'write:blocks',
  'write:channels',
  'write:clip-favorite',
  'write:drive',
  'write:favorites',
  'write:flash',
  'write:flash-likes',
  'write:following',
  'write:gallery',
  'write:gallery-likes',
  'write:invite-codes',
  'write:messaging',
  'write:mutes',
  'write:notes',
  'write:notifications',
  'write:page-likes',
  'write:pages',
  'write:reactions',
  'write:report-abuse',
  'write:user-groups',
  'write:votes'
] as const
