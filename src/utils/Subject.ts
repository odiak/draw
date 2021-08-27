export type Callback<T> = (value: T) => void

export class Subject<T> {
  private callbacks: Array<Callback<T>> = []

  /** 登録された関数を同じ引数を渡して全て実行する
   *
   * @param 登録された関数に渡す引数
   */
  next(value: T) {
    for (const c of this.callbacks) {
      c(value)
    }
  }

  /** 関数を登録する
   *
   * @param 登録する関数
   * @return 登録解除用コールバック
   */
  subscribe(callback: Callback<T>): () => void {
    this.callbacks.push(callback)

    return () => {
      this.unsubscribe(callback)
    }
  }

  /** 関数の登録を解除する
   *
   * 未登録の関数が渡された場合は何もしない
   *
   * @param 登録を解除したい関数
   */
  unsubscribe(callback: Callback<T>) {
    const i = this.callbacks.indexOf(callback)
    if (i !== -1) {
      this.callbacks.splice(i, 1)
    }
  }
}
