export const followersVisibilities = ['followers', 'private', 'public'] as const

export const followingVisibilities = ['followers', 'private', 'public'] as const

export const mutedNoteReasons = ['manual', 'other', 'spam', 'word'] as const

export const noteVisibilities = [
  'followers',
  'home',
  'public',
  'specified'
] as const

export const notificationTypes = [
  'achievementEarned',
  'app',
  'edited',
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
  'read:blocks',
  'read:drive',
  'write:account',
  'write:blocks',
  'write:drive'
] as const
