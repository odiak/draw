import classNames from 'classnames'
import { Tool } from '../types/Tool'
import { Icon } from './Icon'

type Props = {
  tool: Tool
  isSelected: boolean
  onSelect: (() => void) | null
}

export function ToolButton({ tool, isSelected, onSelect }: Props) {
  const buttonClasses = classNames(
    'w-[50px] h-[30px] border-0 align-top',
    isSelected
      ? 'text-white bg-black dark:text-black dark:bg-white'
      : 'bg-gray-200 dark:bg-gray-600 text-black dark:text-white'
  )

  return (
    <button className={buttonClasses} onClick={() => !isSelected && onSelect?.()}>
      <Icon
        name={tool}
        className={classNames(
          'h-[1em] inline-block align-[-0.125em]',
          isSelected ? 'text-white dark:text-black' : 'text-black dark:text-white'
        )}
      />
    </button>
  )
}
