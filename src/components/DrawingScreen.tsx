import React, { useEffect, useState, useRef, useMemo, useLayoutEffect, useCallback } from 'react'
import { ToolBar } from './ToolBar'
import { useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { PictureService } from '../services/PictureService'
import { CanvasManager } from '../CanvasManager'
import { Title } from './Title'
import { useVariable } from '../utils/useVariable'

type Props = {}

const defaultTitle = 'Untitled'

export function DrawingScreen({}: Props) {
  const { pictureId } = useParams<{ pictureId: string }>()
  const pictureService = PictureService.instantiate()

  const canvasManager = useMemo(() => new CanvasManager(pictureId), [pictureId])

  const [title, setTitle] = useState<string | null>(null)

  const [selectedTool, setSelectedTool] = useVariable(canvasManager.tool)
  const [palmRejectionEnabled, setPalmRejectionEnabled] = useVariable(canvasManager.palmRejection)
  const [scale] = useVariable(canvasManager.scale)

  const [canUndo] = useVariable(canvasManager.canUndo)
  const [canRedo] = useVariable(canvasManager.canRedo)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const e = canvasRef.current
    if (e != null) {
      canvasManager.setCanvasElement(e)
    }

    return () => {
      canvasManager.cleanup()
    }
  }, [canvasRef, canvasManager])

  const setTitleWithUpdate = useCallback(
    (title: string | null) => {
      setTitle(title)
      if (title != null) {
        pictureService.updatePicture(pictureId, { title })
      }
    },
    [setTitle, pictureService, pictureId]
  )

  useEffect(() => {
    const unsubscribe = pictureService.watchPicture(pictureId, ({ title }) => {
      if (title != null) {
        setTitle(title)
      }
    })

    return unsubscribe
  }, [pictureService])

  return (
    <>
      <Title>{title ?? defaultTitle}</Title>
      <Container>
        <ToolBar
          title={title ?? defaultTitle}
          onTitleChange={setTitleWithUpdate}
          selectedTool={selectedTool}
          onSelectedToolChange={setSelectedTool}
          palmRejectionEnabled={palmRejectionEnabled}
          onPalmRejectionEnabledChange={setPalmRejectionEnabled}
          onZoomIn={() => {
            canvasManager.zoomIn()
          }}
          onZoomOut={() => {
            canvasManager.zoomOut()
          }}
          scale={scale}
          imageLink={`https://i.kakeru.app/${pictureId}.svg`}
          pageLink={`https://kakeru.app/${pictureId}`}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => {
            canvasManager.undo()
          }}
          onRedo={() => {
            canvasManager.redo()
          }}
        />
        <div className="canvas-wrapper">
          <canvas ref={canvasRef}></canvas>
        </div>
      </Container>
    </>
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
