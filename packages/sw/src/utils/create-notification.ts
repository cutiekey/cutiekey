import type { BadgeNames, PushNotificationDataMap } from '@/types'
import { getAccountFromId } from '@/utils/get-account-from-id'
import { charToFileName } from '@/utils/twemoji-base'
import { getUserName } from '@/utils/get-user-name'
import { cli } from '@/utils/operations'
import { swLang } from '@/utils/lang'

const closeNotificationsByTags = async (tags: string[]) => {
  for (const n of (
    await Promise.all(
      tags.map(tag => globalThis.registration.getNotifications({ tag }))
    )
  ).flat()) {
    n.close()
  }
}

// How to add a new badge
//
//   1. Find the icon you want on https://tabler-icons.io and download the PNG
//   2. Run `vips resize <icon path> /tmp/icon.png 0.4`
//   3. Run `vips scRGB2BW /tmp/icon.png <output path>"[compression=9,strip]"`
//   4. Run `rm /tmp/icon.png`
//   5. Run `mv <output path> <cutiekey path>/packages/backend/assets/tabler-badges`
//   6. Add the filename to `BadgeNames`
const iconUrl = (name: BadgeNames) => `/static-assets/tabler-badges/${name}.png`

async function composeNotification(
  data: PushNotificationDataMap[keyof PushNotificationDataMap]
): Promise<[string, NotificationOptions] | null> {
  const i18n = await (swLang.i18n ?? swLang.fetchLocale())
  const { t } = i18n

  switch (data.type) {
    case 'notification':
      switch (data.body.type) {
        case 'achievementEarned': {
          return [
            t('_notification.achievementEarned'),
            {
              badge: iconUrl('medal'),
              body: t(`_achievements._types._${data.body.achievement}.title`),
              data,
              tag: `achievement:${data.body.achievement}`
            }
          ]
        }

        case 'app': {
          return [
            data.body.header ?? data.body.body,
            {
              body: data.body.header ? data.body.body : '',
              data,
              icon: data.body.icon ?? undefined
            }
          ]
        }

        case 'follow': {
          const account = await getAccountFromId(data.userId)

          if (!account) {
            return null
          }

          const userDetail = await cli.request(
            'users/show',
            {
              userId: data.body.userId
            },
            account.token
          )

          return [
            t('_notification.youWereFollowed'),
            {
              actions: userDetail.isFollowing
                ? []
                : [
                    {
                      action: 'follow',
                      title: t('_notification._actions.followBack')
                    }
                  ],
              badge: iconUrl('user-plus'),
              body: getUserName(data.body.user),
              data,
              icon: data.body.user.avatarUrl!
            } as any
          ]
        }

        case 'followRequestAccepted': {
          return [
            t('_notification.yourFollowRequestAccepted'),
            {
              badge: iconUrl('circle-check'),
              body: getUserName(data.body.user),
              data,
              icon: data.body.user.avatarUrl!
            }
          ]
        }

        case 'mention': {
          return [
            t('_notification.youGotMention', {
              name: getUserName(data.body.user)
            }),
            {
              actions: [
                {
                  action: 'reply',
                  title: t('_notification._actions.reply')
                }
              ],
              badge: iconUrl('at'),
              body: data.body.note.text ?? '',
              data,
              icon: data.body.user.avatarUrl!
            } as any
          ]
        }

        case 'note': {
          return [
            `${t('_notification.newNote')}: ${getUserName(data.body.user)}`,
            {
              body: data.body.note.text ?? '',
              data,
              icon: data.body.user.avatarUrl!
            }
          ]
        }

        case 'pollEnded': {
          return [
            t('_notification.pollEnded'),
            {
              badge: iconUrl('chart-arrows'),
              body: data.body.note.text ?? '',
              data
            }
          ]
        }

        case 'quote': {
          return [
            t('_notification.youGotQuote', {
              name: getUserName(data.body.user)
            }),
            {
              actions: [
                {
                  action: 'reply',
                  title: t('_notification._actions.reply')
                },
                ...(data.body.note.visibility === 'public' ||
                data.body.note.visibility === 'home'
                  ? [
                      {
                        action: 'renote',
                        title: t('_notification._actions.renote')
                      }
                    ]
                  : [])
              ],
              badge: iconUrl('quote'),
              body: data.body.note.text ?? '',
              data,
              icon: data.body.user.avatarUrl!
            } as any
          ]
        }

        case 'reaction': {
          let badge: string | undefined
          let reaction = data.body.reaction

          if (reaction.startsWith(':')) {
            const badgeName = reaction.substring(1, reaction.length - 1)
            const badgeUrl = new URL(`/emoji/${badgeName}.webp`, origin)

            badgeUrl.searchParams.set('badge', '1')

            badge = badgeUrl.href
            reaction = badgeName.split('@')[0]
          } else {
            badge = `/twemoji-badge/${charToFileName(reaction)}.png`
          }

          if (
            await fetch(badge)
              .then(res => res.status !== 200)
              .catch(() => true)
          ) {
            badge = iconUrl('plus')
          }

          const tag = `reaction:${data.body.note.id}`

          return [
            `${reaction} ${getUserName(data.body.user)}`,
            {
              actions: [
                {
                  action: 'showUser',
                  title: getUserName(data.body.user)
                }
              ],
              badge,
              body: data.body.note.text ?? '',
              data,
              icon: data.body.user.avatarUrl!,
              tag
            } as any
          ]
        }

        case 'receiveFollowRequest': {
          return [
            t('_notification.youReceivedFollowRequest'),
            {
              actions: [
                {
                  action: 'accept',
                  title: t('accept')
                },
                {
                  action: 'reject',
                  title: t('reject')
                }
              ],
              badge: iconUrl('user-plus'),
              body: getUserName(data.body.user),
              data,
              icon: data.body.user.avatarUrl!
            } as any
          ]
        }

        case 'renote': {
          return [
            t('_notification.youRenoted', {
              name: getUserName(data.body.user)
            }),
            {
              actions: [
                {
                  action: 'showUser',
                  title: getUserName(data.body.user)
                }
              ],
              badge: iconUrl('repeat'),
              body: data.body.note.text ?? '',
              data,
              icon: data.body.user.avatarUrl!
            } as any
          ]
        }

        case 'reply': {
          return [
            t('_notification.youGotReply', {
              name: getUserName(data.body.user)
            }),
            {
              actions: [
                {
                  action: 'reply',
                  title: t('_notification._actions.reply')
                }
              ],
              badge: iconUrl('arrow-back-up'),
              body: data.body.note.text ?? '',
              data,
              icon: data.body.note.user.avatarUrl!
            } as any
          ]
        }

        case 'test': {
          return [
            t('_notification.testNotification'),
            {
              badge: iconUrl('bell'),
              body: t('_notification.notificationWillBeDisplayedLikeThis'),
              data
            }
          ]
        }

        default: {
          return null
        }
      }

    case 'unreadAntennaNote':
      return [
        t('_notification.unreadAntennaNote', {
          name: data.body.antenna.name
        }),
        {
          badge: iconUrl('antenna'),
          body: `${getUserName(data.body.note.user)}: ${data.body.note.text ?? ''}`,
          data,
          icon: data.body.note.user.avatarUrl!,
          renotify: true,
          tag: `antenna:${data.body.antenna.id}`
        } as any
      ]

    default:
      return null
  }
}

export async function createEmptyNotification() {
  return new Promise<void>(async res => {
    const i18n = await (swLang.i18n ?? swLang.fetchLocale())
    const { t } = i18n

    await globalThis.registration.showNotification(new URL(origin).host, {
      actions: [
        {
          action: 'markAllAsRead',
          title: t('markAllAsRead')
        },
        {
          action: 'settings',
          title: t('notificationSettings')
        }
      ],
      badge: iconUrl('null'),
      body: `Cutiekey v${_VERSION_}`,
      data: {},
      silent: true,
      tag: 'read_notification'
    } as any)

    setTimeout(async () => {
      try {
        await closeNotificationsByTags(['user_visible_auto_notification'])
      } finally {
        res()
      }
    }, 1000)
  })
}

export async function createNotification<
  K extends keyof PushNotificationDataMap
>(data: PushNotificationDataMap[K]) {
  const n = await composeNotification(data)

  if (n) {
    return globalThis.registration.showNotification(...n)
  }

  console.error('[SW] Could not compose notification', data)

  return createEmptyNotification()
}
