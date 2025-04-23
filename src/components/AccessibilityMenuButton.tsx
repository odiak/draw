import { Menu, MenuButton } from '@headlessui/react'
import React, { FC, useCallback } from 'react'
import { withPrefix } from '../i18n/translate'
import { AccessibilityLevel, Permission } from '../services/PictureService'
import { Icon } from './Icon'
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
        <AccIcon type={permission.accessibilityLevel} />
      </MenuButton>

      <MenuItems anchor="bottom end">
        {(['public', 'protected', 'private'] as const).map((level) => (
          <MenuItem key={level}>
            <div onClick={() => change(level)}>
              <AccIcon type={level} />
              {t(level)}
              {permission.accessibilityLevel === level && <CheckIcon />}
            </div>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}

const AccIcon: FC<{ type: AccessibilityLevel }> = ({ type }) => {
  switch (type) {
    case 'public':
      return <Icon name="unlocked" className="mr-1 w-5 inline-block vertical-middle" />
    case 'protected':
      return <Icon name="locked" className="mr-1 w-5 inline-block vertical-middle" />
    case 'private':
      return <Icon name="locked" className="mr-1 w-5 inline-block vertical-middle text-red-500" />
  }
}

const CheckIcon = () => <Icon name="check" className="ml-1 w-5 inline-block" />
