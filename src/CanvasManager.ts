import { Tool } from './types/Tool'
import { Path, PictureService, Point } from './services/PictureService'
import { generateId } from './utils/generateId'
import { Subject } from './utils/Subject'
import { Variable } from './utils/Variable'

export class CanvasManager {
  private canvasElement: HTMLCanvasElement | null = null
  private renderingContext: CanvasRenderingContext2D | null = null
  private dpr = 1.0

  private offsetLeft = 0
  private offsetTop = 0

  private width = 0
  private height = 0

  // sizes in physical pixel
  private widthPP = 0
  private heightPP = 0

  readonly tool = new Variable<Tool>('pen')
  readonly palmRejection = new Variable(false)

  private paths: Path[] = []
  private drawingPath: Path | null = null
  private erasingPathIds: Set<string> | null = null

  private pictureService = PictureService.instantiate()

  private scrollLeft = 0
  private scrollTop = 0
  private bufferedScrollLeft = 0
  private bufferedScrollTop = 0

  private tickingDraw = false
  private tickingScroll = false
  private tickingResize = false

  private prevX = 0
  private prevY = 0
  private handScrollingByMouse = false

  private canvasCleanUpHandler: (() => void) | null = null

  readonly onPathsAdded = new Subject<Path[]>()
  readonly onPathsRemoved = new Subject<string[]>()

  readonly scale = new Variable(1.0)

  constructor(private pictureId: string) {
    this.scale.subscribe((scale, prevScale) => {
      const r = scale / prevScale
      const w2 = this.width / 2
      const h2 = this.height / 2
      this.scrollLeft = this.bufferedScrollLeft = w2 * (r - 1) + r * this.scrollLeft
      this.scrollTop = this.bufferedScrollTop = h2 * (r - 1) + r * this.scrollTop
      this.tickDraw()
    })
  }

  setCanvasElement(elem: HTMLCanvasElement) {
    if (elem === this.canvasElement) return

    const { canvasCleanUpHandler } = this
    if (canvasCleanUpHandler != null) {
      canvasCleanUpHandler()
    }

    this.canvasElement = elem
    this.renderingContext = elem.getContext('2d')
    this.dpr = devicePixelRatio
    this.handleResize()

    const unsubscribers = [
      listen(window, 'resize', this.handleWindowResize.bind(this)),
      listen(elem, 'wheel', this.handleWheel.bind(this)),
      listen(elem, 'mousedown', this.handleMouseDown.bind(this)),
      listen(elem, 'mousemove', this.handleMouseMove.bind(this)),
      listen(document.body, 'mouseup', this.handleGlobalMouseUp.bind(this)),
      listen(elem, 'touchstart', this.handleTouchStart.bind(this), { passive: true }),
      listen(elem, 'touchmove', this.handleTouchMove.bind(this), { passive: true }),
      listen(elem, 'touchend', this.handleTouchEnd.bind(this), { passive: true })
    ]

    this.canvasCleanUpHandler = () => {
      for (const f of unsubscribers) {
        f()
      }
    }
  }

  addPaths(pathsToAdd: Path[]) {
    this.paths = addPaths(this.paths, pathsToAdd)
    this.tickDraw()
  }

  removePathsById(pathIdsToRemove: string[]) {
    this.paths = removePathsByIds(this.paths, pathIdsToRemove)
    this.tickDraw()
  }

  zoomIn() {
    this.scale.update((s) => s * 1.1)
  }

  zoomOut() {
    this.scale.update((s) => s / 1.1)
  }

  private handleResize() {
    const ce = this.canvasElement
    if (ce == null) return

    const rect = ce.getBoundingClientRect()
    this.offsetLeft = rect.left
    this.offsetTop = rect.top
    this.width = rect.width
    this.height = rect.height
    this.widthPP = rect.width * this.dpr
    this.heightPP = rect.height * this.dpr
    ce.width = this.widthPP
    ce.height = this.heightPP

    this.draw()
  }

  private handleWindowResize() {
    if (this.tickingResize) return

    this.tickingResize = true
    setTimeout(() => {
      this.handleResize()
      this.tickingResize = false
    }, 300)
  }

  private updateOffset() {
    const ce = this.canvasElement
    if (ce == null) return
    const rect = ce.getBoundingClientRect()
    this.offsetLeft = rect.left
    this.offsetTop = rect.top
  }

  private getPointFromMouseEvent(event: MouseEvent, ignoreScroll: boolean = false): Point {
    let x = event.clientX - this.offsetLeft
    let y = event.clientY - this.offsetTop

    if (!ignoreScroll) {
      const scale = this.scale.value
      x = (x + this.scrollLeft) / scale
      y = (y + this.scrollTop) / scale
    }

    return { x, y }
  }

  private getTouch(event: TouchEvent, dontCareTouchType: boolean): Touch | null {
    const touches = event.changedTouches

    if (!this.palmRejection.value || dontCareTouchType) {
      return touches[0] || null
    }

    for (const touch of Array.from(touches)) {
      if (touch.touchType === 'stylus') {
        return touch
      }
    }
    return null
  }

  private getPointFromTouchEvent(
    event: TouchEvent,
    ignoreScrollAndTouchType: boolean = false
  ): Point | null {
    const touch = this.getTouch(event, ignoreScrollAndTouchType)
    if (touch == null) return null

    let x = touch.clientX - this.offsetLeft
    let y = touch.clientY - this.offsetTop

    if (!ignoreScrollAndTouchType) {
      const scale = this.scale.value
      x = (x + this.scrollLeft) / scale
      y = (y + this.scrollTop) / scale
    }
    return { x, y }
  }

  private handleMouseDown(event: MouseEvent) {
    this.updateOffset()

    switch (this.tool.value) {
      case 'pen':
        this.drawingPath = {
          id: generateId(),
          color: '#000',
          width: 3,
          points: [this.getPointFromMouseEvent(event)]
        }
        break

      case 'eraser': {
        const p = this.getPointFromMouseEvent(event)
        this.erasingPathIds = new Set(erase(this.paths, p))
        this.tickDraw()
        break
      }

      case 'hand': {
        const { x, y } = this.getPointFromMouseEvent(event, true)
        this.prevX = x
        this.prevY = y
        this.handScrollingByMouse = true
        break
      }
    }
  }

  private handleMouseMove(event: MouseEvent) {
    switch (this.tool.value) {
      case 'pen': {
        const { drawingPath } = this
        if (drawingPath != null) {
          pushPoint(drawingPath.points, this.getPointFromMouseEvent(event))
          this.tickDraw()
        }
        break
      }

      case 'eraser': {
        const { erasingPathIds } = this
        if (erasingPathIds != null) {
          const p = this.getPointFromMouseEvent(event)
          addToSet(erasingPathIds, erase(this.paths, p))
          this.tickDraw()
        }
        break
      }

      case 'hand': {
        if (this.handScrollingByMouse) {
          const { x, y } = this.getPointFromMouseEvent(event, true)
          this.bufferedScrollLeft += this.prevX - x
          this.bufferedScrollTop += this.prevY - y
          this.prevX = x
          this.prevY = y
          this.tickScroll()
        }
        break
      }
    }
  }

  private handleGlobalMouseUp() {
    switch (this.tool.value) {
      case 'pen': {
        const { drawingPath } = this
        if (drawingPath != null) {
          if (drawingPath.points.length > 1) {
            this.paths = this.paths.concat([drawingPath])
            this.pictureService.addAndRemovePaths(this.pictureId, [drawingPath], null)
            this.tickDraw()
          }
          this.drawingPath = null
        }
        break
      }

      case 'eraser': {
        const { erasingPathIds, paths } = this
        if (erasingPathIds != null) {
          const newPaths = removePaths(paths, erasingPathIds)
          if (newPaths !== paths) {
            this.paths = newPaths
            this.pictureService.addAndRemovePaths(this.pictureId, null, Array.from(erasingPathIds))
            this.tickDraw()
          }
          this.erasingPathIds = null
        }
        break
      }

      case 'hand':
        this.handScrollingByMouse = false
        break
    }
  }

  private handleTouchStart(event: TouchEvent) {
    this.updateOffset()

    switch (this.tool.value) {
      case 'pen': {
        const p = this.getPointFromTouchEvent(event)
        if (p != null) {
          this.drawingPath = { id: generateId(), color: '#000', width: 3, points: [p] }
          break
        }
      }
      // fall through

      case 'eraser': {
        const p = this.getPointFromTouchEvent(event)
        if (p != null) {
          const pathIdsToRemove = erase(this.paths, p)
          const { erasingPathIds } = this
          if (erasingPathIds != null) {
            addToSet(erasingPathIds, pathIdsToRemove)
          } else {
            this.erasingPathIds = new Set(pathIdsToRemove)
          }
          this.tickDraw()
          break
        }
      }
      // fall through

      default: {
        const p = this.getPointFromTouchEvent(event, true)
        if (p == null) break
        this.prevX = p.x
        this.prevY = p.y
        break
      }
    }
  }

  private handleTouchMove(event: TouchEvent) {
    switch (this.tool.value) {
      case 'pen': {
        const p = this.getPointFromTouchEvent(event)
        if (p != null) {
          const { drawingPath } = this
          if (drawingPath != null) {
            pushPoint(drawingPath.points, p)
            this.tickDraw()
          }
          break
        }
      }
      // fall through

      case 'eraser': {
        const p = this.getPointFromTouchEvent(event)
        if (p != null) {
          const { erasingPathIds } = this
          if (erasingPathIds != null) {
            const pathIdsToRemove = erase(this.paths, p)
            addToSet(erasingPathIds, pathIdsToRemove)
            this.tickDraw()
          }
          break
        }
      }
      // fall through

      default: {
        const p = this.getPointFromTouchEvent(event, true)
        if (p == null) break
        this.bufferedScrollLeft += this.prevX - p.x
        this.bufferedScrollTop += this.prevY - p.y
        this.prevX = p.x
        this.prevY = p.y

        this.tickScroll()
        break
      }
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    switch (this.tool.value) {
      case 'pen': {
        const p = this.getPointFromTouchEvent(event)
        if (p != null) {
          const { drawingPath } = this
          if (drawingPath != null) {
            pushPoint(drawingPath.points, p)
            if (drawingPath.points.length > 1) {
              this.paths = this.paths.concat([drawingPath])
              this.pictureService.addAndRemovePaths(this.pictureId, [drawingPath], null)
              this.tickDraw()
            }
            this.drawingPath = null
          }
          break
        }
      }
      // fall through

      case 'eraser': {
        const p = this.getPointFromTouchEvent(event)
        if (p != null) {
          const { erasingPathIds } = this
          if (erasingPathIds != null) {
            const pathIdsToRemove = erase(this.paths, p)
            addToSet(erasingPathIds, pathIdsToRemove)

            const newPaths = removePaths(this.paths, erasingPathIds)
            if (newPaths !== this.paths) {
              this.paths = newPaths
              this.pictureService.addAndRemovePaths(
                this.pictureId,
                null,
                Array.from(erasingPathIds)
              )
              this.tickDraw()
            }
            this.erasingPathIds = null
          }
          break
        }
      }
      // fall through

      default: {
        const p = this.getPointFromTouchEvent(event, true)
        if (p == null) break
        this.bufferedScrollLeft += this.prevX - p.x
        this.bufferedScrollLeft += this.prevY - p.y
        this.prevX = p.x
        this.prevY = p.y

        this.tickScroll()
        break
      }
    }
  }

  private handleWheel(event: WheelEvent) {
    this.bufferedScrollLeft += event.deltaX
    this.bufferedScrollTop += event.deltaY

    this.tickScroll()
  }

  private draw() {
    const ctx = this.renderingContext
    if (ctx == null) return

    ctx.clearRect(0, 0, this.widthPP, this.heightPP)

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const {
      erasingPathIds,
      dpr,
      scrollLeft,
      scrollTop,
      drawingPath,
      scale: { value: scale }
    } = this

    if (erasingPathIds == null) {
      for (const path of this.paths) {
        drawPath(ctx, path, scrollLeft, scrollTop, dpr, scale)
      }
    } else {
      for (const path of this.paths) {
        if (!erasingPathIds.has(path.id)) {
          drawPath(ctx, path, scrollLeft, scrollTop, dpr, scale)
        }
      }
    }

    if (drawingPath != null) {
      drawPath(ctx, drawingPath, scrollLeft, scrollTop, dpr, scale)
    }

    this.drawScrollBar(ctx)
  }

  drawScrollBar(ctx: CanvasRenderingContext2D) {
    const { min, max } = Math

    let minDrawedX_ = Number.POSITIVE_INFINITY
    let minDrawedY_ = Number.POSITIVE_INFINITY
    let maxDrawedX_ = Number.NEGATIVE_INFINITY
    let maxDrawedY_ = Number.NEGATIVE_INFINITY
    for (const path of this.paths) {
      for (const { x, y } of path.points) {
        minDrawedX_ = min(minDrawedX_, x)
        minDrawedY_ = min(minDrawedY_, y)
        maxDrawedX_ = max(maxDrawedX_, x)
        maxDrawedY_ = max(maxDrawedY_, y)
      }
    }

    const {
      scale: { value: scale },
      scrollLeft,
      scrollTop,
      width,
      height,
      dpr
    } = this
    const minDrawedX = minDrawedX_ * scale - scrollLeft
    const minDrawedY = minDrawedY_ * scale - scrollTop
    const maxDrawedX = maxDrawedX_ * scale - scrollLeft
    const maxDrawedY = maxDrawedY_ * scale - scrollTop

    const barWidth1 = 6
    const barWidth2 = 3
    const offsetP = 10
    const offsetO1 = 4.5
    const offsetO2 = 6

    const minViewX = 0
    const minViewY = 0
    const maxViewX = width
    const maxViewY = height
    const minX = min(minViewX, minDrawedX)
    const minY = min(minViewY, minDrawedY)
    const maxX = max(maxViewX, maxDrawedX)
    const maxY = max(maxViewY, maxDrawedY)
    const horizontalBarLength = width - offsetP * 2
    const verticalBarLength = height - offsetP * 2
    const shiftX = -minX
    const shiftY = -minY
    const scaleX = horizontalBarLength / (maxX - minX)
    const scaleY = verticalBarLength / (maxY - minY)

    ctx.fillStyle = '#0007'
    ctx.fillRect(
      ((minViewX + shiftX) * scaleX + offsetP) * dpr,
      (height - offsetO1 - barWidth1) * dpr,
      (maxViewX - minViewX) * scaleX * dpr,
      barWidth1 * dpr
    )
    ctx.fillRect(
      (width - offsetO1 - barWidth1) * dpr,
      ((minViewY + shiftY) * scaleY + offsetP) * dpr,
      barWidth1 * dpr,
      (maxViewY - minViewY) * scaleY * dpr
    )

    if (Number.isFinite(minDrawedX + minDrawedY + maxDrawedX + maxDrawedY)) {
      ctx.fillStyle = '#111a'
      ctx.fillRect(
        ((minDrawedX + shiftX) * scaleX + offsetP) * dpr,
        (height - offsetO2 - barWidth2) * dpr,
        (maxDrawedX - minDrawedX) * scaleX * dpr,
        barWidth2 * dpr
      )
      ctx.fillRect(
        (width - offsetO2 - barWidth2) * dpr,
        ((minDrawedY + shiftY) * scaleY + offsetP) * dpr,
        barWidth2 * dpr,
        (maxDrawedY - minDrawedY) * scaleY * dpr
      )
    }
  }

  private tickDraw() {
    if (this.tickingDraw) return

    this.tickingDraw = true
    requestAnimationFrame(() => {
      this.draw()
      this.tickingDraw = false
    })
  }

  private tickScroll() {
    if (this.tickingScroll) return

    this.tickingScroll = true
    requestAnimationFrame(() => {
      this.scrollLeft = this.bufferedScrollLeft
      this.scrollTop = this.bufferedScrollTop
      this.tickingScroll = false
      this.draw()
    })
  }
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  { width, color, points }: Path,
  scrollLeft: number,
  scrollTop: number,
  dpr: number,
  scale: number
) {
  if (points.length === 0) {
    return
  }

  ctx.lineWidth = width * scale * dpr
  ctx.strokeStyle = color
  let first = true
  ctx.beginPath()
  for (const { x, y } of points) {
    const realX = (x * scale - scrollLeft) * dpr
    const realY = (y * scale - scrollTop) * dpr
    if (first) {
      ctx.moveTo(realX, realY)
      first = false
    } else {
      ctx.lineTo(realX, realY)
    }
  }
  ctx.stroke()
}

function pushPoint(points: Point[] | null | undefined, point: Point) {
  if (points == null) return

  if (points.length > 0) {
    const { x, y } = point
    const { x: lastX, y: lastY } = points[points.length - 1]
    if (lastX === x && lastY === y) {
      return
    }
  }

  points.push(point)
}

function erase(paths: Path[], p1: Point): string[] {
  const pathIdsToRemove: string[] = []

  for (const { points, id } of paths) {
    if (points.some((p2) => isCloser(p1, p2, 3))) {
      pathIdsToRemove.push(id)
    }
  }

  return pathIdsToRemove
}

function isCloser({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point, r: number): boolean {
  const d = (x1 - x2) ** 2 + (y1 - y2) ** 2
  return d <= r ** 2
}

function removePaths(paths: Path[], pathIdsToRemove: Set<string>): Path[] {
  const newPaths = paths.filter((path) => !pathIdsToRemove.has(path.id))
  if (newPaths.length === paths.length) {
    return paths
  }
  return newPaths
}

function addPaths(paths: Path[], pathsToAdd: Path[]): Path[] {
  const idSet = new Set(paths.map(({ id }) => id))
  const pathsToReallyAdd = pathsToAdd.filter(({ id }) => {
    if (idSet.has(id)) return false
    idSet.add(id)
    return true
  })
  if (pathsToReallyAdd.length === 0) return paths
  return paths.concat(pathsToReallyAdd)
}

function removePathsByIds(paths: Path[], pathIdsToRemove: string[]): Path[] {
  const pathIdsSetToRemove = new Set(pathIdsToRemove)
  const newPaths = paths.filter(({ id }) => !pathIdsSetToRemove.has(id))
  if (newPaths.length === paths.length) return paths
  return newPaths
}

function addToSet<T>(set: Set<T>, items: Iterable<T>) {
  for (const item of items) {
    set.add(item)
  }
}

type Listenable<EventType extends string, Event, ExtraArgs extends unknown[]> = {
  addEventListener(eventType: EventType, handler: (event: Event) => void, ...args: ExtraArgs): void
  removeEventListener(eventType: EventType, handler: (event: Event) => void): void
}

function listen<ET extends string, E, EA extends unknown[]>(
  target: Listenable<ET, E, EA>,
  eventType: ET,
  handler: (e: E) => void,
  ...args: EA
): () => void {
  target.addEventListener(eventType, handler, ...args)

  return () => {
    target.removeEventListener(eventType, handler)
  }
}
