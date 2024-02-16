export function getUserName(user: { name?: string | null; username: string }) {
  return user.name === ''
    ? user.username
    : user.name ?? user.username
}
