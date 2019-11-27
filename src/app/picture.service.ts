import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment'
import { HttpClient } from '@angular/common/http'
import io from 'socket.io-client'

export type Point = { x: number; y: number }
export type Path = { color: string; width: number; points: Point[] }
export type Picture = {
  pictureId: string
  title: string
  paths: Path[]
}

@Injectable({
  providedIn: 'root'
})
export class PictureService {
  private socketIOClient: ReturnType<typeof io>

  constructor(private http: HttpClient) {
    this.socketIOClient = io(`${environment.SERVER_URL}`)
  }

  async fetchPicture(pictureId: string): Promise<Picture> {
    const res = await this.http
      .get(`${environment.SERVER_URL}/pictures/${pictureId}`, { observe: 'body' })
      .toPromise()
    return res as Picture
  }

  async savePicture(picture: Omit<Picture, 'pictureId'>): Promise<{ pictureId: string }> {
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
