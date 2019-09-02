import React from 'react'
import { AuthDisplay } from './AuthDisplay'
import { Drawing } from './Drawing'

export function App({  }: {}) {
  return (
    <>
      <h1>draw</h1>
      <AuthDisplay />
      <Drawing />
    </>
  )
}
