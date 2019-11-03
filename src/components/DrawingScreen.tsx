import React, { useRef, useLayoutEffect, useState, useCallback } from 'react'
import { PathComponent, Path, Point } from './PathComponent'
import styled from '@emotion/styled'
import { InfoBar } from './InfoBar'

const SVGWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: scroll;
`

const StyledSVG = styled.svg`
  width: 2000px;
  height: 2000px;
`

type Props = {
  pictureId?: string
}

export function DrawingScreen({ pictureId }: Props) {
  const [paths, setPaths] = useState<readonly Path[]>([])
  const [title, setTitle] = useState('untitled')

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
    <>
      <InfoBar title={title} onChangeTitle={setTitle} />
      <SVGWrapper>
        <StyledSVG
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
        </StyledSVG>
      </SVGWrapper>
    </>
  )
}
