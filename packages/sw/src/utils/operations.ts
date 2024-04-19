import { getUrlWithLoginId } from '@/utils/get-url-with-login-id'
import { getAccountFromId } from '@/utils/get-account-from-id'
import type { SwMessage, SwMessageOrderType } from '@/types'
import * as Misskey from 'misskey-js'

// Limit sending requests to `notifications/mark-all-as-read`
const readBlockingStatus = new Map<string, boolean>()

export const cli = new Misskey.api.APIClient({ origin })

export async function api<
  E extends keyof Misskey.Endpoints,
  O extends Misskey.Endpoints[E]['req']
>(
  endpoint: E,
  userId?: string,
  options?: O
  // @ts-expect-error
): Promise<ReturnType<typeof cli.request<E, O>> | void> {
  let account: { id: string; token: string } | void

  if (userId) {
    account = await getAccountFromId(userId)

    if (!account) {
      return
    }
  }

  // @ts-expect-error
  return cli.request(endpoint, options, account?.token)
}

export async function findClient() {
  const clients = await globalThis.clients.matchAll({ type: 'window' })

  return clients.find(c => !new URL(c.url).searchParams.has('zen')) ?? null
}

export function openAntenna(antennaId: string, loginId: string) {
  return openClient('push', `/timeline/antenna/${antennaId}`, loginId, {
    antennaId
  })
}

export async function openClient(
  order: SwMessageOrderType,
  url: string,
  loginId?: string,
  query: Record<string, SwMessage[string]> = {}
) {
  const client = await findClient()

  if (client) {
    client.postMessage({
      ...query,
      loginId,
      order,
      type: 'order',
      url
    } satisfies SwMessage)

    return client
  }

  return globalThis.clients.openWindow(
    loginId ? getUrlWithLoginId(url, loginId) : url
  )
}

export function openNote(noteId: string, loginId?: string) {
  return openClient('push', `/notes/${noteId}`, loginId, { noteId })
}

export async function openPost(
  opts: {
    initialText?: string
    renote?: Misskey.entities.Note
    reply?: Misskey.entities.Note
  },
  loginId?: string
) {
  const query = new URLSearchParams()

  if (opts.initialText) {
    query.set('text', opts.initialText)
  }

  if (opts.renote) {
    query.set('renoteId', opts.renote.id)
  }

  if (opts.reply) {
    query.set('replyId', opts.reply.id)
  }

  return openClient('post', `/share?${query}`, loginId, { options: opts })
}

export function openUser(acct: string, loginId?: string) {
  return openClient('push', `/@${acct}`, loginId, { acct })
}

export function sendMarkAllAsRead(
  userId: string
): Promise<void | null | undefined> {
  if (readBlockingStatus.get(userId)) {
    return Promise.resolve()
  }

  readBlockingStatus.set(userId, true)

  return new Promise(res => {
    setTimeout(() => {
      readBlockingStatus.set(userId, false)

      api('notifications/mark-all-as-read', userId).then(res as any, res)
    }, 1000)
  })
}
