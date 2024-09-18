import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { FC, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { imageBaseUrl2 } from '../constants'
import { withPrefix } from '../i18n/translate'
import { PictureService, PictureWithId } from '../services/PictureService'
import { useMenu } from '../utils/useMenu'
import { Menu as OriginalMenu, MenuItem } from './Menu'

const t = withPrefix('boards')

type Props = {
  picture: PictureWithId
  onDelete?: () => void
}

export const PictureListItem: FC<Props> = ({ picture: { id: pictureId, title }, onDelete }) => {
  const { buttonRef, menuRef } = useMenu()

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
    <Container>
      <MenuButton ref={buttonRef}>
        <FontAwesomeIcon icon={faEllipsisH} className="icon" />
        <Menu ref={menuRef}>
          <MenuItem
            onClick={() => {
              deletePicture()
            }}
          >
            {t('deleteBoard')}
          </MenuItem>
        </Menu>
      </MenuButton>
      <AnchorBox to={`/${pictureId}`}>
        <PictureThumbnail src={`${imageBaseUrl2}/${pictureId}-w380-h300.png`} />
        <PictureTitle>{title || t('untitled')}</PictureTitle>
      </AnchorBox>
    </Container>
  )
}

const Container = styled.div``

const AnchorBox = styled(Link)`
  color: inherit;
  text-decoration: none;
`

const PictureTitle = styled.div`
  position: absolute;
  bottom: 0;
  padding: 4px;
  background: #fffe;
  display: block;
  width: 100%;
  box-sizing: border-box;

  @media (prefers-color-scheme: dark) {
    & {
      background: #333e;
    }
  }
`

const PictureThumbnail = styled.img`
  transform: scale(0.5) translate(-50%, -50%);
`

const MenuButton = styled.button`
  position: absolute;
  background: #ddd8;
  border: 0;
  right: 0;
  top: 0;
  z-index: 1;
  padding: 4px 6px;
  color: inherit;

  & > .icon {
    color: #555c;
  }
`

const Menu = styled(OriginalMenu)`
  min-width: unset;
`
