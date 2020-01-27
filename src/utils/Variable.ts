export type Callback<T> = (value: T, prevValue: T) => void

export class Variable<T> {
  private callbacks: Array<Callback<T>> = []
  private _value: T

  constructor(initialValue: T) {
    this._value = initialValue
  }

  get value() {
    return this._value
  }

  next(value: T) {
    const prev = this._value
    this._value = value
    for (const c of this.callbacks) {
      c(value, prev)
    }
  }

  update(f: (prev: T) => T) {
    this.next(f(this._value))
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
