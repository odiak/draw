export function tickWithRequestAnimationFrame(f: () => void): () => void {
  let ticking = false

  const wrapped = () => {
    f()
    ticking = false
  }

  return () => {
    if (ticking) return

    ticking = true
    requestAnimationFrame(wrapped)
  }
}
