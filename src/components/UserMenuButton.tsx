import React, { FC, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Menu, MenuItem, MenuItemWithAnchor } from './Menu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import { useMenu } from '../utils/useMenu'
import { MigrationService } from '../services/MigrationService'
import { withPrefix } from '../i18n/translate'
import { isSignedIn, useAuth } from '../hooks/useAuth'

const t = withPrefix('menu')

export const UserMenuButton: FC<{ className?: string; hideLinkToBoards?: boolean }> = ({
  className,
  hideLinkToBoards
}) => {
  const { currentUser, signInWithGoogle, signOut } = useAuth()
  const migrationService = MigrationService.instantiate()

  const { menuRef: accountMenuRef, buttonRef: accountMenuButtonRef } = useMenu()

  const signIn = useCallback(async () => {
    await migrationService.registerMigrationToken()
    const c = await signInWithGoogle()
    if (c === undefined) {
      alert(t('failedToSignIn'))
    }
  }, [migrationService, signInWithGoogle])

  return (
    <AccountButton ref={accountMenuButtonRef} className={className}>
      {currentUser !== undefined &&
      isSignedIn(currentUser) &&
      !currentUser.isAnonymous &&
      currentUser.photoURL ? (
        <AccountImage src={currentUser.photoURL} />
      ) : (
        <FontAwesomeIcon icon={faUser} className="icon" />
      )}
      <Menu ref={accountMenuRef}>
        {!hideLinkToBoards && (
          <MenuItemWithAnchor>
            <Link to="/boards">{t('myBoards')}</Link>
          </MenuItemWithAnchor>
        )}
        {currentUser !== undefined &&
          (isSignedIn(currentUser) && currentUser.isAnonymous ? (
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
