import React, { forwardRef, ReactNode } from 'react'

interface MenuProps {
  className?: string;
  children: ReactNode;
}

export const Menu = forwardRef<HTMLUListElement, MenuProps>(({ className = '', children }, ref) => {
  return (
    <ul 
      ref={ref}
      className={`p-0 list-none absolute right-0 top-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 m-0 shadow-md z-100 text-base w-max text-left min-w-[160px] hidden ${className}`}
    >
      {children}
    </ul>
  )
})

Menu.displayName = 'Menu'

interface MenuItemProps {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

export const MenuItem = ({ className = '', onClick, children }: MenuItemProps) => {
  return (
    <li 
      className={`px-2 py-1.5 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${className}`}
      onClick={onClick}
    >
      {children}
    </li>
  )
}

interface MenuItemTextProps {
  className?: string;
  children: ReactNode;
}

export const MenuItemText = ({ className = '', children }: MenuItemTextProps) => {
  return (
    <li className={`px-2 py-1.5 text-gray-500 italic ${className}`}>
      {children}
    </li>
  )
}

interface MenuItemWithAnchorProps {
  className?: string;
  href: string;
  children: ReactNode;
}

export const MenuItemWithAnchor = ({ className = '', href, children }: MenuItemWithAnchorProps) => {
  return (
    <li className={`p-0 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${className}`}>
      <a 
        href={href}
        className="px-2 py-1.5 text-inherit no-underline block"
      >
        {children}
      </a>
    </li>
  )
}

interface MenuDividerProps {
  className?: string;
}

export const MenuDivider = ({ className = '' }: MenuDividerProps) => {
  return (
    <div className={`h-px bg-gray-300 dark:bg-gray-500 ${className}`} />
  )
}
