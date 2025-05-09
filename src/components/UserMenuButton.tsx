import React, { FC, useCallback } from 'react'
import { Link, useMatches } from 'react-router-dom'
import { Menu, MenuItem, MenuItemText } from './Menu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
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
    <button
      ref={accountMenuButtonRef}
      className={`block w-[30px] h-[30px] border-0 bg-gray-300 dark:bg-gray-600 flex justify-center items-center relative p-[1px] text-inherit ${className || ''}`}
    >
      {currentUser !== undefined &&
      isSignedIn(currentUser) &&
      !currentUser.isAnonymous &&
      currentUser.photoURL ? (
        <img src={currentUser.photoURL} className="w-full h-full" />
      ) : (
        <FontAwesomeIcon icon={faUser} className="block" />
      )}

      <Menu ref={accountMenuRef}>
        <Items
          user={currentUser}
          screenName={screenName}
          {...{ signInAnonymously, signInWithGoogle, signOut }}
        />
      </Menu>
    </button>
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
        <MenuItem>
          <Link to="/boards" className="block px-2 py-1.5 text-inherit no-underline">
            {t('myBoards')}
          </Link>
        </MenuItem>
      )}
      {screenName !== 'settings' && isSignedIn_ && (
        <MenuItem>
          <Link to="/settings" className="block px-2 py-1.5 text-inherit no-underline">
            {t('settings')}
          </Link>
        </MenuItem>
      )}
      {isNotSignedIn && <MenuItem onClick={signInAnonymously}>{t('signInAnonymously')}</MenuItem>}
      {isAnonymousLike && <MenuItem onClick={signInWithGoogle}>{t('signInWithGoogle')}</MenuItem>}
      {isSignedIn_ && <MenuItem onClick={signOut}>{t('signOut')}</MenuItem>}
    </>
  )
}
