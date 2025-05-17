import { FC, useState } from 'react'
import { baseUrl, imageBaseUrl } from '../constants'
import { withPrefix } from '../i18n/translate'
import { Permission } from '../services/PictureService'

import { Menu, MenuButton } from '@headlessui/react'
import classNames from 'classnames'
import { useScreenName } from '../utils/screenNames'
import { Icon } from './Icon'
import { MenuItem, MenuItems, MenuSeparator } from './Menu'
import { ShareModal } from './ShareModal'

const t = withPrefix('menu')

type Props = {
  pictureId?: string
  permission?: Permission
  className?: string
}

const buyMeACoffeeLink = 'https://buymeacoffee.com/odiak'

export const EllipsisMenuButton: FC<Props> = ({ pictureId, permission, className }) => {
  const screenName = useScreenName()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const imageLink = `${imageBaseUrl}/${pictureId}.svg`
  const pageLink = `${baseUrl}/${pictureId}`

  const aboutPageLink = navigator.language.startsWith('ja')
    ? 'https://about.kakeru.app/ja'
    : 'https://about.kakeru.app'

  return (
    <>
      <Menu>
        <MenuButton
          className={classNames(
            'w-[36px] h-[30px] border-0 bg-gray-300 dark:bg-gray-600 relative text-inherit',
            className
          )}
        >
          <Icon name="ellipsis" className="w-[1.2em] inline-block" />
        </MenuButton>
        <MenuItems className="w-max">
          {screenName === 'drawing' && pictureId !== undefined && (
            <>
              <MenuItem type="action" onClick={() => setIsShareModalOpen(true)}>
                {t('shareOrExport')}
              </MenuItem>
              <MenuSeparator />
            </>
          )}
          <MenuItem type="link" to={aboutPageLink}>
            {t('aboutKakeru')}
          </MenuItem>
          <MenuItem type="link" to={buyMeACoffeeLink}>
            {t('supportOnBMC')}
          </MenuItem>
          <MenuItem type="link" to="/flags">
            {t('experimentalFlags')}
          </MenuItem>
        </MenuItems>
      </Menu>
      {pictureId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          pictureId={pictureId}
        />
      )}
    </>
  )
}
