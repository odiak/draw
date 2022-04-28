import { memo } from '../utils/memo'
import { Variable } from '../utils/Variable'
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  User,
  UserCredential
} from 'firebase/auth'

export type { User }

export class AuthService {
  static readonly instantiate = memo(() => new AuthService())

  private auth = getAuth()
  private googleAuthProvider = new GoogleAuthProvider()

  readonly currentUser = new Variable<User | null>(null)

  constructor() {
    this.auth.useDeviceLanguage()

    this.auth.onAuthStateChanged(async (user) => {
      if (user == null) {
        const { user: anonUser } = await signInAnonymously(this.auth)
        if (anonUser != null) {
          this.currentUser.next(anonUser)
        }
      } else {
        this.currentUser.next(user)
      }
    })
  }

  async signInWithGoogle(usePopup: boolean = true): Promise<UserCredential | null> {
    if (!usePopup) {
      await signInWithRedirect(this.auth, this.googleAuthProvider)
      return null
    }

    const cred = await signInWithPopup(this.auth, this.googleAuthProvider).catch((e: unknown) => {
      console.error(e)
      const message = extractMessage(e)
      if (
        usePopup &&
        message != null &&
        /\bpopup\b/i.test(message) &&
        /\bblocked\b/i.test(message)
      ) {
        return this.signInWithGoogle(false)
      }
      return null
    })
    return cred
  }

  async signOut(): Promise<void> {
    await this.auth.signOut()
  }
}

function extractMessage(error: unknown): string | undefined {
  if (error == null || typeof error !== 'object') return
  const { message } = error as Record<string, unknown>
  if (typeof message !== 'string') return
  return message
}
