import { faCheck, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, MenuButton } from '@headlessui/react'
import classNames from 'classnames'
import { FC } from 'react'
import { withPrefix } from '../i18n/translate'
import { AccessibilityLevel, Permission } from '../services/PictureService'
import { MenuItem, MenuItems } from './Menu'

const t = withPrefix('menu.accessibilities')

const PublicIcon = () => <FontAwesomeIcon icon={faLockOpen} fixedWidth className="block" />
const ProtectedIcon = () => <FontAwesomeIcon icon={faLock} fixedWidth className="block" />
const PrivateIcon = () => (
  <FontAwesomeIcon icon={faLock} fixedWidth className="block text-red-500" />
)

const CheckIcon = () => <FontAwesomeIcon icon={faCheck} className="ml-1" />

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
          'bg-gray-300 dark:bg-gray-600 border-0 w-[30px] h-[30px] flex justify-center items-center relative text-inherit',
          className
        )}
      >
        {isPublic && <PublicIcon />}
        {isProtected && <ProtectedIcon />}
        {isPrivate && <PrivateIcon />}
      </MenuButton>
      <MenuItems>
        <MenuItem type="action" onClick={() => change('public')}>
          <FontAwesomeIcon icon={faLockOpen} fixedWidth className="mr-1" />
          <span>{t('public')}</span>
          {isPublic && <CheckIcon />}
        </MenuItem>
        <MenuItem type="action" onClick={() => change('protected')}>
          <FontAwesomeIcon icon={faLock} fixedWidth className="mr-1" />
          <span>{t('protected')}</span>
          {isProtected && <CheckIcon />}
        </MenuItem>
        <MenuItem type="action" onClick={() => change('private')}>
          <FontAwesomeIcon icon={faLock} fixedWidth className="mr-1 text-red-500" />
          <span>{t('private')}</span>
          {isPrivate && <CheckIcon />}
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}
