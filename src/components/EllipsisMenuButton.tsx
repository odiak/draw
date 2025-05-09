import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { FC } from 'react'
import { baseUrl, imageBaseUrl } from '../constants'
import { withPrefix } from '../i18n/translate'
import { Permission } from '../services/PictureService'
import { copyToClipboard } from '../utils/copyToClipboard'

import { useMenu } from '../utils/useMenu'
import { Menu, MenuDivider, MenuItem, MenuItemText, MenuItemWithAnchor } from './Menu'
import { useScreenName } from '../utils/screenNames'

const t = withPrefix('menu')

type Props = {
  pictureId?: string
  permission?: Permission
  className?: string
}

const buyMeACoffeeLink = 'https://buymeacoffee.com/odiak'

export const EllipsisMenuButton: FC<Props> = ({ pictureId, permission, className }) => {
  const { menuRef, buttonRef: menuButtonRef } = useMenu()

  const screenName = useScreenName()

  const imageLink = `${imageBaseUrl}/${pictureId}.svg`
  const pageLink = `${baseUrl}/${pictureId}`

  const aboutPageLink = navigator.language.startsWith('ja')
    ? 'https://about.kakeru.app/ja'
    : 'https://about.kakeru.app'

  return (
    <button
      ref={menuButtonRef}
      className={`w-[36px] h-[30px] border-0 bg-gray-300 dark:bg-gray-600 relative text-inherit ${className || ''}`}
    >
      <FontAwesomeIcon icon={faEllipsisH} className="icon" />
      <Menu ref={menuRef}>
        {screenName === 'drawing' && pictureId !== undefined && (
          <>
            {permission?.accessibilityLevel === 'private' ? (
              <MenuItemText>{t('noImageLink')}</MenuItemText>
            ) : (
              <>
                <MenuItemToCopy text={imageLink}>{t('copyImageLink')}</MenuItemToCopy>
                <MenuItemToCopy text={`[![](${imageLink})](${pageLink})`}>
                  {t('copyImageLinkForMarkdown')}
                </MenuItemToCopy>
                <MenuItemToCopy text={`[${pageLink} ${imageLink}]`}>
                  {t('copyImageLinkForScrapbox')}
                </MenuItemToCopy>
              </>
            )}
            <MenuDivider />
          </>
        )}
        <MenuItemWithLink link={aboutPageLink}>{t('aboutKakeru')}</MenuItemWithLink>
        <MenuItemWithLink link={buyMeACoffeeLink}>{t('supportOnBMC')}</MenuItemWithLink>
        <MenuItemWithLink link="/flags">{t('experimentalFlags')}</MenuItemWithLink>
      </Menu>
    </button>
  )
}

const MenuItemToCopy: FC<{ text: string }> = ({ children, text }) => {
  return (
    <MenuItem
      onClick={() => {
        copyToClipboard(text)
      }}
    >
      {children}
    </MenuItem>
  )
}

const MenuItemWithLink: FC<{ link: string }> = ({ link, children }) => {
  return (
    <MenuItem>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-2 py-1.5 text-inherit no-underline"
      >
        {children}
      </a>
    </MenuItem>
  )
}
