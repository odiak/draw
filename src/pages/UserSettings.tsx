import React, { FC } from 'react'
import styled from 'styled-components'
import { isSignedIn, useAuth } from '../hooks/useAuth'
import { useUserSettings } from '../hooks/useUserSettings'
import { withPrefix } from '../i18n/translate'
import { AccessibilityLevel } from '../services/PictureService'
import { Title } from '../components/Title'
import { Link } from 'react-router-dom'

const t = withPrefix('settings')

const Container = styled.div`
  padding: 8px;

  button {
    margin-right: 8px;
  }
`

export const UserSettings: FC = () => {
  const auth = useAuth()
  const { settings, updateSettings, isUpdatingApiToken, createOrRefreshApiToken } =
    useUserSettings()

  return (
    <Container>
      <Title>{t('title')}</Title>

      <h1>{t('title')}</h1>

      <h2>{t('defaultAccessibilityLevel')}</h2>

      <p>{t('defaultAccessibilityLevelDescription')}</p>

      <select
        value={settings.defaultAccessibilityLevel ?? 'public'}
        onChange={(e) => {
          updateSettings({
            defaultAccessibilityLevel: e.target.value as AccessibilityLevel
          })
        }}
      >
        {(['public', 'protected', 'private'] as const).map((level) => (
          <option key={level} value={level}>
            {t(level)}
          </option>
        ))}
      </select>

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
              <button
                onClick={() => {
                  updateSettings({ apiToken: undefined })
                }}
              >
                {t('deleteApiToken')}
              </button>
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

          <br />
          <p>
            <Link to="/">&laquo; {t('backToHome')}</Link>
          </p>
        </>
      )}
    </Container>
  )
}
