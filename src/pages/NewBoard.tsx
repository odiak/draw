import React, { FC } from 'react'
import { Redirect } from 'react-router-dom'
import { generateId } from '../utils/generateId'

export const NewBoard: FC = () => {
  return <Redirect to={`/${generateId()}`} />
}
