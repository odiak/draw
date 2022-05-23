import React, { FC, useCallback } from 'react'
import { AuthService } from '../services/AuthService'
import Link from 'next/link'
import { Menu, MenuItem, MenuItemWithAnchor } from './Menu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import { useMenu } from '../utils/useMenu'
import { useVariable } from '../utils/useVariable'
import { MigrationService } from '../services/MigrationService'
import { useTranslate } from '../i18n/translate'

export const UserMenuButton: FC<{ className?: string }> = ({ className }) => {
  const t = useTranslate('menu')

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
        <MenuItemWithAnchor>
          <Link href="/boards">
            <a>{t('myBoards')}</a>
          </Link>
        </MenuItemWithAnchor>
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

  > .icon {
    display: block;
  }
`

const AccountImage = styled.img`
  width: 100%;
  height: 100%;
`
