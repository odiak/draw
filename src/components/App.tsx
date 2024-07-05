import React, { FC, useEffect } from 'react'
import { createGlobalStyle } from 'styled-components'
import { MigrationService } from '../services/MigrationService'
import { withPrefix } from '../i18n/translate'
import {
  Outlet,
  Route,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
  createRoutesFromElements,
  isRouteErrorResponse,
  useRouteError
} from 'react-router-dom'
import { NotFound } from '../pages/NotFound'
import { DrawingPage } from '../pages/DrawingPage'
import { Flags } from '../pages/Flags'
import { Boards } from '../pages/Boards'
import { NewBoard } from '../pages/NewBoard'
import { InvalidRouteError } from '../utils/InvalidRouteError'

const t = withPrefix('global')

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

const ErrorElement: FC = () => {
  const error = useRouteError()
  if ((isRouteErrorResponse(error) && error.status === 404) || error instanceof InvalidRouteError) {
    return <NotFound />
  }

  return <p>Error</p>
}

const Root: FC = () => (
  <>
    <Outlet />
    <ScrollRestoration />
  </>
)

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" errorElement={<ErrorElement />} element={<Root />}>
      <Route index element={<NewBoard />} />
      <Route path="boards" element={<Boards />} />
      <Route path="flags" element={<Flags />} />
      <Route path=":pictureId" element={<DrawingPage />} />
    </Route>
  )
)

export const App: FC = () => {
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
  }, [])

  return (
    <>
      <GlobalStyle />
      <RouterProvider router={router} />
    </>
  )
}
