import firebase from 'firebase/app'
import memoizeOne from 'memoize-one'
import { Variable } from '../utils/Variable'
import { Subject } from '../utils/Subject'
import { shallowEqual } from '../utils/shallowEqual'
import { AuthService } from './AuthService'

export type Point = { x: number; y: number }
export type Path = { color: string; width: number; points: Point[]; id: string }
export type Picture = {
  id: string
  title?: string
  paths?: Path[]
}

export type PictureUpdate = Partial<{
  title: string
}>

export type PathsUpdate = Partial<{
  addedPaths: Path[]
  removedPathIds: string[]
}>

export type PictureMetaData = {
  exists: boolean
  isOwner: boolean
  readable: boolean
  writable: boolean
}

export class PictureService {
  static readonly instantiate = memoizeOne((pictureId: string) => new PictureService(pictureId))

  private db = firebase.firestore()
  private picturesCollection = this.db.collection('pictures')
  private pictureRef = this.picturesCollection.doc(this.pictureId)

  private titleUpdateTick: { timerId: number } | null = null

  readonly metaData = new Variable<PictureMetaData | null>(null)
  readonly onChangePicture = new Subject<PictureUpdate>()
  readonly onChangePaths = new Subject<PathsUpdate>()

  private deactivationCallbacks: Array<() => void> = []

  private authService = AuthService.instantiate()

  constructor(public readonly pictureId: string) {
    this.activate()
  }

  private async activate() {
    const unwatchPicture = this.watchPicture()
    const unwatchPaths = this.watchPaths()
    this.deactivationCallbacks.push(unwatchPicture, unwatchPaths)
  }

  deactivate() {
    const { deactivationCallbacks } = this
    if (deactivationCallbacks != null) {
      for (const f of deactivationCallbacks) f()
      this.deactivationCallbacks = []
    }
  }

  updatePicture(update: Partial<{ title: string }>) {
    const { titleUpdateTick } = this
    if (titleUpdateTick != null) {
      clearTimeout(titleUpdateTick.timerId)
    }

    const timerId = window.setTimeout(() => {
      this.pictureRef.set(update, { merge: true })
    }, 1500)
    this.titleUpdateTick = { timerId }
  }

  addPaths(pathsToAdd: Path[]) {
    const batch = this.db.batch()
    const pathsCollection = this.pictureRef.collection('paths')

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

    this.setPictureOwnerIfNotExist()
  }

  removePaths(pathIdsToRemove: string[]) {
    const batch = this.db.batch()
    const pathsCollection = this.pictureRef.collection('paths')

    for (const pathId of pathIdsToRemove) {
      batch.delete(pathsCollection.doc(pathId))
    }
    batch.commit()

    this.setPictureOwnerIfNotExist()
  }

  private watchPicture(): () => void {
    const unwatch = this.pictureRef.onSnapshot((snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return
      const data = snapshot.data()
      this.onChangePicture.next((data || {}) as { title?: string })

      let newMetaData: PictureMetaData
      if (data == null) {
        newMetaData = {
          exists: false,
          isOwner: false,
          writable: true,
          readable: true
        }
      } else {
        newMetaData = {
          exists: true,
          isOwner: false,
          writable: true,
          readable: true
        }
      }
      if (!shallowEqual(this.metaData.value, newMetaData)) {
        this.metaData.next(newMetaData)
      }
    })

    return unwatch
  }

  private watchPaths(): () => void {
    const unwatch = this.pictureRef
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

        this.onChangePaths.next({ addedPaths, removedPathIds })
      })

    return unwatch
  }

  private async setPictureOwnerIfNotExist(): Promise<void> {
    const { value: metaData } = this.metaData
    if (metaData == null || metaData.exists) return

    const { value: currentUser } = this.authService.currentUser
    if (currentUser == null) return

    await this.pictureRef.set({ ownerId: currentUser.uid }, { merge: true })
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
