import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const app = initializeApp(kakeruSecrets.firebaseConfig)

if (isRecaptchaEnabled) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(kakeruSecrets.recaptchaKey),
    isTokenAutoRefreshEnabled: true
  })
}
