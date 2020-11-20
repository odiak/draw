import React from 'react'
import { faPen, faHandPaper, faEraser } from '@fortawesome/free-solid-svg-icons'
import { faLasso } from '@fortawesome/pro-solid-svg-icons'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'

const icons = {
  pen: faPen,
  hand: faHandPaper,
  eraser: faEraser,
  lasso: faLasso
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
      <FontAwesomeIcon icon={icons[tool]} className="icon" />
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
