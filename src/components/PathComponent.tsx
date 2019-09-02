import React from 'react'

export type Point = {
  x: number
  y: number
}

export type Path = {
  color: string
  width: number
  points: readonly Point[]
}

export function PathComponent({ path }: { path: Path }) {
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
