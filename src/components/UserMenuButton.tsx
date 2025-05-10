import React, { FC, PropsWithChildren, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { withPrefix } from '../i18n/translate'
import { NotSignedIn, User, isSignedIn, useAuth } from '../hooks/useAuth'
import { ScreenName, useScreenName } from '../utils/screenNames'
import classNames from 'classnames'
import { Menu, MenuButton } from '@headlessui/react'
import { MenuItems, MenuItem } from './Menu'

const t = withPrefix('menu')

export const UserMenuButton: FC<{ className?: string }> = ({ className }) => {
  const {
    currentUser,
    signInWithGoogle: signInWithGoogleOriginal,
    signInAnonymously,
    signOut: signOutOriginal
  } = useAuth()

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
    <Menu>
      <MenuButton
        className={classNames(
          'w-[30px] h-[30px] border-0 bg-gray-300 dark:bg-gray-600 flex justify-center items-center p-[1px] text-inherit',
          className
        )}
      >
        {currentUser !== undefined &&
        isSignedIn(currentUser) &&
        !currentUser.isAnonymous &&
        currentUser.photoURL ? (
          <img src={currentUser.photoURL} className="w-full h-full" />
        ) : (
          <FontAwesomeIcon icon={faUser} className="block" />
        )}
      </MenuButton>
      <MenuItems>
        <Items
          user={currentUser}
          screenName={screenName}
          {...{ signInAnonymously, signInWithGoogle, signOut }}
        />
      </MenuItems>
    </Menu>
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
      {isAnonymous && <MenuItem type="text">{t('usingAnonymously')}</MenuItem>}
      {screenName !== 'boards' && isSignedIn_ && (
        <MenuItem type="link" to="/boards">
          {t('myBoards')}
        </MenuItem>
      )}
      {screenName !== 'settings' && isSignedIn_ && (
        <MenuItem type="link" to="/settings">
          {t('settings')}
        </MenuItem>
      )}
      {isNotSignedIn && (
        <MenuItem type="action" onClick={signInAnonymously}>
          {t('signInAnonymously')}
        </MenuItem>
      )}
      {isAnonymousLike && (
        <MenuItem type="action" onClick={signInWithGoogle}>
          {t('signInWithGoogle')}
        </MenuItem>
      )}
      {isSignedIn_ && (
        <MenuItem type="action" onClick={signOut}>
          {t('signOut')}
        </MenuItem>
      )}
    </>
  )
}
