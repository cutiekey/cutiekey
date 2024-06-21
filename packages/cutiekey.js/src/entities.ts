import type {
  Announcement,
  EmojiDetailed,
  MeDetailed,
  Page,
  User,
  UserDetailedNotMe
} from '@/autogen/models'

export * from '@/autogen/entities'
export * from '@/autogen/models'

export type AnnouncementCreated = {
  announcement: Announcement
}

export type DateString = string

export type EmojiAdded = {
  emoji: EmojiDetailed
}

export type EmojiDeleted = {
  emojis: EmojiDetailed[]
}

export type EmojiUpdated = {
  emojis: EmojiDetailed[]
}

export type ID = string

export type ModerationLog = {
  id: ID
  createdAt: DateString
  user: UserDetailedNotMe | null
  userId: User['id']
}

export type PageEvent = {
  event: string
  pageId: Page['id']
  user: User
  userId: User['id']
  var: any
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
  id: User['id']
  i: string
}

export type SignupPendingRequest = {
  code: string
}

export type SignupPendingResponse = {
  id: User['id']
  i: string
}

export type SignupRequest = {
  emailAddress?: string
  'hcaptcha-response'?: string | null
  host?: string
  'g-recaptcha-response'?: string | null
  invitationCode?: string
  password: string
  'turnstile-response'?: string | null
  username: string
}

export type SignupResponse = MeDetailed & {
  token: string
}
