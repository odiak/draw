import { firestore } from 'firebase/app'
import { AuthService, User } from './AuthService'
import { memo } from '../utils/memo'

export type Point = { x: number; y: number }
export type Path = {
  color: string
  width: number
  points: Point[]
  id: string
  isBezier: boolean
  timestamp?: firestore.Timestamp
}

export type AccessibilityLevel = 'public' | 'protected' | 'private'

export type PictureWithId = {
  id: string
  title: string
  ownerId: string | null
  accessibilityLevel: AccessibilityLevel
  createdAt?: firestore.Timestamp
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

export type Anchor = firestore.Timestamp | undefined

export class PictureService {
  static readonly instantiate = memo(() => new PictureService())

  private db = firestore()
  private picturesCollection = this.db.collection('pictures').withConverter(pictureConverter)

  private titleUpdateTick = new Map<string, { timerId: number }>()

  private existFlags = new Map<string, boolean>()

  private authService = AuthService.instantiate()

  private pathsById(pictureId: string) {
    return this.picturesCollection.doc(pictureId).collection('paths').withConverter(pathConverter)
  }

  private pictureRefById(pictureId: string) {
    return this.picturesCollection.doc(pictureId)
  }

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
    update: Partial<Pick<PictureWithId, 'ownerId' | 'title' | 'accessibilityLevel' | 'createdAt'>>
  ) {
    if (this.existFlags.get(pictureId) === false) {
      const { value: currentUser } = this.authService.currentUser
      if (currentUser != null) {
        update = {
          ...update,
          ownerId: currentUser.uid,
          createdAt: firestore.Timestamp.now()
        }
      }
    }
    await this.pictureRefById(pictureId).set(update, { merge: true })
  }

  addPaths(pictureId: string, pathsToAdd: Path[]) {
    const batch = this.db.batch()
    const pathsCollection = this.pathsById(pictureId)

    for (const path of pathsToAdd) {
      batch.set(pathsCollection.doc(path.id), path, { merge: true })
    }
    batch.commit()

    this.setPictureOwnerIfNotExist(pictureId)
  }

  removePaths(pictureId: string, pathIdsToRemove: string[]) {
    const batch = this.db.batch()
    const pathsCollection = this.pictureRefById(pictureId).collection('paths')

    for (const pathId of pathIdsToRemove) {
      batch.delete(pathsCollection.doc(pathId))
    }
    batch.commit()

    this.setPictureOwnerIfNotExist(pictureId)
  }

  watchPicture(
    pictureId: string,
    callback: (u: PictureWithId | null) => void,
    options?: WatchPictureOptions
  ): () => void {
    const includesLocalChanges = options != null && options.includesLocalChanges === true

    const unwatch = this.pictureRefById(pictureId).onSnapshot(
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites && !includesLocalChanges) return
        this.existFlags.set(pictureId, snapshot.exists)
        callback(snapshot.data() ?? null)
      },
      () => {
        callback({ id: '', title: '', ownerId: null, accessibilityLevel: 'private' })
      }
    )

    return unwatch
  }

  watchPaths(pictureId: string, callback: (u: PathsUpdate) => void): () => void {
    const unwatch = this.pathsById(pictureId)
      .orderBy('timestamp')
      .onSnapshot((snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return

        const addedPaths: Path[] = []
        const removedPathIds: string[] = []

        for (const change of snapshot.docChanges()) {
          switch (change.type) {
            case 'added':
              addedPaths.push(change.doc.data())
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
    const [pictureCallback, userCallback] = combine<PictureWithId | null, User | null>(
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

    const doc = this.pictureRefById(pictureId)
    await doc.set(
      {
        ownerId: currentUser.uid,
        createdAt: firestore.Timestamp.now()
      },
      { merge: true }
    )
  }

  async fetchPictures(currentUser: User, anchor?: Anchor): Promise<[Array<PictureWithId>, Anchor]> {
    const limit = 50

    let q = this.picturesCollection
      .where('ownerId', '==', currentUser.uid)
      .limit(limit)
      .orderBy('createdAt', 'desc')
    if (anchor != null) {
      q = q.startAfter(anchor)
    }
    const qs = await q.get()
    return [
      qs.docs.map((ds) => ({ ...ds.data(), id: ds.id })),
      qs.docs[limit - 1]?.data()?.createdAt
    ]
  }
}

const pictureConverter: firestore.FirestoreDataConverter<PictureWithId> = {
  fromFirestore(doc: firestore.QueryDocumentSnapshot): PictureWithId {
    const { id } = doc
    const { title, ownerId, accessibilityLevel, createdAt } = doc.data()
    return {
      id,
      title: title ?? '',
      ownerId,
      accessibilityLevel: validateAccessibilityLevel(accessibilityLevel),
      createdAt
    }
  },

  toFirestore({ id: _id, ...restPicture }: PictureWithId): firestore.DocumentData {
    return restPicture
  }
}

const pathConverter: firestore.FirestoreDataConverter<Path> = {
  fromFirestore(doc: firestore.QueryDocumentSnapshot): Path {
    const rawPath = doc.data()
    const rawPoints = rawPath.points as number[]
    const length = rawPoints.length
    const points: Point[] = []
    for (let i = 0; i + 1 < length; i += 2) {
      points.push({ x: rawPoints[i], y: rawPoints[i + 1] })
    }
    return {
      points,
      width: rawPath.width,
      color: rawPath.color,
      id: doc.id,
      isBezier: !!rawPath.isBezier,
      timestamp: rawPath.timestamp
    }
  },

  toFirestore({ points, color, width, isBezier, timestamp }: Path): firestore.DocumentData {
    const newPoints: number[] = []
    for (const { x, y } of points) {
      newPoints.push(x, y)
    }
    return {
      color,
      width,
      points: newPoints,
      isBezier,
      timestamp: timestamp ?? firestore.FieldValue.serverTimestamp()
    }
  }
}

function getPermission(picture: PictureWithId | null, user: User): Permission {
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
