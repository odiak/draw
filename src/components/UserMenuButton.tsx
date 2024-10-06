import React, { FC, useCallback } from 'react'
import { Link, useMatches } from 'react-router-dom'
import { Menu, MenuItem, MenuItemText, MenuItemWithAnchor } from './Menu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import { useMenu } from '../utils/useMenu'
import { withPrefix } from '../i18n/translate'
import { NotSignedIn, User, isSignedIn, useAuth } from '../hooks/useAuth'
import { ScreenName, useScreenName } from '../utils/screenNames'

const t = withPrefix('menu')

export const UserMenuButton: FC<{ className?: string }> = ({ className }) => {
  const {
    currentUser,
    signInWithGoogle: signInWithGoogleOriginal,
    signInAnonymously,
    signOut: signOutOriginal
  } = useAuth()

  const { menuRef: accountMenuRef, buttonRef: accountMenuButtonRef } = useMenu()

  const screenName = useScreenName()

  const signInWithGoogle = useCallback(async () => {
    const c = await signInWithGoogleOriginal()
    if (c === undefined) {
      alert(t('failedToSignIn'))
      return
    }

    setTimeout(() => {
      location.reload()
    }, 500)
  }, [signInWithGoogleOriginal])

  const signOut = useCallback(async () => {
    if (!confirm(t('signOutConfirmation'))) return
    signOutOriginal()

    setTimeout(() => {
      location.reload()
    }, 500)
  }, [signOutOriginal])

  if (currentUser === undefined) {
    return null
  }

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
        <Items
          user={currentUser}
          screenName={screenName}
          {...{ signInAnonymously, signInWithGoogle, signOut }}
        />
      </Menu>
    </AccountButton>
  )
}

type ItemsProps = {
  user: User | NotSignedIn
  screenName: ScreenName | undefined
  signInWithGoogle(): void
  signInAnonymously(): void
  signOut(): void
}

const Items: FC<ItemsProps> = ({
  user,
  signInAnonymously,
  signInWithGoogle,
  signOut,
  screenName
}) => {
  const isSignedIn_ = isSignedIn(user)
  const isAnonymous = isSignedIn(user) && user.isAnonymous
  const isAnonymousLike = isAnonymous || !isSignedIn_
  const isNotSignedIn = !isSignedIn_

  return (
    <>
      {isAnonymous && <MenuItemText>{t('usingAnonymously')}</MenuItemText>}
      {screenName !== 'boards' && isSignedIn_ && (
        <MenuItemWithAnchor>
          <Link to="/boards">{t('myBoards')}</Link>
        </MenuItemWithAnchor>
      )}
      {isNotSignedIn && <MenuItem onClick={signInAnonymously}>{t('signInAnonymously')}</MenuItem>}
      {isAnonymousLike && <MenuItem onClick={signInWithGoogle}>{t('signInWithGoogle')}</MenuItem>}
      {isSignedIn_ && <MenuItem onClick={signOut}>{t('signOut')}</MenuItem>}
    </>
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
