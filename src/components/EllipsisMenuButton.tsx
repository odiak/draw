import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { FC } from 'react'
import { baseUrl, imageBaseUrl } from '../constants'
import { withPrefix } from '../i18n/translate'
import { Permission } from '../services/PictureService'
import { copyToClipboard } from '../utils/copyToClipboard'

import { MenuItems, MenuItem } from './Menu'
import { useScreenName } from '../utils/screenNames'
import { Menu, MenuButton, MenuSeparator } from '@headlessui/react'

const t = withPrefix('menu')

type Props = {
  pictureId?: string
  permission?: Permission
  className?: string
}

const buyMeACoffeeLink = 'https://buymeacoffee.com/odiak'

export const EllipsisMenuButton: FC<Props> = ({ pictureId, permission, className }) => {
  const screenName = useScreenName()

  const imageLink = `${imageBaseUrl}/${pictureId}.svg`
  const pageLink = `${baseUrl}/${pictureId}`

  const aboutPageLink = navigator.language.startsWith('ja')
    ? 'https://about.kakeru.app/ja'
    : 'https://about.kakeru.app'

  return (
    <Menu>
      <MenuButton
        className={`w-[36px] h-[30px] border-0 bg-gray-300 dark:bg-gray-600 relative text-inherit ${className || ''}`}
      >
        <FontAwesomeIcon icon={faEllipsisH} className="icon" />
      </MenuButton>
      <MenuItems className="w-max">
        {screenName === 'drawing' && pictureId !== undefined && (
          <>
            {permission?.accessibilityLevel === 'private' ? (
              <MenuItem type="text">{t('noImageLink')}</MenuItem>
            ) : (
              <>
                <MenuItem type="action" onClick={() => copyToClipboard(imageLink)}>
                  {t('copyImageLink')}
                </MenuItem>
                <MenuItem
                  type="action"
                  onClick={() => copyToClipboard(`[![](${imageLink})](${pageLink})`)}
                >
                  {t('copyImageLinkForMarkdown')}
                </MenuItem>
                <MenuItem
                  type="action"
                  onClick={() => copyToClipboard(`[${pageLink} ${imageLink}]`)}
                >
                  {t('copyImageLinkForScrapbox')}
                </MenuItem>
              </>
            )}
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
  )
}
