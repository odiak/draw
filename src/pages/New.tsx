import React, { FC, useMemo } from 'react'
import { generateId } from '../utils/generateId'
import { Navigate } from 'react-router-dom'
import { isNotSignedIn, isSignedIn, useAuth } from '../hooks/useAuth'

export const New: FC = () => {
  const { currentUser } = useAuth()
  const newPictureId = useMemo(() => generateId(), [])

  if (currentUser === undefined) {
    return null
  }

  if (isNotSignedIn(currentUser)) {
    return <Navigate replace to={`/${newPictureId}?welcome=1`} />
  }

  return <Navigate replace to={`/${newPictureId}`} />
}
