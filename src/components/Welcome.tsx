import React, { FC, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
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
    <Backdrop>
      <Container>
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
        <PrimaryButton onClick={signInAnonymously}>{t('startUsingNow')}</PrimaryButton>
        <SecondaryButton onClick={signInWithGoogle}>{t('signInWithGoogle')}</SecondaryButton>
        <p>
          {t('note1')}
          <br />
          {t('note2')}
          <br />
          <a
            href={language === 'ja' ? 'https://about.kakeru.app/ja' : 'https://about.kakeru.app'}
            target="_blank"
            rel="noreferrer"
          >
            {t('learnMore')}
          </a>
        </p>
      </Container>
    </Backdrop>
  )
}

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ccca;
  display: grid;
  place-items: center;
  padding: 12px;

  @media (prefers-color-scheme: dark) {
    background: #777a;
  }
`

const Container = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 10px #0004;

  @media (prefers-color-scheme: dark) {
    background: #222;
  }

  h1 {
    margin-top: 0;
    margin-bottom: 16px;
  }

  p {
    line-height: 1.4;
  }
`

const Button = styled.button`
  display: inline-block;
  margin-right: 12px;
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 24px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #888;
`

const PrimaryButton = styled(Button)`
  background: #007bff;
  color: #fff;
  border-color: #007bff;
`
const SecondaryButton = styled(Button)`
  background: #6c757d;
  color: #fff;
  border-color: #6c757d;
`
