import { Component, OnInit, HostListener } from '@angular/core'
import { Path, Point, PictureService } from '../picture.service'
import { Router, ActivatedRoute } from '@angular/router'

@Component({
  selector: 'app-drawing-screen',
  templateUrl: './drawing-screen.component.html',
  styleUrls: ['./drawing-screen.component.scss']
})
export class DrawingScreenComponent implements OnInit {
  paths: Path[] = []
  title = 'untitled'
  pictureId: string | null = null

  currentDrawingPath: Path | null = null

  constructor(
    private pictureService: PictureService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    const pictureId = this.activatedRoute.snapshot.params.pictureId
    if (typeof pictureId === 'string') {
      this.pictureId = pictureId
      ;(async () => {
        const { title, paths } = await this.pictureService.fetchPicture(pictureId)
        this.title = title
        this.paths = paths
      })()
    }
  }

  onMouseDown(event: MouseEvent) {
    this.currentDrawingPath = { color: '#000', width: 3, points: [getXYFromMouseEvent(event)] }
  }
  onMouseMove(event: MouseEvent) {
    const { currentDrawingPath } = this
    if (currentDrawingPath != null) {
      const xy = getXYFromMouseEvent(event)
      const { x, y } = xy
      const lastPoint = last(currentDrawingPath.points)
      if (x !== lastPoint.x && y !== lastPoint.y) {
        currentDrawingPath.points.push(xy)
      }
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUpGlobal(event: MouseEvent) {
    const { currentDrawingPath } = this
    if (currentDrawingPath != null) {
      this.currentDrawingPath = null
      this.paths.push(currentDrawingPath)
    }
  }

  getPathDescriptor(path: Path): string {
    return path.points
      .map(({ x, y }, i) => {
        if (i === 0) {
          return `M ${x},${y}`
        } else {
          return `L ${x},${y}`
        }
      })
      .join(' ')
  }

  async savePicture() {
    const { pictureId } = await this.pictureService.savePicture({
      id: this.pictureId,
      title: this.title,
      paths: this.paths
    })
    if (pictureId !== this.pictureId) {
      this.router.navigateByUrl(`/p/${pictureId}`)
    }
  }
}

function getXYFromMouseEvent(event: MouseEvent): Point {
  return { x: event.offsetX, y: event.offsetY }
}

function last<T>(array: Array<T>): T {
  return array[array.length - 1]
}
