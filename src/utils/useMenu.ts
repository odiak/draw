import { useState, useCallback, useRef, useEffect } from 'react'
import { addEventListener } from './addEventListener'

let unsubscribe: (() => void) | undefined
const callbacks = new Set<(e: Event) => boolean>()

function listenOutsideClick(callback: (event: Event) => boolean): () => void {
  const unsubscribeThis = () => {
    callbacks.delete(callback)
    if (callbacks.size === 0) {
      unsubscribe?.()
      unsubscribe = undefined
    }
  }

  callbacks.add(callback)

  if (unsubscribe !== undefined) {
    return unsubscribeThis
  }

  const processCallbacks = (event: Event): boolean => {
    for (const cb of callbacks) {
      if (cb(event)) return true
    }
    return false
  }

  const fs = [
    addEventListener(
      document,
      'click',
      (e) => {
        if (processCallbacks(e)) {
          e.preventDefault()
          e.stopPropagation()
        }
      },
      { capture: true }
    ),
    addEventListener(
      document,
      'touchstart',
      (e) => {
        if (processCallbacks(e)) {
          e.preventDefault()
          e.stopPropagation()
        }
      },
      { capture: true }
    ),
    addEventListener(window, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        processCallbacks(e)
      }
    })
  ]
  unsubscribe = () => fs.forEach((f) => f())

  return unsubscribeThis
}

export function useMenu(): {
  buttonRef: (e: HTMLElement | null) => void
  menuRef: (e: HTMLElement | null) => void
} {
  const [showMenu, setShowMenu] = useState(false)

  const internals = useRef({
    button: null as HTMLElement | null,
    menu: null as HTMLElement | null,
    removeButtonListener: null as (() => void) | null,
    removeMenuListener: null as (() => void) | null,
    showMenu
  }).current

  useEffect(() => {
    internals.showMenu = showMenu

    const { menu } = internals
    if (menu != null) {
      menu.style.display = showMenu ? 'block' : 'none'
    }
  }, [showMenu, internals])

  const buttonRef = useCallback(
    (button: HTMLElement | null) => {
      internals.removeButtonListener?.()
      internals.removeButtonListener = null
      internals.button = button

      if (button != null) {
        internals.removeButtonListener = addEventListener(button, 'click', (event: MouseEvent) => {
          setShowMenu((s) => !s)
        })
      }
    },
    [internals]
  )

  const menuRef = useCallback(
    (menu: HTMLElement | null) => {
      internals.removeMenuListener?.()
      internals.removeMenuListener = null
      internals.menu = menu
    },
    [internals]
  )

  useEffect(() => {
    const isInside = (e: Event) => {
      if (!(e.target instanceof Node) || e instanceof KeyboardEvent) return false

      const { menu, button } = internals
      return (
        (button != null && button.contains(e.target)) || (menu != null && menu.contains(e.target))
      )
    }

    return listenOutsideClick((event) => {
      if (internals.showMenu && !isInside(event)) {
        setShowMenu(false)
        return true
      }
      return false
    })
  }, [internals])

  return { menuRef, buttonRef }
}
