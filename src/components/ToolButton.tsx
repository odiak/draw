import React from 'react'
import { Icon } from '@iconify/react'
import penIcon from '@iconify-icons/fa-solid/pen'
import handPaper from '@iconify-icons/fa-solid/hand-paper'
import eraserIcon from '@iconify-icons/fa-solid/eraser'
import lassoIcon from '@iconify-icons/mdi/lasso'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import styled from 'styled-components'

const icons = {
  pen: penIcon,
  hand: handPaper,
  eraser: eraserIcon,
  lasso: lassoIcon
}

type Props = {
  tool: Tool
  isSelected: boolean
  onSelect?: (() => void) | null
}

export function ToolButton({ tool, isSelected, onSelect }: Props) {
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
      <Icon icon={icons[tool]} className="icon" />
    </Button>
  )
}

const Button = styled.button`
  width: 50px;
  height: 30px;
  border: 0;
  background: #e8e8e8;

  &.selected {
    background: #000;

    > .icon {
      color: #fff;
    }
  }
`
