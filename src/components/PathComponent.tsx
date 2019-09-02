import React from 'react'
import { Path } from './App'
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
