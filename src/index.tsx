import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './components/App'
import { checkCookie } from './checkCookie'
import { showBMCWidget } from './bmc'
import { initializeFirebase } from './firebase'
import { initializeSentry } from './sentry'
import { initializeServiceWorker } from './sw'
import './index.css'

initializeFirebase()

initializeSentry()

checkCookie()

initializeServiceWorker()

ReactDOM.render(<App />, document.getElementById('app'))

showBMCWidget()
