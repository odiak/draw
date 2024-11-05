import * as Sentry from '@sentry/react'
import { useEffect } from 'react'
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType
} from 'react-router-dom'

export function initializeSentry() {
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
}
