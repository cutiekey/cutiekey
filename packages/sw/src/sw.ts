import type { PushNotificationDataMap } from '@/types'
import type { I18n, Locale } from '@/utils/i18n'
import * as swos from '@/utils/operations'
import * as Misskey from 'misskey-js'
import { swLang } from '@/utils/lang'
import { get } from 'idb-keyval'
import {
  createEmptyNotification,
  createNotification
} from '@/utils/create-notification'

async function offlineContentHtml() {
  const i18n = (await (swLang.i18n ?? swLang.fetchLocale())) as Partial<
    I18n<Locale>
  >

  const messages = {
    header:
      (i18n.ts?._offlineScreen as any).header ??
      'Could not connect to the server',
    reload: (i18n.ts?.reload as any) ?? 'Reload',
    title:
      (i18n.ts?._offlineScreen as any).title ??
      'Offline - Could not connect to the server'
  }

  return `<!DOCTYPE html><html lang="${await swLang.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{align-items:center;background-color:#0c1210;box-sizing:border-box;color:#dee7e4;display:flex;flex-direction:column;font-family:Hiragino Maru Gothic Pro,BIZ UDGothic,Roboto,HelveticaNeue,Arial,sans-serif;justify-content:center;line-height:1.35;margin:0;min-height:100vh;padding:24px}button{-webkit-tap-highlight-color:transparent;background-color:#b4e900;border:none;border-radius:99rem;color:#192320;cursor:pointer;font-family:Hiragino Maru Gothic Proc,BIZ UDGothic,Roboto,HelveticaNeue,Arial,sans-serif;font-weight:700;line-height:1.35;min-width:100px;padding:7px 14px}button:hover{background-color:#c6ff03}.icon{height:auto;margin-bottom:20px;max-width:120px;width:100%}.message{font-size:20px;font-weight:700;margin-bottom:20px;text-align:center}.version{font-size:90%;margin-bottom:20px;text-align:center}</style><title>${messages.title}</title></head><body><svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="icon" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z"/><path d="M9.58 5.548c.24-.11.492-.207.752-.286 1.88-.572 3.956-.193 5.444 1 1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486 0 .957-.383 1.824-1.003 2.454M18 18.004H6.657C4.085 18 2 15.993 2 13.517c0-2.475 2.085-4.482 4.657-4.482.13-.582.37-1.128.7-1.62M3 3l18 18"/></svg><div class="message">${messages.header}</div><div class="version">v${_VERSION_}</div><button onclick="reloadPage()">${messages.reload}</button><script type="text/javascript">function reloadPage(){location.reload(!0)}</script></body></html>`
}

globalThis.addEventListener('activate', ev => {
  ev.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(v => v !== swLang.cacheName)
            .map(name => caches.delete(name))
        )
      )
      .then(() => globalThis.clients.claim())
  )
})

globalThis.addEventListener('fetch', ev => {
  let isHtmlRequest = false

  if (ev.request.headers.get('sec-fetch-dest') === 'document') {
    isHtmlRequest = true
  } else if (ev.request.headers.get('accept')?.includes('/html')) {
    isHtmlRequest = true
  } else if (ev.request.url.endsWith('/')) {
    isHtmlRequest = true
  }

  if (!isHtmlRequest) {
    return
  }

  ev.respondWith(
    fetch(ev.request).catch(async () => {
      const html = await offlineContentHtml()

      return new Response(html, {
        headers: {
          'content-type': 'text/html'
        },
        status: 200
      })
    })
  )
})

globalThis.addEventListener(
  'message',
  (ev: ServiceWorkerGlobalScopeEventMap['message']) => {
    ev.waitUntil(
      (async (): Promise<void> => {
        switch (ev.data) {
          case 'clear':
            await caches
              .keys()
              .then(cacheNames =>
                Promise.all(cacheNames.map(name => caches.delete(name)))
              )

            return
        }

        if (typeof ev.data === 'object') {
          const otype = Object.prototype.toString
            .call(ev.data)
            .slice(8, -1)
            .toLowerCase()

          if (otype === 'object') {
            if (ev.data.msg === 'initialize') {
              swLang.setLang(ev.data.lang)
            }
          }
        }
      })()
    )
  }
)

globalThis.addEventListener(
  'notificationclick',
  (ev: ServiceWorkerGlobalScopeEventMap['notificationclick']) => {
    ev.waitUntil(
      (async (): Promise<void> => {
        if (_DEV_) {
          console.log(
            '[SW] `notificationclick`',
            ev.action,
            ev.notification.data
          )
        }

        const { action, notification } = ev
        const data: PushNotificationDataMap[keyof PushNotificationDataMap] =
          notification.data ?? {}

        const { userId: loginId } = data

        let client: WindowClient | null = null

        switch (data.type) {
          case 'notification':
            switch (action) {
              case 'accept':
                switch (data.body.type) {
                  case 'receiveFollowRequest':
                    await swos.api('following/requests/accept', loginId, {
                      userId: data.body.userId
                    })

                    break
                }

                break

              case 'follow':
                if ('userId' in data.body) {
                  await swos.api('following/create', loginId, {
                    userId: data.body.userId
                  })
                }

                break

              case 'reject':
                switch (data.body.type) {
                  case 'receiveFollowRequest':
                    await swos.api('following/requests/reject', loginId, {
                      userId: data.body.userId
                    })

                    break
                }

                break

              case 'renote':
                if ('note' in data.body) {
                  await swos.api('notes/create', loginId, {
                    renoteId: data.body.note.id
                  })
                }

                break

              case 'reply':
                if ('note' in data.body) {
                  client = await swos.openPost(
                    { reply: data.body.note },
                    loginId
                  )
                }

                break

              case 'showFollowRequests':
                client = await swos.openClient(
                  'push',
                  '/my/follow-requests',
                  loginId
                )

                break

              case 'showUser':
                if ('user' in data.body) {
                  client = await swos.openUser(
                    Misskey.acct.toString(data.body.user),
                    loginId
                  )
                }

                break

              default:
                switch (data.body.type) {
                  case 'reaction':
                    client = await swos.openNote(data.body.note.id, loginId)

                    break

                  case 'receiveFollowRequest':
                    client = await swos.openClient(
                      'push',
                      '/my/follow-requests',
                      loginId
                    )

                    break

                  default:
                    if ('note' in data.body) {
                      client = await swos.openNote(data.body.note.id, loginId)
                    } else if ('user' in data.body) {
                      client = await swos.openUser(
                        Misskey.acct.toString(data.body.user),
                        loginId
                      )
                    }

                    break
                }
            }

            break

          case 'unreadAntennaNote':
            client = await swos.openAntenna(data.body.antenna.id, loginId)

            break

          default:
            switch (action) {
              case 'markAllAsRead':
                await globalThis.registration
                  .getNotifications()
                  .then(notifications =>
                    notifications.forEach(
                      n => n.tag !== 'read_notification' && n.close()
                    )
                  )

                await get<{ id: string; token: string }[]>('accounts').then(
                  accounts => {
                    return Promise.all(
                      accounts!.map(async account => {
                        await swos.sendMarkAllAsRead(account.id)
                      })
                    )
                  }
                )

                break

              case 'settings':
                client = await swos.openClient(
                  'push',
                  '/settings/notifications',
                  loginId
                )

                break
            }
        }

        if (client) {
          client.focus()
        }

        if (data.type === 'notification') {
          await swos.sendMarkAllAsRead(loginId)
        }

        notification.close()
      })()
    )
  }
)

globalThis.addEventListener(
  'notificationclose',
  (ev: ServiceWorkerGlobalScopeEventMap['notificationclose']) => {
    const data = ev.notification
      .data as PushNotificationDataMap[keyof PushNotificationDataMap]

    ev.waitUntil(
      (async (): Promise<void> => {
        if (data.type === 'notification') {
          await swos.sendMarkAllAsRead(data.userId)
        }

        return
      })()
    )
  }
)

globalThis.addEventListener('push', ev => {
  ev.waitUntil(
    globalThis.clients
      .matchAll({
        includeUncontrolled: true,
        type: 'window'
      })
      .then(async () => {
        const data =
          ev.data?.json() as PushNotificationDataMap[keyof PushNotificationDataMap]

        switch (data.type) {
          case 'notification':
          case 'unreadAntennaNote':
            if (new Date().getTime() - data.dateTime > 1000 * 60 * 60 * 24) {
              break
            }

            return createNotification(data)

          case 'readAllNotifications':
            await globalThis.registration
              .getNotifications()
              .then(notifications =>
                notifications.forEach(
                  n => n.tag !== 'read_notification' && n.close()
                )
              )

            break
        }

        await createEmptyNotification()

        return
      })
  )
})
