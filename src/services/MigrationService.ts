import { memo } from '../utils/memo'
import { AuthService } from './AuthService'
import { localStorage } from '../utils/localStorage'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  where
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

const migrationTokenKey = 'KAKERU_MIGRATION_TOKEN'

type MigrateDataFunctionType = (data: { token: string }) => Promise<{ data: any }>

/**
 * A service class to migrate drawings of anonymous account to non-anonymous account.
 */
export class MigrationService {
  static readonly instantiate = memo(() => new MigrationService())

  private authService = AuthService.instantiate()
  private db = getFirestore()
  private migrationTokensCollection = collection(this.db, 'migrationTokens')
  private picturesCollection = collection(this.db, 'pictures')
  private migrateDataFunction: MigrateDataFunctionType = httpsCallable(
    getFunctions(undefined, 'asia-northeast1'),
    'migrateData'
  )

  private readonly migrationFinishedCallbacks = new Set<() => void>()

  async registerMigrationToken(): Promise<void> {
    const { value: currentUser } = this.authService.currentUser
    if (currentUser == null || !currentUser.isAnonymous) return

    // check if there are some drawings
    const qs = await getDocs(
      query(
        this.picturesCollection,
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

    await setDoc(doc(this.migrationTokensCollection, token), { uid: currentUser.uid })
  }

  async migrateData(): Promise<void> {
    const token = localStorage.getItem(migrationTokenKey)
    if (token == null) return

    await this.migrateDataFunction({ token })

    localStorage.removeItem(migrationTokenKey)

    this.runMigrationFinishedCallbacks()
  }

  /**
   * Register callback which will be called when data migration should be executed
   */
  addMigrationReadyCallback(callback: () => void): () => void {
    const { value: currentUser } = this.authService.currentUser

    if (
      currentUser != null &&
      !currentUser.isAnonymous &&
      localStorage.getItem(migrationTokenKey) != null
    ) {
      setTimeout(callback, 0)
    }

    return this.authService.currentUser.subscribe((user) => {
      if (user != null && !user.isAnonymous && localStorage.getItem(migrationTokenKey) != null) {
        callback()
      }
    })
  }

  addMigrationFinishedCallback(callback: () => void): () => void {
    this.migrationFinishedCallbacks.add(callback)

    return () => {
      this.migrationFinishedCallbacks.delete(callback)
    }
  }

  private runMigrationFinishedCallbacks(): void {
    for (const callback of this.migrationFinishedCallbacks) {
      callback()
    }
  }
}
