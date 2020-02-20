import React from 'react'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import { render } from 'react-dom'
import { App } from './components/App'
import { css, Global } from '@emotion/core'

firebase.initializeApp({
  apiKey: 'AIzaSyC3uYAGMS5pIjJKlNyGkc4aqKn4U1fjV8w',
  authDomain: 'draw-9a1e4.firebaseapp.com',
  databaseURL: 'https://draw-9a1e4.firebaseio.com',
  projectId: 'draw-9a1e4',
  storageBucket: 'draw-9a1e4.appspot.com',
  messagingSenderId: '251397130642',
  appId: '1:251397130642:web:ae3b9c1dff554eea'
})

const globalStyle = css`
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
`

render(
  <>
    <Global styles={globalStyle} />
    <App />
  </>,
  document.getElementById('app')
)
