import '../firebase'
import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript
} from 'next/document'
import { Fragment } from 'react'
import { ServerStyleSheet } from 'styled-components'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { initializeAnalytics, isSupported, setUserId, setUserProperties } from 'firebase/analytics'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getApp } from 'firebase/app'

const app = getApp()

isSupported().then((supported) => {
  if (!supported) return

  const analytics = initializeAnalytics(app)
  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user != null && analytics != null) {
      setUserId(analytics, user.uid)
      setUserProperties(analytics, { anonymous: user.isAnonymous })
    }
  })
})

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0
})

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />)
        })

      const initialProps = await Document.getInitialProps(ctx)
      return {
        ...initialProps,
        styles: [
          <Fragment key={0}>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </Fragment>
        ]
      }
    } finally {
      sheet.seal()
    }
  }

  render() {
    return (
      <Html lang="en" prefix="og: https://ogp.me/ns#">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
export default MyDocument
