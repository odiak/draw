import React, { FC, useCallback } from 'react'
import { ExperimentalSettingsService } from '../services/ExperimentalSettingsService'
import styled from 'styled-components'
import { useVariable } from '../utils/useVariable'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'
import { Title } from '../components/Title'
import { withPrefix } from '../i18n/translate'

const t = withPrefix('flags')

const Container = styled.div`
  padding: 5px 10px;
`

const Label = styled.label`
  display: block;
  margin-bottom: 14px;
`

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
    <Container>
      <Title>{t('title')}</Title>

      <h1>{t('title')}</h1>
      <Label>
        <input
          type="checkbox"
          checked={!!settings.hackForSamsungGalaxyNote}
          onChange={(e) => {
            setSettingsWithSave({ hackForSamsungGalaxyNote: e.target.checked })
          }}
        />
        {t('hackForSamsungGalaxyNote')}
      </Label>
      <Label>
        <input
          type="checkbox"
          checked={!!settings.disableSmoothingPaths}
          onChange={(e) => {
            setSettingsWithSave({ disableSmoothingPaths: e.target.checked })
          }}
        />
        {t('disableSmoothingPaths')}
      </Label>
    </Container>
  )
}
