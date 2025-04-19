import classNames from 'classnames'
import React from 'react'
import styled from 'styled-components'
import Eraser from '../assets/eraser.svg?react'
import Hand from '../assets/hand.svg?react'
import Lasso from '../assets/lasso.svg?react'
import Pen from '../assets/pen.svg?react'
import { Tool } from '../types/Tool'

const svgIcons = {
  lasso: Lasso,
  pen: Pen,
  hand: Hand,
  eraser: Eraser
}

type Props = {
  tool: Tool
  isSelected: boolean
  onSelect?: (() => void) | null
}

export function ToolButton({ tool, isSelected, onSelect }: Props) {
  const Icon = svgIcons[tool]

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
      <Icon className="icon svg-icon" />
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
