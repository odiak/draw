const uninitialized: unknown = {}

export function memo<T>(f: () => T): () => T {
  let val: T = uninitialized as T
  return () => {
    if (val === uninitialized) {
      val = f()
    }
    return val
  }
}
