import React, { FC, useEffect } from 'react'
import { createGlobalStyle } from 'styled-components'
import { MigrationService } from '../services/MigrationService'
import { useTranslate } from '../i18n/translate'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { NotFound } from '../pages/NotFound'
import { DrawingPage } from '../pages/DrawingPage'
import { Flags } from '../pages/Flags'
import { Boards } from '../pages/Boards'
import { NewBoard } from '../pages/NewBoard'

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

  @media (prefers-color-scheme: dark) {
    html {
      background: #000;
      color: #eee;
    }
  }
`

export const App: FC = () => {
  const t = useTranslate('global')

  useEffect(() => {
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
    <>
      <GlobalStyle />
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={NewBoard} />
          <Route path="/boards" component={Boards} />
          <Route path="/flags" component={Flags} />
          <Route path="/:pictureId([0-9a-f]{32})" component={DrawingPage} />
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    </>
  )
}
