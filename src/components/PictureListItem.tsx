import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { imageBaseUrl } from '../constants'
import { withPrefix } from '../i18n/translate'
import { PictureService, PictureWithId } from '../services/PictureService'
import { useMenu } from '../utils/useMenu'
import { MenuItems, MenuItem } from './Menu'
import { Menu, MenuButton } from '@headlessui/react'

const t = withPrefix('boards')

type Props = {
  picture: PictureWithId
  imageToken?: string
  onDelete?: () => void
}

export const PictureListItem: FC<Props> = ({
  picture: { id: pictureId, title, accessibilityLevel },
  onDelete,
  imageToken
}) => {
  const { buttonRef, menuRef } = useMenu()

  const imageTokenQuery = imageToken ? `?token=${imageToken}` : ''

  const deletePicture = useCallback(async () => {
    if (!confirm(t('deleteConfirmation'))) return

    const service = PictureService.instantiate()
    const succeeded = await service.deletePicture(pictureId)
    if (!succeeded) {
      alert(t('failedToDelete'))
      return
    }
    onDelete?.()
  }, [onDelete, pictureId])

  return (
    <div className="relative">
      <Menu>
        <MenuButton
          ref={buttonRef}
          className="absolute bg-gray-300/50 dark:bg-gray-700/50 border-0 right-0 top-0 z-[1] p-1 px-1.5 text-inherit"
        >
          <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600/80 dark:text-gray-400/80" />
        </MenuButton>
        <MenuItems>
          <MenuItem
            type="action"
            onClick={() => {
              deletePicture()
            }}
          >
            {t('deleteBoard')}
          </MenuItem>
        </MenuItems>
      </Menu>
      <Link to={`/${pictureId}`} className="text-inherit no-underline">
        {(accessibilityLevel !== 'private' || imageToken !== undefined) && (
          <img
            src={`${imageBaseUrl}/${pictureId}-w380-h300.png${imageTokenQuery}`}
            className="scale-50 -translate-x-1/2 -translate-y-1/2"
          />
        )}
        <div className="absolute bottom-0 p-1 bg-white/90 dark:bg-gray-800/90 block w-full box-border">
          {title || t('untitled')}
        </div>
      </Link>
    </div>
  )
}
