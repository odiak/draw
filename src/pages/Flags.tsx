import React, { FC, useCallback } from 'react'
import { ExperimentalSettingsService } from '../services/ExperimentalSettingsService'
import { useVariable } from '../utils/useVariable'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'
import { Title } from '../components/Title'
import { withPrefix } from '../i18n/translate'

const t = withPrefix('flags')

export const Flags: FC = () => {
  useSetCurrentScreen('flags')

  const settingsService = ExperimentalSettingsService.instantiate()
  const [settings] = useVariable(settingsService.experimentalSettings)

  const setSettingsWithSave = useCallback(
    (u: typeof settings) => {
      const s = { ...settings, ...u }
      settingsService.setExperimentalSettings(s)
    },
    [settings, settingsService]
  )

  return (
    <div className="px-2.5 py-1.5">
      <Title>{t('title')}</Title>

      <h1>{t('title')}</h1>
      <label className="block mb-3.5">
        <input
          type="checkbox"
          checked={!!settings.hackForSamsungGalaxyNote}
          onChange={(e) => {
            setSettingsWithSave({ hackForSamsungGalaxyNote: e.target.checked })
          }}
          className="mr-2"
        />
        {t('hackForSamsungGalaxyNote')}
      </label>
      <label className="block mb-3.5">
        <input
          type="checkbox"
          checked={!!settings.disableSmoothingPaths}
          onChange={(e) => {
            setSettingsWithSave({ disableSmoothingPaths: e.target.checked })
          }}
          className="mr-2"
        />
        {t('disableSmoothingPaths')}
      </label>
      <label className="block mb-3.5">
        <input
          type="checkbox"
          checked={!!settings.disableScaleLimit}
          onChange={(e) => {
            setSettingsWithSave({ disableScaleLimit: e.target.checked })
          }}
          className="mr-2"
        />
        {t('disableScaleLimit')}
      </label>
    </div>
  )
}
