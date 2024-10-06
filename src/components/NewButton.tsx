import React, { FC } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

export const NewButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <Button to="/new" className={className}>
      <FontAwesomeIcon icon={faPlus} className="icon" />
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
