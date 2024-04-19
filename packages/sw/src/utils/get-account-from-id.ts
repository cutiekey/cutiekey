import { get } from 'idb-keyval'

export async function getAccountFromId(id: string) {
  const accounts = await get<{ id: string; token: string }[]>('accounts')

  if (!accounts) {
    console.warn('[SW] Accounts are not being recorded')

    return
  }

  return accounts.find(e => e.id === id)
}
