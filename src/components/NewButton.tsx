import React, { FC } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

export const NewButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <Link
      to="/new"
      className={`block w-[30px] h-[30px] border-0 bg-gray-300 dark:bg-gray-600 flex justify-center items-center text-inherit no-underline ${className || ''}`}
    >
      <FontAwesomeIcon icon={faPlus} className="block" />
    </Link>
  )
}
