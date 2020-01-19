import { memo } from '../utils/memo'
import io from 'socket.io-client'

export type Point = { x: number; y: number }
export type Path = { color: string; width: number; points: Point[]; id?: string }
export type Picture = {
  id: string
  title: string
  paths: Path[]
}

export class PictureService {
  static instantiate = memo(() => new PictureService())

  private socketIOClient: ReturnType<typeof io>

  constructor() {
    this.socketIOClient = io(SERVER_URL)
  }

  async fetchPicture(pictureId: string): Promise<Picture> {
    const res = await fetch(`${SERVER_URL}/pictures/${pictureId}`)
    return (await res.json()) as Picture
  }

  async savePicture(
    picture: Omit<Picture, 'id'> & { id: string | null }
  ): Promise<{ pictureId: string }> {
    return new Promise((resolve, reject) => {
      try {
        this.socketIOClient.emit('savePicture', picture, (pictureId: string) => {
          resolve({ pictureId })
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}
