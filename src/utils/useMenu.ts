import { useState, useCallback, useRef, useEffect } from 'react'
import { addEventListener } from './addEventListener'

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
        internals.removeButtonListener = addEventListener(button, 'click', () => {
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
      const { menu, button } = internals
      return (
        (button != null && button.contains(e.target as Node)) ||
        (menu != null && menu.contains(e.target as Node))
      )
    }

    return bundle([
      addEventListener(
        document,
        'click',
        (e) => {
          if (!internals.showMenu || isInside(e)) return
          e.preventDefault()
          e.stopPropagation()
          setShowMenu(false)
        },
        { capture: true }
      ),
      addEventListener(
        document,
        'touchstart',
        (e) => {
          if (!internals.showMenu || isInside(e)) return
          e.preventDefault()
          e.stopPropagation()
          setShowMenu(false)
        },
        { capture: true }
      ),
      addEventListener(window, 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowMenu(false)
        }
      })
    ])
  }, [internals])

  return { menuRef, buttonRef }
}

function bundle(fs: Array<() => void>): () => void {
  return () => {
    for (const f of fs) {
      f()
    }
  }
}
