/** 画面の再描画ごとに1回以下しか実行できないようにするwrapper
 *
 * 何回実行しても、1回の再描画につき最大1回しか実行されないようにする
 *
 * @param f 再描画毎に実行したい関数
 */
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
