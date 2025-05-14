import { FC, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Canvas } from '../components/Canvas'
import { Title } from '../components/Title'

import { SignInBanner } from '../components/SignInBanner'
import { ToolBar } from '../components/ToolBar'
import { Welcome } from '../components/Welcome'
import { useAuth } from '../hooks/useAuth'
import { withPrefix } from '../i18n/translate'
import { PictureService } from '../services/PictureService'
import { InvalidRouteError } from '../utils/InvalidRouteError'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'

const t = withPrefix('global')

function normalizeTitle(title: string | undefined): string | undefined {
  const stripped = title?.replace(/^\s+|\s+$/g, '')
  return stripped === '' ? undefined : stripped
}

const pictureIdPattern = /^[0-9a-f]{32}$/

function useValidatedParams(): { pictureId: string } {
  const { pictureId = '' } = useParams()
  const prev = useRef<string>(undefined)

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

  const navigate = useNavigate()
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

      <div className="flex h-full w-full flex-col select-none">
        <ToolBar pictureId={pictureId} />
        <div className="w-full h-full overflow-hidden relative" suppressHydrationWarning>
          <Canvas pictureId={pictureId} currentUser={currentUser} isWritable={isWritable} />
        </div>
        <SignInBanner />
      </div>

      {showWelcome && (
        <Welcome
          onClose={() => {
            setShowWelcome(false)
            navigate(`/${pictureId}`, { replace: true })
          }}
        />
      )}
    </>
  )
}
