import type * as Models from '@/autogen/models'
import type * as Entities from '@/entities'

export type BroadcastEvents = {
  announcementCreated: (payload: Entities.AnnouncementCreated) => void
  emojiAdded: (payload: Entities.EmojiAdded) => void
  emojiDeleted: (payload: Entities.EmojiDeleted) => void
  emojiUpdated: (payload: Entities.EmojiUpdated) => void
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
      note: (payload: Models.Note) => void
    }
    params: {
      antennaId: string
    }
    receives: null
  }
  channel: {
    events: {
      note: (payload: Models.Note) => void
    }
    params: {
      channelId: string
    }
    receives: null
  }
  drive: {
    events: {
      fileCreated: (payload: Models.DriveFile) => void
      fileDeleted: (payload: Models.DriveFile['id']) => void
      fileUpdated: (payload: Models.DriveFile) => void
      folderCreated: (payload: Models.DriveFolder) => void
      folderDeleted: (payload: Models.DriveFolder['id']) => void
      folderUpdated: (payload: Models.DriveFolder) => void
    }
    params: null
    receives: null
  }
  globalTimeline: {
    events: {
      note: (payload: Models.Note) => void
    }
    params: {
      withFiles?: boolean
      withRenotes?: boolean
    }
    receives: null
  }
  hashtag: {
    events: {
      note: (payload: Models.Note) => void
    }
    params: {
      q?: string
    }
    receives: null
  }
  homeTimeline: {
    events: {
      note: (payload: Models.Note) => void
    }
    params: {
      withFiles?: boolean
      withRenotes?: boolean
    }
    receives: null
  }
  hybridTimeline: {
    events: {
      note: (payload: Models.Note) => void
    }
    params: {
      withFiles?: boolean
      withRenotes?: boolean
      withReplies?: boolean
    }
    receives: null
  }
  localTimeline: {
    events: {
      note: (payload: Models.Note) => void
    }
    params: {
      withFiles?: boolean
      withRenotes?: boolean
      withReplies?: boolean
    }
    receives: null
  }
  main: {
    events: {
      announcementCreated: (payload: Entities.AnnouncementCreated) => void
      driveFileCreated: (payload: Models.DriveFile) => void
      follow: (payload: Models.UserDetailedNotMe) => void
      followed: (payload: Models.UserDetailed | Models.UserLite) => void
      mention: (payload: Models.Note) => void
      meUpdated: (payload: Models.UserDetailed) => void
      myTokenRegenerated: () => void
      notification: (payload: Models.Notification) => void
      pageEvent: (payload: Entities.PageEvent) => void
      readAllAnnouncements: () => void
      readAllAntennas: () => void
      readAllNotifications: () => void
      readAllUnreadMentions: () => void
      readAllUnreadSpecifiedNotes: () => void
      readAntenna: (payload: Models.Antenna) => void
      receiveFollowRequest: (payload: Models.User) => void
      registryUpdated: (payload: {
        key: string
        scope?: string[]
        value: any | null
      }) => void
      renote: (payload: Models.Note) => void
      reply: (payload: Models.Note) => void
      signin: (payload: Models.Signin) => void
      unfollow: (payload: Models.UserDetailed) => void
      unreadAntenna: (payload: Models.Antenna) => void
      unreadMention: (payload: Models.Note['id']) => void
      unreadNotification: (payload: Models.Notification) => void
      unreadSpecifiedNote: (payload: Models.Note['id']) => void
      urlUploadFinished: (payload: {
        file: Models.DriveFile
        marker: string
      }) => void
    }
    params: null
    receives: null
  }
  queueStats: {
    events: {
      stats: (payload: Entities.QueueStats) => void
      statsLog: (payload: Entities.QueueStatsLog) => void
    }
    params: null
    receives: {
      requestLog: {
        id: number | string // TODO: only use a string here
        length: number
      }
    }
  }
  reversiGame: {
    events: {
      canceled: (payload: { userId: Models.User['id'] }) => void
      changeReadyStates: (payload: { user1: boolean; user2: boolean }) => void
      ended: (payload: {
        game: Models.ReversiGameDetailed
        winnerId: Models.User['id'] | null
      }) => void
      log: (payload: Record<string, any>) => void
      started: (payload: { game: Models.ReversiGameDetailed }) => void
      updateSettings: (payload: {
        key: string
        userId: Models.User['id']
        value: any
      }) => void
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
      ready: boolean
      updateSettings: {
        key: string
        value: any
      }
    }
  }
  roleTimeline: {
    events: {
      note: (payload: Models.Note) => void
    }
    params: {
      roleId: string
    }
    receives: null
  }
  serverStats: {
    events: {
      stats: (payload: Entities.ServerStats) => void
      statsLog: (payload: Entities.ServerStatsLog) => void
    }
    params: null
    receives: {
      requestLog: {
        id: number | string // TODO: only use a string here
        length: number
      }
    }
  }
  userList: {
    events: {
      note: (payload: Models.Note) => void
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
        userId: Models.User['id']
      }
      type: 'pollVoted'
    }
  | {
      body: {
        emoji: string | null
        reaction: string
        userId: Models.User['id']
      }
      type: 'reacted'
    }
  | {
      body: {
        reaction: string
        userId: Models.User['id']
      }
      type: 'unreacted'
    }
