import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react'
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
  const pictureService = PictureService.instantiate()
  const { pictureId } = useParams<{ pictureId: string }>()

  const canvasManager = useMemo(() => new CanvasManager(pictureId), [pictureId])

  const [title, setTitle] = useState<string | null>(null)

  const [selectedTool, setSelectedTool] = useVariable(canvasManager.tool)
  const [palmRejectionEnabled, setPalmRejectionEnabled] = useVariable(canvasManager.palmRejection)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const e = canvasRef.current
    if (e != null) {
      canvasManager.setCanvasElement(e)
    }
  }, [canvasRef, canvasManager])

  useEffect(() => {
    if (title != null) {
      pictureService.setTitle(pictureId, title)
    }
  }, [pictureService, pictureId, title])

  useEffect(() => {
    pictureService.fetchPicture(pictureId).then((picture) => {
      if (picture != null) {
        const { title, paths } = picture
        if (title != null) {
          setTitle(title)
        }
        if (paths != null) {
          canvasManager.addPaths(paths)
        }
      }
    })

    pictureService.watchPicture(
      pictureId,
      ({ pictureId: targetPictureId, title: newTitle, pathsToAdd, pathIdsToRemove }) => {
        if (targetPictureId !== pictureId) return

        if (newTitle != null) {
          setTitle(newTitle)
        }

        if (pathsToAdd != null) {
          canvasManager.addPaths(pathsToAdd)
        }
        if (pathIdsToRemove != null) {
          canvasManager.removePathsById(pathIdsToRemove)
        }
      }
    )

    const unsubscribeAdd = canvasManager.onPathsAdded.subscribe((paths) => {
      pictureService.addAndRemovePaths(pictureId, paths, null)
    })
    const unsubscribeRemove = canvasManager.onPathsRemoved.subscribe((pathIds) => {
      pictureService.addAndRemovePaths(pictureId, null, pathIds)
    })

    return () => {
      pictureService.unwatchPicture(pictureId)
      unsubscribeAdd()
      unsubscribeRemove()
    }
  }, [pictureId, pictureService, canvasManager])

  return (
    <>
      <Title>{title || defaultTitle}</Title>
      <Container>
        <ToolBar
          title={title || defaultTitle}
          onTitleChange={setTitle}
          selectedTool={selectedTool}
          onSelectedToolChange={setSelectedTool}
          palmRejectionEnabled={palmRejectionEnabled}
          onPalmRejectionEnabledChange={setPalmRejectionEnabled}
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
