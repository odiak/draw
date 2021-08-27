class DummyLocalStorage implements Storage {
  private data: {[k: string]: string} = {}

  get length(): number {
    return Object.getOwnPropertyNames(this.data).length
  }

  clear(): void {
    this.data = {}
  }

  key(index: number): string | null {
    const keys = Object.getOwnPropertyNames(this.data)
    return keys[index] ?? null
  }

  getItem(key: string): string | null {
    return this.data[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.data[key] = value
  }

  removeItem(key: string): void {
    delete this.data[key]
  }
}

const dummyLocalStorage = new DummyLocalStorage()

/** localStorageが無い環境でも使えるようにしたlocalStorageのpolyfill */
export const localStorage = (() => {
  try {
    return window.localStorage ?? dummyLocalStorage
  } catch {
    return dummyLocalStorage
  }
})()
