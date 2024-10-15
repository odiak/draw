import { useEffect, useState } from 'react'
import { User, isNotSignedIn, useAuth } from './useAuth'
import { imageBaseUrl } from '../constants'

export type UseImageTokenResult = {
  imageToken: string | undefined
}

export function useImageToken(): UseImageTokenResult {
  const { currentUser } = useAuth()
  const [imageToken, setImageToken] = useState<string>()

  useEffect(() => {
    if (currentUser === undefined || isNotSignedIn(currentUser)) return

    const timer = setInterval(() => {
      fetchImageToken(currentUser).then(setImageToken, () => {
        // ignore error
      })
    }, 1000 * 60 * 10)

    return () => {
      clearInterval(timer)
    }
  }, [currentUser])

  return {
    imageToken
  }
}

async function fetchImageToken(user: User): Promise<string> {
  const idToken = await user.getIdToken()
  const response = await fetch(`${imageBaseUrl}/issueImageToken`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  })
  const { token } = await response.json()

  return token
}
