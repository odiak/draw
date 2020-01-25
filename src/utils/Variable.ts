import { Callback } from './Subject'

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
    this._value = value
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
