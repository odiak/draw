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
  defaultAccessibilityLevel?: 'public' | 'protected' | 'private'
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

      if (!snapshot.metadata.hasPendingWrites) {
        setSettings(snapshot.data())
      }
    })

    return unsubscribe
  }, [auth, firestore])

  const updateSettings = useCallback(
    async (settings: UserSettings) => {
      if (auth.currentUser === undefined || auth.currentUser instanceof NotSignedIn) return

      const userRef = doc(collection(firestore, 'users'), auth.currentUser.uid).withConverter(
        userSettingsConverter
      )
      setSettings((s) => ({ ...s, ...settings }))
      await setDoc(userRef, settings, { merge: true })
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
  toFirestore: (settings) => ({
    ...settings,
    apiToken: settings.apiToken ?? null
  }),
  fromFirestore: (snapshot) => {
    const { defaultAccessibilityLevel: defaultAccLevel, apiToken } = snapshot.data() as Record<
      string,
      unknown
    >
    const settings: UserSettings = {}

    if (
      defaultAccLevel != null &&
      (defaultAccLevel === 'public' ||
        defaultAccLevel === 'protected' ||
        defaultAccLevel === 'private')
    ) {
      settings.defaultAccessibilityLevel = defaultAccLevel
    } else {
      settings.defaultAccessibilityLevel = undefined
    }

    if (apiToken != null) {
      settings.apiToken = String(apiToken)
    }

    return settings
  }
}
