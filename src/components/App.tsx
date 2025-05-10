import React, { FC, useEffect, useState } from 'react'
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
import { Home } from '../pages/Home'
import { InvalidRouteError } from '../utils/InvalidRouteError'
import { useAuth } from '../hooks/useAuth'
import { SplashScreen } from './SplashScreen'
import { New } from '../pages/New'
import { screenNames } from '../utils/screenNames'
import { UserSettings } from '../pages/UserSettings'

const t = withPrefix('global')

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
      <Route index element={<Home />} />
      <Route id={screenNames.boards} path="boards" element={<Boards />} />
      <Route id={screenNames.new} path="new" element={<New />} />
      <Route id={screenNames.flags} path="flags" element={<Flags />} />
      <Route id={screenNames.settings} path="settings" element={<UserSettings />} />
      <Route id={screenNames.drawing} path=":pictureId" element={<DrawingPage />} />
    </Route>
  )
)

export const App: FC = () => {
  const { onMigrationReady } = useAuth()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches)
    }

    setDarkMode(darkModeMediaQuery.matches)

    darkModeMediaQuery.addEventListener('change', handleChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    return onMigrationReady(async (migrate) => {
      if (!confirm(t('migrationConfirmation'))) return
      try {
        await migrate()
      } catch (e) {
        console.log(e)
        alert(t('migrationFailed'))
        return
      }
      alert(t('migrationSucceeded'))
    })
  }, [onMigrationReady])

  return (
    <>
      <SplashScreen />
      <RouterProvider router={router} />
    </>
  )
}
