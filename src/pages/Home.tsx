import React, { FC } from 'react'
import { Navigate } from 'react-router-dom'
import { isNotSignedIn, useAuth } from '../hooks/useAuth'

export const Home: FC = () => {
  const { currentUser } = useAuth()

  if (currentUser === undefined) {
    return null
  }

  if (isNotSignedIn(currentUser)) {
    return <Navigate replace to="/new" />
  }

  return <Navigate replace to="/boards" />
}
