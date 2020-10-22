import React, { useEffect } from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { DrawingScreen } from './DrawingScreen'
import { NotFound } from './NotFound'
import { NewPicture } from './NewPicture'
import { Pictures } from './Pictures'
import { Flags } from './Flags'
import { MigrationService } from '../services/MigrationService'

export function App() {
  useEffect(() => {
    const migrationService = MigrationService.instantiate()
    return migrationService.addMigrationReadyCallback(async () => {
      if (!confirm('Do you migrate data created before signing in?')) return
      try {
        await migrationService.migrateData()
      } catch (e) {
        console.log(e)
        alert('Failed to migrate data.')
        return
      }
      alert('Data was successfully migrated!')
    })
  }, [])

  return (
    <BrowserRouter>
      <>
        <Switch>
          <Route exact path="/" component={NewPicture} />
          <Route path="/boards" component={Pictures} />
          <Route path="/flags" component={Flags} />
          <Route path="/:pictureId([0-9a-f]{32})" component={DrawingScreen} />
          <Route component={NotFound} />
        </Switch>
      </>
    </BrowserRouter>
  )
}
