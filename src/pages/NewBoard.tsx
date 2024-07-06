import React, { FC, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { generateId } from '../utils/generateId'
import { isNotSignedIn, useAuth } from '../hooks/useAuth'

export const NewBoard: FC = () => {
  const { currentUser } = useAuth()
  const newPictureId = useMemo(() => generateId(), [])

  if (currentUser === undefined) {
    return null
  }

  const query = isNotSignedIn(currentUser) ? '?welcome=1' : ''
  return <Navigate replace to={`/${newPictureId}${query}`} />
}
