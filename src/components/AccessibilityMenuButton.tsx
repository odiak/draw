import React, { FC, useCallback } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faLockOpen, faCheck } from '@fortawesome/free-solid-svg-icons'
import { Permission, AccessibilityLevel } from '../services/PictureService'
import { Menu, MenuItem } from './Menu'
import { useMenu } from '../utils/useMenu'

const StyledFontAwesomeIcon = styled(FontAwesomeIcon)``
const RedStyledFontAwesomeIcon = styled(StyledFontAwesomeIcon)`
  color: red;
`

const PublicIcon = () => <StyledFontAwesomeIcon icon={faLockOpen} fixedWidth />
const ProtectedIcon = () => <StyledFontAwesomeIcon icon={faLock} fixedWidth />
const PrivateIcon = () => <RedStyledFontAwesomeIcon icon={faLock} fixedWidth />

const CheckIcon_ = styled(StyledFontAwesomeIcon)``
const CheckIcon = () => <CheckIcon_ icon={faCheck} />

const Button = styled.button`
  background: #ddd;
  display: block;
  border: 0;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  > ${StyledFontAwesomeIcon} {
    display: block;
  }
`

const StyledMenuItem = styled(MenuItem)`
  ${StyledFontAwesomeIcon}:nth-of-type(1) {
    margin-right: 4px;
  }

  ${CheckIcon_} {
    margin-left: 4px;
  }
`

export const AccessibilityMenuButton: FC<{
  className?: string
  permission: Permission
  onAccessibilityLevelChange?: (_accLevel: AccessibilityLevel) => void
}> = ({ className, permission, onAccessibilityLevelChange }) => {
  const { menuRef, buttonRef } = useMenu()

  const [isPublic, isProtected, isPrivate] = ['public', 'protected', 'private'].map(
    (level) => level === permission.accessibilityLevel
  )

  const change = useCallback(
    (accLevel: AccessibilityLevel) => {
      if (accLevel !== permission.accessibilityLevel) {
        onAccessibilityLevelChange?.(accLevel)
      }
    },
    [onAccessibilityLevelChange, permission]
  )
  const makePublic = useCallback(() => {
    change('public')
  }, [change])
  const makeProtected = useCallback(() => {
    change('protected')
  }, [change])
  const makePrivate = useCallback(() => {
    change('private')
  }, [change])

  return (
    <Button className={className} ref={buttonRef}>
      {isPublic && <PublicIcon />}
      {isProtected && <ProtectedIcon />}
      {isPrivate && <PrivateIcon />}
      <Menu ref={menuRef}>
        <StyledMenuItem onClick={makePublic}>
          <PublicIcon />
          Everyone can see and draw
          {isPublic && <CheckIcon />}
        </StyledMenuItem>
        <StyledMenuItem onClick={makeProtected}>
          <ProtectedIcon />
          Everyone can see, only you can draw
          {isProtected && <CheckIcon />}
        </StyledMenuItem>
        <StyledMenuItem onClick={makePrivate}>
          <PrivateIcon />
          Only you can see and draw
          {isPrivate && <CheckIcon />}
        </StyledMenuItem>
      </Menu>
    </Button>
  )
}
