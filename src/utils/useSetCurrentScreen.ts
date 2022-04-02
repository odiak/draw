import { getAnalytics, setCurrentScreen } from 'firebase/analytics'
import { useEffect } from 'react'

export function useSetCurrentScreen(name: string) {
  useEffect(() => {
    setCurrentScreen(getAnalytics(), name)
  }, [])
}
