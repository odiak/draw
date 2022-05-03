import '../firebase'
import { AuthService, User } from './AuthService'
import { memo } from '../utils/memo'
import {
  collection,
  doc,
  DocumentData,
  Firestore,
  FirestoreDataConverter,
  getDocs,
  getFirestore,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  where,
  WithFieldValue,
  writeBatch,
  WriteBatch,
  limit,
  orderBy,
  query,
  startAfter,
  onSnapshot,
  setDoc,
  getDoc
} from 'firebase/firestore'
import { imageBaseUrl } from '../constants'

export type Point = { x: number; y: number }
export type Path = {
  color: string
  width: number
  points: Point[]
  id: string
  isBezier: boolean
  timestamp?: Date
  offsetX: number
  offsetY: number
}

export type AccessibilityLevel = 'public' | 'protected' | 'private'

export type PictureWithId = {
  id: string
  title: string
  ownerId: string | null
  accessibilityLevel: AccessibilityLevel
  createdAt?: Timestamp
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

export type Anchor = Timestamp | undefined

export class PictureService {
  static readonly instantiate = memo(() => new PictureService())

  private db = getFirestore()
  private picturesCollection = collection(this.db, 'pictures').withConverter(pictureConverter)

  private titleUpdateTick = new Map<string, { timerId: number }>()

  private existFlags = new Map<string, boolean>()

  private authService = AuthService.instantiate()

  private touching: { pictureId: string } | undefined

  private pathsById(pictureId: string) {
    return collection(doc(this.picturesCollection, pictureId), 'paths').withConverter(pathConverter)
  }

  private pictureRefById(pictureId: string) {
    return doc(this.picturesCollection, pictureId)
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
          createdAt: Timestamp.now()
        }
      }
    }
    await setDoc(this.pictureRefById(pictureId), update, { merge: true })
  }

  addPaths(pictureId: string, pathsToAdd: Path[]) {
    const pathsCollection = this.pathsById(pictureId)

    batchHelper(this.db, (doOp) => {
      for (const path of pathsToAdd) {
        doOp((batch) => batch.set(doc(pathsCollection, path.id), path, { merge: true }))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId)
    this.touchPicture(pictureId)
  }

  removePaths(pictureId: string, pathIdsToRemove: string[]) {
    const pathsCollection = collection(this.pictureRefById(pictureId), 'paths')

    batchHelper(this.db, (doOp) => {
      for (const pathId of pathIdsToRemove) {
        doOp((batch) => batch.delete(doc(pathsCollection, pathId)))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId)
    this.touchPicture(pictureId)
  }

  updatePaths(pictureId: string, updates: Array<Partial<Path> & Pick<Path, 'id'>>) {
    const pathsCollection = collection(this.pictureRefById(pictureId), 'paths')

    batchHelper(this.db, (doOp) => {
      for (const { id, ...update } of updates) {
        doOp((batch) => batch.set(doc(pathsCollection, id), update, { merge: true }))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId)
    this.touchPicture(pictureId)
  }

  watchPicture(
    pictureId: string,
    callback: (u: PictureWithId | null) => void,
    options?: WatchPictureOptions
  ): () => void {
    const includesLocalChanges = options != null && options.includesLocalChanges === true

    const unwatch = onSnapshot(
      this.pictureRefById(pictureId),
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites && !includesLocalChanges) return
        this.existFlags.set(pictureId, snapshot.exists())
        callback(snapshot.data() ?? null)
      },
      () => {
        callback({ id: '', title: '', ownerId: null, accessibilityLevel: 'private' })
      }
    )

    return unwatch
  }

  async fetchPicture(pictureId: string): Promise<PictureWithId | null> {
    return (await getDoc(this.pictureRefById(pictureId))).data() ?? null
  }

  watchPaths(pictureId: string, callback: (u: PathsUpdate) => void): () => void {
    const unwatch = onSnapshot(
      query(this.pathsById(pictureId), orderBy('timestamp')),
      (snapshot) => {
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
      }
    )

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
    await setDoc(
      doc,
      {
        ownerId: currentUser.uid,
        createdAt: Timestamp.now()
      },
      { merge: true }
    )
  }

  async fetchPictures(currentUser: User, anchor?: Anchor): Promise<[Array<PictureWithId>, Anchor]> {
    const n = 50

    const q = query(
      this.picturesCollection,
      where('ownerId', '==', currentUser.uid),
      limit(n),
      orderBy('createdAt', 'desc'),
      ...(anchor ? [startAfter(anchor)] : [])
    )
    const qs = await getDocs(q)

    const pictures = qs.docs.map((ds) => ({ ...ds.data(), id: ds.id }))
    const nextAnchor = qs.docs[n - 1]?.data()?.createdAt

    return [pictures, nextAnchor]
  }

  private async touchPicture(pictureId: string) {
    if (this.touching?.pictureId === pictureId) return

    const touching = { pictureId }
    this.touching = touching
    setTimeout(async () => {
      await fetch(`${imageBaseUrl}/update/${pictureId}`, { method: 'POST' }).catch(() => undefined)
      if (this.touching === touching) {
        this.touching = undefined
      }
    }, 1000)
  }
}

const pictureConverter: FirestoreDataConverter<PictureWithId> = {
  fromFirestore(doc: QueryDocumentSnapshot): PictureWithId {
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

  toFirestore({ id: _id, ...restPicture }: PictureWithId): DocumentData {
    return restPicture
  }
}

const pathConverter: FirestoreDataConverter<Path | null> = {
  fromFirestore(doc: QueryDocumentSnapshot): Path | null {
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
      timestamp: (rawPath.timestamp as Timestamp | null)?.toDate(),
      offsetX: rawPath.offsetX ?? 0,
      offsetY: rawPath.offsetY ?? 0
    }
  },

  toFirestore(path: WithFieldValue<Path | null>): DocumentData {
    if (path == null) return {}

    const { points, color, width, isBezier, timestamp, offsetX, offsetY } = path
    const data: DocumentData = {}
    if (points != null) {
      const newPoints: number[] = []
      for (const { x, y } of points as Point[]) {
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
    if (timestamp instanceof Date) {
      data.timestamp = Timestamp.fromDate(timestamp)
    } else {
      data.timestamp = serverTimestamp()
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
  db: Firestore,
  callback: (f: (doOperation: (batch: WriteBatch) => void) => void) => void
): void {
  let batch = writeBatch(db)

  let i = 0
  callback((f) => {
    f(batch)
    i += 1
    if (i >= maxOperationsInBatch) {
      batch.commit()
      batch = writeBatch(db)
      i = 0
    }
  })
  if (i > 0) {
    batch.commit()
  }
}
