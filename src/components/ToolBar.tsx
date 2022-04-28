import React, { useState, useCallback, FC, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHandPointUp,
  faSlash,
  faSearchPlus,
  faSearchMinus,
  faEllipsisH,
  faUndo,
  faRedo
} from '@fortawesome/free-solid-svg-icons'
import { ToolButton } from './ToolButton'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import styled, { css } from 'styled-components'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useMenu } from '../utils/useMenu'
import { useVariable } from '../utils/useVariable'
import { PictureService, Permission, AccessibilityLevel } from '../services/PictureService'
import { AccessibilityMenuButton } from './AccessibilityMenuButton'
import { MenuDivider, MenuItem, MenuItemWithAnchor, Menu, MenuItemText } from './Menu'
import { UserMenuButton } from './UserMenuButton'
import { NewButton } from './NewButton'
import { DrawingService, colors, widths } from '../services/DrawingService'

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

const MenuItemToCopy: FC<{ text: string }> = ({ children, text }) => {
  return (
    <MenuItem
      onClick={() => {
        copyToClipboard(text)
      }}
    >
      {children}
    </MenuItem>
  )
}

const MenuItemWithLink: FC<{ link: string }> = ({ link, children }) => {
  return (
    <MenuItemWithAnchor>
      <a href={link} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </MenuItemWithAnchor>
  )
}

const defaultTitle = 'Untitled'

export function ToolBar({ pictureId }: Props) {
  const pictureService = PictureService.instantiate()
  const drawingService = DrawingService.instantiate()

  const { menuRef, buttonRef: menuButtonRef } = useMenu()

  const [title, setTitle] = useState<string | null>(null)
  const setTitleWithUpdate = useCallback(
    (title: string) => {
      setTitle(title)
      pictureService.updateTitle(pictureId, title)
    },
    [setTitle, pictureId, pictureService]
  )
  useEffect(() => {
    return pictureService.watchPicture(pictureId, (picture) => {
      setTitle(picture?.title ?? null)
    })
  }, [pictureId, pictureService])

  const [permission, setPermission] = useState<Permission | null>(null)
  useEffect(() => {
    return pictureService.watchPermission(pictureId, setPermission)
  }, [pictureService, pictureId])

  const imageLink = `https://i.kakeru.app/${pictureId}.svg`
  const pageLink = `https://kakeru.app/${pictureId}`

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
      pictureService.updatePicture(pictureId, { accessibilityLevel: accLevel })
    },
    [pictureId, pictureService]
  )

  const { buttonRef: colorWidthButtonRef, menuRef: colorWidthMenuRef } = useMenu()

  const [strokeWidth, setStrokeWidth] = useVariable(drawingService.strokeWidth)
  const [strokeColor, setStrokeColor] = useVariable(drawingService.strokeColor)

  return (
    <Container>
      <input
        type="text"
        value={title ?? defaultTitle}
        onChange={(e) => setTitleWithUpdate(e.target.value)}
        placeholder="Title"
        disabled={permission == null || !permission.writable}
      />
      <RightButtonsContainer>
        {permission != null && permission.isOwner && (
          <StyledAccessibilityMenuButton
            permission={permission}
            onAccessibilityLevelChange={updateAccessibilityLevel}
          />
        )}
        <StyledNewButton />
        <StyledUserMenuButton />
        <MenuButton ref={menuButtonRef}>
          <FontAwesomeIcon icon={faEllipsisH} className="icon" />
          <Menu ref={menuRef}>
            {permission?.accessibilityLevel === 'private' ? (
              <MenuItemText>No image link for this access level</MenuItemText>
            ) : (
              <>
                <MenuItemToCopy text={imageLink}>Copy image link</MenuItemToCopy>
                <MenuItemToCopy text={`[![](${imageLink})](${pageLink})`}>
                  Copy image link for Markdown
                </MenuItemToCopy>
                <MenuItemToCopy text={`[${pageLink} ${imageLink}]`}>
                  Copy image link for Scrapbox
                </MenuItemToCopy>
              </>
            )}
            <MenuDivider />
            <MenuItemWithLink link="https://about.kakeru.app/">About Kakeru</MenuItemWithLink>
            <MenuItemWithLink link="/flags">Experimental flags</MenuItemWithLink>
          </Menu>
        </MenuButton>
      </RightButtonsContainer>
      <div className="tools">
        {permission?.writable && (
          <>
            <div className="tool-group">
              <WrappedToolButton tool="pen" selectedTool={tool} onSelectedToolChange={setTool} />
              <WrappedToolButton tool="hand" selectedTool={tool} onSelectedToolChange={setTool} />
              <WrappedToolButton tool="eraser" selectedTool={tool} onSelectedToolChange={setTool} />
              <WrappedToolButton tool="lasso" selectedTool={tool} onSelectedToolChange={setTool} />
            </div>

            <div className="tool-group">
              <button className="tool-bar-button" ref={colorWidthButtonRef}>
                <ColorIcon color={strokeColor} width={strokeWidth} />
                <ColorWidthMenu ref={colorWidthMenuRef}>
                  <div>
                    {colors.map((color, i) => (
                      <ColorWidthMenuItem
                        key={i}
                        selected={color === strokeColor}
                        onClick={() => setStrokeColor(color)}
                      >
                        <ColorIndicator color={color} />
                      </ColorWidthMenuItem>
                    ))}
                  </div>
                  <div>
                    {widths.map((width, i) => (
                      <ColorWidthMenuItem
                        key={i}
                        selected={width === strokeWidth}
                        onClick={() => setStrokeWidth(width)}
                      >
                        <WidthIndicator width={width} />
                      </ColorWidthMenuItem>
                    ))}
                  </div>
                </ColorWidthMenu>
              </button>
            </div>

            <div className="tool-group">
              <button
                className={classNames('tool-bar-button', { selected: palmRejection })}
                onClick={() => {
                  setPalmRejection(!palmRejection)
                }}
              >
                <span className="fa-layers fa-fw">
                  <FontAwesomeIcon icon={faHandPointUp} className="icon" />
                  <FontAwesomeIcon icon={faSlash} className="icon" />
                </span>
              </button>
            </div>
          </>
        )}

        <div className="tool-group">
          <button className="tool-bar-button" onClick={zoomOut}>
            <FontAwesomeIcon className="icon" icon={faSearchMinus} />
          </button>
          <button className="tool-bar-button" onClick={zoomIn}>
            <FontAwesomeIcon className="icon" icon={faSearchPlus} />
          </button>
          <span>{(scale * 100).toFixed()}%</span>
        </div>

        {permission?.writable && (
          <div className="tool-group">
            <button className="tool-bar-button" disabled={!canUndo} onClick={undo}>
              <FontAwesomeIcon className="icon" icon={faUndo} />
            </button>
            <button className="tool-bar-button" disabled={!canRedo} onClick={redo}>
              <FontAwesomeIcon className="icon" icon={faRedo} />
            </button>
          </div>
        )}
      </div>
    </Container>
  )
}

const Container = styled.div`
  display: block;
  border-bottom: 1px solid #000;
  touch-action: manipulation;

  input {
    display: block;
    border: 1px solid transparent;
    padding: 3px;
    width: 300px;

    &:hover {
      border-color: #ccc;
    }

    &:disabled {
      background: inherit;
      color: inherit;
      &:hover {
        border-color: transparent;
      }
    }
  }

  .tools {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .tool-group {
    margin-right: 20px;
    height: 30px;
  }

  .tool-bar-button {
    width: 40px;
    height: 30px;
    border: 0;
    background: #e8e8e8;
    position: relative;

    .fa-slash {
      color: red !important;
    }

    &.selected {
      background: #444;

      .icon {
        color: #fff;
      }
    }
  }
`

const RightButtonsContainer = styled.div`
  display: flex;
  width: fit-content;
  align-items: right;
  position: absolute;
  right: 0;
  top: 0;
`

const StyledNewButton = styled(NewButton)`
  margin-right: 12px;
`

const StyledUserMenuButton = styled(UserMenuButton)`
  margin-right: 12px;
`

const MenuButton = styled.button`
  width: 36px;
  height: 30px;
  border: 0;
  background: #ddd;
  position: relative;
`

const StyledAccessibilityMenuButton = styled(AccessibilityMenuButton)`
  margin-right: 40px;
`

const ColorIcon = styled.div<{ color: string; width: number }>`
  border: 1px solid #000;
  box-sizing: border-box;
  display: inline-block;
  background: ${(p) => p.color};
  vertical-align: middle;
  ${(p) => {
    const size = p.width + 6
    return css`
      width: ${size}px;
      height: ${size}px;
      border-radius: ${size / 2}px;
    `
  }}
`

const ColorWidthMenu = styled.div`
  padding: 0;
  position: absolute;
  right: 0;
  top: 100%;
  background: #fff;
  border: 1px solid #ccc;
  margin: 0;
  box-shadow: 0 0 6px #0004;
  z-index: 100;
  font-size: 16px;
  text-align: left;
  width: 120px;
  display: none;
  line-height: 0;
`

const ColorWidthMenuItem = styled.div<{ selected?: boolean }>`
  display: inline-block;
  width: 30px;
  height: 30px;
  ${(p) =>
    p.selected &&
    css`
      border-radius: 4px;
      background: #ccc;
    `}
`

const ColorIndicator = styled.div<{ color: string }>`
  background: ${(p) => p.color};
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid #000;
  box-sizing: border-box;
  margin: 4px;
`

const WidthIndicator = styled.div<{ width: number }>`
  box-sizing: border-box;
  background: #000;
  ${(p) => {
    const size = p.width * 1.3 + 1
    return css`
      width: ${size}px;
      height: ${size}px;
      border-radius: ${size / 2}px;
      margin: ${(30 - size) / 2}px;
    `
  }}
`
