import type * as Misskey from 'misskey-js'

type PushNotificationDataSourceMap = {
  notification: Misskey.entities.Notification
  readAllNotifications: undefined
  unreadAntennaNote: {
    antenna: {
      id: string
      name: string
    }
    note: Misskey.entities.Note
  }
}

export type BadgeNames =
  | 'antenna'
  | 'arrow-back-up'
  | 'at'
  | 'bell'
  | 'chart-arrows'
  | 'circle-check'
  | 'medal'
  | 'messagess'
  | 'null'
  | 'plus'
  | 'quote'
  | 'repeat'
  | 'user-plus'
  | 'users'

export type PushNotificationData<
  K extends keyof PushNotificationDataSourceMap
> = {
  body: PushNotificationDataSourceMap[K]
  dateTime: number
  type: K
  userId: string
}

export type PushNotificationDataMap = {
  [K in keyof PushNotificationDataSourceMap]: PushNotificationData<K>
}

export type SwMessage = {
  loginId?: string
  order: SwMessageOrderType
  type: 'order'
  url: string
  [x: string]: unknown
}

export type SwMessageOrderType = 'post' | 'push'
