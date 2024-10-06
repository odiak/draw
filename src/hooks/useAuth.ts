import { FirebaseError } from 'firebase/app'
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'firebase/auth'
import {
  getFirestore,
  getDocs,
  query,
  collection,
  where,
  limit,
  orderBy,
  setDoc,
  doc
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getFunctions } from '../utils/firebase-functions'

const migrationTokenKey = 'KAKERU_MIGRATION_TOKEN'

export class NotSignedIn {
  static instance = new NotSignedIn()
  private constructor() {}

  // only for type inference
  readonly notSignedIn = true
}

type UserState = User | NotSignedIn

export type { User, UserState }

type Unsubscribe = () => void
type MigrateFunction = () => Promise<void>

type UseAuthResult = {
  auth: Auth
  currentUser: UserState | undefined
  signInAnonymously(): Promise<User | undefined>
  signInWithGoogle(): Promise<User | undefined>
  signOut(): Promise<void>
  onMigrationReady(callback: (migrate: MigrateFunction) => void | Promise<void>): Unsubscribe
}

export function useAuth(): UseAuthResult {
  const auth = useMemo(() => getAuth(), [])

  const [currentUser, setCurrentUser] = useState<User | NotSignedIn | undefined>(
    () => auth.currentUser ?? undefined
  )

  const migrationReadyCallbacks = useRef<Set<(m: MigrateFunction) => void> | undefined>()

  useEffect(() => {
    auth.useDeviceLanguage()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ?? NotSignedIn.instance)

      const callbacks = migrationReadyCallbacks.current
      if (user !== null && !user.isAnonymous && callbacks !== undefined && callbacks.size > 0) {
        invokeMigrationReadyCallbacks(callbacks)
      }
    })

    return unsubscribe
  }, [auth])

  const signInAnonymouslyWrapper = useCallback(async () => {
    try {
      const cred = await signInAnonymously(auth)
      return cred.user
    } catch (e) {
      console.error(e)
      return undefined
    }
  }, [auth])

  const signInWithGoogleWrapper = useCallback(async () => {
    registerMigrationToken(auth.currentUser ?? undefined)

    const provider = new GoogleAuthProvider()
    try {
      const cred = await signInWithPopup(auth, provider)
      return cred.user
    } catch (e: unknown) {
      if (e instanceof FirebaseError && isPopupBlockedError(e)) {
        await signInWithRedirect(auth, provider)
      }
      console.error(e)
      return undefined
    }
  }, [auth])

  const signOutWrapper = useCallback(() => {
    return signOut(auth)
  }, [auth])

  const onMigrationReady = useCallback(
    (callback: (migrate: MigrateFunction) => void | Promise<void>): Unsubscribe => {
      if (migrationReadyCallbacks.current === undefined) {
        migrationReadyCallbacks.current = new Set()
      }
      migrationReadyCallbacks.current.add(callback)

      return () => {
        migrationReadyCallbacks.current?.delete(callback)
      }
    },
    []
  )

  return {
    auth,
    currentUser,
    signInAnonymously: signInAnonymouslyWrapper,
    signInWithGoogle: signInWithGoogleWrapper,
    signOut: signOutWrapper,
    onMigrationReady
  }
}

export function isSignedIn(user: User | NotSignedIn): user is User {
  return !(user instanceof NotSignedIn)
}

export function isNotSignedIn(user: User | NotSignedIn): user is NotSignedIn {
  return user instanceof NotSignedIn
}

function isPopupBlockedError(error: FirebaseError): boolean {
  const { message } = error
  return /\bpopup\b/.test(message) && /\bblocked\b/.test(message)
}

async function registerMigrationToken(currentUser: User | undefined): Promise<void> {
  if (currentUser === undefined || !currentUser.isAnonymous) return

  const db = getFirestore()

  // check if there are some drawings
  const qs = await getDocs(
    query(
      collection(db, 'pictures'),
      where('ownerId', '==', currentUser.uid),
      limit(1),
      orderBy('createdAt', 'desc')
    )
  )
  if (qs.docs.length === 0) return

  const token = Array.from(crypto.getRandomValues(new Uint8Array(30)))
    .map((n) => n.toString(36))
    .join('')

  try {
    localStorage.setItem(migrationTokenKey, token)
  } catch {
    // nothing
  }

  await setDoc(doc(collection(db, 'migrationTokens'), token), { uid: currentUser.uid })
}

async function invokeMigrationReadyCallbacks(
  callbacks: Iterable<(m: MigrateFunction) => void | Promise<void>>
) {
  const token = localStorage.getItem(migrationTokenKey)
  if (token === null) return

  for (const callback of callbacks) {
    try {
      await callback(() => migrateData(token))
    } catch {
      // nothing
    }
  }

  localStorage.removeItem(migrationTokenKey)
}

async function migrateData(token: string): Promise<void> {
  const migrateDataFunction = httpsCallable(getFunctions(), 'migrateData')

  await migrateDataFunction({ token })
}
