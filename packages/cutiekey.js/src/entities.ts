import type { ModerationLogPayloads } from '@/consts'
import type * as Models from '@/autogen/models'

export type AnnouncementCreated = {
  announcement: Models.Announcement
}

export type DateString = string

export type EmojiAdded = {
  emoji: Models.EmojiDetailed
}

export type EmojiDeleted = {
  emojis: Models.EmojiDetailed[]
}

export type EmojiUpdated = {
  emojis: Models.EmojiDetailed[]
}

export type ID = string

export type ModerationLog = {
  id: ID
  user: Models.UserDetailedNotMe | null
  userId: Models.User['id']
  createdAt: DateString
} & (
  | {
      info: ModerationLogPayloads['assignRole']
      type: 'assignRole'
    }
  | {
      info: ModerationLogPayloads['clearQueue']
      type: 'clearQueue'
    }
  | {
      info: ModerationLogPayloads['createAvatarDecoration']
      type: 'createAvatarDecoration'
    }
  | {
      info: ModerationLogPayloads['createCustomEmoji']
      type: 'createCustomEmoji'
    }
  | {
      info: ModerationLogPayloads['createGlobalAnnouncement']
      type: 'createGlobalAnnouncement'
    }
  | {
      info: ModerationLogPayloads['createInvitation']
      type: 'createInvitation'
    }
  | {
      info: ModerationLogPayloads['createRole']
      type: 'createRole'
    }
  | {
      info: ModerationLogPayloads['createUserAnnouncement']
      type: 'createUserAnnouncement'
    }
  | {
      info: ModerationLogPayloads['deleteAvatarDecoration']
      type: 'deleteAvatarDecoration'
    }
  | {
      info: ModerationLogPayloads['deleteCustomEmoji']
      type: 'deleteCustomEmoji'
    }
  | {
      info: ModerationLogPayloads['deleteDriveFile']
      type: 'deleteDriveFile'
    }
  | {
      info: ModerationLogPayloads['deleteGlobalAnnouncement']
      type: 'deleteGlobalAnnouncement'
    }
  | {
      info: ModerationLogPayloads['deleteNote']
      type: 'deleteNote'
    }
  | {
      info: ModerationLogPayloads['deleteRole']
      type: 'deleteRole'
    }
  | {
      info: ModerationLogPayloads['deleteUserAnnouncement']
      type: 'deleteUserAnnouncement'
    }
  | {
      info: ModerationLogPayloads['markSensitiveDriveFile']
      type: 'markSensitiveDriveFile'
    }
  | {
      info: ModerationLogPayloads['promoteQueue']
      type: 'promoteQueue'
    }
  | {
      info: ModerationLogPayloads['resetPassword']
      type: 'resetPassword'
    }
  | {
      info: ModerationLogPayloads['resolveAbuseReport']
      type: 'resolveAbuseReport'
    }
  | {
      info: ModerationLogPayloads['suspend']
      type: 'suspend'
    }
  | {
      info: ModerationLogPayloads['suspendRemoteInstance']
      type: 'suspendRemoteInstance'
    }
  | {
      info: ModerationLogPayloads['unassignRole']
      type: 'unassignRole'
    }
  | {
      info: ModerationLogPayloads['unmarkSensitiveDriveFile']
      type: 'unmarkSensitiveDriveFile'
    }
  | {
      info: ModerationLogPayloads['unsetUserAvatar']
      type: 'unsetUserAvatar'
    }
  | {
      info: ModerationLogPayloads['unsetUserBanner']
      type: 'unsetUserBanner'
    }
  | {
      info: ModerationLogPayloads['unsuspend']
      type: 'unsuspend'
    }
  | {
      info: ModerationLogPayloads['unsuspendRemoteInstance']
      type: 'unsuspendRemoteInstance'
    }
  | {
      info: ModerationLogPayloads['updateAvatarDecoration']
      type: 'updateAvatarDecoration'
    }
  | {
      info: ModerationLogPayloads['updateCustomEmoji']
      type: 'updateCustomEmoji'
    }
  | {
      info: ModerationLogPayloads['updateGlobalAnnouncement']
      type: 'updateGlobalAnnouncement'
    }
  | {
      info: ModerationLogPayloads['updateRole']
      type: 'updateRole'
    }
  | {
      info: ModerationLogPayloads['updateServerSettings']
      type: 'updateServerSettings'
    }
  | {
      info: ModerationLogPayloads['updateUserAnnouncement']
      type: 'updateUserAnnouncement'
    }
  | {
      info: ModerationLogPayloads['updateUserNote']
      type: 'updateUserNote'
    }
)

export type PageEvent = {
  event: string
  pageId: Models.Page['id']
  user: Models.User
  userId: Models.User['id']
  var: unknown
}

export type QueueStats = {
  deliver: {
    active: number
    activeSincePrevTick: number
    delayed: number
    waiting: number
  }
  inbox: {
    active: number
    activeSincePrevTick: number
    delayed: number
    waiting: number
  }
}

export type QueueStatsLog = QueueStats[]

export type ServerStats = {
  cpu: number
  fs: {
    r: number
    w: number
  }
  mem: {
    active: number
    used: number
  }
  net: {
    rx: number
    tx: number
  }
}

export type ServerStatsLog = ServerStats[]

export type SigninRequest = {
  password: string
  token?: string
  username: string
}

export type SigninResponse = {
  id: Models.User['id']
  i: string
}

export type SignupPendingRequest = {
  code: string
}

export type SignupPendingResponse = {
  id: Models.User['id']
  i: string
}

export type SignupRequest = {
  emailAddress?: string
  'g-recaptcha-response'?: string | null
  'hcaptcha-response'?: string | null
  host?: string
  invitationCode?: string
  password: string
  'turnstile-response'?: string | null
  username: string
}

export type SignupResponse = Models.MeDetailed & {
  token: string
}

export type * from '@/autogen/entities'
export type * from '@/autogen/models'
