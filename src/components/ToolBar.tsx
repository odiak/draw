import { Menu, MenuButton, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import classNames from 'classnames'
import React, { FC, Fragment, useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { withPrefix } from '../i18n/translate'
import { DrawingService, colors, widths } from '../services/DrawingService'
import { AccessibilityLevel, Permission, PictureService } from '../services/PictureService'
import { Tool } from '../types/Tool'
import { useVariable } from '../utils/useVariable'
import { AccessibilityMenuButton } from './AccessibilityMenuButton'
import { EllipsisMenuButton } from './EllipsisMenuButton'
import { Icon } from './Icon'
import { NewButton } from './NewButton'
import { ToolButton } from './ToolButton'
import { UserMenuButton } from './UserMenuButton'

const tToolBar = withPrefix('toolBar')

type Props = {
  pictureId: string
}

const WrappedToolButton: FC<{
  tool: Tool
  selectedTool: Tool
  onSelectedToolChange: (_tool: Tool) => void
}> = ({ tool, selectedTool, onSelectedToolChange }) => {
  return (
    <ToolButton
      tool={tool}
      isSelected={selectedTool === tool}
      onSelect={() => onSelectedToolChange(tool)}
    />
  )
}

const defaultTitle = 'Untitled'

export function ToolBar({ pictureId }: Props) {
  const pictureService = PictureService.instantiate()
  const drawingService = DrawingService.instantiate()

  const { currentUser } = useAuth()

  const [title, setTitle] = useState<string | null>(null)
  const setTitleWithUpdate = useCallback(
    (title: string) => {
      setTitle(title)
      pictureService.updateTitle(pictureId, title, currentUser)
    },
    [pictureService, pictureId, currentUser]
  )
  useEffect(() => {
    return pictureService.watchPicture(pictureId, (picture) => {
      setTitle(picture?.title ?? null)
    })
  }, [pictureId, pictureService])

  const [permission, setPermission] = useState<Permission>()
  useEffect(() => {
    return pictureService.watchPermission(pictureId, currentUser, setPermission)
  }, [pictureService, pictureId, currentUser])

  const [tool, setTool] = useVariable(drawingService.tool)
  const [palmRejection, setPalmRejection] = useVariable(drawingService.palmRejectionEnabled)

  const [scale] = useVariable(drawingService.scale)

  const zoomIn = useCallback(() => {
    drawingService.onZoomIn.next(null)
  }, [drawingService])
  const zoomOut = useCallback(() => {
    drawingService.onZoomOut.next(null)
  }, [drawingService])

  const [canUndo] = useVariable(drawingService.canUndo)
  const [canRedo] = useVariable(drawingService.canRedo)

  const undo = useCallback(() => {
    drawingService.onUndo.next(null)
  }, [drawingService])
  const redo = useCallback(() => {
    drawingService.onRedo.next(null)
  }, [drawingService])

  const updateAccessibilityLevel = useCallback(
    (accLevel: AccessibilityLevel) => {
      pictureService.updatePicture(pictureId, currentUser, { accessibilityLevel: accLevel })
    },
    [currentUser, pictureId, pictureService]
  )

  const [strokeWidth, setStrokeWidth] = useVariable(drawingService.strokeWidth)
  const [strokeColor, setStrokeColor] = useVariable(drawingService.strokeColor)

  return (
    <div className="block border-b border-black dark:border-gray-500 touch-none">
      <input
        type="text"
        value={title ?? defaultTitle}
        onChange={(e) => setTitleWithUpdate(e.target.value)}
        placeholder={tToolBar('title')}
        disabled={permission == null || !permission.writable}
        className="block border border-transparent p-[3px] w-[300px] hover:border-gray-300 disabled:bg-inherit disabled:text-inherit disabled:hover:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:hover:border-gray-500"
      />
      <div className="flex w-fit absolute right-0 top-0">
        {permission != null && permission.isOwner && (
          <AccessibilityMenuButton
            className="mr-10"
            permission={permission}
            onAccessibilityLevelChange={updateAccessibilityLevel}
          />
        )}
        <NewButton className="mr-3" />
        <UserMenuButton className="mr-3" />
        <EllipsisMenuButton pictureId={pictureId} permission={permission} />
      </div>
      <div className="flex flex-row flex-wrap mt-1">
        {permission?.writable && (
          <>
            <div className="mr-5 h-[30px]">
              <WrappedToolButton tool="pen" selectedTool={tool} onSelectedToolChange={setTool} />
              <WrappedToolButton tool="hand" selectedTool={tool} onSelectedToolChange={setTool} />
              <WrappedToolButton tool="eraser" selectedTool={tool} onSelectedToolChange={setTool} />
              <WrappedToolButton tool="lasso" selectedTool={tool} onSelectedToolChange={setTool} />
            </div>

            <div className="mr-5 h-[30px]">
              <Menu>
                <MenuButton as={Fragment}>
                  <Button>
                    <div
                      className="inline-block align-middle border border-black dark:border-gray-400 box-border"
                      style={{
                        backgroundColor: strokeColor,
                        width: `${strokeWidth + 6}px`,
                        height: `${strokeWidth + 6}px`,
                        borderRadius: `${(strokeWidth + 6) / 2}px`
                      }}
                    />
                  </Button>
                </MenuButton>
                <MenuItems
                  anchor="bottom"
                  as="div"
                  className="bg-white dark:bg-gray-700 w-30 shadow-lg rounded border-[1px] border-gray-300 dark:border-gray-500"
                >
                  <MenuSection className="grid grid-cols-4">
                    {colors.map((color, i) => (
                      <MenuItem
                        key={i}
                        as="div"
                        className={classNames('w-[30px] h-[30px]', {
                          'rounded bg-gray-300 dark:bg-gray-600': color === strokeColor
                        })}
                        onClick={() => setStrokeColor(color)}
                      >
                        <div
                          className="w-[22px] h-[22px] rounded-full border border-black dark:border-gray-400 m-1 box-border"
                          style={{ backgroundColor: color }}
                        />
                      </MenuItem>
                    ))}
                  </MenuSection>
                  <MenuSection className="grid grid-cols-4">
                    {widths.map((width, i) => (
                      <MenuItem
                        key={i}
                        as="div"
                        className={classNames('w-[30px] h-[30px]', {
                          'rounded bg-gray-300 dark:bg-gray-600': width === strokeWidth
                        })}
                        onClick={() => setStrokeWidth(width)}
                      >
                        <div
                          className="bg-black dark:bg-white box-border"
                          style={{
                            width: `${width * 1.3 + 1}px`,
                            height: `${width * 1.3 + 1}px`,
                            borderRadius: `${(width * 1.3 + 1) / 2}px`,
                            margin: `${(30 - (width * 1.3 + 1)) / 2}px`
                          }}
                        />
                      </MenuItem>
                    ))}
                  </MenuSection>
                </MenuItems>
              </Menu>
            </div>

            <div className="mr-5 h-[30px]">
              <button
                className={classNames(
                  'w-[40px] h-[30px] border-0 relative',
                  palmRejection
                    ? 'bg-gray-600 text-white dark:bg-gray-300 dark:text-black'
                    : 'bg-gray-200 text-black dark:bg-gray-600 dark:text-white'
                )}
                onClick={() => {
                  setPalmRejection(!palmRejection)
                }}
              >
                <Icon name="palmRejection" className="w-[1.2em] inline-block" />
              </button>
            </div>
          </>
        )}

        <div className="mr-5 h-[30px]">
          <Button onClick={zoomOut}>
            <Icon name="zoomOut" className="w-[1.2em] inline-block" />
          </Button>
          <Button onClick={zoomIn}>
            <Icon name="zoomIn" className="w-[1.2em] inline-block" />
          </Button>
          <span>{(scale * 100).toFixed()}%</span>
        </div>

        {permission?.writable && (
          <div className="mr-5 h-[30px]">
            <Button disabled={!canUndo} onClick={undo}>
              <Icon name="undo" className="w-[1.2em] inline-block" />
            </Button>
            <Button disabled={!canRedo} onClick={redo}>
              <Icon name="redo" className="w-[1.2em] inline-block" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

type ButtonProps = React.ComponentProps<'button'>
const Button = ({ children, className, ...props }: ButtonProps) => (
  <button
    className={classNames(
      'w-[40px] h-[30px] border-0 bg-gray-200 text-black dark:bg-gray-600 dark:text-white relative disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-500 dark:disabled:text-gray-400',
      className
    )}
    {...props}
  >
    {children}
  </button>
)
