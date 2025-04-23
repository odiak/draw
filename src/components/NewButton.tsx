import React, { FC } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Icon } from './Icon'

export const NewButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <Button to="/new" className={className}>
      <Icon name="plus" className="icon" />
    </Button>
  )
}

const Button = styled(Link)`
  display: block;
  width: 30px;
  height: 30px;
  border: 0;
  background: #ddd;
  display: flex;
  justify-content: center;
  align-items: center;

  &:link,
  &:visited {
    color: inherit;
    text-decoration: none;
  }

  > .icon {
    display: block;
  }

  @media (prefers-color-scheme: dark) {
    & {
      background: #444;
    }
  }
`
