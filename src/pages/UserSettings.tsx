import React, { FC } from 'react'
import { isSignedIn, useAuth } from '../hooks/useAuth'
import { useUserSettings } from '../hooks/useUserSettings'
import { withPrefix } from '../i18n/translate'
import { AccessibilityLevel } from '../services/PictureService'
import { Title } from '../components/Title'
import { Link } from 'react-router-dom'

const t = withPrefix('settings')

export const UserSettings: FC = () => {
  const auth = useAuth()
  const { settings, updateSettings, isUpdatingApiToken, createOrRefreshApiToken } =
    useUserSettings()

  return (
    <div className="p-2">
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
        className="p-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
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
                {t('yourApiToken')}:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  {settings.apiToken}
                </code>
              </p>
              {!isUpdatingApiToken && (
                <button
                  onClick={createOrRefreshApiToken}
                  className="mr-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('refreshApiToken')}
                </button>
              )}
              {isUpdatingApiToken && (
                <button
                  disabled
                  className="mr-2 px-2 py-1 bg-gray-400 text-white rounded cursor-not-allowed"
                >
                  Refreshing API token...
                </button>
              )}
              <button
                onClick={() => {
                  updateSettings({ apiToken: undefined })
                }}
                className="mr-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                {t('deleteApiToken')}
              </button>
            </div>
          ) : (
            <div>
              <p>{t('apiTokenIsNotCreated')}</p>
              {!isUpdatingApiToken && (
                <button
                  onClick={createOrRefreshApiToken}
                  className="mr-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('createApiToken')}
                </button>
              )}
              {isUpdatingApiToken && (
                <button
                  disabled
                  className="mr-2 px-2 py-1 bg-gray-400 text-white rounded cursor-not-allowed"
                >
                  {t('creatingApiToken')}
                </button>
              )}
            </div>
          )}
          <p>
            <a
              href="https://github.com/odiak/draw/blob/master/API.md"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              {t('apiDocumentation')}
            </a>
          </p>

          <br />
          <p>
            <Link to="/" className="text-blue-500 hover:underline">
              &laquo; {t('backToHome')}
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
