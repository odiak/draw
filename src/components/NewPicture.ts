import { FC, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { generateId } from '../utils/generateId'

export const NewPicture: FC = () => {
  const history = useHistory()

  useEffect(() => {
    history.replace(`/${generateId()}`)
  }, [history])

  return null
}
