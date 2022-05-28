import { AppProps as OriginalAppProps } from 'next/app'
import Head from 'next/head'
import { FC, useEffect } from 'react'
import { createGlobalStyle } from 'styled-components'
import { MigrationService } from '../services/MigrationService'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { useTranslate } from '../i18n/translate'
import { Language, LanguageContext } from '../LanguageContext'

config.autoAddCss = false

const GlobalStyle = createGlobalStyle`
  html {
    font-family: Arial, Helvetica, sans-serif;
  }

  html,
  body,
  #__next {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    overscroll-behavior: none;
  }
`

type AppProps = OriginalAppProps & { lang: Language | undefined }

const MyApp: FC<AppProps> = ({ Component, pageProps, lang }) => {
  const t = useTranslate('global')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const migrationService = MigrationService.instantiate()
    return migrationService.addMigrationReadyCallback(async () => {
      if (!confirm(t('migrationConfirmation'))) return
      try {
        await migrationService.migrateData()
      } catch (e) {
        console.log(e)
        alert(t('migrationFailed'))
        return
      }
      alert(t('migrationSucceeded'))
    })
  }, [t])

  return (
    <LanguageContext.Provider value={lang}>
      <GlobalStyle />
      <Head>
        <link rel="shortcut icon" href="/favicon.png" />
        <title key="title">Kakeru</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Component {...pageProps} />
    </LanguageContext.Provider>
  )
}
export default MyApp
