import React, { ReactNode } from 'react'
import { faPen, faHandPaper, faEraser } from '@fortawesome/free-solid-svg-icons'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Lasso from '../assets/lasso.svg?react'

const faIcons = {
  pen: faPen,
  hand: faHandPaper,
  eraser: faEraser
}
const svgIcons = {
  lasso: Lasso
}

type Props = {
  tool: Tool
  isSelected: boolean
  onSelect: (() => void) | null
}

export function ToolButton({ tool, isSelected, onSelect }: Props) {
  let iconNode: ReactNode
  switch (tool) {
    case 'pen':
    case 'hand':
    case 'eraser': {
      iconNode = (
        <FontAwesomeIcon
          icon={faIcons[tool]}
          className={isSelected ? 'text-white dark:text-black' : 'text-black dark:text-white'}
        />
      )
      break
    }

    case 'lasso': {
      const Icon = svgIcons[tool]
      iconNode = (
        <Icon
          className={classNames(
            'icon h-[1em] inline-block align-[-0.125em]',
            isSelected ? 'text-white dark:text-black' : 'text-black dark:text-white'
          )}
        />
      )
      break
    }
  }

  const buttonClasses = classNames(
    'w-[50px] h-[30px] border-0 align-top',
    isSelected
      ? 'text-white bg-black dark:text-black dark:bg-white'
      : 'bg-gray-200 dark:bg-gray-600 text-black dark:text-white'
  )

  return (
    <button className={buttonClasses} onClick={() => !isSelected && onSelect?.()}>
      {tool === 'lasso' ? iconNode : <FontAwesomeIcon icon={faIcons[tool]} />}
    </button>
  )
}
