import { Variable } from './Variable'
import { useState, useCallback, useEffect } from 'react'

export function useVariable<T>(variable: Variable<T>): [T, (value: T) => void] {
  const [value, setValue] = useState(variable.value)

  const setValueWrapper = useCallback(
    (value: T) => {
      variable.next(value)
    },
    [variable]
  )

  useEffect(() => {
    setValue(variable.value)
    return variable.subscribe((value) => {
      setValue(value)
    })
  }, [variable, setValue])

  return [value, setValueWrapper]
}
