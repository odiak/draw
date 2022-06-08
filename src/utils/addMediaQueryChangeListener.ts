export function addMediaQueryChangeListener(
  mql: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void
): () => void {
  if (mql.addEventListener === undefined) {
    mql.addListener(listener)
    return () => mql.removeListener(listener)
  }

  mql.addEventListener('change', listener)
  return () => mql.removeEventListener('change', listener)
}
