import React, { FC, useCallback } from 'react'
import { translate, withPrefix } from '../i18n/translate'
import { isSignedIn, useAuth } from '../hooks/useAuth'

const t = withPrefix('signInBanner')

export const SignInBanner: FC = () => {
  const { currentUser, signInAnonymously, signInWithGoogle: signInWithGoogleOriginal } = useAuth()

  const signInWithGoogle = useCallback(async () => {
    const c = await signInWithGoogleOriginal()
    if (c === undefined) {
      alert(translate('menu.failedToSignIn'))
    }
  }, [signInWithGoogleOriginal])

  if (currentUser === undefined || isSignedIn(currentUser)) {
    return null
  }

  return (
    <div className="p-2 text-center bg-red-200 text-base">
      {t('text1')}
      <button 
        onClick={signInAnonymously}
        className="border-0 bg-transparent p-0 underline text-inherit cursor-pointer inline mx-[0.15em]"
      >
        {t('link1')}
      </button>
      {t('text2')}
      <button 
        onClick={signInWithGoogle}
        className="border-0 bg-transparent p-0 underline text-inherit cursor-pointer inline mx-[0.15em]"
      >
        {t('link2')}
      </button>
      {t('text3')}
    </div>
  )
}
