import React, { FC, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useAuth } from '../hooks/useAuth'

const duration = 700

export const SplashScreen: FC = () => {
  const { currentUser } = useAuth()
  const isFirst = useRef(true)
  const [isWaiting, setIsWaiting] = useState(true)

  useEffect(() => {
    if (!isFirst.current) return

    isFirst.current = false
    if (currentUser === undefined) {
      setTimeout(() => {
        setIsWaiting(false)
      }, duration)
    } else {
      setIsWaiting(false)
    }
  }, [currentUser])

  if (isWaiting || currentUser === undefined) {
    return (
      <Container>
        <h1>Kakeru</h1>
      </Container>
    )
  }

  return null
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fffe;
  display: grid;
  place-items: center;
  z-index: 9999;
  --text-stroke-color: #000;

  h1 {
    font-size: 60px;
    font-style: italic;
    color: transparent;
    -webkit-text-stroke: 1.5px var(--text-stroke-color);
  }

  /* dark mode */
  @media (prefers-color-scheme: dark) {
    background: #000;
    --text-stroke-color: #fff;
  }
`
