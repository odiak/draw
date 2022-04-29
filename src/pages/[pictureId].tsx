import { GetServerSideProps } from 'next'
import { FC, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Canvas } from '../components/Canvas'
import { Title } from '../components/Title'
import { ToolBar } from '../components/ToolBar'
import { PictureService } from '../services/PictureService'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'

type Props = {
  pictureId: string
  title: string | null
}

const defaultTitle = 'Untitled'

const DrawingPage: FC<Props> = ({ pictureId, title: initialTitle }) => {
  useSetCurrentScreen('drawing')

  const pictureService = PictureService.instantiate()

  const [title, setTitle] = useState<string | null>(initialTitle)

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
        <div className="canvas-wrapper" suppressHydrationWarning>
          {typeof window !== 'undefined' ? <Canvas pictureId={pictureId} /> : null}
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

export default DrawingPage

const idPattern = /^[0-9a-f]{32}$/

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const pictureId = context.params?.pictureId
  if (typeof pictureId !== 'string' || !idPattern.test(pictureId)) {
    return { notFound: true }
  }

  const title = PictureService.instantiate()
    .fetchPicture(pictureId)
    .then((picture) => picture?.title ?? null)

  return {
    props: title.then((title) => ({
      pictureId,
      title
    }))
  }
}
