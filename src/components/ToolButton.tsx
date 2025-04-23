import classNames from 'classnames'
import React from 'react'
import styled from 'styled-components'
import { Tool } from '../types/Tool'
import { Icon } from './Icon'

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
      <Icon name={tool} className="icon svg-icon" />
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
