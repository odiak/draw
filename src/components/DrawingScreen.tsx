import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react'
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

  const internals = useRef({ animationRequestId: null as number | null }).current

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

  const animationFrameFunction = useCallback(() => {
    if (paths !== drawingService.picture?.paths) {
      setPaths(drawingService.picture?.paths)
    }

    internals.animationRequestId = requestAnimationFrame(animationFrameFunction)
  }, [paths, drawingService, internals])

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      switch (selectedTool) {
        case 'pen':
          drawingService.handlePenDown({
            color: '#000',
            width: 3,
            ...getXYFromMouseEvent(event)
          })
          break

        case 'hand':
          return

        case 'eraser':
          drawingService.handleEraserDown(getXYFromMouseEvent(event))
          break
      }

      animationFrameFunction()
    },
    [drawingService, selectedTool, animationFrameFunction]
  )

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      switch (selectedTool) {
        case 'pen':
          drawingService.handlePenMove(getXYFromMouseEvent(event))
          break

        case 'eraser':
          drawingService.handleEraserMove(getXYFromMouseEvent(event))
          break
      }
    },
    [selectedTool, drawingService]
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
      }

      const { animationRequestId } = internals
      if (animationRequestId != null) {
        cancelAnimationFrame(animationRequestId)
        internals.animationRequestId = null
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
          const xy = getXYFromTouchEvent(event, palmRejectionEnabled)
          if (xy == null) break
          drawingService.handlePenDown({
            color: '#000',
            width: 3,
            ...xy
          })
          break
        }

        case 'eraser': {
          const xy = getXYFromTouchEvent(event, palmRejectionEnabled)
          if (xy == null) break
          drawingService.handleEraserDown(xy)
          break
        }
      }

      animationFrameFunction()
    },
    [selectedTool, drawingService, palmRejectionEnabled, animationFrameFunction]
  )

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      switch (selectedTool) {
        case 'pen': {
          const xy = getXYFromTouchEvent(event, palmRejectionEnabled)
          if (xy == null) break
          drawingService.handlePenMove(xy)
          break
        }

        case 'eraser': {
          const xy = getXYFromTouchEvent(event, palmRejectionEnabled)
          if (xy == null) break
          drawingService.handleEraserMove(xy)
          break
        }
      }
    },
    [selectedTool, drawingService, palmRejectionEnabled]
  )

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      switch (selectedTool) {
        case 'pen':
          if (getTouch(event.nativeEvent, palmRejectionEnabled) != null) {
            drawingService.handlePenUp()
          }
          break

        case 'eraser':
          if (getTouch(event.nativeEvent, palmRejectionEnabled) != null) {
            drawingService.handleEraserUp()
          }
          break
      }

      const { animationRequestId } = internals
      if (animationRequestId != null) {
        cancelAnimationFrame(animationRequestId)
        internals.animationRequestId = null
      }
    },
    [selectedTool, drawingService, palmRejectionEnabled, internals]
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
      <div className="svg-wrapper">
        <svg
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
                    return `M ${x},${y}`
                  } else {
                    return `L ${x},${y}`
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
    overflow: scroll;

    > svg {
      display: block;
      width: 2000px;
      height: 2000px;
      touch-action: none;
    }
  }
`

function getXYFromMouseEvent(event: React.MouseEvent): Point {
  return { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY }
}

function getXYFromTouchEvent(event: React.TouchEvent, palmRejection: boolean): Point | null {
  const rect = (event.target as Element).closest('svg')!.getBoundingClientRect()
  const touch = getTouch(event.nativeEvent, palmRejection)
  if (touch == null) return null
  const x = touch.clientX - window.pageXOffset - rect.left
  const y = touch.clientY - window.pageYOffset - rect.top
  return { x, y }
}

function getTouch(event: TouchEvent, palmRejection: boolean): Touch | null {
  if (!palmRejection) {
    return event.changedTouches[0]
  }

  for (const changedTouch of Array.from(event.changedTouches)) {
    if (changedTouch.touchType === 'stylus') {
      return changedTouch
    }
  }
  return null
}
