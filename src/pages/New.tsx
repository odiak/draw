import React, { FC, useMemo } from 'react'
import { generateId } from '../utils/generateId'
import { Navigate } from 'react-router-dom'

export const New: FC = () => {
  const newPictureId = useMemo(() => generateId(), [])

  return <Navigate replace to={`/${newPictureId}?welcome=1`} />
}
