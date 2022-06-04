import React, { FC } from 'react'
import styled from 'styled-components'
import { useTranslate } from '../i18n/translate'
import { BottomMenuState } from './Canvas'

type Props = {
  state: BottomMenuState | undefined
  onPaste(): void
  onCopy(): void
  onDelete(): void
}

export const CanvasBottomMenu: FC<Props> = ({ state, onCopy, onPaste, onDelete }) => {
  const t = useTranslate('canvas')

  if (state === undefined) return null

  switch (state.type) {
    case 'lasso': {
      switch (state.state) {
        case 'idle':
          return (
            <BottomMenu>
              <BottomMenuItem onClick={onPaste}>{t('paste')}</BottomMenuItem>
            </BottomMenu>
          )
        case 'drawing':
          return null
        case 'closed':
          return (
            <BottomMenu>
              <BottomMenuItem onClick={onPaste}>{t('paste')}</BottomMenuItem>
              <BottomMenuItem onClick={onDelete}>{t('delete')}</BottomMenuItem>
              <BottomMenuItem onClick={onCopy}>{t('copy')}</BottomMenuItem>
            </BottomMenu>
          )
      }
      break
    }

    default:
      return null
  }
}

const BottomMenu = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  padding-bottom: 16px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  text-align: center;
`

const BottomMenuItem = styled.button`
  margin: 0;
  padding: 5px;
  display: inline-block;
  background: #aaab;
  border: 0;
  border-radius: 2px;
  color: inherit;
  & + & {
    margin-left: 5px;
  }

  @media (prefers-color-scheme: dark) {
    background: #666b;
  }
`
