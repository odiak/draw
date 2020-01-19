import { memo } from '../utils/memo'
import io from 'socket.io-client'

export type Point = { x: number; y: number }
export type Path = { color: string; width: number; points: Point[]; id: string }
export type Picture = {
  id: string
  title?: string
  paths?: Path[]
}

export type PictureUpdate = { pictureId: string } & Partial<{
  title: string
  pathsToAdd: Path[]
  pathIdsToRemove: string[]
}>

export class PictureService {
  static instantiate = memo(() => new PictureService())

  private socketIOClient: ReturnType<typeof io>

  constructor() {
    this.socketIOClient = io(SERVER_URL)
  }

  async fetchPicture(pictureId: string): Promise<Picture | null> {
    const res = await fetch(`${SERVER_URL}/pictures/${pictureId}`)
    if (res.status === 404) {
      return null
    }
    return (await res.json()) as Picture
  }

  setTitle(pictureId: string, title: string) {
    this.socketIOClient.emit('updatePicture', { pictureId, title })
  }

  addAndRemovePaths(
    pictureId: string,
    pathsToAdd: Path[] | null,
    pathIdsToRemove: string[] | null
  ) {
    this.socketIOClient.emit('updatePicture', { pictureId, pathsToAdd, pathIdsToRemove })
  }

  watchPicture(pictureId: string, onUpdate: (update: PictureUpdate) => void) {
    this.socketIOClient.emit('watchPicture', { pictureId })
    this.socketIOClient.on('pictureUpdated', onUpdate)
  }

  unwatchPicture(pictureId: string) {
    this.socketIOClient.emit('unwatchPicture', { pictureId })
    this.socketIOClient.off('pictureUpdated')
  }
}
