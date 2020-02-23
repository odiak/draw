import { Subject } from './Subject'
import { useState, useEffect, useCallback } from 'react'

export function useSubject<T>(subject: Subject<T>): [T | null, (value: T) => void] {
  const [value, setValueOriginal] = useState<T | null>(null)

  useEffect(() => {
    const unsubscribe = subject.subscribe(setValueOriginal)
    return unsubscribe
  }, [setValueOriginal, subject])

  const setValue = useCallback(
    (newValue: T) => {
      subject.next(newValue)
    },
    [subject]
  )

  return [value, setValue]
}
