export type Callback<T> = (value: T) => void

export class Subject<T> {
  private callbacks: Array<Callback<T>> = []

  next(value: T) {
    for (const c of this.callbacks) {
      c(value)
    }
  }

  subscribe(callback: Callback<T>): () => void {
    this.callbacks.push(callback)

    return () => {
      this.unsubscribe(callback)
    }
  }

  unsubscribe(callback: Callback<T>) {
    const i = this.callbacks.indexOf(callback)
    if (i !== -1) {
      this.callbacks.splice(i, 1)
    }
  }
}
