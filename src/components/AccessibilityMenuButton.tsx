import React, { FC, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faLockOpen, faCheck } from '@fortawesome/free-solid-svg-icons'
import { Permission, AccessibilityLevel } from '../services/PictureService'
import { Menu, MenuItem } from './Menu'
import { useMenu } from '../utils/useMenu'
import { withPrefix } from '../i18n/translate'

const t = withPrefix('menu.accessibilities')

const PublicIcon = () => <FontAwesomeIcon icon={faLockOpen} fixedWidth className="block" />
const ProtectedIcon = () => <FontAwesomeIcon icon={faLock} fixedWidth className="block" />
const PrivateIcon = () => <FontAwesomeIcon icon={faLock} fixedWidth className="block text-red-500" />

const CheckIcon = () => <FontAwesomeIcon icon={faCheck} className="ml-1" />



export const AccessibilityMenuButton: FC<{
  className?: string
  permission: Permission
  onAccessibilityLevelChange?: (_accLevel: AccessibilityLevel) => void
}> = ({ className, permission, onAccessibilityLevelChange }) => {
  const { menuRef, buttonRef } = useMenu()

  const [isPublic, isProtected, isPrivate] = ['public', 'protected', 'private'].map(
    (level) => level === permission.accessibilityLevel
  )

  const change = useCallback(
    (accLevel: AccessibilityLevel) => {
      if (accLevel !== permission.accessibilityLevel) {
        onAccessibilityLevelChange?.(accLevel)
      }
    },
    [onAccessibilityLevelChange, permission]
  )
  const makePublic = useCallback(() => {
    change('public')
  }, [change])
  const makeProtected = useCallback(() => {
    change('protected')
  }, [change])
  const makePrivate = useCallback(() => {
    change('private')
  }, [change])

  return (
    <button 
      className={`bg-gray-300 dark:bg-gray-600 block border-0 w-[30px] h-[30px] flex justify-center items-center relative text-inherit ${className || ''}`} 
      ref={buttonRef}
    >
      {isPublic && <PublicIcon />}
      {isProtected && <ProtectedIcon />}
      {isPrivate && <PrivateIcon />}
      <Menu ref={menuRef}>
        <MenuItem onClick={makePublic} className="flex items-center">
          <FontAwesomeIcon icon={faLockOpen} fixedWidth className="mr-1" />
          <span>{t('public')}</span>
          {isPublic && <CheckIcon />}
        </MenuItem>
        <MenuItem onClick={makeProtected} className="flex items-center">
          <FontAwesomeIcon icon={faLock} fixedWidth className="mr-1" />
          <span>{t('protected')}</span>
          {isProtected && <CheckIcon />}
        </MenuItem>
        <MenuItem onClick={makePrivate} className="flex items-center">
          <FontAwesomeIcon icon={faLock} fixedWidth className="mr-1 text-red-500" />
          <span>{t('private')}</span>
          {isPrivate && <CheckIcon />}
        </MenuItem>
      </Menu>
    </button>
  )
}
