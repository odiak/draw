import React from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('app')!).render(<App />)

showBMCWidget()
