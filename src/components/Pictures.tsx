import React, { FC, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Title } from './Title'
import { PictureService, PictureWithId } from '../services/PictureService'
import { Link } from 'react-router-dom'

export const Pictures: FC<{}> = () => {
  const pictureService = PictureService.instantiate()

  const [pictures, setPictures] = useState<Array<PictureWithId>>([])

  useEffect(() => {
    ;(async () => {
      const fetchedPictures = await pictureService.fetchPictures()
      setPictures((ps) => ps.concat(fetchedPictures))
    })()
  }, [pictureService])

  return (
    <Container>
      <Title>My boards</Title>

      <ContentContainer>
        <H>My boards</H>
        <PictureList>
          {pictures.map((p) => (
            <PictureListItem key={p.id} to={`/${p.id}`}>
              <PictureThumnail src={`https://i.kakeru.app/${p.id}.svg`} />
              <PictureTitle>{p.title ?? 'Untitled'}</PictureTitle>
            </PictureListItem>
          ))}
        </PictureList>
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
  max-width: 600px;
`

const H = styled.h1``

const PictureList = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const PictureListItem = styled(Link)`
  width: 190px;
  height: 150px;
  margin-right: 10px;
  margin-bottom: 10px;
  color: inherit;
  text-decoration: none;
  position: relative;
  box-shadow: 1px 1px 4px #6669;
  overflow: hidden;
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
