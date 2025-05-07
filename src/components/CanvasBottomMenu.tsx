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
            <div className="absolute bottom-0 left-0 right-0 m-0 p-0 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] text-center">
              <button 
                className="m-0 p-[5px] inline-block bg-gray-400/70 dark:bg-gray-600/70 border-0 rounded-sm text-inherit"
                onClick={onPaste}
              >
                {t('paste')}
              </button>
            </div>
          )
        case 'drawing':
          return null
        case 'closed':
          return (
            <div className="absolute bottom-0 left-0 right-0 m-0 p-0 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] text-center">
              <button 
                className="m-0 p-[5px] inline-block bg-gray-400/70 dark:bg-gray-600/70 border-0 rounded-sm text-inherit"
                onClick={onPaste}
              >
                {t('paste')}
              </button>
              <button 
                className="m-0 ml-[5px] p-[5px] inline-block bg-gray-400/70 dark:bg-gray-600/70 border-0 rounded-sm text-inherit"
                onClick={onDelete}
              >
                {t('delete')}
              </button>
              <button 
                className="m-0 ml-[5px] p-[5px] inline-block bg-gray-400/70 dark:bg-gray-600/70 border-0 rounded-sm text-inherit"
                onClick={onCopy}
              >
                {t('copy')}
              </button>
            </div>
          )
      }
      break
    }

    default:
      return null
  }
}
