import React, { useState, useCallback, FC, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHandPointUp,
  faSlash,
  faSearchPlus,
  faSearchMinus,
  faEllipsisH,
  faUndo,
  faRedo,
  faPlus
} from '@fortawesome/free-solid-svg-icons'
import { ToolButton } from './ToolButton'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import styled from 'styled-components'
import { copyToClipboard } from '../utils/copyToClipboard'
import { Link } from 'react-router-dom'
import { useMenu } from '../utils/useMenu'
import { useVariable } from '../utils/useVariable'
import { PictureService, Permission, AccessibilityLevel } from '../services/PictureService'
import { CanvasManager } from '../CanvasManager'
import { AccessibilityMenuButton } from './AccessibilityMenuButton'
import { MenuDivider, MenuItem, MenuItemWithAnchor, Menu } from './Menu'
import { UserMenuButton } from './UserMenuButton'
import { NewButton } from './NewButton'

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
            <MenuItemToCopy text={imageLink}>Copy image link</MenuItemToCopy>
            <MenuItemToCopy text={`[![](${imageLink})](${pageLink})`}>
              Copy image link for Markdown
            </MenuItemToCopy>
            <MenuItemToCopy text={`[${pageLink} ${imageLink}]`}>
              Copy image link for Scrapbox
            </MenuItemToCopy>
            <MenuDivider />
            <MenuItemWithLink link="https://about.kakeru.app/">About Kakeru</MenuItemWithLink>
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
  }

  .tool-bar-button {
    width: 50px;
    height: 30px;
    border: 0;
    overflow: hidden;

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
