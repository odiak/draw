import React, { FC, useCallback } from 'react'
import styled from 'styled-components'
import { Icon } from '@iconify/react'
import lockIcon from '@iconify-icons/fa-solid/lock'
import lockOpen from '@iconify-icons/fa-solid/lock-open'
import checkIcon from '@iconify-icons/fa-solid/check'
import { Permission, AccessibilityLevel } from '../services/PictureService'
import { Menu, MenuItem } from './Menu'
import { useMenu } from '../utils/useMenu'

const StyledIcon = styled(Icon)``
const RedStyledIcon = styled(Icon)`
  color: red;
`
const PublicIcon = () => <StyledIcon icon={lockOpen} />
const ProtectedIcon = () => <StyledIcon icon={lockIcon} />
const PrivateIcon = () => <RedStyledIcon icon={lockIcon} />

const CheckIcon_ = styled(Icon)``
const CheckIcon = () => <CheckIcon_ icon={checkIcon} />

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

  > ${StyledIcon} {
    display: block;
  }
`

const StyledMenuItem = styled(MenuItem)`
  ${StyledIcon}:nth-of-type(1) {
    margin-right: 4px;
  }

  ${CheckIcon_} {
    margin-left: 4px;
  }
`

export const AccessibilityMenuButton: FC<{
  className?: string
  permission: Permission
  onAccessibilityLevelChange?: (accLevel: AccessibilityLevel) => void
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
