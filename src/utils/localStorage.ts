const dummyLocalStorage: Storage = {
  length: 0,
  clear() {},
  getItem() {
    return null
  },
  key() {
    return null
  },
  setItem() {},
  removeItem() {}
}

export const localStorage = (() => {
  try {
    return window.localStorage ?? dummyLocalStorage
  } catch {
    return dummyLocalStorage
  }
})()
