import { Injectable } from '@angular/core'
import { Picture, PictureService, Path } from './picture.service'
import { Subject } from 'rxjs'

type PenEvent = {
  x: number
  y: number
  color: string
  width: number
}

type PictureWithNullableId = Omit<Picture, 'id'> & { id: string | null }

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  picture: PictureWithNullableId | null = null
  private currentlyDrawingPath: Path | null = null
  private isErasing = false

  readonly onSave = new Subject<{ pictureId: string }>()

  constructor(private pictureService: PictureService) {}

  clean() {
    this.picture = null
    this.currentlyDrawingPath = null
  }

  init() {
    this.picture = { title: 'Untitled', paths: [], id: null }
  }

  async loadPicture(pictureId: string) {
    const picture = await this.pictureService.fetchPicture(pictureId)
    this.picture = picture
  }

  handlePenDown({ x, y, color, width }: PenEvent) {
    if (this.currentlyDrawingPath != null) {
      return
    }

    const { picture } = this
    if (picture != null) {
      const path: Path = { color, width, points: [{ x, y }] }
      picture.paths.push(path)
      this.currentlyDrawingPath = path
    }
  }

  handlePenMove({ x, y }: Pick<PenEvent, 'x' | 'y'>) {
    const { currentlyDrawingPath: path } = this
    if (path == null) return

    const len = path.points.length
    if (len != null) {
      const point = path.points[len - 1]
      if (point.x === x || point.y === y) {
        return
      }
    }

    path.points.push({ x, y })
  }

  handlePenUp() {
    const { currentlyDrawingPath, picture } = this
    if (currentlyDrawingPath != null) {
      this.currentlyDrawingPath = null
      if (picture != null) {
        this.pictureService.savePicture(picture).then((o) => {
          this.onSave.next(o)
        })
      }
    }
  }

  setTitle(title: string) {
    const { picture } = this
    if (picture != null) {
      picture.title = title
      this.pictureService.savePicture(picture).then((o) => {
        this.onSave.next(o)
      })
    }
  }

  handleEraserDown({ x, y }: { x: number; y: number }) {
    this.isErasing = true
    this.handleEraserMove({ x, y })
  }

  handleEraserMove({ x, y }: { x: number; y: number }) {
    if (!this.isErasing) {
      return
    }

    const { picture } = this
    if (picture == null) {
      return
    }

    const deletingPathIndices = [] as number[]
    for (const [i, path] of picture.paths.entries()) {
      for (const { x: x_, y: y_ } of path.points) {
        if (squaredDistance(x - x_, y - y_) <= 9) {
          deletingPathIndices.push(i)
        }
      }
    }

    picture.paths = picture.paths.filter((_, i) => !deletingPathIndices.includes(i))
    this.pictureService.savePicture(picture)
  }

  handleEraserUp() {}
}

function squaredDistance(dx: number, dy: number): number {
  return dx * dx + dy * dy
}
