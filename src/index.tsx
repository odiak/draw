import React from 'react'
import { initializeApp } from 'firebase/app'
import { render } from 'react-dom'
import { App } from './components/App'
import { createGlobalStyle } from 'styled-components'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { initializeAnalytics, setUserId, setUserProperties } from 'firebase/analytics'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const app = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG!))
const analytics = initializeAnalytics(app)

const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  if (user != null) {
    setUserId(analytics, user.uid)
    setUserProperties(analytics, { anonymous: user.isAnonymous })
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
