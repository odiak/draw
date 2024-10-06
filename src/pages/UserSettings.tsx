import React, { FC } from 'react'
import styled from 'styled-components'
import { isSignedIn, useAuth } from '../hooks/useAuth'
import { useUserSettings } from '../hooks/useUserSettings'
import { withPrefix } from '../i18n/translate'

const t = withPrefix('settings')

const Container = styled.div`
  padding: 8px;
`

export const UserSettings: FC = () => {
  const auth = useAuth()
  const { settings, isUpdatingApiToken, createOrRefreshApiToken } = useUserSettings()

  return (
    <Container>
      <h1>{t('title')}</h1>

      {auth.currentUser !== undefined && isSignedIn(auth.currentUser) && (
        <>
          <h2>{t('apiToken')}</h2>
          {settings.apiToken ? (
            <div>
              <p>
                {t('yourApiToken')}: <code>{settings.apiToken}</code>
              </p>
              {!isUpdatingApiToken && (
                <button onClick={createOrRefreshApiToken}>{t('refreshApiToken')}</button>
              )}
              {isUpdatingApiToken && <button disabled>Refreshing API token...</button>}
            </div>
          ) : (
            <div>
              <p>{t('apiTokenIsNotCreated')}</p>
              {!isUpdatingApiToken && (
                <button onClick={createOrRefreshApiToken}>{t('createApiToken')}</button>
              )}
              {isUpdatingApiToken && <button disabled>{t('creatingApiToken')}</button>}
            </div>
          )}
          <p>
            <a
              href="https://github.com/odiak/draw/blob/master/API.md"
              target="_blank"
              rel="noreferrer"
            >
              {t('apiDocumentation')}
            </a>
          </p>
        </>
      )}
    </Container>
  )
}
