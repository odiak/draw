import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './components/App'
import { checkCookie } from './checkCookie'
import { showBMCWidget } from './bmc'
import { initializeFirebase } from './firebase'
import { initializeSentry } from './sentry'

initializeFirebase()

initializeSentry()

checkCookie()

ReactDOM.render(<App />, document.getElementById('app'))

showBMCWidget()
