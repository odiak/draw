import React, { FC, useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { Title } from './Title'
import { PictureService, PictureWithId, Anchor } from '../services/PictureService'
import Link from 'next/link'
import { UserMenuButton } from './UserMenuButton'
import { AuthService } from '../services/AuthService'
import { useVariable } from '../utils/useVariable'
import { NewButton } from './NewButton'
import { useSetCurrentScreen } from '../utils/useSetCurrentScreen'

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
    if (currentUser != null && typeof window !== 'undefined') {
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
      <Title>My boards</Title>

      <ContentContainer>
        <H>My boards</H>
        <PictureList>
          {pictures.map((p) => (
            <Link key={p.id} href={`/${p.id}`} passHref>
              <PictureListItem>
                <PictureThumnail src={`https://i.kakeru.app/${p.id}-w380-h300.png`} />
                <PictureTitle>{p.title ?? 'Untitled'}</PictureTitle>
              </PictureListItem>
            </Link>
          ))}
        </PictureList>
        {loadingState === 'loaded' && anchor != null && <Button onClick={onClick}>More</Button>}
        {loadingState === 'loading' && <Message>Loading...</Message>}
        {loadingState === 'loaded' && pictures.length === 0 && (
          <Message>There is no board.</Message>
        )}
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

const PictureListItem = styled.a`
  width: 190px;
  height: 150px;
  margin: 5px;
  color: inherit;
  text-decoration: none;
  position: relative;
  box-shadow: 1px 1px 4px #6669;
  overflow: hidden;
  border-radius: 2px;

  @media screen and (max-width: 830px) {
    width: calc(25% - 10px);
  }

  @media screen and (max-width: 600px) {
    width: calc(33% - 10px);
  }

  @media screen and (max-width: 400px) {
    width: calc(50% - 10px);
  }
`

const PictureTitle = styled.div`
  position: absolute;
  bottom: 0;
  padding: 4px;
  background: #fffe;
  display: block;
  width: 100%;
  box-sizing: border-box;
`

const PictureThumnail = styled.img`
  transform: scale(0.5) translate(-50%, -50%);
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
`

const StyledNewButton = styled(NewButton)`
  margin-right: 12px;
`
const StyledUserMenuButton = styled(UserMenuButton)`
  margin-right: 22px;
`
