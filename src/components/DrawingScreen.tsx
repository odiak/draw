import React, { useEffect, useState } from 'react'
import { ToolBar } from './ToolBar'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { PictureService } from '../services/PictureService'
import { Title } from './Title'
import { Canvas } from './Canvas'

type Props = {}

const defaultTitle = 'Untitled'

export function DrawingScreen({}: Props) {
  const { pictureId } = useParams<{ pictureId: string }>()
  const pictureService = PictureService.instantiate()

  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = pictureService.watchPicture(
      pictureId,
      (picture) => {
        setTitle(picture?.title ?? null)
      },
      { includesLocalChanges: true }
    )

    return () => {
      unsubscribe()
    }
  }, [pictureService, pictureId])

  return (
    <>
      <Title>{title ?? defaultTitle}</Title>
      <Container>
        <ToolBar pictureId={pictureId} />
        <div className="canvas-wrapper">
          <Canvas pictureId={pictureId} />
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
    position: relative;
  }
`
