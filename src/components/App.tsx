import React from 'react'
import { AuthDisplay } from './AuthDisplay'
import { Drawing } from './Drawing'
import { BrowserRouter as Router, Route, Switch, match } from 'react-router-dom'

function WrappedDrawing({
  match: {
    params: { pictureId }
  }
}: {
  match: match<{ pictureId?: string }>
}) {
  return <Drawing pictureId={pictureId} />
}

export function App({  }: {}) {
  return (
    <Router>
      <>
        <h1>draw</h1>
        <AuthDisplay />
        <Switch>
          <Route exact path="/" component={WrappedDrawing} />
          <Route path="/p/:pictureId" component={WrappedDrawing} />
        </Switch>
      </>
    </Router>
  )
}
