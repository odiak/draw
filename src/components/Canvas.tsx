import React from 'react'
import { Tool } from '../types/Tool'
import { Path, PictureService, Point } from '../services/PictureService'
import { generateId } from '../utils/generateId'
import { addEventListener } from '../utils/addEventListener'
import { fitCurve } from '@odiak/fit-curve'
import { ExperimentalSettingsService } from '../services/ExperimentalSettingsService'
import { Color } from '../utils/Color'
import { DrawingService } from '../services/DrawingService'

type Operation =
  | Readonly<{
      type: 'add'
      paths: Path[]
    }>
  | Readonly<{
      type: 'remove'
      paths: Path[]
    }>
  | Readonly<{
      type: 'move'
      paths: Path[]
      dx: number
      dy: number
      lassoId: string
    }>

type PathWithBoundary = Path & { boundary?: PathBoundary }

type Pointer = {
  id: number
}

const zoomScaleFactor = 1.1
const zoomScaleFactorForWheel = 1.05

const isLikeMacOs = /\bMac OS X\b/i.test(navigator.userAgent)

const scrollBarColorV = Color.fromString('#0007')
const scrollBarColorD = Color.fromString('#111a')

type Props = {
  pictureId: string
}

export class Canvas extends React.Component<Props, {}> {
  private canvasElement: HTMLCanvasElement | null = null
  private parentElement: Element | null = null
  private renderingContext: CanvasRenderingContext2D | null = null
  private dpr = 1.0

  private offsetLeft = 0
  private offsetTop = 0

  private width = 0
  private height = 0

  // sizes in physical pixel
  private widthPP = 0
  private heightPP = 0

  private paths = new Map<string, PathWithBoundary>()
  private drawingPath: Path | null = null
  private erasingPathIds: Set<string> | null = null
  private currentLasso: Lasso | null = null

  private pictureService = PictureService.instantiate()
  private drawingService = DrawingService.instantiate()

  private scrollLeft = 0
  private scrollTop = 0
  private bufferedScrollLeft = 0
  private bufferedScrollTop = 0

  private tickingDraw = false
  private tickingScroll = false
  private tickingResize = false

  private prevX = 0
  private prevY = 0
  private isPanning = false

  private canvasCleanUpHandler: (() => void) | null = null

  private doneOperationStack: Operation[] = []
  private undoneOperationStack: Operation[] = []

  private unwatchPaths: (() => void) | null = null
  private unwatchPermission: (() => void) | null = null

  private canvasRef = this.setCanvasElement.bind(this)

  private writable = false

  private readonly experimentalSettings =
    ExperimentalSettingsService.instantiate().experimentalSettings

  private eraserWidth = 3

  private isWheelZooming = false
  private wheelZoomX = 0
  private wheelZoomY = 0

  private isScrollBarVisible = false
  private hidingScrollBarTimer = null as number | null
  private scrollBarOpacity = 1.0

  private isDraggingLasso = false

  private cleanUpFunctions: Array<() => void> = []

  private activePointers: Map<number, Pointer> = new Map()

  constructor(props: Props, context: unknown) {
    super(props, context)

    const fs: Array<() => void> = []

    fs.push(
      this.drawingService.onUndo.subscribe(() => {
        this.undo()
      })
    )
    fs.push(
      this.drawingService.onRedo.subscribe(() => {
        this.redo()
      })
    )
    fs.push(
      this.drawingService.onZoomIn.subscribe(() => {
        this.zoomIn()
      })
    )
    fs.push(
      this.drawingService.onZoomOut.subscribe(() => {
        this.zoomOut()
      })
    )

    fs.push(
      this.drawingService.scale.subscribe((scale, prevScale) => {
        const r = scale / prevScale
        let x: number
        let y: number
        if (this.isWheelZooming) {
          x = this.wheelZoomX
          y = this.wheelZoomY
        } else {
          x = this.width / 2
          y = this.height / 2
        }
        this.scrollLeft = this.bufferedScrollLeft = x * (r - 1) + r * this.scrollLeft
        this.scrollTop = this.bufferedScrollTop = y * (r - 1) + r * this.scrollTop
        this.tickDraw()
      })
    )

    fs.push(
      this.drawingService.tool.subscribe((tool) => {
        if (tool !== 'lasso' && this.currentLasso != null) {
          this.currentLasso = null
          this.tickDraw()
        }
      })
    )

    this.cleanUpFunctions = fs

    this.onUpdatePictureId(true)
  }

  private onUpdatePictureId(first: boolean = false) {
    if (!first) {
      this.undoneOperationStack = []
      this.doneOperationStack = []
      this.paths = new Map()
      this.drawingService.scale.next(1.0)
      this.activePointers = new Map()
    }
    this.checkOperationStack()

    this.unwatchPaths?.()
    this.unwatchPaths = this.pictureService.watchPaths(
      this.props.pictureId,
      ({ addedPaths, removedPathIds, modifiedPaths }) => {
        if (addedPaths != null) {
          this.addPathsAndAdjustPosition(addedPaths)
        }
        if (removedPathIds != null) {
          this.removePathsById(removedPathIds)
        }
        if (modifiedPaths != null) {
          this.updatePaths(modifiedPaths)
        }
      }
    )

    this.unwatchPermission?.()
    this.unwatchPermission = this.pictureService.watchPermission(
      this.props.pictureId,
      (permission) => {
        this.writable = permission.writable
      }
    )

    this.tickDraw()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.pictureId !== prevProps.pictureId) {
      this.onUpdatePictureId()
    }
  }

  componentWillUnmount() {
    this.unwatchPaths?.()
    this.unwatchPermission?.()
    for (const f of this.cleanUpFunctions) f()
    this.cleanUpCanvas()
  }

  render() {
    return <canvas ref={this.canvasRef} style={{}}></canvas>
  }

  setCanvasElement(elem: HTMLCanvasElement | null) {
    if (elem == null) {
      this.cleanUpCanvas()
      return
    }

    if (elem === this.canvasElement) return

    const { canvasCleanUpHandler } = this
    if (canvasCleanUpHandler != null) {
      canvasCleanUpHandler()
    }

    const parent = elem.parentElement

    this.canvasElement = elem
    this.parentElement = parent
    this.renderingContext = elem.getContext('2d')
    this.dpr = devicePixelRatio
    this.handleResize()

    const unsubscribers = [
      addEventListener(elem, 'wheel', this.handleWheel.bind(this)),
      addEventListener(elem, 'touchmove', (event) => {
        event.preventDefault()
      }),
      addEventListener(elem, 'pointerdown', this.handlePointerDown.bind(this)),
      addEventListener(elem, 'pointermove', this.handlePointerMove.bind(this)),
      addEventListener(elem, 'pointerup', this.handlePointerUp.bind(this)),
      addEventListener(elem, 'pointercancel', this.handlePointerCancel.bind(this)),
      addEventListener(window, 'keydown', this.handleWindowKeyDown.bind(this))
    ]

    const ro = new ResizeObserver(() => {
      this.handleResizeWithThrottling()
    })
    ro.observe(parent!)

    this.canvasCleanUpHandler = () => {
      for (const f of unsubscribers) {
        f()
      }
      ro.disconnect()
    }
  }

  cleanUpCanvas() {
    const { canvasCleanUpHandler } = this
    if (canvasCleanUpHandler != null) {
      canvasCleanUpHandler()
      this.canvasCleanUpHandler = null
    }

    this.canvasElement = null
    this.renderingContext = null
  }

  setWritable(writable: boolean = true) {
    this.writable = writable
  }

  private addPathsAndAdjustPosition(pathsToAdd: Path[]) {
    const wasEmpty = this.paths.size === 0
    const n = addPaths(this.paths, pathsToAdd)

    if (wasEmpty) {
      let minX = Number.POSITIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      for (const path of this.paths.values()) {
        for (const { x, y } of path.points) {
          minX = Math.min(minX, x + path.offsetX)
          minY = Math.min(minY, y + path.offsetY)
        }
      }
      if (Number.isFinite(minX + minY)) {
        this.scrollLeft = this.bufferedScrollLeft = minX - 40
        this.scrollTop = this.bufferedScrollTop = minY - 40
      }
    }

    if (n > 0) {
      this.tickDraw()
    }
  }

  private removePathsById(pathIdsToRemove: string[]) {
    const n = removePaths(this.paths, pathIdsToRemove)

    if (n > 0) {
      this.tickDraw()
    }
  }

  private updatePaths(paths: Path[]) {
    updatePaths(this.paths, paths)
    if (paths.length > 0) {
      this.tickDraw()
    }
  }

  private addPathsInternal(paths: Path[]) {
    addPaths(this.paths, paths)
    this.pictureService.addPaths(this.props.pictureId, paths)
  }

  private removePathsInternal(paths: Path[]) {
    const pathIds = paths.map((p) => p.id)
    removePaths(this.paths, pathIds)
    this.pictureService.removePaths(this.props.pictureId, pathIds)
  }

  private movePathsInternal(paths: Path[], dx: number, dy: number) {
    const newPaths = paths.map((path) => ({
      ...path,
      offsetX: path.offsetX + dx,
      offsetY: path.offsetY + dy,
      boundary: undefined
    }))
    updatePaths(this.paths, newPaths)
    this.pictureService.updatePaths(
      this.props.pictureId,
      newPaths.map(({ id, offsetX, offsetY }) => ({ id, offsetX, offsetY }))
    )
  }

  private moveLassoById(id: string, dx: number, dy: number) {
    const { currentLasso } = this
    if (currentLasso == null || currentLasso.id !== id) return

    currentLasso.offsetX += dx
    currentLasso.offsetY += dy
  }

  private removeLassoWithWrongId(id: string) {
    if (this.currentLasso?.id !== id) {
      this.currentLasso = null
    }
  }

  private checkOperationStack() {
    const canUndo = this.doneOperationStack.length !== 0
    const canRedo = this.undoneOperationStack.length !== 0

    if (this.drawingService.canUndo.value !== canUndo) this.drawingService.canUndo.next(canUndo)
    if (this.drawingService.canRedo.value !== canRedo) this.drawingService.canRedo.next(canRedo)
  }

  private doOperation(operation: Operation, redo: boolean = false) {
    this.doneOperationStack.push(operation)
    if (!redo) this.undoneOperationStack = []
    this.checkOperationStack()

    switch (operation.type) {
      case 'add':
        this.addPathsInternal(operation.paths)
        break

      case 'remove':
        this.removePathsInternal(operation.paths)
        break

      case 'move':
        this.movePathsInternal(operation.paths, operation.dx, operation.dy)
        if (redo) {
          this.moveLassoById(operation.lassoId, operation.dx, operation.dy)
          this.removeLassoWithWrongId(operation.lassoId)
        }
        break
    }

    this.tickDraw()
  }

  private undoOperation(operation: Operation) {
    this.undoneOperationStack.push(operation)
    this.checkOperationStack()

    switch (operation.type) {
      case 'add':
        this.removePathsInternal(operation.paths)
        break

      case 'remove':
        this.addPathsInternal(operation.paths)
        break

      case 'move':
        this.movePathsInternal(operation.paths, 0, 0)
        this.moveLassoById(operation.lassoId, -operation.dx, -operation.dy)
        this.removeLassoWithWrongId(operation.lassoId)
        break
    }

    this.tickDraw()
  }

  private zoomIn() {
    this.drawingService.scale.update((s) => s * zoomScaleFactor)
    this.showScrollBar()
    this.hideScrollBarAfterDelay()
  }

  private zoomOut() {
    this.drawingService.scale.update((s) => s / zoomScaleFactor)
    this.showScrollBar()
    this.hideScrollBarAfterDelay()
  }

  private zoomByWheel(delta: number, x: number, y: number) {
    this.isWheelZooming = true
    this.wheelZoomX = x
    this.wheelZoomY = y
    this.drawingService.scale.update((s) => s * zoomScaleFactorForWheel ** -delta)
    this.isWheelZooming = false

    this.showScrollBar()
    this.hideScrollBarAfterDelay()
  }

  private undo(): boolean {
    const op = this.doneOperationStack.pop()
    this.checkOperationStack()
    if (op == null) return false

    this.undoOperation(op)
    return true
  }

  private redo(): boolean {
    const op = this.undoneOperationStack.pop()
    this.checkOperationStack()
    if (op == null) return false

    this.doOperation(op, true)
    return true
  }

  private handleResize() {
    const ce = this.canvasElement
    const parent = this.parentElement
    if (ce == null || parent == null) return

    const rect = parent.getBoundingClientRect()
    this.offsetLeft = rect.left
    this.offsetTop = rect.top
    this.width = rect.width
    this.height = rect.height
    this.widthPP = rect.width * this.dpr
    this.heightPP = rect.height * this.dpr
    ce.width = this.widthPP
    ce.height = this.heightPP
    ce.style.width = `${rect.width}px`
    ce.style.height = `${rect.height}px`

    this.draw()
  }

  private handleResizeWithThrottling() {
    if (this.tickingResize) return

    this.tickingResize = true
    setTimeout(() => {
      this.handleResize()
      this.tickingResize = false
    }, 300)
  }

  private handleWindowKeyDown(event: KeyboardEvent) {
    const isCtrlOrMetaKeyPressed = isLikeMacOs ? event.metaKey : event.ctrlKey
    const isZKeyPressed = event.key === 'z'
    const isShiftKeyPressed = event.shiftKey

    if (isCtrlOrMetaKeyPressed && isZKeyPressed) {
      if (isShiftKeyPressed) {
        this.redo()
      } else {
        this.undo()
      }
    }
  }

  private getPointFromMouseEvent(event: MouseEvent, ignoreScroll: boolean = false): Point {
    let x = event.clientX - this.offsetLeft
    let y = event.clientY - this.offsetTop

    if (!ignoreScroll) {
      const scale = this.drawingService.scale.value
      x = (x + this.scrollLeft) / scale
      y = (y + this.scrollTop) / scale
    }

    return { x, y }
  }

  private getPointFromPointerEvent(
    event: PointerEvent,
    ignoreScrollAndTouchType: boolean = false
  ): Point | undefined {
    if (
      !ignoreScrollAndTouchType &&
      this.drawingService.palmRejectionEnabled.value &&
      event.pointerType === 'touch'
    ) {
      return undefined
    }

    let x = event.clientX - this.offsetLeft
    let y = event.clientY - this.offsetTop

    if (!ignoreScrollAndTouchType) {
      const scale = this.drawingService.scale.value
      x = (x + this.scrollLeft) / scale
      y = (y + this.scrollTop) / scale
    }

    return { x, y }
  }

  private addDrawingPath() {
    const { drawingPath } = this
    if (drawingPath == null) return

    this.drawingPath = null
    if (drawingPath.points.length > 1) {
      this.doOperation({ type: 'add', paths: [drawingPath] })
    }
  }

  private removeErasingPaths() {
    const { erasingPathIds } = this
    if (erasingPathIds == null) return

    this.erasingPathIds = null

    const erasingPaths: Path[] = []
    for (const id of erasingPathIds) {
      const path = this.paths.get(id)
      if (path == null) {
        erasingPathIds.delete(id)
      } else {
        erasingPaths.push(path)
      }
    }
    if (erasingPathIds.size === 0) return

    this.doOperation({ type: 'remove', paths: erasingPaths })
  }

  private get actualCurrentTool(): Tool {
    if (!this.writable) return 'hand'
    return this.drawingService.tool.value
  }

  private handlePointerDown(event: PointerEvent) {
    this.canvasElement!.setPointerCapture(event.pointerId)
    this.activePointers.set(event.pointerId, toPointer(event))

    switch (this.actualCurrentTool) {
      case 'pen': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          this.drawingPath = {
            id: generateId(),
            color: this.drawingService.strokeColor.value,
            width: this.drawingService.strokeWidth.value,
            points: [p],
            isBezier: false,
            offsetX: 0,
            offsetY: 0
          }
          break
        }
      }
      // fall through

      case 'eraser': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          const pathIdsToRemove = erase(this.paths, p, null, this.eraserWidth)
          const { erasingPathIds } = this
          if (erasingPathIds != null) {
            addToSet(erasingPathIds, pathIdsToRemove)
          } else {
            this.erasingPathIds = new Set(pathIdsToRemove)
          }
          this.tickDraw()
          this.prevX = p.x
          this.prevY = p.y
          break
        }
      }
      // fall through

      case 'lasso': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          const lasso = this.currentLasso
          if (lasso != null && isInsideLasso(p, lasso, calculateLassoBoundary(lasso))) {
            this.prevX = p.x
            this.prevY = p.y
            this.isDraggingLasso = true
            break
          }
          this.currentLasso = new Lasso([p])
          this.tickDraw()
          break
        }
      }
      // fall through

      default: {
        const p = this.getPointFromPointerEvent(event, true)
        if (p == null) break
        this.prevX = p.x
        this.prevY = p.y
        this.showScrollBar()
        this.isPanning = true
        break
      }
    }
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.activePointers.has(event.pointerId)) return

    switch (this.actualCurrentTool) {
      case 'pen': {
        const p = this.getPointFromPointerEvent(event)
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
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          const { erasingPathIds } = this
          if (erasingPathIds != null) {
            const pathIdsToRemove = erase(
              this.paths,
              p,
              { x: this.prevX, y: this.prevY },
              this.eraserWidth
            )
            addToSet(erasingPathIds, pathIdsToRemove)
            this.tickDraw()
            this.prevX = p.x
            this.prevY = p.y
          }
          break
        }
      }
      // fall through

      case 'lasso': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          const lasso = this.currentLasso
          if (lasso != null && !lasso.isClosed) {
            pushPoint(lasso.points, p)
            this.tickDraw()
          } else if (lasso != null && this.isDraggingLasso) {
            this.dragLassoTo(lasso, p)
          }
          break
        }
      }
      // fall through

      default: {
        const p = this.getPointFromPointerEvent(event, true)
        if (p == null) break
        if (this.isPanning) {
          this.bufferedScrollLeft += this.prevX - p.x
          this.bufferedScrollTop += this.prevY - p.y
          this.prevX = p.x
          this.prevY = p.y

          this.tickScroll()
        }
        break
      }
    }
  }

  private handlePointerUp(event: PointerEvent) {
    if (!this.activePointers.has(event.pointerId)) return

    switch (this.actualCurrentTool) {
      case 'pen': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          pushPoint(this.drawingPath?.points, p)
          if (this.experimentalSettings.value.disableSmoothingPaths !== true) {
            smoothPath(this.drawingPath, this.drawingService.scale.value)
          }
          this.addDrawingPath()
          break
        }
      }
      // fall through

      case 'eraser': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          addToSet(
            this.erasingPathIds,
            erase(this.paths, p, { x: this.prevX, y: this.prevY }, this.eraserWidth)
          )
          this.removeErasingPaths()
          break
        }
      }
      // fall through

      case 'lasso': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          const lasso = this.currentLasso
          if (lasso != null && !lasso.isClosed) {
            this.postProcessLasso(lasso)
          } else if (lasso != null && this.isDraggingLasso) {
            this.finishDraggingLasso()
          }
          break
        }
      }
      // fall through

      default: {
        const p = this.getPointFromPointerEvent(event, true)
        if (p == null) break
        if (this.isPanning) {
          this.bufferedScrollLeft += this.prevX - p.x
          this.bufferedScrollLeft += this.prevY - p.y
          this.prevX = p.x
          this.prevY = p.y

          this.tickScroll()
          this.hideScrollBarAfterDelay()

          this.isPanning = false
        }
        break
      }
    }

    this.activePointers.delete(event.pointerId)
    if (this.canvasElement!.hasPointerCapture(event.pointerId)) {
      this.canvasElement!.releasePointerCapture(event.pointerId)
    }
  }

  private handlePointerCancel(event: PointerEvent) {
    if (!this.activePointers.has(event.pointerId)) return

    switch (this.actualCurrentTool) {
      case 'pen': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          if (this.experimentalSettings.value.disableSmoothingPaths !== true) {
            smoothPath(this.drawingPath, this.drawingService.scale.value)
          }
          this.addDrawingPath()
          break
        }
      }
      // fall through

      case 'eraser': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          this.removeErasingPaths()
          break
        }
      }
      // fall through

      case 'lasso': {
        const p = this.getPointFromPointerEvent(event)
        if (p != null) {
          const lasso = this.currentLasso
          if (lasso != null && !lasso.isClosed) {
            this.postProcessLasso(lasso)
          } else if (lasso != null && this.isDraggingLasso) {
            this.finishDraggingLasso()
          }
          break
        }
      }
      // fall through

      default: {
        const p = this.getPointFromPointerEvent(event, true)
        if (p == null) break
        if (this.isPanning) {
          this.hideScrollBarAfterDelay()
          this.isPanning = false
        }
        break
      }
    }

    this.activePointers.delete(event.pointerId)
    if (this.canvasElement!.hasPointerCapture(event.pointerId)) {
      this.canvasElement!.releasePointerCapture(event.pointerId)
    }
  }

  private handleWheel(event: WheelEvent) {
    event.preventDefault()

    if (event.ctrlKey) {
      const { x, y } = this.getPointFromMouseEvent(event, true)
      this.zoomByWheel(event.deltaY, x, y)
      return
    }

    this.bufferedScrollLeft += event.deltaX
    this.bufferedScrollTop += event.deltaY
    this.showScrollBar()
    this.hideScrollBarAfterDelay()

    this.tickScroll()
  }

  private draw() {
    const ctx = this.renderingContext
    if (ctx == null) return

    const { erasingPathIds, dpr, scrollLeft, scrollTop, drawingPath, currentLasso } = this
    const scale = this.drawingService.scale.value

    ctx.clearRect(0, 0, this.widthPP, this.heightPP)

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const minXOnScreen = scrollLeft / scale
    const minYOnScreen = scrollTop / scale
    const maxXOnScreen = (this.width + scrollLeft) / scale
    const maxYOnScreen = (this.height + scrollTop) / scale

    for (const path of this.paths.values()) {
      const b = getPathBoundary(path)
      if (
        b.minX > maxXOnScreen ||
        b.minY > maxYOnScreen ||
        b.maxX < minXOnScreen ||
        b.maxY < minYOnScreen
      ) {
        continue
      }

      if (erasingPathIds != null && erasingPathIds.has(path.id)) {
        continue
      }

      let dx = 0
      let dy = 0
      if (currentLasso != null && currentLasso.overlappingPathIds.has(path.id)) {
        dx = currentLasso.accumulatedOffsetX
        dy = currentLasso.accumulatedOffsetY
      }

      drawPath(ctx, path, scrollLeft, scrollTop, dpr, scale, dx, dy)
    }

    if (drawingPath != null) {
      drawPath(ctx, drawingPath, scrollLeft, scrollTop, dpr, scale, 0, 0)
    }

    if (currentLasso != null) {
      drawLassoPath(ctx, currentLasso, scrollLeft, scrollTop, dpr, scale)
    }

    if (this.isScrollBarVisible) {
      this.drawScrollBar(ctx)
    }
  }

  drawScrollBar(ctx: CanvasRenderingContext2D) {
    const { min, max } = Math

    let minDrawedX_ = Number.POSITIVE_INFINITY
    let minDrawedY_ = Number.POSITIVE_INFINITY
    let maxDrawedX_ = Number.NEGATIVE_INFINITY
    let maxDrawedY_ = Number.NEGATIVE_INFINITY
    for (const path of this.paths.values()) {
      const b = getPathBoundary(path)
      minDrawedX_ = min(minDrawedX_, b.minX)
      minDrawedY_ = min(minDrawedY_, b.minY)
      maxDrawedX_ = max(maxDrawedX_, b.maxX)
      maxDrawedY_ = max(maxDrawedY_, b.maxY)
    }

    const { scrollLeft, scrollTop, width, height, dpr } = this
    const scale = this.drawingService.scale.value
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

    const colorV = scrollBarColorV.copy()
    const colorD = scrollBarColorD.copy()
    colorV.a *= this.scrollBarOpacity
    colorD.a *= this.scrollBarOpacity

    ctx.fillStyle = colorV.toString()
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
      ctx.fillStyle = colorD.toString()
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

  private showScrollBar() {
    const { hidingScrollBarTimer } = this
    if (hidingScrollBarTimer != null) {
      clearInterval(hidingScrollBarTimer)
      this.hidingScrollBarTimer = null
    }

    this.isScrollBarVisible = true
    this.scrollBarOpacity = 1
    this.tickDraw()
  }

  private hideScrollBarAfterDelay() {
    const { hidingScrollBarTimer } = this
    if (hidingScrollBarTimer != null) {
      clearInterval(hidingScrollBarTimer)
    }

    const T = 900
    const TOff = 500
    const step = 50
    let t = 0
    this.hidingScrollBarTimer = window.setInterval(() => {
      t += step
      this.scrollBarOpacity = Math.min(1, (T - t) / (T - TOff))
      if (t >= T) {
        this.scrollBarOpacity = 0
        this.isScrollBarVisible = false
        if (this.hidingScrollBarTimer != null) {
          clearInterval(this.hidingScrollBarTimer)
          this.hidingScrollBarTimer = null
        }
      }
      this.tickDraw()
    }, step)
  }

  private dragLassoTo(lasso: Lasso, { x, y }: Point) {
    const dx = x - this.prevX
    const dy = y - this.prevY
    lasso.move(dx, dy)

    this.prevX = x
    this.prevY = y
    this.tickDraw()
  }

  private finishDraggingLasso() {
    const { currentLasso } = this
    if (currentLasso == null) return

    const dx = currentLasso.accumulatedOffsetX
    const dy = currentLasso.accumulatedOffsetY
    currentLasso.resetAccumulation()
    if (dx === 0 && dy === 0) return

    const paths: Path[] = []
    for (const id of currentLasso.overlappingPathIds) {
      const path = this.paths.get(id)
      if (path != null) {
        paths.push({ ...path })
      }
    }

    if (paths.length !== 0) {
      this.doOperation({
        type: 'move',
        lassoId: currentLasso.id,
        paths,
        dx,
        dy
      })
    }

    this.isDraggingLasso = false
  }

  // Call this after a lasso gets drawed
  private postProcessLasso(lasso: Lasso) {
    lasso.isClosed = true
    if (lassoLength(lasso, this.drawingService.scale.value) < 50) {
      this.currentLasso = null
    } else {
      addToSet(lasso.overlappingPathIds, selectPathsOverlappingWithLasso(this.paths, lasso))
    }
    this.tickDraw()
  }
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  { width, color, points, isBezier, offsetX, offsetY }: Path,
  scrollLeft: number,
  scrollTop: number,
  dpr: number,
  scale: number,
  dx: number,
  dy: number
) {
  if (points.length === 0) {
    return
  }

  ctx.lineWidth = width * scale * dpr
  ctx.strokeStyle = color
  let first = true
  ctx.beginPath()
  if (isBezier) {
    let args: number[] = []
    for (const { x, y } of points) {
      const realX = ((x + offsetX + dx) * scale - scrollLeft) * dpr
      const realY = ((y + offsetY + dy) * scale - scrollTop) * dpr
      if (first) {
        ctx.moveTo(realX, realY)
        first = false
      } else {
        args.push(realX, realY)
        if (args.length === 6) {
          ctx.bezierCurveTo(...(args as [number, number, number, number, number, number]))
          args = []
        }
      }
    }
  } else {
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
  }
  ctx.stroke()
}

function drawLassoPath(
  ctx: CanvasRenderingContext2D,
  { points, isClosed, offsetX, offsetY }: Lasso,
  scrollLeft: number,
  scrollTop: number,
  dpr: number,
  scale: number
) {
  if (points.length <= 1) return

  ctx.setLineDash([4 * dpr, 4 * dpr])
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1

  ctx.beginPath()

  let isFirst = true
  for (const { x, y } of points) {
    const realX = ((x + offsetX) * scale - scrollLeft) * dpr
    const realY = ((y + offsetY) * scale - scrollTop) * dpr
    if (isFirst) {
      ctx.moveTo(realX, realY)
      isFirst = false
    } else {
      ctx.lineTo(realX, realY)
    }
  }
  if (isClosed) {
    ctx.closePath()
  }
  ctx.stroke()

  ctx.setLineDash([])
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

function erase(
  paths: Map<string, Path>,
  p0: Point,
  p1: Point | null,
  eraserWidth: number
): string[] {
  const pathIdsToRemove: string[] = []

  let ps: Point[]
  if (p1 == null) {
    ps = [p0]
  } else {
    ps = [...iteratePoints(p0, p1, 0, 0, 2)]
  }

  for (const path of paths.values()) {
    const { width, id } = path
    const d2 = (width + eraserWidth) ** 2

    loop: for (const { x: x0, y: y0 } of iteratePathPoints(path, 1.0)) {
      for (const { x: x1, y: y1 } of ps) {
        if ((x0 - x1) ** 2 + (y0 - y1) ** 2 <= d2) {
          pathIdsToRemove.push(id)
          break loop
        }
      }
    }
  }

  return pathIdsToRemove
}

function* iteratePathPoints(
  { isBezier, points, offsetX, offsetY }: Path,
  f: number
): Iterable<Point> {
  if (isBezier) {
    for (let i = 3; i < points.length; i += 3) {
      const p0 = points[i - 3]
      const p1 = points[i - 2]
      const p2 = points[i - 1]
      const p3 = points[i]
      yield* iterateBezierPoints(p0, p1, p2, p3, offsetX, offsetY, f)
    }
  } else {
    for (let i = 1; i < points.length; i++) {
      const pp = points[i - 1]
      const np = points[i]
      yield* iteratePoints(pp, np, offsetX, offsetY, f)
    }
  }
}

function* iteratePoints(
  p0: Point,
  p1: Point,
  offsetX: number,
  offsetY: number,
  f: number
): Iterable<Point> {
  const { x: x0, y: y0 } = p0
  const { x: x1, y: y1 } = p1
  const d = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2)
  const vx = ((x1 - x0) / d) * f
  const vy = ((y1 - y0) / d) * f
  const sx = Math.sign(vx)
  const sy = Math.sign(vy)
  for (let x = x0, y = y0; x * sx < x1 * sx && y * sy < y1 * sy; x += vx, y += vy) {
    yield { x: x + offsetX, y: y + offsetY }
  }
}

function* iterateBezierPoints(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  offsetX: number,
  offsetY: number,
  f: number
): Iterable<Point> {
  const { x: x0, y: y0 } = p0
  const { x: x1, y: y1 } = p1
  const { x: x2, y: y2 } = p2
  const { x: x3, y: y3 } = p3
  const d = Math.sqrt((x0 - x3) ** 2 + (y0 - y3) ** 2)
  const step = (1 / d) * f
  for (let t = 0; t < 1; t += step) {
    const s = 1 - t
    const a0 = s ** 3
    const a1 = 3 * s ** 2 * t
    const a2 = 3 * s * t ** 2
    const a3 = t ** 3
    const x = a0 * x0 + a1 * x1 + a2 * x2 + a3 * x3
    const y = a0 * y0 + a1 * y1 + a2 * y2 + a3 * y3
    yield { x: x + offsetX, y: y + offsetY }
  }
}

function removePaths(paths: Map<string, Path>, pathIdsToRemove: Iterable<string>): number {
  let count = 0
  for (const pathId of pathIdsToRemove) {
    if (paths.delete(pathId)) count++
  }
  return count
}

function addPaths(paths: Map<string, Path>, pathsToAdd: Path[]): number {
  let count = 0
  for (const path of pathsToAdd) {
    if (!paths.has(path.id)) {
      paths.set(path.id, path)
      count++
    }
  }
  return count
}

function updatePaths(paths: Map<string, Path>, pathsToAdd: Path[]) {
  for (const path of pathsToAdd) {
    paths.set(path.id, path)
  }
}

function addToSet<T>(set: Set<T> | null | undefined, items: Iterable<T>) {
  if (set == null) return

  for (const item of items) {
    set.add(item)
  }
}

function smoothPath(path: Path | null, scale: number): void {
  if (path == null) return
  path.points = fitCurve(path.points, 5 / scale).flatMap((c, i) => (i === 0 ? c : c.slice(1)))
  path.isBezier = true
}

type LassoInfo = {
  maxX: number
  pointsWithOffset: Point[]
}

function calculateLassoBoundary(lassoPath: Lasso): LassoInfo {
  let maxX = Number.NEGATIVE_INFINITY
  const { offsetX, offsetY } = lassoPath
  const pointsWithOffset: Point[] = []
  for (const { x, y } of lassoPath.points) {
    const xo = x + offsetX
    const yo = y + offsetY
    maxX = Math.max(maxX, xo)
    pointsWithOffset.push({ x: xo, y: yo })
  }
  return { maxX, pointsWithOffset }
}

function isInsideLasso(p0: Point, {}: Lasso, { maxX, pointsWithOffset }: LassoInfo): boolean {
  if (p0.x > maxX) return false

  const p1 = { x: maxX + 1000, y: p0.y }
  let c = 0
  for (let i = 0; i < pointsWithOffset.length; i++) {
    const q0 = i > 0 ? pointsWithOffset[i - 1] : pointsWithOffset[pointsWithOffset.length - 1]
    const q1 = pointsWithOffset[i]
    if (doesIntersect(p0, p1, q0, q1)) {
      c += 1
    }
  }
  return c % 2 === 1
}

function doesIntersect(p0: Point, p1: Point, q0: Point, q1: Point): boolean {
  const vp = subtract(p1, p0)
  const vq = subtract(q1, q0)
  const d = subtract(q0, p0)
  const c = outerProduct(vp, vq)
  const dvp = outerProduct(d, vp)
  if (c === 0) {
    return dvp === 0
  }
  const dvq = outerProduct(d, vq)
  const t = dvq / c
  const u = dvp / c
  return t > 0 && t <= 1 && u > 0 && u <= 1
}

function subtract(p: Point, q: Point): Point {
  return { x: p.x - q.x, y: p.y - q.y }
}

function outerProduct(p: Point, q: Point): number {
  return p.x * q.y - p.y * q.x
}

function lassoLength({ points }: Lasso, scale: number): number {
  let d = 0
  for (let i = 0; i < points.length; i++) {
    const p = i > 0 ? points[i - 1] : points[points.length - 1]
    const q = points[i]
    d += Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2)
  }
  return d * scale
}

function selectPathsOverlappingWithLasso(
  paths: Map<string, PathWithBoundary>,
  lasso: Lasso
): string[] {
  const boundary = calculateLassoBoundary(lasso)
  const pathIds: string[] = []
  for (const [pathId, path] of paths) {
    if (!areBoundariesOverlapping(getPathBoundary(path), lasso)) {
      continue
    }

    for (const p of iteratePathPoints(path, 1.0)) {
      if (isInsideLasso(p, lasso, boundary)) {
        pathIds.push(pathId)
        break
      }
    }
  }
  return pathIds
}

function areBoundariesOverlapping(b1: Boundary, b2: Boundary): boolean {
  return b1.minX <= b2.maxX && b2.minX <= b1.maxX && b1.minY <= b2.maxY && b2.minY <= b1.maxY
}

type Boundary = { minX: number; minY: number; maxX: number; maxY: number }

class Lasso {
  readonly id = generateId()
  points: Point[]
  isClosed = false
  offsetX = 0
  offsetY = 0
  overlappingPathIds = new Set<string>()
  accumulatedOffsetX = 0
  accumulatedOffsetY = 0

  private originalBoundary: Boundary | null = null

  constructor(points: Point[] = []) {
    this.points = points
  }

  private _pointsWithOffset: Point[] | null = null

  get pointsWithOffset(): Point[] {
    const po = this._pointsWithOffset
    if (po != null) {
      return po
    }

    const { offsetX, offsetY } = this
    return (this._pointsWithOffset = this.points.map(({ x, y }) => ({
      x: x + offsetX,
      y: y + offsetY
    })))
  }

  move(dx: number, dy: number) {
    this.offsetX += dx
    this.offsetY += dy
    this.accumulatedOffsetX += dx
    this.accumulatedOffsetY += dy
  }

  resetAccumulation() {
    this.accumulatedOffsetX = 0
    this.accumulatedOffsetY = 0
  }

  private calculateOriginalBoundary(): Boundary {
    const { originalBoundary } = this
    if (originalBoundary != null) return originalBoundary

    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (const { x, y } of this.points) {
      minX = Math.min(x, minX)
      minY = Math.min(y, minY)
      maxX = Math.max(x, maxX)
      maxY = Math.max(y, maxY)
    }
    return (this.originalBoundary = { minX, minY, maxX, maxY })
  }

  get minX(): number {
    return this.calculateOriginalBoundary().minX + this.offsetX
  }
  get minY(): number {
    return this.calculateOriginalBoundary().minY + this.offsetY
  }
  get maxX(): number {
    return this.calculateOriginalBoundary().maxX + this.offsetX
  }
  get maxY(): number {
    return this.calculateOriginalBoundary().maxY + this.offsetY
  }
}

class PathBoundary {
  private originalMinX: number
  private originalMaxX: number
  private originalMinY: number
  private originalMaxY: number
  private path: Path

  constructor(path: Path) {
    this.path = path
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (const { x, y } of path.points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    this.originalMinX = minX
    this.originalMaxX = maxX
    this.originalMinY = minY
    this.originalMaxY = maxY
  }

  get minX(): number {
    return this.originalMinX + this.path.offsetX
  }
  get minY(): number {
    return this.originalMinY + this.path.offsetY
  }
  get maxX(): number {
    return this.originalMaxX + this.path.offsetX
  }
  get maxY(): number {
    return this.originalMaxY + this.path.offsetY
  }
}

function getPathBoundary(path: PathWithBoundary): PathBoundary {
  return path.boundary ?? (path.boundary = new PathBoundary(path))
}

function toPointer(event: PointerEvent): Pointer {
  const { pointerId: id } = event
  return { id }
}
