import { memo } from '../utils/memo'
import firebase from 'firebase/app'
import { Variable } from '../utils/Variable'

export type User = firebase.User

export class AuthService {
  static readonly instantiate = memo(() => new AuthService())

  private auth = firebase.auth()
  private googleAuthProvider = new firebase.auth.GoogleAuthProvider()

  readonly currentUser = new Variable<User | null>(null)

  constructor() {
    this.auth.useDeviceLanguage()

    this.auth.onAuthStateChanged(async (user) => {
      if (user == null) {
        const { user: anonUser } = await this.auth.signInAnonymously()
        if (anonUser != null) {
          this.currentUser.next(anonUser)
        }
      } else {
        this.currentUser.next(user)
      }
    })
  }

  async signInWithGoogle(usePopup: boolean = true): Promise<firebase.auth.UserCredential | null> {
    if (!usePopup) {
      await this.auth.signInWithRedirect(this.googleAuthProvider)
      return null
    }

    const cred = await this.auth.signInWithPopup(this.googleAuthProvider).catch((e: unknown) => {
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
