import type {
  AnnouncementCreated,
  EmojiAdded,
  EmojiDeleted,
  EmojiUpdated,
  PageEvent,
  QueueStats,
  QueueStatsLog,
  ReversiGameDetailed,
  ServerStats,
  ServerStatsLog
} from '@/entities'
import type {
  Antenna,
  DriveFile,
  DriveFolder,
  Note,
  Notification,
  Signin,
  User,
  UserDetailed,
  UserDetailedNotMe,
  UserLite
} from '@/autogen/models'

export type BroadcastEvents = {
  announcementCreated: (payload: AnnouncementCreated) => void
  emojiAdded: (payload: EmojiAdded) => void
  emojiDeleted: (payload: EmojiDeleted) => void
  emojiUpdated: (payload: EmojiUpdated) => void
  noteUpdated: (payload: NoteUpdatedEvent) => void
}

export type Channels = {
  admin: {
    events: {
      newAbuseUserReport: {
        id: string
        comment: string
        reporterId: string
        targetUserId: string
      }
    }
    params: null
    receives: null
  }
  antenna: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      antennaId: string
    }
    receives: null
  }
  bubbleTimeline: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      withBots?: boolean
      withFiles?: boolean
      withRenotes?: boolean
    }
    receives: null
  }
  channel: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      channelId: string
    }
    receives: null
  }
  drive: {
    events: {
      fileCreated: (payload: DriveFile) => void
      fileDeleted: (payload: DriveFile['id']) => void
      fileUpdated: (payload: DriveFile) => void
      folderCreated: (payload: DriveFolder) => void
      folderDeleted: (payload: DriveFolder['id']) => void
      folderUpdated: (payload: DriveFolder) => void
    }
    params: null
    receives: null
  }
  globalTimeline: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      withBots?: boolean
      withFiles?: boolean
      withRenotes?: boolean
    }
    receives: null
  }
  hashtag: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      q?: string
    }
    receives: null
  }
  homeTimeline: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      withBots?: boolean
      withFiles?: boolean
      withRenotes?: boolean
    }
    receives: null
  }
  hybridTimeline: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      withBots?: boolean
      withFiles?: boolean
      withRenotes?: boolean
      withReplies?: boolean
    }
    receives: null
  }
  localTimeline: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      withBots?: boolean
      withFiles?: boolean
      withRenotes?: boolean
      withReplies?: boolean
    }
    receives: null
  }
  main: {
    events: {
      announcementCreated: (payload: AnnouncementCreated) => void
      driveFileCreated: (payload: DriveFile) => void
      edited: (payload: Note) => void
      follow: (payload: UserDetailedNotMe) => void
      followed: (payload: UserDetailed | UserLite) => void
      mention: (payload: Note) => void
      meUpdated: (payload: UserDetailed) => void
      myTokenRegenerated: () => void
      notification: (payload: Notification) => void
      notificationFlushed: () => void
      pageEvent: (payload: PageEvent) => void
      readAllAnnouncements: () => void
      readAllAntennas: () => void
      readAllNotifications: () => void
      readAllUnreadMentions: () => void
      readAllUnreadSpecifiedNotes: () => void
      readAntenna: (payload: Antenna) => void
      receiveFollowRequest: (payload: User) => void
      registryUpdated: (payload: {
        key: string
        scope?: string[]
        value: any | null
      }) => void
      renote: (payload: Note) => void
      reply: (payload: Note) => void
      signin: (payload: Signin) => void
      unfollow: (payload: UserDetailed) => void
      unreadAntenna: (payload: Antenna) => void
      unreadMention: (payload: Note['id']) => void
      unreadNotification: (payload: Notification) => void
      unreadSpecifiedNote: (payload: Note['id']) => void
      urlUploadFinished: (payload: { file: DriveFile; marker: string }) => void
    }
    params: null
    receives: null
  }
  queueStats: {
    events: {
      stats: (payload: QueueStats) => void
      statsLog: (payload: QueueStatsLog) => void
    }
    params: null
    receives: {
      id: number | string
      length: number
    }
  }
  reversiGame: {
    events: {
      canceled: (payload: { userId: User['id'] }) => void
      changeReadyStates: (payload: { user1: boolean; user2: boolean }) => void
      ended: (
        payload: {
          game: ReversiGameDetailed
          winnerId: User['id'] | null
        }
      ) => void
      log: (payload: Record<string, any>) => void
      started: (payload: { game: ReversiGameDetailed }) => void
      updateSettings: (
        payload: {
          key: string
          userId: User['id']
          value: any
        }
      ) => void
    }
    params: {
      gameId: string
    }
    receives: {
      cancel: Record<string, never> | null
      claimTimeIsUp: Record<string, never> | null
      putStone: {
        id: string
        pos: number
      }
      ready: boolean,
      updateSettings: {
        key: string
        value: any
      }
    }
  }
  roleTimeline: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      roleId: string
    }
    receives: null
  }
  serverStats: {
    events: {
      stats: (payload: ServerStats) => void
      statsLog: (payload: ServerStatsLog) => void
    }
    params: null
    receives: {
      requestLog: {
        id: number | string
        length: number
      }
    }
  }
  userList: {
    events: {
      note: (payload: Note) => void
    }
    params: {
      listId: string
      withFiles?: boolean
      withRenotes?: boolean
    }
    receives: null
  }
}

export type NoteUpdatedEvent =
  | {
      body: {
        deletedAt: string
      }
      type: 'deleted'
    }
  | {
      body: {
        choice: number
        userId: User['id']
      }
      type: 'pollVoted'
    }
  | {
      body: {
        emoji: string | null
        reaction: string
        userId: User['id']
      }
      type: 'reacted'
    }
  | {
      body: {
        reaction: string
        userId: User['id']
      }
      type: 'unreacted'
    }
  | {
      id: Note['id']
      body: {
        cw: string | null
        text: string
      }
      type: 'updated'
    }
