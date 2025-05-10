import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isNotSignedIn, isSignedIn, useAuth } from '../hooks/useAuth'
import { useImageToken } from '../hooks/useImageToken'
import { withPrefix } from '../i18n/translate'
import { Anchor, PictureService, PictureWithId } from '../services/PictureService'
import { removeArrayElementAt } from '../utils/removeArrayElementAt'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'
import { EllipsisMenuButton } from './EllipsisMenuButton'
import { Icon } from './Icon'
import { PictureListItem } from './PictureListItem'
import { Title } from './Title'
import { UserMenuButton } from './UserMenuButton'

const t = withPrefix('boards')

type LoadingState = 'initial' | 'loading' | 'loaded'

export const Pictures: FC = () => {
  useSetCurrentScreen('list')

  const pictureService = PictureService.instantiate()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [pictures, setPictures] = useState<Array<PictureWithId>>([])
  const [loadingState, setLoadingState] = useState<LoadingState>('initial')
  const [anchor, setAnchor] = useState<Anchor>()
  const { imageToken } = useImageToken()

  const buttonRef = useRef<HTMLButtonElement>(null)

  const fetchPictures = useCallback(
    async (anchor_: Anchor = anchor) => {
      if (currentUser === undefined || !isSignedIn(currentUser)) return

      setLoadingState('loading')
      const [fetchedPictures, newAnchor] = await pictureService.fetchPictures(currentUser, anchor_)
      setPictures((ps) => (anchor_ == null ? fetchedPictures : ps.concat(fetchedPictures)))
      setLoadingState('loaded')
      setAnchor(newAnchor)
    },
    [pictureService, anchor, currentUser]
  )

  useEffect(() => {
    if (currentUser === undefined || loadingState !== 'initial') return

    if (isNotSignedIn(currentUser)) {
      navigate('/')
    } else {
      fetchPictures(undefined)
    }
  }, [currentUser, fetchPictures, loadingState, navigate])

  useEffect(() => {
    if (buttonRef.current == null) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchPictures(anchor)
      }
    })
    observer.observe(buttonRef.current)

    return () => {
      observer.disconnect()
    }
  }, [anchor, fetchPictures])

  const onClick = useCallback(() => {
    fetchPictures()
  }, [fetchPictures])

  return (
    <div className="w-full h-full overflow-auto">
      <div className="fixed top-0 right-0 w-fit flex z-10">
        <UserMenuButton className="mr-3" />
        <EllipsisMenuButton />
      </div>
      <Title>{t('title')}</Title>

      <div className="mx-auto max-w-300 p-3 pb-5">
        <h1>{t('title')}</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <Link
            to="/new"
            className="bg-gray-500 dark:bg-gray-600 text-white text-base flex flex-col border-0 relative shadow-md overflow-hidden rounded-sm w-full aspect-4/3 not-supports-aspect-ratio:h-40 hover:scale-103 hover:shadow-lg transition-all duration-200"
          >
            <Icon name="plus" className="block flex-1 p-3" />
            <div className="p-1 bg-white/20 flex-0">{t('new')}</div>
          </Link>
          {pictures.map((p, i) => (
            <PictureListItem
              key={p.id}
              picture={p}
              imageToken={p.accessibilityLevel === 'private' ? imageToken : undefined}
              className="rounded-sm shadow-md overflow-hidden hover:scale-103 hover:shadow-lg transition-all duration-200"
              onDelete={() => {
                setPictures(removeArrayElementAt(pictures, i))
              }}
            />
          ))}
        </div>
        {loadingState === 'loaded' && anchor != null && (
          <button ref={buttonRef} onClick={onClick} className="block mx-auto my-2.5">
            {t('loadMore')}
          </button>
        )}
        {loadingState === 'loading' && <div className="text-center my-2.5">{t('loading')}</div>}
        {loadingState === 'loaded' && pictures.length === 0 && (
          <div className="text-center my-2.5">{t('empty')}</div>
        )}
      </div>
    </div>
  )
}
