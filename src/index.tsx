import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import './firebase'
import * as Sentry from '@sentry/react'
import { initializeAnalytics, isSupported, setUserId, setUserProperties } from 'firebase/analytics'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getApp } from 'firebase/app'
import { App } from './components/App'
import { checkCookie } from './checkCookie'
import { showBMCWidget } from './bmc'
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType
} from 'react-router-dom'

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
  dsn: kakeruSecrets.sentryDsn,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes
    })
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: [/^\//, /^https?:\/\/i\.kakeru\.app\b/]
})

checkCookie()

ReactDOM.render(<App />, document.getElementById('app'))

showBMCWidget()
