import classNames from 'classnames'
import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export const NewButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <Link
      to="/new"
      className={classNames(
        'w-[30px] h-[30px] border-0 bg-gray-300 dark:bg-gray-600 flex justify-center items-center text-inherit no-underline',
        className
      )}
    >
      <Icon name="plus" className="p-1" />
    </Link>
  )
}
