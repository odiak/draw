import React, { useRef, useLayoutEffect, useState, useCallback, useMemo } from 'react'
import firebase from 'firebase/app'
import { PathComponent, Path, Point } from './PathComponent'
import styled from '@emotion/styled'

const BoardContainer = styled.svg`
  width: 700px;
  height: 500px;
  border: 1px solid #aaa;
`

export function Drawing() {
  const [paths, setPaths] = useState<readonly Path[]>([])
  const [drawingPath, setDrawingPath] = useState<Path | null>(null)
  const db = useMemo(() => firebase.firestore(), [])
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
    <>
      <div>
        <button
          onClick={useCallback(
            (e: React.MouseEvent<unknown, MouseEvent>) => {
              db.collection('pictures')
                .add({ paths })
                .then((pictureRef) => {
                  console.log(pictureRef)
                })
            },
            [paths]
          )}
        >
          save
        </button>
      </div>
      <BoardContainer
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
      </BoardContainer>
    </>
  )
}
