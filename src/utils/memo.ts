const uninitialized: unknown = {}

/** 関数の実行結果をcacheするやつ
 *
 * 2回目の呼び出し以降は、1回目の実行結果を返す
 *
 * @param 実行したい関数
 */
export function memo<T>(f: () => T): () => T {
  let val: T = uninitialized as T
  return () => {
    if (val === uninitialized) {
      val = f()
    }
    return val
  }
}
