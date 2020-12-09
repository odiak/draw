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

firebase.initializeApp({
  apiKey: 'AIzaSyC3uYAGMS5pIjJKlNyGkc4aqKn4U1fjV8w',
  authDomain: 'draw-9a1e4.firebaseapp.com',
  databaseURL: 'https://draw-9a1e4.firebaseio.com',
  projectId: 'draw-9a1e4',
  storageBucket: 'draw-9a1e4.appspot.com',
  messagingSenderId: '251397130642',
  appId: '1:251397130642:web:ae3b9c1dff554eea',
  measurementId: 'G-KC20B58HEQ'
})
firebase.analytics()

firebase.auth().onAuthStateChanged((user) => {
  if (user != null) {
    firebase.analytics().setUserId(user.uid)
  }
})

Sentry.init({
  dsn: 'https://1960c22d4cb84d36a5c718b27604a428@o488873.ingest.sentry.io/5550015',
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
