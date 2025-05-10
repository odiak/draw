import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { imageBaseUrl } from '../constants'
import { withPrefix } from '../i18n/translate'
import { PictureService, PictureWithId } from '../services/PictureService'
import { MenuItems, MenuItem } from './Menu'
import { Menu, MenuButton } from '@headlessui/react'
import classNames from 'classnames'

const t = withPrefix('boards')

type Props = {
  picture: PictureWithId
  imageToken?: string
  className?: string
  onDelete?: () => void
}

export const PictureListItem: FC<Props> = ({
  picture: { id: pictureId, title, accessibilityLevel },
  onDelete,
  imageToken,
  className
}) => {
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
    <div className={classNames('relative w-full', className)}>
      <Menu>
        <MenuButton className="absolute bg-gray-300/50 dark:bg-gray-700/50 border-0 right-0 top-0 p-1 px-1.5 text-inherit">
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
      <Link to={`/${pictureId}`} className="text-inherit no-underline w-full">
        {(accessibilityLevel !== 'private' || imageToken !== undefined) && (
          <img
            src={`${imageBaseUrl}/${pictureId}-w400-h300.png${imageTokenQuery}`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-0 p-1 bg-white/90 dark:bg-gray-800/90 w-full box-border">
          {title || t('untitled')}
        </div>
      </Link>
    </div>
  )
}
