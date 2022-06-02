import React from 'react'
import ReactDOM from 'react-dom'
import './firebase'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { initializeAnalytics, isSupported, setUserId, setUserProperties } from 'firebase/analytics'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getApp } from 'firebase/app'
import { App } from './components/App'
import { checkCookie } from './checkCookie'

const app = getApp()

isSupported().then((supported) => {
  if (!supported) return

  const analytics = initializeAnalytics(app)
  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user != null && analytics != null) {
      setUserId(analytics, user.uid)
      setUserProperties(analytics, { anonymous: user.isAnonymous })
    }
  })
})

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0
})

checkCookie()

ReactDOM.render(<App />, document.getElementById('app'))
