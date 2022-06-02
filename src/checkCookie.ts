const cookieName = 'kakeru_no_ogp'
const maxAge = 60 * 60 * 24 * 365 * 3

export function checkCookie() {
  const value = document.cookie
    .split(';')
    .map((c) => c.trim().split('=') as [string, string])
    .find(([key]) => key === cookieName)?.[1]

  if (value) return

  document.cookie = `${cookieName}=1; max-age=${maxAge}`
}
