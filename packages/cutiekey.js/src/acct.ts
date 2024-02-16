export type Acct = {
  host: string | null
  username: string
}

export function parse(acct: string) {
  if (acct.startsWith('@')) {
    acct = acct.substring(1)
  }

  const split = acct.split('@', 2)

  return {
    host: split[1] || null,
    username: split[0]
  } as Acct
}

export function toString(acct: Acct) {
  return !acct.host
    ? acct.username
    : `${acct.username}@${acct.host}`
}
