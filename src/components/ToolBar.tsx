import React, { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHandPointUp,
  faSlash,
  faSearchPlus,
  faSearchMinus,
  faEllipsisH
} from '@fortawesome/free-solid-svg-icons'
import { ToolButton } from './ToolButton'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import styled from '@emotion/styled'
import { copyToClipboard } from '../utils/copyToClipboard'

type Props = {
  selectedTool: Tool
  onSelectedToolChange: (tool: Tool) => void
  title: string
  onTitleChange: (title: string) => void
  palmRejectionEnabled: boolean
  onPalmRejectionEnabledChange: (enabled: boolean) => void
  onZoomIn(): void
  onZoomOut(): void
  scale: number
  imageLink: string
  pageLink: string
}

function makeToolButton(
  tool: Tool,
  selectedTool: Tool,
  onSelectedToolChange: (tool: Tool) => void
) {
  return (
    <ToolButton
      tool={tool}
      isSelected={selectedTool === tool}
      onSelect={() => onSelectedToolChange(tool)}
    />
  )
}

function makeMenuItemToCopy(content: string, textToCopy: string, close: () => void) {
  return (
    <MenuItem
      onClick={() => {
        close()
        copyToClipboard(textToCopy)
      }}
    >
      {content}
    </MenuItem>
  )
}

function makeMenuItemWithLink(content: string, url: string, close: () => void) {
  return (
    <MenuItemWithAnchor onClick={close}>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </MenuItemWithAnchor>
  )
}

export function ToolBar({
  selectedTool,
  onSelectedToolChange,
  title,
  onTitleChange,
  palmRejectionEnabled,
  onPalmRejectionEnabledChange,
  onZoomIn,
  onZoomOut,
  scale,
  imageLink,
  pageLink
}: Props) {
  const [showMenu, setShowMenu] = useState(false)

  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  const closeMenu = useCallback(() => {
    setShowMenu(false)
  }, [setShowMenu])

  // set up for closing menu
  useLayoutEffect(() => {
    if (!showMenu) return

    const isInside = (e: Event) => {
      const menuButton = menuButtonRef.current
      const menu = menuRef.current
      return (
        (menuButton != null && menuButton.contains(e.target as Node)) ||
        (menu != null && menu.contains(e.target as Node))
      )
    }

    const onClick = (e: MouseEvent) => {
      if (isInside(e)) return
      e.preventDefault()
      e.stopPropagation()
      closeMenu()
    }
    document.addEventListener('click', onClick, { capture: true })

    const onTouchStart = (e: TouchEvent) => {
      if (isInside(e)) return
      e.preventDefault()
      e.stopPropagation()
      closeMenu()
    }
    document.addEventListener('touchstart', onTouchStart, { capture: true })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuButtonRef, menuRef, showMenu, closeMenu])

  return (
    <Container>
      <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} />
      <MenuButton
        ref={menuButtonRef}
        onClick={() => {
          setShowMenu(!showMenu)
        }}
      >
        <FontAwesomeIcon icon={faEllipsisH} className="icon" />
      </MenuButton>
      <Menu ref={menuRef} show={showMenu}>
        {makeMenuItemToCopy('Copy image link', imageLink, closeMenu)}
        {makeMenuItemToCopy(
          'Copy image link for Markdown',
          `[![](${imageLink})](${pageLink})`,
          closeMenu
        )}
        {makeMenuItemToCopy(
          'Copy image link for Scrapbox',
          `[${pageLink} ${imageLink}]`,
          closeMenu
        )}
        <MenuDivider />
        {makeMenuItemWithLink('About Kakeru', 'https://about.kakeru.app/', closeMenu)}
      </Menu>
      <div className="tools">
        <div className="tool-group">
          {makeToolButton('pen', selectedTool, onSelectedToolChange)}
          {makeToolButton('hand', selectedTool, onSelectedToolChange)}
          {makeToolButton('eraser', selectedTool, onSelectedToolChange)}
        </div>

        <div className="tool-group">
          <button
            className={classNames('tool-bar-button', { selected: palmRejectionEnabled })}
            onClick={() => {
              onPalmRejectionEnabledChange(!palmRejectionEnabled)
            }}
          >
            <span className="fa-layers fa-fw">
              <FontAwesomeIcon icon={faHandPointUp} className="icon" />
              <FontAwesomeIcon icon={faSlash} className="icon" />
            </span>
          </button>
        </div>

        <div className="tool-group">
          <button className="tool-bar-button" onClick={onZoomOut}>
            <FontAwesomeIcon className="icon" icon={faSearchMinus} />
          </button>
          <button className="tool-bar-button" onClick={onZoomIn}>
            <FontAwesomeIcon className="icon" icon={faSearchPlus} />
          </button>
          <span>{(scale * 100).toFixed()}%</span>
        </div>
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

const MenuButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  width: 36px;
  height: 30px;
  border: 0;
  background: #ddd;
`

const Menu = styled.ul<{ show: boolean }>`
  padding: 0;
  list-style: none;
  position: absolute;
  right: 0;
  top: 30px;
  display: ${({ show }) => (show ? 'block' : 'none')};
  background: #fff;
  border: 1px solid #ccc;
  margin: 0;
  box-shadow: 0 0 6px #0004;
`

const MenuItem = styled.li`
  padding: 6px 8px;
  cursor: pointer;

  &:hover {
    background: #eee;
  }
`

const MenuItemWithAnchor = styled.li`
  padding: 0;
  cursor: pointer;

  &:hover {
    background: #eee;
  }

  & > a:link,
  & > a:visited {
    padding: 6px 8px;
    color: inherit;
    text-decoration: none;
    display: block;
  }
`

const MenuDivider = styled.div`
  height: 1px;
  background: #ccc;
`
