import React, { FC, useCallback, useEffect, useState } from 'react'
import { isSignedIn, useAuth } from '../hooks/useAuth'
import { withPrefix, translate, language } from '../i18n/translate'

const t = withPrefix('welcome')

type Props = {
  onClose?: () => void
}

export const Welcome: FC<Props> = ({ onClose }) => {
  const {
    currentUser,
    signInAnonymously: signInAnonymouslyOriginal,
    signInWithGoogle: signInWithGoogleOriginal
  } = useAuth()
  const [isWaiting, setIsWaiting] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setIsWaiting(false)
    }, 700)
  }, [])

  const signInAnonymously = useCallback(async () => {
    signInAnonymouslyOriginal() // don't await
    onClose?.()
  }, [onClose, signInAnonymouslyOriginal])

  const signInWithGoogle = useCallback(async () => {
    const c = await signInWithGoogleOriginal()
    if (c === undefined) {
      alert(translate('menu.failedToSignIn'))
    }
    onClose?.()
  }, [onClose, signInWithGoogleOriginal])

  if (isWaiting || (currentUser !== undefined && isSignedIn(currentUser))) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-300/80 dark:bg-gray-600/80 grid place-items-center p-3">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-lg">
        <h1 className="mt-0 mb-4">{t('title')}</h1>
        <p className="leading-relaxed">{t('description')}</p>
        <button 
          onClick={signInAnonymously}
          className="inline-block mr-3 my-2 text-2xl py-1 px-2 rounded border border-blue-600 bg-blue-600 text-white"
        >
          {t('startUsingNow')}
        </button>
        <button 
          onClick={signInWithGoogle}
          className="inline-block mr-3 my-2 text-2xl py-1 px-2 rounded border border-gray-500 bg-gray-500 text-white"
        >
          {t('signInWithGoogle')}
        </button>
        <p className="leading-relaxed">
          {t('note1')}
          <br />
          {t('note2')}
          <br />
          <a
            href={language === 'ja' ? 'https://about.kakeru.app/ja' : 'https://about.kakeru.app'}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline"
          >
            {t('learnMore')}
          </a>
        </p>
      </div>
    </div>
  )
}
