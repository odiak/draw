import { memo } from '../utils/memo'
import firebase from 'firebase/app'

export type Point = { x: number; y: number }
export type Path = { color: string; width: number; points: Point[]; id: string }
export type Picture = {
  id: string
  title?: string
  paths?: Path[]
}

export type PictureUpdate = Partial<{
  title: string
  pathsToAdd: Path[]
  pathIdsToRemove: string[]
}>

export class PictureService {
  static instantiate = memo(() => new PictureService())

  private db = firebase.firestore()
  private picturesCollection = this.db.collection('pictures')

  private titleUpdateTick: { pictureId: string; timerId: number } | null = null

  async fetchPicture(pictureId: string): Promise<Picture | null> {
    let title: string | undefined
    const picRef = this.picturesCollection.doc(pictureId)
    const pic = await picRef.get()
    if (pic.exists) {
      title = (pic.data() as { title: string }).title
    }

    const pathsSnapshot = await picRef
      .collection('paths')
      .orderBy('timestamp')
      .get()
    const paths = pathsSnapshot.docs.map(decodePath)

    return { id: pictureId, paths, title }
  }

  setTitle(pictureId: string, title: string) {
    const { titleUpdateTick } = this
    if (titleUpdateTick != null && titleUpdateTick.pictureId === pictureId) {
      clearTimeout(titleUpdateTick.timerId)
    }

    const timerId = window.setTimeout(() => {
      this.picturesCollection.doc(pictureId).set({ title }, { merge: true })
    }, 1500)
    this.titleUpdateTick = { pictureId, timerId }
  }

  addAndRemovePaths(
    pictureId: string,
    pathsToAdd: Path[] | null,
    pathIdsToRemove: string[] | null
  ) {
    const batch = this.db.batch()
    const pathsCollection = this.picturesCollection.doc(pictureId).collection('paths')

    if (pathsToAdd != null) {
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
    }
    if (pathIdsToRemove != null) {
      for (const pathId of pathIdsToRemove) {
        batch.delete(pathsCollection.doc(pathId))
      }
    }
    batch.commit()
  }

  watchPicture(pictureId: string, onUpdate: (update: PictureUpdate) => void): () => void {
    const docRef = this.picturesCollection.doc(pictureId)
    const unwatchPic = docRef.onSnapshot((snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return
      const data = snapshot.data()
      onUpdate((data || {}) as { title?: string })
    })

    const unwatchPaths = docRef
      .collection('paths')
      .orderBy('timestamp')
      .onSnapshot((snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return

        const pathsToAdd: Path[] = []
        const pathIdsToRemove: string[] = []

        for (const change of snapshot.docChanges()) {
          switch (change.type) {
            case 'added':
              pathsToAdd.push(decodePath(change.doc))
              break

            case 'removed':
              pathIdsToRemove.push(change.doc.id)
              break
          }
        }

        onUpdate({ pathsToAdd, pathIdsToRemove })
      })

    return () => {
      unwatchPic()
      unwatchPaths()
    }
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
