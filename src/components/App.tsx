import React from 'react'
import { DrawingScreen } from './DrawingScreen'
import { BrowserRouter as Router, Route, Switch, match } from 'react-router-dom'

function WrappedDrawing({
  match: {
    params: { pictureId }
  }
}: {
  match: match<{ pictureId?: string }>
}) {
  return <DrawingScreen pictureId={pictureId} />
}

export function App({  }: {}) {
  return (
    <Router>
      <>
        <Switch>
          <Route exact path="/" component={WrappedDrawing} />
          <Route path="/p/:pictureId" component={WrappedDrawing} />
        </Switch>
      </>
    </Router>
  )
}
