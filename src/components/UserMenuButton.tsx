import React, { FC, useCallback } from 'react'
import { AuthService } from '../services/AuthService'
import { Link } from 'react-router-dom'
import { Menu, MenuItem, MenuItemWithAnchor } from './Menu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import { useMenu } from '../utils/useMenu'
import { useVariable } from '../utils/useVariable'
import { MigrationService } from '../services/MigrationService'
import { withPrefix } from '../i18n/translate'

const t = withPrefix('menu')

export const UserMenuButton: FC<{ className?: string; hideLinkToBoards?: boolean }> = ({
  className,
  hideLinkToBoards
}) => {
  const authService = AuthService.instantiate()
  const [currentUser] = useVariable(authService.currentUser)
  const migrationService = MigrationService.instantiate()

  const { menuRef: accountMenuRef, buttonRef: accountMenuButtonRef } = useMenu()

  const signIn = useCallback(async () => {
    await migrationService.registerMigrationToken()
    const c = await authService.signInWithGoogle()
    if (c == null) {
      alert(t('failedToSignIn'))
    }
  }, [authService, migrationService])

  const signOut = useCallback(() => {
    authService.signOut()
  }, [authService])

  return (
    <AccountButton ref={accountMenuButtonRef} className={className}>
      {currentUser == null || currentUser.isAnonymous || currentUser.photoURL == null ? (
        <FontAwesomeIcon icon={faUser} className="icon" />
      ) : (
        <AccountImage src={currentUser.photoURL} />
      )}
      <Menu ref={accountMenuRef}>
        {!hideLinkToBoards && (
          <MenuItemWithAnchor>
            <Link to="/boards">{t('myBoards')}</Link>
          </MenuItemWithAnchor>
        )}
        {currentUser != null &&
          (currentUser.isAnonymous ? (
            <MenuItem onClick={signIn}>{t('signInWithGoogle')}</MenuItem>
          ) : (
            <MenuItem onClick={signOut}>{t('signOut')}</MenuItem>
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
  color: inherit;

  > .icon {
    display: block;
  }

  @media (prefers-color-scheme: dark) {
    & {
      background: #444;
    }
  }
`

const AccountImage = styled.img`
  width: 100%;
  height: 100%;
`
