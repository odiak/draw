import React, { useEffect, useState, useCallback, useLayoutEffect, useRef, WheelEvent } from 'react'
import { ToolBar } from './ToolBar'
import { useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { Point, Path, PictureService } from '../services/PictureService'
import { Tool } from '../types/Tool'
import { generateId } from '../utils/generateId'

type Props = {}

export function DrawingScreen({}: Props) {
  const pictureService = PictureService.instantiate()
  const { pictureId } = useParams<{ pictureId: string }>()

  const [title, setTitle] = useState('Untitled')
  const [paths, setPaths] = useState([] as Path[])

  const [selectedTool, setSelectedTool] = useState('pen' as Tool)
  const [palmRejectionEnabled, setPalmRejectionEnabled] = useState(false)

  const [offset, setOffset] = useState<[number, number]>([0, 0])

  const internals = useRef({
    prevX: 0,
    prevY: 0,
    drawTicking: false,
    scrollTicking: false,
    offsetX: 0,
    offsetY: 0,
    handScrollingByMouse: false,
    canvasElementOffset: [0, 0] as [number, number],
    canvasWidth: 0,
    canvasHeight: 0,
    drawingPath: null as Path | null,
    dpr: devicePixelRatio,
    ctx: null as CanvasRenderingContext2D | null,
    paths,
    erasingPaths: null as Set<Path> | null,
    handleResize: () => {},
    resizeTicking: false
  }).current
  internals.paths = paths

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const elem = canvasRef.current
    if (elem == null) {
      internals.ctx = null
      return
    }

    internals.handleResize = () => {
      const rect = elem.getBoundingClientRect()
      internals.canvasElementOffset = [rect.left, rect.top]
      internals.dpr = devicePixelRatio
      const width = rect.width * internals.dpr
      const height = rect.height * internals.dpr
      elem.width = width
      elem.height = height
      internals.canvasWidth = width
      internals.canvasHeight = height
    }
    internals.handleResize()
    internals.ctx = elem.getContext('2d')
  }, [canvasRef, internals])

  const draw = useCallback(() => {
    const {
      ctx,
      dpr,
      offsetX,
      offsetY,
      canvasWidth,
      canvasHeight,
      drawingPath,
      paths,
      erasingPaths
    } = internals
    if (ctx == null) return
    if (paths == null) return

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (erasingPaths == null) {
      for (const path of paths) {
        drawPath(ctx, path, offsetX, offsetY, dpr)
      }
    } else {
      for (const path of paths) {
        if (!erasingPaths.has(path)) {
          drawPath(ctx, path, offsetX, offsetY, dpr)
        }
      }
    }

    if (drawingPath != null) {
      drawPath(ctx, drawingPath, offsetX, offsetY, dpr)
    }
  }, [internals])

  const savePicture = useCallback(
    (p: { paths?: Path[]; title?: string }) => {
      pictureService.savePicture({ id: pictureId, title, paths, ...p })
    },
    [paths, pictureId, title, pictureService]
  )

  const setTitleWrapper = useCallback(
    (title: string) => {
      setTitle(title)
      savePicture({ title })
    },
    [setTitle, savePicture]
  )

  useLayoutEffect(() => {
    draw()
  }, [paths, offset, draw])

  useEffect(() => {
    pictureService.fetchPicture(pictureId).then((picture) => {
      if (picture != null) {
        setTitle(picture.title)
        setPaths(picture.paths)
      }
    })
  }, [pictureId, pictureService])

  const tickDraw = useCallback(() => {
    if (internals.drawTicking) return

    internals.drawTicking = true
    requestAnimationFrame(() => {
      draw()
      internals.drawTicking = false
    })
  }, [internals, draw])

  useLayoutEffect(() => {
    const elem = canvasRef.current
    if (elem == null) return

    const onResize = () => {
      if (internals.resizeTicking) return

      requestAnimationFrame(() => {
        internals.handleResize()
        draw()
      })
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [internals, draw])

  const tickScroll = useCallback(() => {
    if (internals.scrollTicking) return

    internals.scrollTicking = true
    requestAnimationFrame(() => {
      setOffset([internals.offsetX, internals.offsetY])
      internals.scrollTicking = false
    })
  }, [internals])

  const onWheel = useCallback(
    (event: WheelEvent) => {
      internals.offsetX += event.deltaX
      internals.offsetY += event.deltaY

      tickScroll()
    },
    [internals, tickScroll]
  )

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const { left, top } = canvasRef.current!.getBoundingClientRect()
      internals.canvasElementOffset = [left, top]

      switch (selectedTool) {
        case 'pen':
          internals.drawingPath = {
            color: '#000',
            width: 3,
            points: [getXYFromMouseEvent(event, internals.canvasElementOffset, offset)]
          }
          break

        case 'eraser': {
          const xy = getXYFromMouseEvent(event, internals.canvasElementOffset, offset)
          const pathsToRemove = erase(internals.paths, xy)
          internals.erasingPaths = new Set(pathsToRemove)
          tickDraw()
          break
        }

        case 'hand': {
          const xy = getXYFromMouseEvent(event, internals.canvasElementOffset)
          internals.prevX = xy.x
          internals.prevY = xy.y
          internals.handScrollingByMouse = true
          break
        }
      }
    },
    [selectedTool, tickDraw, offset, internals]
  )

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      switch (selectedTool) {
        case 'pen':
          pushPoint(
            internals.drawingPath?.points,
            getXYFromMouseEvent(event, internals.canvasElementOffset, offset)
          )
          tickDraw()
          break

        case 'eraser': {
          const { erasingPaths } = internals
          if (erasingPaths != null) {
            const xy = getXYFromMouseEvent(event, internals.canvasElementOffset, offset)
            const pathsToRemove = erase(internals.paths, xy)
            for (const path of pathsToRemove) {
              erasingPaths.add(path)
            }
            tickDraw()
          }

          break
        }

        case 'hand': {
          if (internals.handScrollingByMouse) {
            const xy = getXYFromMouseEvent(event, internals.canvasElementOffset)
            internals.offsetX += internals.prevX - xy.x
            internals.offsetY += internals.prevY - xy.y
            internals.prevX = xy.x
            internals.prevY = xy.y
            tickScroll()
          }
          break
        }
      }
    },
    [selectedTool, offset, internals, tickDraw, tickScroll]
  )

  useLayoutEffect(() => {
    const onMouseUpGlobal = () => {
      switch (selectedTool) {
        case 'pen': {
          const { drawingPath } = internals
          if (drawingPath != null) {
            if (drawingPath.points.length > 1) {
              drawingPath.id = generateId()
              const newPaths = paths.concat([drawingPath])
              setPaths(newPaths)
              savePicture({ paths: newPaths })
            }
            internals.drawingPath = null
          }
          break
        }

        case 'eraser': {
          const { erasingPaths, paths } = internals
          if (erasingPaths != null) {
            const newPaths = removePaths(paths, erasingPaths)
            if (newPaths !== paths) {
              setPaths(newPaths)
              savePicture({ paths: newPaths })
            }
            internals.erasingPaths = null
          }
          break
        }

        case 'hand':
          internals.handScrollingByMouse = false
          break
      }
    }
    document.addEventListener('mouseup', onMouseUpGlobal)

    return () => {
      document.removeEventListener('mouseup', onMouseUpGlobal)
    }
  }, [selectedTool, internals, pictureService, paths, savePicture])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (canvas == null) return

    const onTouchStart = (event: TouchEvent) => {
      const { left, top } = canvasRef.current!.getBoundingClientRect()
      internals.canvasElementOffset = [left, top]

      switch (selectedTool) {
        case 'pen': {
          const xy = getXYFromTouchEvent(
            event,
            internals.canvasElementOffset,
            getTouchType(palmRejectionEnabled),
            offset
          )
          if (xy != null) {
            internals.drawingPath = { color: '#000', width: 3, points: [xy] }
            break
          }
        }
        // fall through

        case 'eraser': {
          const xy = getXYFromTouchEvent(
            event,
            internals.canvasElementOffset,
            getTouchType(palmRejectionEnabled),
            offset
          )
          if (xy != null) {
            const { erasingPaths, paths } = internals
            const pathsToRemove = erase(paths, xy)
            if (erasingPaths != null) {
              for (const path of pathsToRemove) {
                erasingPaths.add(path)
              }
            } else {
              internals.erasingPaths = new Set(pathsToRemove)
            }
            tickDraw()
            break
          }
        }
        // fall through

        default: {
          const xy = getXYFromTouchEvent(event, internals.canvasElementOffset, null)
          if (xy == null) break
          internals.prevX = xy.x
          internals.prevY = xy.y
          break
        }
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      switch (selectedTool) {
        case 'pen': {
          const xy = getXYFromTouchEvent(
            event,
            internals.canvasElementOffset,
            getTouchType(palmRejectionEnabled),
            offset
          )
          if (xy != null) {
            pushPoint(internals.drawingPath?.points, xy)
            tickDraw()
            break
          }
        }
        // fall through

        case 'eraser': {
          const xy = getXYFromTouchEvent(
            event,
            internals.canvasElementOffset,
            getTouchType(palmRejectionEnabled),
            offset
          )
          if (xy != null) {
            const { erasingPaths, paths } = internals
            if (erasingPaths != null) {
              const pathsToRemove = erase(paths, xy)
              for (const path of pathsToRemove) {
                erasingPaths.add(path)
              }
              tickDraw()
            }
            break
          }
        }
        // fall through

        default: {
          const xy = getXYFromTouchEvent(event, internals.canvasElementOffset, null)
          if (xy == null) break
          internals.offsetX += internals.prevX - xy.x
          internals.offsetY += internals.prevY - xy.y
          internals.prevX = xy.x
          internals.prevY = xy.y

          tickScroll()
          break
        }
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      switch (selectedTool) {
        case 'pen': {
          const xy = getXYFromTouchEvent(
            event,
            internals.canvasElementOffset,
            getTouchType(palmRejectionEnabled),
            offset
          )
          if (xy != null) {
            const { drawingPath } = internals
            if (drawingPath != null) {
              pushPoint(drawingPath.points, xy)
              if (drawingPath.points.length > 1) {
                drawingPath.id = generateId()
                const newPaths = paths.concat([drawingPath])
                setPaths(newPaths)
                savePicture({ paths: newPaths })
              }
              internals.drawingPath = null
            }
            break
          }
        }
        // fall through

        case 'eraser': {
          const xy = getXYFromTouchEvent(
            event,
            internals.canvasElementOffset,
            getTouchType(palmRejectionEnabled),
            offset
          )
          if (xy != null) {
            const { erasingPaths, paths } = internals
            if (erasingPaths != null) {
              const pathsToRemove = erase(paths, xy)
              for (const path of pathsToRemove) {
                erasingPaths.add(path)
              }

              const newPaths = removePaths(paths, erasingPaths)
              if (newPaths !== paths) {
                setPaths(newPaths)
                savePicture({ paths: newPaths })
              }
              internals.erasingPaths = null
            }
            break
          }
        }
        // fall through

        default: {
          const xy = getXYFromTouchEvent(event, internals.canvasElementOffset, null)
          if (xy == null) break
          internals.offsetX += internals.prevX - xy.x
          internals.offsetY += internals.prevY - xy.y
          internals.prevX = xy.x
          internals.prevY = xy.y

          tickScroll()
          break
        }
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [
    internals,
    palmRejectionEnabled,
    tickDraw,
    tickScroll,
    canvasRef,
    offset,
    selectedTool,
    pictureService,
    title,
    paths,
    savePicture
  ])

  return (
    <Container>
      <ToolBar
        title={title}
        onTitleChange={setTitleWrapper}
        selectedTool={selectedTool}
        onSelectedToolChange={setSelectedTool}
        palmRejectionEnabled={palmRejectionEnabled}
        onPalmRejectionEnabledChange={setPalmRejectionEnabled}
      />
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
        ></canvas>
      </div>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;

  > .canvas-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;

    > canvas {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
  }
`

function getXYFromMouseEvent(
  event: React.MouseEvent,
  [left, top]: [number, number],
  [offsetX, offsetY]: [number, number] = [0, 0]
): Point {
  return { x: event.clientX - left + offsetX, y: event.clientY - top + offsetY }
}

function getXYFromTouchEvent(
  event: TouchEvent,
  [left, top]: [number, number],
  touchType: TouchType | null,
  [offsetX, offsetY]: [number, number] = [0, 0]
): Point | null {
  const touch = getTouch(event, touchType)
  if (touch == null) return null
  const x = touch.clientX - left + offsetX
  const y = touch.clientY - top + offsetY
  return { x, y }
}

function getTouch(event: TouchEvent, touchType: TouchType | null): Touch | null {
  for (const changedTouch of Array.from(event.changedTouches)) {
    if (touchType == null || changedTouch.touchType === touchType) {
      return changedTouch
    }
  }
  return null
}

function getTouchType(palmRejectionEnabled: boolean): TouchType | null {
  return palmRejectionEnabled ? 'stylus' : null
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  { width, color, points }: Path,
  scrollLeft: number,
  scrollTop: number,
  dpr: number
) {
  if (points.length === 0) {
    return
  }

  ctx.lineWidth = width * dpr
  ctx.strokeStyle = color
  let first = true
  ctx.beginPath()
  for (const { x, y } of points) {
    const realX = (x - scrollLeft) * dpr
    const realY = (y - scrollTop) * dpr
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

function erase(paths: Path[], p1: Point): Path[] {
  const pathsToRemove = paths.filter((path) => {
    return path.points.some((p2) => {
      return isCloser(p1, p2, 3)
    })
  })
  return pathsToRemove
}

function isCloser({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point, r: number): boolean {
  const d = (x1 - x2) ** 2 + (y1 - y2) ** 2
  return d <= r ** 2
}

function removePaths(paths: Path[], pathsToRemove: Set<Path>): Path[] {
  const newPaths = paths.filter((path) => !pathsToRemove.has(path))
  if (newPaths.length === paths.length) {
    return paths
  }
  return newPaths
}
