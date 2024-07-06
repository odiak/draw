import React, { FC, useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Canvas } from '../components/Canvas'
import { Title } from '../components/Title'

import { ToolBar } from '../components/ToolBar'
import { withPrefix } from '../i18n/translate'
import { PictureService } from '../services/PictureService'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'
import { InvalidRouteError } from '../utils/InvalidRouteError'
import { useAuth } from '../hooks/useAuth'
import { Welcome } from '../components/Welcome'

const t = withPrefix('global')

function normalizeTitle(title: string | undefined): string | undefined {
  const stripped = title?.replace(/^\s+|\s+$/g, '')
  return stripped === '' ? undefined : stripped
}

const pictureIdPattern = /^[0-9a-f]{32}$/

function useValidatedParams(): { pictureId: string } {
  const { pictureId = '' } = useParams()
  const prev = useRef<string>()

  if (prev.current !== pictureId) {
    prev.current = pictureId

    if (pictureId === '' || !pictureIdPattern.test(pictureId)) {
      throw new InvalidRouteError()
    }
  }

  return { pictureId }
}

export const DrawingPage: FC = () => {
  useSetCurrentScreen('drawing')

  const { pictureId } = useValidatedParams()

  const pictureService = PictureService.instantiate()
  const { currentUser } = useAuth()

  const [title, setTitle] = useState<string | undefined>()
  const [isWritable, setIsWritable] = useState(false)

  const location = useLocation()
  const [showWelcome, setShowWelcome] = useState(() =>
    Boolean(new URLSearchParams(location.search).get('welcome'))
  )

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

  useEffect(() => {
    return pictureService.watchPermission(pictureId, currentUser, (permission) => {
      setIsWritable(permission.writable)
    })
  }, [currentUser, pictureId, pictureService])

  return (
    <>
      <Title>{normalizeTitle(title) ?? t('defaultTitle')}</Title>

      <Container>
        <ToolBar pictureId={pictureId} />
        <div className="canvas-wrapper" suppressHydrationWarning>
          <Canvas pictureId={pictureId} currentUser={currentUser} isWritable={isWritable} />
        </div>
      </Container>

      {showWelcome && (
        <Welcome
          onClose={() => {
            setShowWelcome(false)
          }}
        />
      )}
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
