import firebase from 'firebase/app'
import { AuthService, User } from './AuthService'
import { memo } from '../utils/memo'

export type Point = { x: number; y: number }
export type Path = {
  color: string
  width: number
  points: Point[]
  id: string
  isBezier: boolean
  timestamp?: firebase.firestore.Timestamp
  offsetX: number
  offsetY: number
}

export type AccessibilityLevel = 'public' | 'protected' | 'private'

export type PictureWithId = {
  id: string
  title: string
  ownerId: string | null
  accessibilityLevel: AccessibilityLevel
  createdAt?: firebase.firestore.Timestamp
}

export type PathsUpdate = Partial<{
  addedPaths: Path[]
  removedPathIds: string[]
  modifiedPaths: Path[]
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

export type Anchor = firebase.firestore.Timestamp | undefined

export class PictureService {
  static readonly instantiate = memo(() => new PictureService())

  private db = firebase.firestore()
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
          createdAt: firebase.firestore.Timestamp.now()
        }
      }
    }
    await this.pictureRefById(pictureId).set(update, { merge: true })
  }

  addPaths(pictureId: string, pathsToAdd: Path[]) {
    const pathsCollection = this.pathsById(pictureId)

    batchHelper(this.db, (doOp) => {
      for (const path of pathsToAdd) {
        doOp((batch) => batch.set(pathsCollection.doc(path.id), path, { merge: true }))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId)
  }

  removePaths(pictureId: string, pathIdsToRemove: string[]) {
    const pathsCollection = this.pictureRefById(pictureId).collection('paths')

    batchHelper(this.db, (doOp) => {
      for (const pathId of pathIdsToRemove) {
        doOp((batch) => batch.delete(pathsCollection.doc(pathId)))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId)
  }

  updatePaths(pictureId: string, updates: Array<Partial<Path> & Pick<Path, 'id'>>) {
    const pathsCollection = this.pictureRefById(pictureId).collection('paths')

    batchHelper(this.db, (doOp) => {
      for (const { id, ...update } of updates) {
        doOp((batch) => batch.set(pathsCollection.doc(id), update, { merge: true }))
      }
    })

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
        const modifiedPaths: Path[] = []

        for (const change of snapshot.docChanges()) {
          switch (change.type) {
            case 'added': {
              const path = change.doc.data()
              if (path != null) addedPaths.push(path)
              break
            }

            case 'removed':
              removedPathIds.push(change.doc.id)
              break

            case 'modified': {
              const path = change.doc.data()
              if (path != null) modifiedPaths.push(path)
              break
            }
          }
        }

        callback({ addedPaths, removedPathIds, modifiedPaths })
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
        createdAt: firebase.firestore.Timestamp.now()
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

const pictureConverter: firebase.firestore.FirestoreDataConverter<PictureWithId> = {
  fromFirestore(doc: firebase.firestore.QueryDocumentSnapshot): PictureWithId {
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

  toFirestore({ id: _id, ...restPicture }: PictureWithId): firebase.firestore.DocumentData {
    return restPicture
  }
}

const pathConverter: firebase.firestore.FirestoreDataConverter<Path | null> = {
  fromFirestore(doc: firebase.firestore.QueryDocumentSnapshot): Path | null {
    const rawPath = doc.data()
    const rawPoints = rawPath.points as number[]
    if (
      !Array.isArray(rawPoints) ||
      typeof rawPath.width !== 'number' ||
      typeof rawPath.color !== 'string'
    ) {
      return null
    }

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
      timestamp: rawPath.timestamp,
      offsetX: rawPath.offsetX ?? 0,
      offsetY: rawPath.offsetY ?? 0
    }
  },

  toFirestore(path: Partial<Path> | null): firebase.firestore.DocumentData {
    if (path == null) return {}

    const { points, color, width, isBezier, timestamp, offsetX, offsetY } = path
    const data: firebase.firestore.DocumentData = {
      timestamp: timestamp ?? firebase.firestore.FieldValue.serverTimestamp()
    }
    if (points != null) {
      const newPoints: number[] = []
      for (const { x, y } of points) {
        newPoints.push(x, y)
      }
      data.points = newPoints
    }
    if (color != null) {
      data.color = color
    }
    if (width != null) {
      data.width = width
    }
    if (isBezier != null) {
      data.isBezier = isBezier
    }
    if (offsetX != null && offsetX !== 0) {
      data.offsetX = offsetX
    }
    if (offsetY != null && offsetY !== 0) {
      data.offsetY = offsetY
    }
    return data
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

const maxOperationsInBatch = 500

function batchHelper(
  db: firebase.firestore.Firestore,
  callback: (f: (doOperation: (batch: firebase.firestore.WriteBatch) => void) => void) => void
): void {
  const batch = db.batch()
  let i = 0
  callback((f) => {
    f(batch)
    i += 1
    if (i >= maxOperationsInBatch) {
      batch.commit()
      i = 0
    }
  })
  if (i > 0) {
    batch.commit()
  }
}
