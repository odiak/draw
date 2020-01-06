import { Picture, PictureService, Path } from './PictureService'
import { Subject } from '../utils/Subject'
import { memo } from '../utils/memo'

type PenEvent = {
  x: number
  y: number
  color: string
  width: number
}

type PictureWithNullableId = Omit<Picture, 'id'> & { id: string | null }

export class DrawingService {
  static instantiate = memo(() => new DrawingService())

  pictureService = PictureService.instantiate()

  picture: PictureWithNullableId | null = null
  private currentlyDrawingPath: Path | null = null
  private isErasing = false

  readonly onSave = new Subject<{ pictureId: string }>()

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
    if (len !== 0) {
      const lastPoint = path.points[len - 1]
      if (lastPoint.x === x || lastPoint.y === y) {
        return
      }
    }

    path.points.push({ x, y })

    const picture = this.picture!
    picture.paths = picture.paths.slice()
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

  handleEraserUp() {
    if (!this.isErasing) {
      return
    }

    this.isErasing = false
  }
}

function squaredDistance(dx: number, dy: number): number {
  return dx * dx + dy * dy
}
