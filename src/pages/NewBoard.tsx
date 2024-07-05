import React, { FC } from 'react'
import { Navigate } from 'react-router-dom'
import { generateId } from '../utils/generateId'

export const NewBoard: FC = () => {
  return <Navigate replace to={`/${generateId()}`} />
}
