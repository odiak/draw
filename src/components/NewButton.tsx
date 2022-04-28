import React, { FC } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

export const NewButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <Link href="/" passHref>
      <Button href="/" className={className}>
        <FontAwesomeIcon icon={faPlus} className="icon" />
      </Button>
    </Link>
  )
}

const Button = styled.a`
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
