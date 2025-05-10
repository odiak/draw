import { MenuItem, MenuItems, MenuSeparator } from '@headlessui/react'
import { AnchorProps } from '@headlessui/react/dist/internal/floating'
import classNames from 'classnames'
import { FC, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

const CustomMenuItems: FC<PropsWithChildren<{ anchor?: AnchorProps; className?: string }>> = ({
  children,
  anchor,
  className
}) => {
  return (
    <MenuItems
      anchor={anchor ?? 'bottom end'}
      className={classNames(
        'bg-white dark:bg-gray-700 shadow-lg rounded border-[1px] border-gray-300 dark:border-gray-500',
        className
      )}
    >
      {children}
    </MenuItems>
  )
}

const CustomMenuItem: FC<
  PropsWithChildren<
    | {
        type: 'link'
        to: string
      }
    | { type: 'action'; onClick: () => void }
    | { type: 'text' }
  >
> = (props) => {
  const className =
    'px-2 py-1.5 w-full text-left cursor-default block hover:bg-gray-100 dark:hover:bg-gray-600'

  switch (props.type) {
    case 'link':
      return (
        <MenuItem>
          <Link to={props.to} className={className}>
            {props.children}
          </Link>
        </MenuItem>
      )
    case 'action':
      return (
        <MenuItem>
          <button className={className} onClick={props.onClick}>
            {props.children}
          </button>
        </MenuItem>
      )
    case 'text':
      return (
        <MenuItem disabled>
          <div className={className}>{props.children}</div>
        </MenuItem>
      )
  }
}

const CustomMenuSeparator: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className
}) => {
  return (
    <MenuSeparator
      className={classNames('border-t-1 border-gray-300 dark:border-gray-500 my-1', className)}
    >
      {children}
    </MenuSeparator>
  )
}

export {
  CustomMenuItem as MenuItem,
  CustomMenuItems as MenuItems,
  CustomMenuSeparator as MenuSeparator
}
