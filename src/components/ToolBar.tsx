import React, { useState, useCallback, FC, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHandPointUp,
  faSlash,
  faSearchPlus,
  faSearchMinus,
  faUndo,
  faRedo
} from '@fortawesome/free-solid-svg-icons'
import { ToolButton } from './ToolButton'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import { Menu as HeadlessMenu } from '@headlessui/react'
import { useMenu } from '../utils/useMenu'
import { useVariable } from '../utils/useVariable'
import { PictureService, Permission, AccessibilityLevel } from '../services/PictureService'
import { AccessibilityMenuButton } from './AccessibilityMenuButton'
import { UserMenuButton } from './UserMenuButton'
import { NewButton } from './NewButton'
import { DrawingService, colors, widths } from '../services/DrawingService'
import { withPrefix } from '../i18n/translate'
import { EllipsisMenuButton } from './EllipsisMenuButton'
import { useAuth } from '../hooks/useAuth'

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

  const { buttonRef: colorWidthButtonRef, menuRef: colorWidthMenuRef } = useMenu()

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
              <button
                className="w-[40px] h-[30px] border-0 bg-gray-200 dark:bg-gray-600 relative text-inherit"
                ref={colorWidthButtonRef}
              >
                <div
                  className="inline-block align-middle border border-black dark:border-gray-400 box-border"
                  style={{
                    backgroundColor: strokeColor,
                    width: `${strokeWidth + 6}px`,
                    height: `${strokeWidth + 6}px`,
                    borderRadius: `${(strokeWidth + 6) / 2}px`
                  }}
                />
                <div
                  ref={colorWidthMenuRef}
                  className="hidden absolute right-0 top-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 m-0 shadow-md z-[100] text-base text-left w-[120px] leading-none p-0"
                >
                  <div>
                    {colors.map((color, i) => (
                      <div
                        key={i}
                        className={`inline-block w-[30px] h-[30px] ${color === strokeColor ? 'rounded bg-gray-300 dark:bg-gray-600' : ''}`}
                        onClick={() => setStrokeColor(color)}
                      >
                        <div
                          className="w-[22px] h-[22px] rounded-[11px] border border-black dark:border-gray-400 m-1 box-border"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    {widths.map((width, i) => (
                      <div
                        key={i}
                        className={`inline-block w-[30px] h-[30px] ${width === strokeWidth ? 'rounded bg-gray-300 dark:bg-gray-600' : ''}`}
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
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            </div>

            <div className="mr-5 h-[30px]">
              <button
                className={`w-[40px] h-[30px] border-0 bg-gray-200 dark:bg-gray-600 relative text-inherit ${palmRejection ? 'bg-gray-600 text-white dark:bg-gray-300 dark:text-black' : ''}`}
                onClick={() => {
                  setPalmRejection(!palmRejection)
                }}
              >
                <span className="fa-layers fa-fw">
                  <FontAwesomeIcon icon={faHandPointUp} className="block" />
                  <FontAwesomeIcon icon={faSlash} className="block text-red-500" />
                </span>
              </button>
            </div>
          </>
        )}

        <div className="mr-5 h-[30px]">
          <button
            className="w-[40px] h-[30px] border-0 bg-gray-200 dark:bg-gray-600 relative text-inherit disabled:dark:text-gray-500"
            onClick={zoomOut}
          >
            <FontAwesomeIcon className="block" icon={faSearchMinus} />
          </button>
          <button
            className="w-[40px] h-[30px] border-0 bg-gray-200 dark:bg-gray-600 relative text-inherit disabled:dark:text-gray-500"
            onClick={zoomIn}
          >
            <FontAwesomeIcon className="block" icon={faSearchPlus} />
          </button>
          <span>{(scale * 100).toFixed()}%</span>
        </div>

        {permission?.writable && (
          <div className="mr-5 h-[30px]">
            <button
              className="w-[40px] h-[30px] border-0 bg-gray-200 dark:bg-gray-600 relative text-inherit disabled:dark:text-gray-500"
              disabled={!canUndo}
              onClick={undo}
            >
              <FontAwesomeIcon className="block" icon={faUndo} />
            </button>
            <button
              className="w-[40px] h-[30px] border-0 bg-gray-200 dark:bg-gray-600 relative text-inherit disabled:dark:text-gray-500"
              disabled={!canRedo}
              onClick={redo}
            >
              <FontAwesomeIcon className="block" icon={faRedo} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
