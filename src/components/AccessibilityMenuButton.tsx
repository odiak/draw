import { faCheck, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, MenuButton } from '@headlessui/react'
import React, { FC, useCallback } from 'react'
import { withPrefix } from '../i18n/translate'
import { AccessibilityLevel, Permission } from '../services/PictureService'
import { MenuItem, MenuItems } from './Menu2'

const t = withPrefix('menu.accessibilities')

export const AccessibilityMenuButton: FC<{
  permission: Permission
  onAccessibilityLevelChange?: (_accLevel: AccessibilityLevel) => void
}> = ({ permission, onAccessibilityLevelChange }) => {
  const change = useCallback(
    (accLevel: AccessibilityLevel) => {
      if (accLevel !== permission.accessibilityLevel) {
        onAccessibilityLevelChange?.(accLevel)
      }
    },
    [onAccessibilityLevelChange, permission]
  )

  return (
    <Menu>
      <MenuButton className="bg-gray-300 dark:bg-gray-700 w-[30px] h-[30px] flex justify-center items-center relative text-inherit border-0">
        <Icon type={permission.accessibilityLevel} />
      </MenuButton>

      <MenuItems anchor="bottom end">
        {(['public', 'protected', 'private'] as const).map((level) => (
          <MenuItem key={level}>
            <div onClick={() => change(level)}>
              <Icon type={level} />
              {t(level)}
              {permission.accessibilityLevel === level && <CheckIcon />}
            </div>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}

const Icon: FC<{ type: AccessibilityLevel }> = ({ type }) => {
  switch (type) {
    case 'public':
      return <FontAwesomeIcon icon={faLockOpen} fixedWidth className="mr-1" />
    case 'protected':
      return <FontAwesomeIcon icon={faLock} fixedWidth className="mr-1" />
    case 'private':
      return <FontAwesomeIcon icon={faLock} fixedWidth className="mr-1 text-red-500" />
  }
}

const CheckIcon = () => <FontAwesomeIcon icon={faCheck} className="ml-1" />
