import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHandPointUp,
  faSlash,
  faSearchPlus,
  faSearchMinus
} from '@fortawesome/free-solid-svg-icons'
import { ToolButton } from './ToolButton'
import { Tool } from '../types/Tool'
import classNames from 'classnames'
import styled from '@emotion/styled'

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

export function ToolBar({
  selectedTool,
  onSelectedToolChange,
  title,
  onTitleChange,
  palmRejectionEnabled,
  onPalmRejectionEnabledChange,
  onZoomIn,
  onZoomOut,
  scale
}: Props) {
  return (
    <Container>
      <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} />
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
          {(scale * 100).toFixed()}%
        </div>
      </div>
    </Container>
  )
}

const Container = styled.div`
  display: block;
  border-bottom: 1px solid #000;

  input {
    display: block;
    border: 1px solid transparent;

    &:hover {
      border-color: #ccc;
    }
  }

  .tools {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
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
