import React, { useEffect, useState, useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import { ToolBar } from './ToolBar'
import { useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { PictureService } from '../services/PictureService'
import { Tool } from '../types/Tool'
import { CanvasManager } from '../CanvasManager'
import { Title } from './Title'

type Props = {}

export function DrawingScreen({}: Props) {
  const pictureService = PictureService.instantiate()
  const { pictureId } = useParams<{ pictureId: string }>()

  const [title, setTitle] = useState('Untitled')

  const [selectedTool, setSelectedTool] = useState('pen' as Tool)
  const [palmRejectionEnabled, setPalmRejectionEnabled] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const canvasManager = useMemo(() => new CanvasManager(pictureId), [pictureId])

  const setTitleWrapper = useCallback(
    (title: string) => {
      setTitle(title)
      pictureService.setTitle(pictureId, title)
    },
    [setTitle, pictureService, pictureId]
  )

  const setSelectedToolWrapper = useCallback(
    (tool: Tool) => {
      setSelectedTool(tool)
      canvasManager.setTool(tool)
    },
    [setSelectedTool, canvasManager]
  )

  const setPalmRejectionEnabledWrapper = useCallback(
    (enabled: boolean) => {
      setPalmRejectionEnabled(enabled)
      canvasManager.setPalmRejection(enabled)
    },
    [setPalmRejectionEnabled, canvasManager]
  )

  useLayoutEffect(() => {
    const e = canvasRef.current
    if (e != null) {
      canvasManager.setCanvasElement(e)
    }
  }, [canvasRef, canvasManager])

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
      <Title>{title}</Title>
      <Container>
        <ToolBar
          title={title}
          onTitleChange={setTitleWrapper}
          selectedTool={selectedTool}
          onSelectedToolChange={setSelectedToolWrapper}
          palmRejectionEnabled={palmRejectionEnabled}
          onPalmRejectionEnabledChange={setPalmRejectionEnabledWrapper}
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
