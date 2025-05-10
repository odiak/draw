import { MenuItem, MenuItems } from '@headlessui/react'
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
  const baseClassName =
    'p-2 w-full text-left cursor-default block hover:bg-gray-100 dark:hover:bg-gray-600'

  switch (props.type) {
    case 'link':
      return (
        <MenuItem>
          <Link to={props.to} className={baseClassName}>
            {props.children}
          </Link>
        </MenuItem>
      )
    case 'action':
      return (
        <MenuItem>
          <button className={baseClassName} onClick={props.onClick}>
            {props.children}
          </button>
        </MenuItem>
      )
    case 'text':
      return (
        <MenuItem disabled>
          <div className={baseClassName}>{props.children}</div>
        </MenuItem>
      )
  }
}

export { CustomMenuItems as MenuItems, CustomMenuItem as MenuItem }
