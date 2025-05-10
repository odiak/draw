import React, { FC, useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const duration = 700

export const SplashScreen: FC = () => {
  const { currentUser } = useAuth()
  const isFirst = useRef(true)
  const [isWaiting, setIsWaiting] = useState(true)

  useEffect(() => {
    if (!isFirst.current) return

    isFirst.current = false
    if (currentUser === undefined) {
      setTimeout(() => {
        setIsWaiting(false)
      }, duration)
    } else {
      setIsWaiting(false)
    }
  }, [currentUser])

  if (isWaiting || currentUser === undefined) {
    return (
      <div className="fixed inset-0 bg-white/90 dark:bg-black grid place-items-center z-[9999]">
        <h1 className="text-[60px] italic text-transparent [--text-stroke-color:black] dark:[--text-stroke-color:white] [-webkit-text-stroke:1.5px_var(--text-stroke-color)]">
          Kakeru
        </h1>
      </div>
    )
  }

  return null
}
