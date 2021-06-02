import React, { FC, useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import handPointUp from '@iconify-icons/fa-solid/hand-point-up'
import slashIcon from '@iconify-icons/fa-solid/slash'
import searchPlus from '@iconify-icons/fa-solid/search-plus'
import searchMinus from '@iconify-icons/fa-solid/search-minus'
import ellipsisH from '@iconify-icons/fa-solid/ellipsis-h'
import undoIcon from '@iconify-icons/fa-solid/undo'
import redoIcon from '@iconify-icons/fa-solid/redo'
import { ToolButton } from './ToolButton'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import styled, { css } from 'styled-components'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useMenu } from '../utils/useMenu'
import { useVariable } from '../utils/useVariable'
import { AccessibilityLevel, Permission, PictureService } from '../services/PictureService'
import { CanvasManager } from '../CanvasManager'
import { AccessibilityMenuButton } from './AccessibilityMenuButton'
import { Menu, MenuDivider, MenuItem, MenuItemWithAnchor } from './Menu'
import { UserMenuButton } from './UserMenuButton'
import { NewButton } from './NewButton'

const colors = [
  '#c0c0c0',
  '#808080',
  '#000000',
  '#800000',
  '#ff0000',
  '#ffa500',
  '#ffff00',
  '#008000',
  '#0000ff',
  '#ff00ff',
  '#800080',
  '#4b0082'
]

const widths: number[] = [1, 2, 3, 4, 5, 7, 9, 11]

const StyledIcon = styled(Icon)``
const LayerIcons = styled.span`
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1.25em;
  ${StyledIcon} {
    bottom: 0;
    left: 0;
    margin: auto;
    position: absolute;
    right: 0;
    top: 0;
  }
`

type Props = {
  pictureId: string
  canvasManager: CanvasManager
}

const WrappedToolButton: FC<{
  tool: Tool
  selectedTool: Tool
  onSelectedToolChange: (tool: Tool) => void
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

export function ToolBar({ pictureId, canvasManager }: Props) {
  const pictureService = PictureService.instantiate()

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

  const [tool, setTool] = useVariable(canvasManager.tool)
  const [palmRejection, setPalmRejection] = useVariable(canvasManager.palmRejection)

  const [scale] = useVariable(canvasManager.scale)

  const zoomIn = useCallback(() => {
    canvasManager.zoomIn()
  }, [canvasManager])
  const zoomOut = useCallback(() => {
    canvasManager.zoomOut()
  }, [canvasManager])

  const [canUndo] = useVariable(canvasManager.canUndo)
  const [canRedo] = useVariable(canvasManager.canRedo)

  const undo = useCallback(() => {
    canvasManager.undo()
  }, [canvasManager])
  const redo = useCallback(() => {
    canvasManager.redo()
  }, [canvasManager])

  const updateAccessibilityLevel = useCallback(
    (accLevel: AccessibilityLevel) => {
      pictureService.updatePicture(pictureId, { accessibilityLevel: accLevel })
    },
    [pictureId, pictureService]
  )

  const { buttonRef: colorWidthButtonRef, menuRef: colorWidthMenuRef } = useMenu()

  const [strokeWidth, setStrokeWidth] = useVariable(canvasManager.strokeWidth)
  const [strokeColor, setStrokeColor] = useVariable(canvasManager.strokeColor)

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
          <Icon icon={ellipsisH} className="icon" />
          <Menu ref={menuRef}>
            <MenuItemToCopy text={imageLink}>Copy image link</MenuItemToCopy>
            <MenuItemToCopy text={`[![](${imageLink})](${pageLink})`}>
              Copy image link for Markdown
            </MenuItemToCopy>
            <MenuItemToCopy text={`[${pageLink} ${imageLink}]`}>
              Copy image link for Scrapbox
            </MenuItemToCopy>
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
                className={classNames('tool-bar-button', {
                  selected: palmRejection
                })}
                onClick={() => {
                  setPalmRejection(!palmRejection)
                }}
              >
                <LayerIcons>
                  <StyledIcon
                    icon={handPointUp}
                    className="icon"
                    style={{ position: 'absolute' }}
                  />
                  <StyledIcon icon={slashIcon} className="icon fa-slash" style={{ position: 'absolute' }} />
                </LayerIcons>
              </button>
            </div>
          </>
        )}

        <div className="tool-group">
          <button className="tool-bar-button" onClick={zoomOut}>
            <Icon className="icon" icon={searchMinus} />
          </button>
          <button className="tool-bar-button" onClick={zoomIn}>
            <Icon className="icon" icon={searchPlus} />
          </button>
          <span>{(scale * 100).toFixed()}%</span>
        </div>

        {permission?.writable && (
          <div className="tool-group">
            <button className="tool-bar-button" disabled={!canUndo} onClick={undo}>
              <Icon className="icon" icon={undoIcon} />
            </button>
            <button className="tool-bar-button" disabled={!canRedo} onClick={redo}>
              <Icon className="icon" icon={redoIcon} />
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
