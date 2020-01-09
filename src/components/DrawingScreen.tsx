import React, {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  MouseEvent,
  WheelEvent
} from 'react'
import { ToolBar } from './ToolBar'
import { DrawingService } from '../services/DrawingService'
import { useParams, useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { Point } from '../services/PictureService'
import { Tool } from '../types/Tool'

type Props = {}

export function DrawingScreen({}: Props) {
  const drawingService = DrawingService.instantiate()
  const { pictureId } = useParams()
  const history = useHistory()

  const [paths, setPaths] = useState(drawingService.picture?.paths)

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
    handScrollingByMouse: false
  }).current

  const svgWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    drawingService.clean()

    if (typeof pictureId === 'string') {
      drawingService.loadPicture(pictureId).then(() => {
        // titleAdapterService.title.next(this.title)
        setPaths(drawingService.picture?.paths)
      })
    } else {
      drawingService.init()
      setPaths(drawingService.picture?.paths)
      // titleAdapterService.title.next(this.title)
    }

    return drawingService.onSave.subscribe(({ pictureId: newPictureId }) => {
      if (newPictureId !== pictureId) {
        history.push(`/p/${pictureId}`)
      }
    })
  }, [pictureId])

  const tickDraw = useCallback(() => {
    if (internals.drawTicking) return

    internals.drawTicking = true
    requestAnimationFrame(() => {
      setPaths(drawingService.picture?.paths)
      internals.drawTicking = false
    })
  }, [internals])

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
    [internals]
  )

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      switch (selectedTool) {
        case 'pen':
          drawingService.handlePenDown({
            color: '#000',
            width: 3,
            ...getXYFromMouseEvent(event, offset)
          })
          tickDraw()
          break

        case 'eraser':
          drawingService.handleEraserDown(getXYFromMouseEvent(event, offset))
          tickDraw()
          break

        case 'hand': {
          const xy = getXYFromMouseEvent(event)
          internals.prevX = xy.x
          internals.prevY = xy.y
          internals.handScrollingByMouse = true
          break
        }
      }
    },
    [drawingService, selectedTool, tickDraw, offset]
  )

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      switch (selectedTool) {
        case 'pen':
          drawingService.handlePenMove(getXYFromMouseEvent(event, offset))
          tickDraw()
          break

        case 'eraser':
          drawingService.handleEraserMove(getXYFromMouseEvent(event, offset))
          tickDraw()
          break

        case 'hand': {
          if (internals.handScrollingByMouse) {
            const xy = getXYFromMouseEvent(event)
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
    [selectedTool, drawingService, offset]
  )

  useLayoutEffect(() => {
    const onMouseUpGlobal = () => {
      switch (selectedTool) {
        case 'pen':
          drawingService.handlePenUp()
          break

        case 'eraser':
          drawingService.handleEraserUp()
          break

        case 'hand':
          internals.handScrollingByMouse = false
          break
      }
    }
    document.addEventListener('mouseup', onMouseUpGlobal)

    return () => {
      document.removeEventListener('mouseup', onMouseUpGlobal)
    }
  }, [selectedTool, drawingService, internals])

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      switch (selectedTool) {
        case 'pen': {
          const xy = getXYFromTouchEvent(event, getTouchType(palmRejectionEnabled), offset)
          if (xy != null) {
            drawingService.handlePenDown({
              color: '#000',
              width: 3,
              ...xy
            })
            break
          }

          // fall through
        }

        case 'eraser': {
          const xy = getXYFromTouchEvent(event, getTouchType(palmRejectionEnabled), offset)
          if (xy != null) {
            drawingService.handleEraserDown(xy)
            break
          }

          // fall through
        }

        default: {
          const xy = getXYFromTouchEvent(event, null)
          if (xy == null) break
          internals.prevX = xy.x
          internals.prevY = xy.y
          break
        }
      }
    },
    [selectedTool, drawingService, palmRejectionEnabled, offset]
  )

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      switch (selectedTool) {
        case 'pen': {
          const xy = getXYFromTouchEvent(event, getTouchType(palmRejectionEnabled), offset)
          if (xy != null) {
            drawingService.handlePenMove(xy)
            tickDraw()
            break
          }

          // fall through
        }

        case 'eraser': {
          const xy = getXYFromTouchEvent(event, getTouchType(palmRejectionEnabled), offset)
          if (xy != null) {
            drawingService.handleEraserMove(xy)
            tickDraw()
            break
          }

          // fall through
        }

        default: {
          const xy = getXYFromTouchEvent(event, null)
          if (xy == null) break
          internals.offsetX += internals.prevX - xy.x
          internals.offsetY += internals.prevY - xy.y
          internals.prevX = xy.x
          internals.prevY = xy.y

          tickScroll()
          break
        }
      }
    },
    [selectedTool, drawingService, palmRejectionEnabled, offset, tickDraw]
  )

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      switch (selectedTool) {
        case 'pen':
          if (getTouch(event.nativeEvent, getTouchType(palmRejectionEnabled)) != null) {
            drawingService.handlePenUp()
            tickDraw()
            break
          }
        // fall through

        case 'eraser':
          if (getTouch(event.nativeEvent, getTouchType(palmRejectionEnabled)) != null) {
            drawingService.handleEraserUp()
            tickDraw()
            break
          }
        // fall through

        default: {
          const xy = getXYFromTouchEvent(event, null)
          if (xy == null) break
          internals.offsetX += internals.prevX - xy.x
          internals.offsetY += internals.prevY - xy.y
          internals.prevX = xy.x
          internals.prevY = xy.y

          tickScroll()
          break
        }
      }
    },
    [selectedTool, drawingService, palmRejectionEnabled, internals, tickDraw]
  )

  return (
    <Container>
      <ToolBar
        title="Untitled"
        onTitleChange={() => {}}
        selectedTool={selectedTool}
        onSelectedToolChange={setSelectedTool}
        palmRejectionEnabled={palmRejectionEnabled}
        onPalmRejectionEnabledChange={setPalmRejectionEnabled}
      />
      <div ref={svgWrapperRef} className="svg-wrapper">
        <svg
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {paths?.map(({ points, color, width }, i) => (
            <path
              key={i}
              fill="none"
              stroke={color}
              strokeWidth={width}
              d={points
                .map(({ x, y }, i) => {
                  if (i === 0) {
                    return `M ${x - offset[0]},${y - offset[1]}`
                  } else {
                    return `L ${x - offset[0]},${y - offset[1]}`
                  }
                })
                .join(' ')}
            />
          ))}
        </svg>
      </div>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;

  .svg-wrapper {
    width: 100%;
    height: 100%;

    > svg {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
    }
  }
`

function getXYFromMouseEvent(
  event: React.MouseEvent,
  [offsetX, offsetY]: [number, number] = [0, 0]
): Point {
  return { x: event.nativeEvent.offsetX + offsetX, y: event.nativeEvent.offsetY + offsetY }
}

function getXYFromTouchEvent(
  event: React.TouchEvent,
  touchType: TouchType | null,
  [offsetX, offsetY]: [number, number] = [0, 0]
): Point | null {
  const rect = (event.target as Element).closest('svg')!.getBoundingClientRect()
  const touch = getTouch(event.nativeEvent, touchType)
  if (touch == null) return null
  const x = touch.clientX - window.pageXOffset - rect.left + offsetX
  const y = touch.clientY - window.pageYOffset - rect.top + offsetY
  return { x, y }
}

function getTouch(event: TouchEvent, touchType: TouchType | null): Touch | null {
  for (const changedTouch of Array.from(event.changedTouches)) {
    if (touchType == null || compareTouchType(changedTouch, touchType)) {
      return changedTouch
    }
  }
  return null
}

function compareTouchType(touch: Touch, touchType: TouchType): boolean {
  if (!('touchType' in touch) && touchType === 'direct') {
    return true
  }
  return touch.touchType === touchType
}

function getTouchType(palmRejectionEnabled: boolean): TouchType {
  return palmRejectionEnabled ? 'stylus' : 'direct'
}
