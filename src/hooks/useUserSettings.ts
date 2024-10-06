import { useCallback, useEffect, useMemo, useState } from 'react'
import { NotSignedIn, useAuth } from './useAuth'
import {
  FirestoreDataConverter,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  setDoc
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { getFunctions } from '../utils/firebase-functions'

export type UserSettings = {
  apiToken?: string
}

export function useUserSettings() {
  const auth = useAuth()

  const firestore = useMemo(() => getFirestore(), [])

  const [settings, setSettings] = useState<UserSettings>({})
  const [isUpdatingApiToken, setIsUpdatingApiToken] = useState(false)

  useEffect(() => {
    if (auth.currentUser === undefined || auth.currentUser instanceof NotSignedIn) return

    const userRef = doc(collection(firestore, 'users'), auth.currentUser.uid).withConverter(
      userSettingsConverter
    )
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSettings({})
        return
      }

      setSettings(snapshot.data())
    })

    return unsubscribe
  }, [auth, firestore])

  const updateSettings = useCallback(
    async (settings: UserSettings) => {
      if (auth.currentUser === undefined || auth.currentUser instanceof NotSignedIn) return

      const userRef = doc(collection(firestore, 'users'), auth.currentUser.uid).withConverter(
        userSettingsConverter
      )
      await setDoc(userRef, settings)
    },
    [auth, firestore]
  )

  const createOrRefreshApiToken = useCallback(async () => {
    setIsUpdatingApiToken(true)
    const func = httpsCallable(getFunctions(), 'createOrRefreshApiToken')

    await func()
    setIsUpdatingApiToken(false)
  }, [])

  return { settings, updateSettings, createOrRefreshApiToken, isUpdatingApiToken }
}

const userSettingsConverter: FirestoreDataConverter<UserSettings> = {
  toFirestore: (settings) => settings,
  fromFirestore: (snapshot) => {
    const { apiToken } = snapshot.data()
    return {
      apiToken: apiToken != null ? String(apiToken) : undefined
    }
  }
}
