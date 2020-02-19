import { RefObject, useState, useCallback, useLayoutEffect } from 'react'

export function useMenu({
  menuRef,
  buttonRef
}: {
  menuRef: RefObject<HTMLElement>
  buttonRef: RefObject<HTMLElement>
}): { show: boolean; close: () => void; toggle: () => void } {
  const [showMenu, setShowMenu] = useState(false)

  const closeMenu = useCallback(() => {
    setShowMenu(false)
  }, [setShowMenu])

  const toggleMenu = useCallback(() => {
    setShowMenu(!showMenu)
  }, [showMenu, setShowMenu])

  useLayoutEffect(() => {
    if (!showMenu) return

    const isInside = (e: Event) => {
      const menuButton = buttonRef.current
      const menu = menuRef.current
      return (
        (menuButton != null && menuButton.contains(e.target as Node)) ||
        (menu != null && menu.contains(e.target as Node))
      )
    }

    const onClick = (e: MouseEvent) => {
      if (isInside(e)) return
      e.preventDefault()
      e.stopPropagation()
      closeMenu()
    }
    document.addEventListener('click', onClick, { capture: true })

    const onTouchStart = (e: TouchEvent) => {
      if (isInside(e)) return
      e.preventDefault()
      e.stopPropagation()
      closeMenu()
    }
    document.addEventListener('touchstart', onTouchStart, { capture: true })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('click', onClick, { capture: true })
      document.removeEventListener('touchstart', onTouchStart, { capture: true })
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [buttonRef, menuRef, showMenu, closeMenu])

  return { show: showMenu, close: closeMenu, toggle: toggleMenu }
}
