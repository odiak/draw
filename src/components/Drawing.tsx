import React, { useRef, useLayoutEffect, useState, useCallback, useMemo, useEffect } from 'react'
import firebase from 'firebase/app'
import { PathComponent, Path, Point } from './PathComponent'
import styled from '@emotion/styled'
import { range } from '@odiak/iterate'

const BoardContainer = styled.svg`
  width: 700px;
  height: 500px;
  border: 1px solid #aaa;
`

type Props = {
  pictureId?: string
}

export function Drawing({ pictureId }: Props) {
  const [paths, setPaths] = useState<readonly Path[]>([])

  const [uid, setUid] = useState(null as string | null)

  const db = useMemo(() => firebase.firestore(), [])
  useEffect(() => {
    if (pictureId == null) return
    console.log(pictureId)

    db.collection('pictures')
      .doc(pictureId)
      .get()
      .then((doc) => {
        console.log(doc)
        if (doc.exists) {
          setPaths((doc.data() as any).paths as Path[])
        }
      })
  }, [pictureId])

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      setUid(user != null ? user.uid : null)
    })
  }, [])

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
      <div>
        <button
          onClick={useCallback(
            (e: React.MouseEvent<unknown, MouseEvent>) => {
              const id =
                pictureId != null
                  ? pictureId
                  : range(16)
                      .map(() => Math.floor(Math.random() * 16).toString(16))
                      .toArray()
                      .join('')

              db.collection('pictures')
                .doc(id)
                .set({ uid, paths })
                .then(() => {
                  if (pictureId == null) {
                    location.href = `/p/${id}`
                  }
                })
            },
            [paths, pictureId]
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
