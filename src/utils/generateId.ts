/** ランダムな32桁の16進数で構成された文字列を生成する関数 */
export function generateId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}
