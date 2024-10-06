import { useMemo } from 'react'
import { useMatches } from 'react-router-dom'

export const screenNames = {
  new: 'new',
  flags: 'flags',
  drawing: 'drawing',
  boards: 'boards'
}
export type ScreenName = keyof typeof screenNames

export function useScreenName(): ScreenName | undefined {
  const matches = useMatches()
  const screenName = useMemo(
    () => matches.map((m) => m.id).find((id) => id in screenNames),
    [matches]
  )

  return screenName as ScreenName | undefined
}
