import React, { useState } from 'react'
import styled from '@emotion/styled'

const Container = styled.div`
  border-bottom: 1px solid #000;
`

type Props = {
  title: string
  onChangeTitle?: ((newTitle: string) => void) | null
}

const TitleInput = styled.input`
  display: block;
  border: 1px solid transparent;

  &:hover {
    border-color: #ccc;
  }
`

export function InfoBar({ title, onChangeTitle }: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(title)

  return (
    <Container>
      <TitleInput
        type="text"
        value={title}
        onChange={(e) => {
          if (onChangeTitle != null) {
            onChangeTitle(e.target.value)
          }
        }}
      />
      <button>undo</button>
      <button>redo</button>
    </Container>
  )
}
