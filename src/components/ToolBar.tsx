import React, { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHandPointUp,
  faSlash,
  faSearchPlus,
  faSearchMinus,
  faEllipsisH,
  faUndo,
  faRedo,
  faPlus,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import { ToolButton } from './ToolButton'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import styled from '@emotion/styled'
import { copyToClipboard } from '../utils/copyToClipboard'
import { Link } from 'react-router-dom'
import { useMenu } from '../utils/useMenu'
import { AuthService } from '../services/AuthService'
import { useVariable } from '../utils/useVariable'

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
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
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
  pageLink,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: Props) {
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const accountMenuButtonRef = useRef<HTMLButtonElement>(null)
  const accountMenuRef = useRef<HTMLUListElement>(null)

  const { show: showMenu, close: closeMenu, toggle: toggleMenu } = useMenu({
    buttonRef: menuButtonRef,
    menuRef: menuRef
  })

  const { show: showAccountMenu, toggle: toggleAccountMenu } = useMenu({
    buttonRef: accountMenuButtonRef,
    menuRef: accountMenuRef
  })

  const authService = AuthService.instantiate()

  const [currentUser] = useVariable(authService.currentUser)

  return (
    <Container>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Title"
      />
      <RightButtonsContainer>
        <NewButton to="/">
          <FontAwesomeIcon icon={faPlus} className="icon" />
        </NewButton>
        <AccountButton ref={accountMenuButtonRef} onClick={toggleAccountMenu}>
          {currentUser != null ? (
            <AccountImage src={currentUser.photoURL || ''} />
          ) : (
            <FontAwesomeIcon icon={faUser} className="icon" />
          )}
          <Menu ref={accountMenuRef} show={showAccountMenu}>
            {currentUser != null ? (
              <>
                <MenuItem
                  onClick={() => {
                    authService.signOut()
                  }}
                >
                  Sign out
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem
                  onClick={async () => {
                    const c = await authService.signInWithGoogle()
                    if (c == null) {
                      alert('Failed to sign in')
                    }
                  }}
                >
                  Sign in with Google
                </MenuItem>
              </>
            )}
          </Menu>
        </AccountButton>
        <MenuButton ref={menuButtonRef} onClick={toggleMenu}>
          <FontAwesomeIcon icon={faEllipsisH} className="icon" />
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
        </MenuButton>
      </RightButtonsContainer>
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

        <div className="tool-group">
          <button className="tool-bar-button" disabled={!canUndo} onClick={onUndo}>
            <FontAwesomeIcon className="icon" icon={faUndo} />
          </button>
          <button className="tool-bar-button" disabled={!canRedo} onClick={onRedo}>
            <FontAwesomeIcon className="icon" icon={faRedo} />
          </button>
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

const RightButtonsContainer = styled.div`
  display: flex;
  width: fit-content;
  align-items: right;
  position: absolute;
  right: 0;
  top: 0;
`

const MenuButton = styled.button`
  width: 36px;
  height: 30px;
  border: 0;
  background: #ddd;
  position: relative;
`

const Menu = styled.ul<{ show: boolean }>`
  padding: 0;
  list-style: none;
  position: absolute;
  right: 0;
  top: 100%;
  display: ${({ show }) => (show ? 'block' : 'none')};
  background: #fff;
  border: 1px solid #ccc;
  margin: 0;
  box-shadow: 0 0 6px #0004;
  z-index: 100;
  font-size: 16px;
  width: max-content;
  text-align: left;
  min-width: 160px;
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

const NewButton = styled(Link)`
  display: block;
  width: 30px;
  height: 30px;
  border: 0;
  background: #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;

  &:link,
  &:visited {
    color: inherit;
    text-decoration: none;
  }

  > .icon {
    display: block;
  }
`

const AccountButton = styled.button`
  display: block;
  width: 30px;
  height: 30px;
  border: 0;
  background: #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  position: relative;
  padding: 1px;

  > .icon {
    display: block;
  }
`

const AccountImage = styled.img`
  width: 100%;
  height: 100%;
`
