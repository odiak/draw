import {
  FirestoreDataConverter,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  setDoc
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFunctions } from '../utils/firebase-functions'
import { NotSignedIn, useAuth } from './useAuth'

export type UserSettings = {
  defaultAccessibilityLevel?: 'public' | 'protected' | 'private'
  apiToken?: string
}

export function useUserSettings() {
  const { currentUser } = useAuth()

  const firestore = useMemo(() => getFirestore(), [])

  const [settings, setSettings] = useState<UserSettings>({})
  const [isUpdatingApiToken, setIsUpdatingApiToken] = useState(false)

  useEffect(() => {
    if (currentUser === undefined || currentUser instanceof NotSignedIn) return

    const userRef = doc(collection(firestore, 'users'), currentUser.uid).withConverter(
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
  }, [currentUser, firestore])

  const updateSettings = useCallback(
    async (settings: UserSettings) => {
      if (currentUser === undefined || currentUser instanceof NotSignedIn) return

      const userRef = doc(collection(firestore, 'users'), currentUser.uid).withConverter(
        userSettingsConverter
      )
      setSettings((s) => ({ ...s, ...settings }))
      await setDoc(userRef, settings, { merge: true })
    },
    [currentUser, firestore]
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
