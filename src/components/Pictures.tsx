import React, { FC, useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { PictureService, PictureWithId, Anchor } from '../services/PictureService'
import { UserMenuButton } from './UserMenuButton'
import { AuthService } from '../services/AuthService'
import { useVariable } from '../utils/useVariable'
import { NewButton } from './NewButton'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'
import { withPrefix } from '../i18n/translate'
import { Title } from './Title'
import { PictureListItem } from './PictureListItem'
import { removeArrayElementAt } from '../utils/removeArrayElementAt'

const t = withPrefix('boards')

type LoadingState = 'initial' | 'loading' | 'loaded'

export const Pictures: FC = () => {
  useSetCurrentScreen('list')

  const pictureService = PictureService.instantiate()
  const authService = AuthService.instantiate()

  const [pictures, setPictures] = useState<Array<PictureWithId>>([])
  const [loadingState, setLoadingState] = useState<LoadingState>('initial')
  const [anchor, setAnchor] = useState(undefined as Anchor)

  const [currentUser] = useVariable(authService.currentUser)

  const fetchPictures = useCallback(
    (anchor_: Anchor = anchor) => {
      if (currentUser == null) return
      ;(async () => {
        setLoadingState('loading')
        const [fetchedPictures, newAnchor] = await pictureService.fetchPictures(
          currentUser,
          anchor_
        )
        setPictures((ps) => (anchor_ == null ? fetchedPictures : ps.concat(fetchedPictures)))
        setLoadingState('loaded')
        setAnchor(newAnchor)
      })()
    },
    [pictureService, anchor, currentUser]
  )

  useEffect(() => {
    if (currentUser != null) {
      fetchPictures(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  const onClick = useCallback(() => {
    fetchPictures()
  }, [fetchPictures])

  return (
    <Container>
      <ButtonsContainer>
        <StyledNewButton />
        <StyledUserMenuButton />
      </ButtonsContainer>
      <Title>{t('title')}</Title>

      <ContentContainer>
        <H>{t('title')}</H>
        <PictureList>
          {pictures.map((p, i) => (
            <PictureListItem
              key={p.id}
              picture={p}
              onDelete={() => {
                setPictures(removeArrayElementAt(pictures, i))
              }}
            />
          ))}
        </PictureList>
        {loadingState === 'loaded' && anchor != null && (
          <Button onClick={onClick}>{t('loadMore')}</Button>
        )}
        {loadingState === 'loading' && <Message>{t('loading')}</Message>}
        {loadingState === 'loaded' && pictures.length === 0 && <Message>{t('empty')}</Message>}
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
`

const ContentContainer = styled.div`
  margin-left: auto;
  margin-right: auto;
  max-width: 800px;
  padding: 5px;
  padding-bottom: 20px;
`

const H = styled.h1``

const PictureList = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const Button = styled.button`
  display: block;
  margin: 10px auto;
`

const Message = styled.div`
  text-align: center;
  margin: 10px 0;
`

const ButtonsContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: fit-content;
  display: flex;
  z-index: 10;
`

const StyledNewButton = styled(NewButton)`
  margin-right: 12px;
`
const StyledUserMenuButton = styled(UserMenuButton)`
  margin-right: 22px;
`
