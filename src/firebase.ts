import { initializeAnalytics, isSupported, setUserId, setUserProperties } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'

export async function initializeFirebase() {
  const app = initializeApp(kakeruSecrets.firebaseConfig)

  if (!isRecaptchaEnabled && kakeruSecrets.appCheckDebugToken) {
    const global = window as unknown as Record<string, unknown>
    global.FIREBASE_APPCHECK_DEBUG_TOKEN = kakeruSecrets.appCheckDebugToken
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(kakeruSecrets.recaptchaKey),
    isTokenAutoRefreshEnabled: true
  })

  initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  })

  const analyticsSupported = await isSupported()
  if (analyticsSupported) {
    const analytics = initializeAnalytics(app)
    const auth = getAuth()
    onAuthStateChanged(auth, (user) => {
      if (user != null && analytics != null) {
        setUserId(analytics, user.uid)
        setUserProperties(analytics, { anonymous: user.isAnonymous })
      }
    })
  }
}
