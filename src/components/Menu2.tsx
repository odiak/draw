import { MenuItem, MenuItemProps, MenuItems, MenuItemsProps } from '@headlessui/react'
import React, { FC, Fragment } from 'react'

const CustomMenuItems: FC<MenuItemsProps> = (props) => {
  return (
    <MenuItems
      className="p-0 bg-white border border-gray-300 m-0 shadow-md text-base w-max text-left min-w-[160px] dark:bg-gray-700 dark:border-gray-600 outline-0 focus-visible:outline-1"
      {...props}
    />
  )
}

type CustomMenuItemProps = MenuItemProps & {
  onClick?: () => void
  children?: React.ReactNode
}

const CustomMenuItem: FC<CustomMenuItemProps> = ({ children, onClick, ...props }) => {
  return (
    <MenuItem as={Fragment} {...props}>
      <div
        className="py-1.5 px-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
        onClick={onClick}
      >
        {children}
      </div>
    </MenuItem>
  )
}

export { CustomMenuItem as MenuItem, CustomMenuItems as MenuItems }
