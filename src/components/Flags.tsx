import React, { FC, useState, useCallback } from 'react'
import { ExperimentalSettingsService } from '../services/ExperimentalSettingsService'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const Container = styled.div`
  padding: 5px 10px;
`

export const Flags: FC<{}> = () => {
  const settingsService = ExperimentalSettingsService.instantiate()
  const [settings, setSettings] = useState(() => settingsService.experimentalSettings)

  const setSettingsWithSave = useCallback(
    (u: typeof settings) => {
      const s = { ...settings, ...u }
      setSettings(s)
      settingsService.experimentalSettings = s
    },
    [settings, settingsService]
  )

  return (
    <Container>
      <h1>Flags</h1>
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
      <p>
        <Link to="/">back to home</Link>
      </p>
    </Container>
  )
}
