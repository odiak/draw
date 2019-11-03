import React from 'react'
import styled from '@emotion/styled'

const Container = styled.div`
  border-bottom: 1px solid #000;
`

type Props = {
  title: string
}

export function InfoBar({ title }: Props) {
  return (
    <Container>
      <div>{title}</div>
      <button>undo</button>
      <button>redo</button>
    </Container>
  )
}
