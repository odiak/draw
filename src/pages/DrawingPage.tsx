import React, { FC, useEffect, useState } from 'react'
import { useRouteMatch } from 'react-router-dom'
import styled from 'styled-components'
import { Canvas } from '../components/Canvas'
import { Title } from '../components/Title'

import { ToolBar } from '../components/ToolBar'
import { useTranslate } from '../i18n/translate'
import { PictureService } from '../services/PictureService'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'

function normalizeTitle(title: string | undefined): string | undefined {
  const stripped = title?.replace(/^\s+|\s+$/g, '')
  return stripped === '' ? undefined : stripped
}

export const DrawingPage: FC = () => {
  const t = useTranslate('global')

  useSetCurrentScreen('drawing')

  const { pictureId } = useRouteMatch<{ pictureId: string }>().params

  const pictureService = PictureService.instantiate()

  const [title, setTitle] = useState<string | undefined>()

  useEffect(() => {
    const unsubscribe = pictureService.watchPicture(
      pictureId,
      (picture) => {
        setTitle(picture?.title)
      },
      { includesLocalChanges: true }
    )

    return () => {
      unsubscribe()
    }
  }, [pictureService, pictureId])

  return (
    <>
      <Title>{normalizeTitle(title) ?? t('defaultTitle')}</Title>

      <Container>
        <ToolBar pictureId={pictureId} />
        <div className="canvas-wrapper" suppressHydrationWarning>
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
