import React from 'react'
import { render } from 'react-dom'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { App } from './App'

firebase.initializeApp({
  apiKey: 'AIzaSyAHYun-sXC5ZkK-XNpEqaImnd24nxrCbLM',
  authDomain: 'draw-9a1e4.firebaseapp.com',
  databaseURL: 'https://draw-9a1e4.firebaseio.com',
  projectId: 'draw-9a1e4',
  storageBucket: 'draw-9a1e4.appspot.com',
  messagingSenderId: '251397130642',
  appId: '1:251397130642:web:ae3b9c1dff554eea'
})

render(<App />, document.getElementById('app'))
