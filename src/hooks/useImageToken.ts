import { useEffect, useState } from 'react'
import { User, isNotSignedIn, useAuth } from './useAuth'
import { imageBaseUrl } from '../constants'

const updateInterval = 1000 * 60 * 10

export type UseImageTokenResult = {
  imageToken: string | undefined
}

export function useImageToken(): UseImageTokenResult {
  const { currentUser } = useAuth()
  const [imageToken, setImageToken] = useState<string>()

  useEffect(() => {
    if (currentUser === undefined || isNotSignedIn(currentUser)) return

    const user = currentUser

    function fetchImageTokenWrapper() {
      fetchImageToken(user).then(setImageToken, () => {
        // ignore error
      })
    }

    fetchImageTokenWrapper()
    const timer = setInterval(fetchImageTokenWrapper, updateInterval)

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
