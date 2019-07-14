import React, { useRef, useLayoutEffect, useState, useCallback } from 'react'
import styled from '@emotion/styled'
import { AuthDisplay } from './AuthDisplay'

const Board = styled.svg`
  width: 700px;
  height: 500px;
  border: 1px solid #aaa;
`

type Point = {
  x: number
  y: number
}

type Path = {
  color: string
  width: number
  points: readonly Point[]
}

export function App() {
  const [paths, setPaths] = useState<readonly Path[]>([])
  const [drawingPath, setDrawingPath] = useState<Path | null>(null)

  const color = '#000'
  const lineWidth = 3
  const boardRef = useRef<SVGSVGElement>(null)
  const memo = useRef({ isMouseDown: false, points: [] as Point[], paths })
  memo.current.paths = paths

  useLayoutEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      if (memo.current.isMouseDown) {
        memo.current.isMouseDown = false
        setPaths(
          memo.current.paths.concat([{ color, width: lineWidth, points: memo.current.points }])
        )
        memo.current.points = []
      }
    }
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div>
      <h1>draw</h1>
      <AuthDisplay />
      <Board
        ref={boardRef}
        onMouseDown={useCallback((e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
          memo.current.isMouseDown = true
        }, [])}
        onMouseMove={useCallback((e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
          if (memo.current.isMouseDown) {
            const {
              nativeEvent: { offsetX: x, offsetY: y }
            } = e
            const { points } = memo.current
            const lastPoint = points.length > 0 ? points[points.length - 1] : null
            if (lastPoint == null || lastPoint.x !== x || lastPoint.y !== y) {
              memo.current.points.push({ x, y })
              setDrawingPath({ color, width: lineWidth, points: memo.current.points })
            }
          }
        }, [])}
      >
        {paths.map((p, i) => (
          <PathComponent key={i} path={p} />
        ))}
        {drawingPath && <PathComponent path={drawingPath} />}
      </Board>
    </div>
  )
}

function PathComponent({ path }: { path: Path }) {
  return (
    <path
      d={path.points
        .map(({ x, y }, i) => {
          if (i === 0) {
            return `M ${x},${y}`
          } else {
            return `L ${x},${y}`
          }
        })
        .join(' ')}
      fill="none"
      stroke={path.color}
      strokeWidth={path.width}
    />
  )
}
