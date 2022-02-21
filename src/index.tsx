import React from 'react'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import 'firebase/functions'
import 'firebase/analytics'
import { render } from 'react-dom'
import { App } from './components/App'
import { createGlobalStyle } from 'styled-components'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'

firebase.initializeApp(JSON.parse(process.env.FIREBASE_CONFIG!))
firebase.analytics()

firebase.auth().onAuthStateChanged((user) => {
  if (user != null) {
    firebase.analytics().setUserId(user.uid)
    firebase.analytics().setUserProperties({ anonymous: user.isAnonymous })
  }
})

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0
})

const GlobalStyle = createGlobalStyle`
  html {
    font-family: Arial, Helvetica, sans-serif;
  }

  html,
  body,
  #app {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    overscroll-behavior: none;
  }
`

render(
  <>
    <GlobalStyle />
    <App />
  </>,
  document.getElementById('app')
)
