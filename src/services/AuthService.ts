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

  async signInWithGoogle(): Promise<firebase.auth.UserCredential | null> {
    const cred = await this.auth.signInWithPopup(this.googleAuthProvider).catch(() => null)
    return cred
  }

  async signOut(): Promise<void> {
    await this.auth.signOut()
  }
}
