import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react'
import { ToolBar } from './ToolBar'
import { useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { PictureService } from '../services/PictureService'
import { CanvasManager } from '../CanvasManager'
import { Title } from './Title'

type Props = {}

const defaultTitle = 'Untitled'

export function DrawingScreen({}: Props) {
  const { pictureId } = useParams<{ pictureId: string }>()
  const pictureService = PictureService.instantiate()

  const canvasManager = useMemo(() => new CanvasManager(pictureId), [pictureId])

  const [title, setTitle] = useState<string | null>(null)

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

  useEffect(() => {
    const unsubscribe = pictureService.watchPicture(pictureId, ({ title }) => {
      setTitle(title ?? null)
    })

    return unsubscribe
  }, [pictureService, pictureId])

  return (
    <>
      <Title>{title ?? defaultTitle}</Title>
      <Container>
        <ToolBar pictureId={pictureId} canvasManager={canvasManager} />
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
