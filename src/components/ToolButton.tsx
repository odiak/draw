import React from 'react'
import { faPen, faHandPaper, faEraser } from '@fortawesome/free-solid-svg-icons'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'
import Lasso from '../assets/lasso.svg?react'

const icons = {
  pen: faPen,
  hand: faHandPaper,
  eraser: faEraser
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
      {/* <FontAwesomeIcon icon={icons[tool]} className="icon" /> */}
      {tool !== 'lasso' ? (
        <FontAwesomeIcon icon={icons[tool]} className="icon" />
      ) : (
        <StyledLasso className="icon" />
      )}
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

const StyledLasso = styled(Lasso)`
  height: 1em;
  display: inline-block;
  vertical-align: -0.125em;
`
