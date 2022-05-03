import { GetServerSideProps } from 'next'
import { FC, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Canvas } from '../components/Canvas'
import { TitleAndOgp } from '../components/TitleAndOgp'
import { ToolBar } from '../components/ToolBar'
import { baseUrl } from '../constants'
import { PictureService, PictureWithId } from '../services/PictureService'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'

type Props = {
  pictureId: string
  picture: Pick<PictureWithId, 'title' | 'accessibilityLevel'> | null
}

const defaultTitle = 'Untitled'
const emptyPattern = /^\s*$/

const DrawingPage: FC<Props> = ({ pictureId, picture }) => {
  useSetCurrentScreen('drawing')

  const pictureService = PictureService.instantiate()

  const [title, setTitle] = useState<string | null>(picture?.title ?? null)

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
      <TitleAndOgp
        noOgp={picture === null || picture.accessibilityLevel === 'private'}
        title={title === null || emptyPattern.test(title) ? defaultTitle : title}
        url={`${baseUrl}/${pictureId}`}
      />
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

  const picture = PictureService.instantiate()
    .fetchPicture(pictureId)
    .catch(() => null)

  return {
    props: picture.then((picture) => ({
      pictureId,
      picture: picture
        ? { title: picture.title, accessibilityLevel: picture.accessibilityLevel }
        : null
    }))
  }
}
