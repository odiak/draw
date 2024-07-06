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
import { useEffect, useMemo, useState } from 'react'

export class NotSignedIn {
  static instance = new NotSignedIn()
  private constructor() {}

  // only for type inference
  readonly notSignedIn = true
}

type UserState = User | NotSignedIn

export type { User, UserState }

type UseAuthResult = {
  auth: Auth
  currentUser: UserState | undefined
  signInAnonymously(): Promise<User | undefined>
  signInWithGoogle(): Promise<User | undefined>
  signOut(): Promise<void>
}

export function useAuth(): UseAuthResult {
  const auth = useMemo(() => getAuth(), [])

  const [currentUser, setCurrentUser] = useState<User | NotSignedIn | undefined>(
    () => auth.currentUser ?? undefined
  )

  useEffect(() => {
    auth.useDeviceLanguage()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ?? NotSignedIn.instance)
    })

    return unsubscribe
  }, [auth])

  const functions = useMemo(
    () => ({
      signInAnonymously: signInAnonymouslyWrapper.bind(null, auth),
      signInWithGoogle: signInWithGoogle.bind(null, auth),
      signOut: signOut.bind(null, auth)
    }),
    [auth]
  )

  return {
    auth,
    currentUser,
    ...functions
  }
}

export function isSignedIn(user: User | NotSignedIn): user is User {
  return !(user instanceof NotSignedIn)
}

export function isNotSignedIn(user: User | NotSignedIn): user is NotSignedIn {
  return user instanceof NotSignedIn
}

async function signInAnonymouslyWrapper(auth: Auth): Promise<User | undefined> {
  try {
    const cred = await signInAnonymously(auth)
    return cred.user
  } catch (e) {
    console.error(e)
    return undefined
  }
}

async function signInWithGoogle(auth: Auth): Promise<User | undefined> {
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
}

function isPopupBlockedError(error: FirebaseError): boolean {
  const { message } = error
  return /\bpopup\b/.test(message) && /\bblocked\b/.test(message)
}
