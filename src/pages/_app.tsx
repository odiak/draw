import { AppProps } from 'next/app'
import Head from 'next/head'
import { FC, useEffect } from 'react'
import { createGlobalStyle } from 'styled-components'
import { MigrationService } from '../services/MigrationService'

const GlobalStyle = createGlobalStyle`
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

  body {
    overscroll-behavior: none;
  }
`

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const migrationService = MigrationService.instantiate()
    return migrationService.addMigrationReadyCallback(async () => {
      if (!confirm('Do you migrate data created before signing in?')) return
      try {
        await migrationService.migrateData()
      } catch (e) {
        console.log(e)
        alert('Failed to migrate data.')
        return
      }
      alert('Data was successfully migrated!')
    })
  }, [])

  return (
    <>
      <GlobalStyle />
      <Head>
        <link rel="shortcut icon" href="/favicon.png" />
        <title key="title">Kakeru</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
export default MyApp
