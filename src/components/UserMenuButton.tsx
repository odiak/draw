import React, { FC, useCallback } from 'react'
import { AuthService } from '../services/AuthService'
import { Link } from 'react-router-dom'
import { Menu, MenuItem, MenuItemWithAnchor } from './Menu'
import { Icon } from '@iconify/react'
import userIcon from '@iconify-icons/fa-solid/user'
import styled from 'styled-components'
import { useMenu } from '../utils/useMenu'
import { useVariable } from '../utils/useVariable'
import { MigrationService } from '../services/MigrationService'

export const UserMenuButton: FC<{ className?: string }> = ({ className }) => {
  const authService = AuthService.instantiate()
  const [currentUser] = useVariable(authService.currentUser)
  const migrationService = MigrationService.instantiate()

  const { menuRef: accountMenuRef, buttonRef: accountMenuButtonRef } = useMenu()

  const signIn = useCallback(async () => {
    await migrationService.registerMigrationToken()
    const c = await authService.signInWithGoogle()
    if (c == null) {
      alert('Failed to sign in')
    }
  }, [authService, migrationService])

  const signOut = useCallback(() => {
    authService.signOut()
  }, [authService])

  return (
    <AccountButton ref={accountMenuButtonRef} className={className}>
      {currentUser == null || currentUser.isAnonymous || currentUser.photoURL == null ? (
        <Icon icon={userIcon} className="icon" />
      ) : (
        <AccountImage src={currentUser.photoURL} />
      )}
      <Menu ref={accountMenuRef}>
        <MenuItemWithAnchor>
          <Link to="/boards">My boards</Link>
        </MenuItemWithAnchor>
        {currentUser != null &&
          (currentUser.isAnonymous ? (
            <MenuItem onClick={signIn}>Sign in with Google</MenuItem>
          ) : (
            <MenuItem onClick={signOut}>Sign out</MenuItem>
          ))}
      </Menu>
    </AccountButton>
  )
}

const AccountButton = styled.button`
  display: block;
  width: 30px;
  height: 30px;
  border: 0;
  background: #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 1px;

  > .icon {
    display: block;
  }
`

const AccountImage = styled.img`
  width: 100%;
  height: 100%;
`
