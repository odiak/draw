import { memo } from '../utils/memo'
import firebase from 'firebase/app'
import { Variable } from '../utils/Variable'

export class AuthService {
  static readonly instantiate = memo(() => new AuthService())

  private auth = firebase.auth()
  private googleAuthProvider = new firebase.auth.GoogleAuthProvider()

  readonly currentUser = new Variable<firebase.User | null>(null)

  constructor() {
    this.auth.useDeviceLanguage()

    this.auth.onAuthStateChanged((user) => {
      this.currentUser.next(user)
    })
  }

  async signInWithGoogle(): Promise<firebase.auth.UserCredential | null> {
    const cred = await this.auth.signInWithPopup(this.googleAuthProvider).catch((e) => {
      return null
    })
    return cred
  }

  async signOut(): Promise<void> {
    await this.auth.signOut()
  }
}
