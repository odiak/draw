import React, { FC, useCallback } from 'react'
import styled from 'styled-components'
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
    <Container>
      {t('text1')}
      <button onClick={signInAnonymously}>{t('link1')}</button>
      {t('text2')}
      <button onClick={signInWithGoogle}>{t('link2')}</button>
      {t('text3')}
    </Container>
  )
}

const Container = styled.div`
  padding: 8px;
  text-align: center;
  background: #fdd;
  font-size: 16px;

  button {
    border: 0;
    background: none;
    padding: 0;
    text-decoration: underline;
    font-size: inherit;
    cursor: pointer;
    display: inline;
    margin-left: 0.15em;
    margin-right: 0.15em;
  }
`
