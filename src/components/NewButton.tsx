import React, { FC } from 'react'
import styled from 'styled-components'
import { Icon } from '@iconify/react'
import plusIcon from '@iconify-icons/fa-solid/plus'
import { Link } from 'react-router-dom'

export const NewButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <Button to="/" className={className}>
      <Icon icon={plusIcon} className="icon" />
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
`
