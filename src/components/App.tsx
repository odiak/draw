import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { DrawingScreen } from './DrawingScreen'
import { NotFound } from './NotFound'
import { NewPicture } from './NewPicture'
import { Pictures } from './Pictures'
import { Flags } from './Flags'

export function App() {
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
