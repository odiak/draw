import React, { FC } from 'react'
import { withPrefix } from '../i18n/translate'
import { BottomMenuState } from './Canvas'

const t = withPrefix('canvas')

type Props = {
  state: BottomMenuState | undefined
  onPaste(): void
  onCopy(): void
  onDelete(): void
}

export const CanvasBottomMenu: FC<Props> = ({ state, onCopy, onPaste, onDelete }) => {
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

const BottomMenu: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 m-0 p-0 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] text-center space-x-[5px]">
      {children}
    </div>
  )
}

const BottomMenuItem: FC<{ onClick?: () => void; children: React.ReactNode }> = ({
  onClick,
  children
}) => {
  return (
    <button
      onClick={onClick}
      className="p-[5px] inline-block bg-[#aaab] border-0 rounded-[2px] text-inherit dark:bg-[#666b]"
    >
      {children}
    </button>
  )
}
