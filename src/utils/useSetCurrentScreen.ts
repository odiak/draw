import { useEffect } from 'react'
import firebase from 'firebase'

export function useSetCurrentScreen(name: string) {
  useEffect(() => {
    firebase.analytics().setCurrentScreen(name)
  }, [])
}
