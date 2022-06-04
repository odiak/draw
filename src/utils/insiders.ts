import { translate } from '../i18n/translate'

const cookieName = 'kakeru_dev'
const prefix = `${cookieName}=`
const maxAge = 60 * 60 * 24 * 365 * 3

export const isInsidersVersion =
  document.cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(prefix) && s.length > prefix.length) !== undefined

export function toggleIsInsiderVersion() {
  const ok = confirm(
    isInsidersVersion
      ? translate('insiders.turnOffConfirmation')
      : translate('insiders.turnOnConfirmation')
  )
  if (!ok) return

  if (isInsidersVersion) {
    document.cookie = `${cookieName}=; max-age=${-1}`
  } else {
    document.cookie = `${cookieName}=1; max-age=${maxAge}`
  }
  location.reload()
}
