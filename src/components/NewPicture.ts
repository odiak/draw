import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { generateId } from '../utils/generateId'

export function NewPicture() {
  const history = useHistory()

  useEffect(() => {
    history.push(`/${generateId()}`)
  }, [history])

  return null
}
