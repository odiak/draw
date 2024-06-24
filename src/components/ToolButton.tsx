import React, { ReactNode } from 'react'
import { faPen, faHandPaper, faEraser } from '@fortawesome/free-solid-svg-icons'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'
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
  onSelect?: (() => void) | null
}

export function ToolButton({ tool, isSelected, onSelect }: Props) {
  let iconNode: ReactNode
  switch (tool) {
    case 'pen':
    case 'hand':
    case 'eraser': {
      iconNode = <FontAwesomeIcon icon={faIcons[tool]} className="icon" />
      break
    }

    case 'lasso': {
      const Icon = svgIcons[tool]
      iconNode = <Icon className="icon svg-icon" />
      break
    }
  }

  return (
    <Button
      className={classNames({ selected: isSelected })}
      onClick={
        onSelect && !isSelected
          ? () => {
              onSelect()
            }
          : undefined
      }
    >
      {iconNode}
    </Button>
  )
}

const Button = styled.button`
  width: 50px;
  height: 30px;
  border: 0;
  background: #e8e8e8;
  color: inherit;
  vertical-align: top;

  &.selected {
    background: #000;

    > .icon {
      color: #fff;
    }
  }

  > .svg-icon {
    height: 1em;
    display: inline-block;
    vertical-align: -0.125em;
  }

  @media (prefers-color-scheme: dark) {
    & {
      background: #444;
    }

    &.selected {
      background: #aaa;
      > .icon {
        color: #000;
      }
    }
  }
`
