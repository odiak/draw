export function shallowEqual(object: unknown, other: unknown): boolean {
  if (object === other) return true

  if (Array.isArray(object)) {
    return (
      Array.isArray(other) &&
      object.length === other.length &&
      object.every((v, i) => v === other[i])
    )
  }

  if (typeof object === 'object') {
    if (typeof other !== 'object') return false
    if (object === null) return other === null
    const objectKeys = Object.keys(object)
    const otherKeys = Object.keys(other as object)
    return (
      objectKeys.length === otherKeys.length &&
      objectKeys.every((k) => k in (other as object) && (object as any)[k] === (other as any)[k])
    )
  }

  return false
}
