import React, { FC, useCallback } from 'react'
import { ExperimentalSettingsService } from '../services/ExperimentalSettingsService'
import styled from 'styled-components'
import { useVariable } from '../utils/useVariable'

const Container = styled.div`
  padding: 5px 10px;
`

export const Flags: FC<{}> = () => {
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
      <h1>Experimental Flags</h1>
      <div>
        <label>
          <input
            type="checkbox"
            checked={!!settings.smoothPaths}
            onChange={(e) => {
              setSettingsWithSave({ smoothPaths: e.target.checked })
            }}
          />
          Enable smoothing paths
        </label>
      </div>
    </Container>
  )
}
