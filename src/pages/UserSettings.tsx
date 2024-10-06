import React, { FC } from 'react'
import styled from 'styled-components'
import { isSignedIn, useAuth } from '../hooks/useAuth'
import { useUserSettings } from '../hooks/useUserSettings'

const Container = styled.div`
  padding: 8px;
`

export const UserSettings: FC = () => {
  const auth = useAuth()
  const { settings, isUpdatingApiToken, createOrRefreshApiToken } = useUserSettings()

  return (
    <Container>
      <h1>Account settings</h1>

      {auth.currentUser !== undefined && isSignedIn(auth.currentUser) && (
        <>
          <h2>API token</h2>
          {settings.apiToken ? (
            <div>
              <p>
                Your API token is: <code>{settings.apiToken}</code>
              </p>
              {!isUpdatingApiToken && (
                <button onClick={createOrRefreshApiToken}>Refresh API token</button>
              )}
              {isUpdatingApiToken && <button disabled>Refreshing API token...</button>}
            </div>
          ) : (
            <div>
              <p>Your API token is not created yet.</p>
              {!isUpdatingApiToken && (
                <button onClick={createOrRefreshApiToken}>Create API token</button>
              )}
              {isUpdatingApiToken && <button disabled>Creating API token...</button>}
            </div>
          )}
          <p>
            <a
              href="https://github.com/odiak/draw/blob/master/API.md"
              target="_blank"
              rel="noreferrer"
            >
              API documentation
            </a>
          </p>
        </>
      )}
    </Container>
  )
}
