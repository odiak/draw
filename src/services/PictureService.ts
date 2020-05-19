import firebase from 'firebase/app'
import memoizeOne from 'memoize-one'
import { AuthService, User } from './AuthService'
import { Variable } from '../utils/Variable'

export type Point = { x: number; y: number }
export type Path = { color: string; width: number; points: Point[]; id: string }

export type AccessibilityLevel = 'public' | 'protected' | 'private'

export type Picture = {
  title?: string
  ownerId?: string
  accessibilityLevel?: AccessibilityLevel
}

export type PictureWithId = Picture & {
  id: string
}

export type PathsUpdate = Partial<{
  addedPaths: Path[]
  removedPathIds: string[]
}>

export type Permission = {
  isOwner: boolean
  readable: boolean
  writable: boolean
  accessibilityLevel: AccessibilityLevel
}

export type WatchPictureOptions = {
  includesLocalChanges?: boolean
}

export class PictureService {
  static readonly instantiate = memoizeOne(() => new PictureService())

  private db = firebase.firestore()
  private picturesCollection = this.db.collection('pictures')

  private titleUpdateTick = new Map<string, { timerId: number }>()

  private existFlags = new Map<string, boolean>()

  private authService = AuthService.instantiate()

  updateTitle(pictureId: string, title: string) {
    const tick = this.titleUpdateTick.get(pictureId)
    if (tick != null) {
      clearTimeout(tick.timerId)
      this.titleUpdateTick.delete(pictureId)
    }

    const timerId = window.setTimeout(() => {
      this.updatePicture(pictureId, { title })
    }, 1500)
    this.titleUpdateTick.set(pictureId, { timerId })
  }

  async updatePicture(
    pictureId: string,
    update: Pick<Picture, 'ownerId' | 'title' | 'accessibilityLevel'>
  ) {
    if (this.existFlags.get(pictureId) === false) {
      const { value: currentUser } = this.authService.currentUser
      if (currentUser != null) {
        update.ownerId = currentUser.uid
      }
    }
    await this.picturesCollection.doc(pictureId).set(update, { merge: true })
  }

  addPaths(pictureId: string, pathsToAdd: Path[]) {
    const batch = this.db.batch()
    const pathsCollection = this.picturesCollection.doc(pictureId).collection('paths')

    for (const path of pathsToAdd) {
      batch.set(
        pathsCollection.doc(path.id),
        {
          ...encodePath(path),
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      )
    }
    batch.commit()

    this.setPictureOwnerIfNotExist(pictureId)
  }

  removePaths(pictureId: string, pathIdsToRemove: string[]) {
    const batch = this.db.batch()
    const pathsCollection = this.picturesCollection.doc(pictureId).collection('paths')

    for (const pathId of pathIdsToRemove) {
      batch.delete(pathsCollection.doc(pathId))
    }
    batch.commit()

    this.setPictureOwnerIfNotExist(pictureId)
  }

  watchPicture(
    pictureId: string,
    callback: (u: Picture | null) => void,
    options?: WatchPictureOptions
  ): () => void {
    const includesLocalChanges = options != null && options.includesLocalChanges === true

    const unwatch = this.picturesCollection.doc(pictureId).onSnapshot(
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites && !includesLocalChanges) return
        this.existFlags.set(pictureId, snapshot.exists)
        callback(snapshot.data() ?? null)
      },
      () => {
        callback({ accessibilityLevel: 'private' })
      }
    )

    return unwatch
  }

  watchPaths(pictureId: string, callback: (u: PathsUpdate) => void): () => void {
    const unwatch = this.picturesCollection
      .doc(pictureId)
      .collection('paths')
      .orderBy('timestamp')
      .onSnapshot((snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return

        const addedPaths: Path[] = []
        const removedPathIds: string[] = []

        for (const change of snapshot.docChanges()) {
          switch (change.type) {
            case 'added':
              addedPaths.push(decodePath(change.doc))
              break

            case 'removed':
              removedPathIds.push(change.doc.id)
              break
          }
        }

        callback({ addedPaths, removedPathIds })
      })

    return unwatch
  }

  watchPermission(pictureId: string, callback: (p: Permission) => void): () => void {
    const [pictureCallback, userCallback] = combine<Picture | null, User | null>(
      (picture, user) => {
        if (user == null) return

        callback(getPermission(picture, user))
      }
    )
    const unsubscribeP = this.watchPicture(pictureId, pictureCallback, {
      includesLocalChanges: true
    })
    const unsubscribeU = this.authService.currentUser.subscribe(userCallback)
    userCallback(this.authService.currentUser.value)

    return () => {
      unsubscribeP()
      unsubscribeU()
    }
  }

  private async setPictureOwnerIfNotExist(pictureId: string): Promise<void> {
    if (this.existFlags.get(pictureId)) return

    const { value: currentUser } = this.authService.currentUser
    if (currentUser == null) return

    const doc = this.picturesCollection.doc(pictureId)
    await doc.set({ ownerId: currentUser.uid }, { merge: true })
  }

  async fetchPictures(): Promise<Array<PictureWithId>> {
    const currentUser = await waitUntil(
      this.authService.currentUser,
      (u: User | null): u is User => u != null
    )

    const qs = await this.picturesCollection
      .where('ownerId', '==', currentUser.uid)
      .limit(100)
      .get()
    return qs.docs.map((ds) => ({ ...ds.data(), id: ds.id }))
  }
}

type EncodedPath = {
  color: string
  width: number
  points: number[]
}

function encodePath({ color, width, points }: Path): EncodedPath {
  const newPoints: number[] = []
  for (const { x, y } of points) {
    newPoints.push(x, y)
  }
  return { color, width, points: newPoints }
}

function decodePath(doc: any): Path {
  const rawPath = doc.data()
  const rawPoints = rawPath.points as number[]
  const length = rawPoints.length
  const points: Point[] = []
  for (let i = 0; i + 1 < length; i += 2) {
    points.push({ x: rawPoints[i], y: rawPoints[i + 1] })
  }
  return { points, width: rawPath.width, color: rawPath.color, id: doc.id }
}

function getPermission(picture: Picture | null, user: User): Permission {
  const accessibilityLevel = validateAccessibilityLevel(picture?.accessibilityLevel)

  if (picture == null || picture.ownerId === user.uid) {
    return {
      isOwner: true,
      readable: true,
      writable: true,
      accessibilityLevel
    }
  } else if (accessibilityLevel === 'public') {
    return {
      isOwner: false,
      readable: true,
      writable: true,
      accessibilityLevel
    }
  } else if (accessibilityLevel === 'protected') {
    return {
      isOwner: false,
      readable: true,
      writable: false,
      accessibilityLevel
    }
  } else {
    return {
      isOwner: false,
      readable: false,
      writable: false,
      accessibilityLevel
    }
  }
}

function validateAccessibilityLevel(accLevel: string | null | undefined): AccessibilityLevel {
  if (accLevel === 'protected' || accLevel === 'private') return accLevel
  return 'public'
}

function combine<T1, T2>(callback: (v1: T1, v2: T2) => void): [(v1: T1) => void, (v2: T2) => void] {
  let value1: T1
  let value2: T2
  let value1Initialized = false
  let value2Initialized = false

  const callback1 = (v1: T1) => {
    value1 = v1
    value1Initialized = true
    if (value2Initialized) {
      callback(value1, value2)
    }
  }
  const callback2 = (v2: T2) => {
    value2 = v2
    value2Initialized = true
    if (value1Initialized) {
      callback(value1, value2)
    }
  }
  return [callback1, callback2]
}

async function waitUntil<T, S extends T>(
  variable: Variable<T>,
  cond: (t: T) => t is S
): Promise<S> {
  const { value } = variable
  if (cond(value)) return value

  return new Promise((resolve) => {
    const unsubscribe = variable.subscribe((t) => {
      if (cond(t)) {
        resolve(t)
        unsubscribe()
      }
    })
  })
}
