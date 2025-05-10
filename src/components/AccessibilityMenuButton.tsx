import { Menu, MenuButton } from '@headlessui/react'
import classNames from 'classnames'
import { FC } from 'react'
import { withPrefix } from '../i18n/translate'
import { AccessibilityLevel, Permission } from '../services/PictureService'
import { Icon } from './Icon'
import { MenuItem, MenuItems } from './Menu'

const t = withPrefix('menu.accessibilities')

const PublicIcon = () => <Icon name="unlocked" className="block" />
const ProtectedIcon = () => <Icon name="locked" className="block" />
const PrivateIcon = () => <Icon name="locked" className="block text-red-500" />

const CheckIcon = () => <Icon name="check" className="ml-1 w-[1.2em] inline-block" />

export const AccessibilityMenuButton: FC<{
  className?: string
  permission: Permission
  onAccessibilityLevelChange?: (_accLevel: AccessibilityLevel) => void
}> = ({ className, permission, onAccessibilityLevelChange }) => {
  const [isPublic, isProtected, isPrivate] = ['public', 'protected', 'private'].map(
    (level) => level === permission.accessibilityLevel
  )

  const change = (accLevel: AccessibilityLevel) => {
    if (accLevel !== permission.accessibilityLevel) {
      onAccessibilityLevelChange?.(accLevel)
    }
  }

  return (
    <Menu>
      <MenuButton
        className={classNames(
          'bg-gray-300 dark:bg-gray-600 border-0 w-[30px] h-[30px] p-1 flex justify-center items-center relative text-inherit',
          className
        )}
      >
        {isPublic && <PublicIcon />}
        {isProtected && <ProtectedIcon />}
        {isPrivate && <PrivateIcon />}
      </MenuButton>
      <MenuItems>
        <MenuItem type="action" onClick={() => change('public')}>
          <Icon name="unlocked" className="mr-1 w-[1.2em] inline-block" />
          <span>{t('public')}</span>
          {isPublic && <CheckIcon />}
        </MenuItem>
        <MenuItem type="action" onClick={() => change('protected')}>
          <Icon name="locked" className="mr-1 w-[1.2em] inline-block" />
          <span>{t('protected')}</span>
          {isProtected && <CheckIcon />}
        </MenuItem>
        <MenuItem type="action" onClick={() => change('private')}>
          <Icon name="locked" className="mr-1 w-[1.2em] inline-block text-red-500" />
          <span>{t('private')}</span>
          {isPrivate && <CheckIcon />}
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}
