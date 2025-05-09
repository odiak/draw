import React, { FC, useState, useEffect, useCallback, useRef } from 'react'
import { PictureService, PictureWithId, Anchor } from '../services/PictureService'
import { UserMenuButton } from './UserMenuButton'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'
import { withPrefix } from '../i18n/translate'
import { Title } from './Title'
import { PictureListItem } from './PictureListItem'
import { removeArrayElementAt } from '../utils/removeArrayElementAt'
import { EllipsisMenuButton } from './EllipsisMenuButton'
import { isNotSignedIn, isSignedIn, useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useImageToken } from '../hooks/useImageToken'

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

      <div className="mx-auto max-w-[800px] p-[5px] pb-5">
        <h1>{t('title')}</h1>
        <div className="flex flex-wrap">
          <Link
            to="/new"
            className="block bg-gray-500 dark:bg-gray-600 text-white text-base flex flex-col border-0 w-[190px] h-[150px] m-[5px] relative shadow-md overflow-hidden rounded-sm no-underline sm:w-[calc(25%-10px)] max-sm:w-[calc(33%-10px)] max-[400px]:w-[calc(50%-10px)]"
          >
            <div className="flex-1 grid place-items-center">
              <FontAwesomeIcon icon={faPlus} className="block text-[80px] flex-1" />
            </div>
            <div className="p-1 bg-white/20">{t('new')}</div>
          </Link>
          {pictures.map((p, i) => (
            <PictureListItem
              key={p.id}
              picture={p}
              imageToken={p.accessibilityLevel === 'private' ? imageToken : undefined}
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
