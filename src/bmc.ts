import { translate } from './i18n/translate'
import { localStorage } from './utils/localStorage'

const lastShownKey = 'bmc_last_shown'

export function showBMCWidget(force = false) {
  if (!force) {
    const now = Date.now()
    const lastShown = Number(localStorage.getItem(lastShownKey) ?? 0)
    if (now - lastShown < 1000 * 60 * 60 * 24 * 14) {
      return
    }
  }

  localStorage.setItem(lastShownKey, String(Date.now()))

  const script = document.querySelector('script[data-name="BMC-Widget"]')
  if (script && script instanceof HTMLScriptElement) {
    script.dataset.message = translate('global.supportMessage')
  }
  const style = document.querySelector('style#bmc-style')
  if (style) {
    style.remove()
  }
}
