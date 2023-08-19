import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const app = initializeApp(kakeruSecrets.firebaseConfig)

if (!isRecaptchaEnabled && kakeruSecrets.appCheckDebugToken) {
  ;(window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = kakeruSecrets.appCheckDebugToken
}
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(kakeruSecrets.recaptchaKey),
  isTokenAutoRefreshEnabled: true
})
