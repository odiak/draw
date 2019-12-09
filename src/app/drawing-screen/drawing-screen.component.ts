import { Component, OnInit, HostListener, OnDestroy } from '@angular/core'
import { Path, Point, PictureService } from '../picture.service'
import { Router, ActivatedRoute } from '@angular/router'
import { DrawingService } from '../drawing.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-drawing-screen',
  templateUrl: './drawing-screen.component.html',
  styleUrls: ['./drawing-screen.component.scss']
})
export class DrawingScreenComponent implements OnInit, OnDestroy {
  pictureId: string | null = null

  private subscription = new Subscription()

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private drawingService: DrawingService
  ) {}

  ngOnInit() {
    this.drawingService.clean()

    const pictureId = this.activatedRoute.snapshot.params.pictureId
    if (typeof pictureId === 'string') {
      this.pictureId = pictureId
      this.drawingService.loadPicture(pictureId)
    }

    this.subscription.add(
      this.drawingService.onSave.subscribe(({ pictureId }) => {
        if (pictureId !== this.pictureId) {
          this.router.navigateByUrl(`/p/${pictureId}`)
        }
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  get title() {
    const { picture } = this.drawingService
    return picture != null ? picture.title : ''
  }

  set title(title: string) {
    this.drawingService.setTitle(title)
  }

  get paths() {
    const { picture } = this.drawingService
    return picture != null ? picture.paths : []
  }

  onMouseDown(event: MouseEvent) {
    this.drawingService.handlePenDown({ color: '#000', width: 3, ...getXYFromMouseEvent(event) })
  }

  onMouseMove(event: MouseEvent) {
    this.drawingService.handlePenMove(getXYFromMouseEvent(event))
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUpGlobal(event: MouseEvent) {
    this.drawingService.handlePenUp()
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
}

function getXYFromMouseEvent(event: MouseEvent): Point {
  return { x: event.offsetX, y: event.offsetY }
}
