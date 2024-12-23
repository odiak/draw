import '../firebase'
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
  getDoc,
  Bytes
} from 'firebase/firestore'
import { imageBaseUrl } from '../constants'
import { getAuth, User } from 'firebase/auth'
import { UserState, isNotSignedIn, isSignedIn } from '../hooks/useAuth'
import { httpsCallable } from 'firebase/functions'
import { getFunctions } from '../utils/firebase-functions'

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
  updatedAt?: Timestamp
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

type Unsubscribe = () => void

export class PictureService {
  static readonly instantiate = memo(() => new PictureService())

  private db = getFirestore()
  private picturesCollection = collection(this.db, 'pictures').withConverter(pictureConverter)

  private titleUpdateTick = new Map<string, { timerId: number }>()

  private existFlags = new Map<string, boolean>()

  private touchingPictureIds = new Set<string>()

  private pathsById(pictureId: string) {
    return collection(doc(this.picturesCollection, pictureId), 'paths').withConverter(pathConverter)
  }

  private pictureRefById(pictureId: string) {
    return doc(this.picturesCollection, pictureId)
  }

  updateTitle(pictureId: string, title: string, currentUser: UserState | undefined) {
    const tick = this.titleUpdateTick.get(pictureId)
    if (tick != null) {
      clearTimeout(tick.timerId)
      this.titleUpdateTick.delete(pictureId)
    }

    const timerId = window.setTimeout(() => {
      this.updatePicture(pictureId, currentUser, { title })
    }, 1500)
    this.titleUpdateTick.set(pictureId, { timerId })
  }

  async updatePicture(
    pictureId: string,
    currentUser: UserState | undefined,
    update: Partial<Omit<PictureWithId, 'id'>>
  ) {
    const now = Timestamp.now()
    const data = { ...update, updatedAt: now }

    // TODO: check permission before updating
    if (this.existFlags.get(pictureId) === false) {
      if (currentUser !== undefined && isSignedIn(currentUser)) {
        data.ownerId = currentUser.uid
        data.createdAt = now
      }
    }
    await setDoc(this.pictureRefById(pictureId), data, { merge: true })
  }

  addPaths(pictureId: string, pathsToAdd: Path[], currentUser: UserState | undefined) {
    const pathsCollection = this.pathsById(pictureId)

    batchHelper(this.db, (doOp) => {
      for (const path of pathsToAdd) {
        doOp((batch) => batch.set(doc(pathsCollection, path.id), path, { merge: true }))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId, currentUser)
    this.touchPicture(pictureId)
  }

  removePaths(pictureId: string, pathIdsToRemove: string[], currentUser: UserState | undefined) {
    const pathsCollection = collection(this.pictureRefById(pictureId), 'paths')

    batchHelper(this.db, (doOp) => {
      for (const pathId of pathIdsToRemove) {
        doOp((batch) => batch.delete(doc(pathsCollection, pathId)))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId, currentUser)
    this.touchPicture(pictureId)
  }

  updatePaths(
    pictureId: string,
    updates: Array<Partial<Path> & Pick<Path, 'id'>>,
    currentUser: UserState | undefined
  ) {
    const pathsCollection = collection(this.pictureRefById(pictureId), 'paths')

    batchHelper(this.db, (doOp) => {
      for (const { id, ...update } of updates) {
        doOp((batch) => batch.set(doc(pathsCollection, id), update, { merge: true }))
      }
    })

    this.setPictureOwnerIfNotExist(pictureId, currentUser)
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

  watchPermission(
    pictureId: string,
    currentUser: UserState | undefined,
    callback: (p: Permission) => void
  ): Unsubscribe {
    if (currentUser === undefined || isNotSignedIn(currentUser)) return () => {}

    let picture: PictureWithId | null = null
    let defaultAccLevel: AccessibilityLevel | undefined

    const onChange = () => {
      if (picture !== null && defaultAccLevel !== undefined && unsubscribe1 !== undefined) {
        unsubscribe1()
        unsubscribe1 = undefined
      }
      callback(getPermission(picture, currentUser, defaultAccLevel))
    }

    let unsubscribe1: Unsubscribe | undefined = onSnapshot(
      doc(collection(this.db, 'users'), currentUser.uid),
      (snapshot) => {
        defaultAccLevel = validateAccessibilityLevel(snapshot.data()?.defaultAccessibilityLevel)
        onChange()
      }
    )

    const unsubscribe2 = this.watchPicture(
      pictureId,
      (picture_) => {
        picture = picture_
        onChange()
      },
      { includesLocalChanges: true }
    )

    return () => {
      unsubscribe1?.()
      unsubscribe2()
    }
  }

  private async setPictureOwnerIfNotExist(
    pictureId: string,
    currentUser: UserState | undefined
  ): Promise<void> {
    if (this.existFlags.get(pictureId)) return

    if (currentUser === undefined || isNotSignedIn(currentUser)) return

    const initPicture = httpsCallable(getFunctions(), 'initPicture')
    await initPicture({ pictureId })
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
    if (this.touchingPictureIds.has(pictureId)) return

    this.touchingPictureIds.add(pictureId)
    setTimeout(async () => {
      await fetch(`${imageBaseUrl}/update/${pictureId}`, { method: 'POST' }).catch(() => undefined)
      this.touchingPictureIds.delete(pictureId)
    }, 1000)
  }

  async deletePicture(pictureId: string): Promise<boolean> {
    const { currentUser } = getAuth()
    if (currentUser === null) return false

    const func = httpsCallable<{ pictureId: string }, boolean>(getFunctions(), 'deletePicture')

    try {
      const res = await func({ pictureId })
      return res.data
    } catch (e: unknown) {
      console.error(e)
      return false
    }
  }
}

const pictureConverter: FirestoreDataConverter<PictureWithId> = {
  fromFirestore(doc: QueryDocumentSnapshot): PictureWithId {
    const { id } = doc
    const { title, ownerId, accessibilityLevel, createdAt, updatedAt } = doc.data()
    return {
      id,
      title: title ?? '',
      ownerId,
      accessibilityLevel: validateAccessibilityLevel(accessibilityLevel),
      createdAt,
      updatedAt
    }
  },

  toFirestore({ id: _id, ...restPicture }: PictureWithId): DocumentData {
    return restPicture
  }
}

const useBinaryDataForPoints = true // TODO: remove later
const pointsDataVersion = 1

const pathConverter: FirestoreDataConverter<Path | null> = {
  fromFirestore(doc: QueryDocumentSnapshot): Path | null {
    const rawPath = doc.data()
    const rawPoints = rawPath.points as number[] | Bytes
    if (
      (!Array.isArray(rawPoints) && !(rawPoints instanceof Bytes)) ||
      typeof rawPath.width !== 'number' ||
      typeof rawPath.color !== 'string'
    ) {
      return null
    }

    const points: Point[] = []
    if (rawPoints instanceof Bytes) {
      const bytes = rawPoints.toUint8Array()
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      const version = dataView.getUint32(0)
      switch (version) {
        case 1: {
          const length = (dataView.byteLength - 4) >> 3
          for (let i = 0; i < length; i++) {
            points.push({
              x: dataView.getFloat32(4 + i * 8),
              y: dataView.getFloat32(4 + i * 8 + 4)
            })
          }
          break
        }
        default:
          return null
      }
    } else {
      const length = rawPoints.length
      for (let i = 0; i + 1 < length; i += 2) {
        points.push({ x: rawPoints[i], y: rawPoints[i + 1] })
      }
    }
    return {
      points,
      width: rawPath.width,
      color: rawPath.color,
      id: doc.id,
      isBezier: !!rawPath.isBezier || rawPoints instanceof Bytes,
      timestamp: (rawPath.timestamp as Timestamp | null)?.toDate(),
      offsetX: rawPath.offsetX ?? 0,
      offsetY: rawPath.offsetY ?? 0
    }
  },

  toFirestore(path: WithFieldValue<Path | null>): DocumentData {
    if (path == null) return {}

    const { points, color, width, isBezier, timestamp, offsetX, offsetY } = path
    const data: DocumentData = {}
    if (points != null && Array.isArray(points)) {
      if (useBinaryDataForPoints && isBezier) {
        const buffer = new ArrayBuffer(4 + points.length * 8)
        const dataView = new DataView(buffer)
        dataView.setUint32(0, pointsDataVersion)
        for (let i = 0; i < points.length; i++) {
          const { x, y } = points[i] as Point
          dataView.setFloat32(4 + i * 8, x)
          dataView.setFloat32(4 + i * 8 + 4, y)
        }
        data.points = Bytes.fromUint8Array(new Uint8Array(buffer))
      } else {
        const newPoints: number[] = []
        for (const { x, y } of points as Point[]) {
          newPoints.push(x, y)
        }
        data.points = newPoints
      }
    }
    if (color != null) {
      data.color = color
    }
    if (width != null) {
      data.width = width
    }
    if (isBezier != null && !(useBinaryDataForPoints && isBezier)) {
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

function getPermission(
  picture: PictureWithId | null,
  user: User,
  defaultAccessibilityLevel?: AccessibilityLevel
): Permission {
  const accessibilityLevel = validateAccessibilityLevel(
    picture?.accessibilityLevel,
    defaultAccessibilityLevel
  )

  if (picture == null || picture.ownerId === user.uid) {
    return {
      isOwner: true,
      readable: true,
      writable: true,
      accessibilityLevel
    }
  }

  switch (accessibilityLevel) {
    case 'public':
      return {
        isOwner: false,
        readable: true,
        writable: true,
        accessibilityLevel
      }

    case 'protected':
      return {
        isOwner: false,
        readable: true,
        writable: false,
        accessibilityLevel
      }

    case 'private':
      return {
        isOwner: false,
        readable: false,
        writable: false,
        accessibilityLevel
      }
  }
}

function validateAccessibilityLevel(
  accLevel: string | null | undefined,
  defaultValue?: AccessibilityLevel
): AccessibilityLevel {
  if (accLevel === 'protected' || accLevel === 'private' || accLevel === 'public') return accLevel
  return defaultValue ?? 'public'
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
