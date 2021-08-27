/** 色情報を保持するclass */
export class Color {
  /** rgbaの4値から`Color`を作成する
   *
   * @param r red
   * @param g green
   * @param b blue
   * @param a 透明度
   */
  constructor(public r: number, public g: number, public b: number, public a: number) {}

  /** 16進数カラーコードから`Color`を作成する
   *
   * @param colorStr 16進数カラーコード
   * @return 作成した`Color`オブジェクト
   */
  static fromString(colorStr: string): Color {
    let r = 1,
      g = 1,
      b = 1,
      a = 1

    if (colorStr[0] === '#') {
      const hex = colorStr.slice(1)
      switch (hex.length) {
        case 8: {
          r = parseTwoDigitsHex(hex.slice(0, 2))
          g = parseTwoDigitsHex(hex.slice(2, 4))
          b = parseTwoDigitsHex(hex.slice(4, 6))
          a = parseTwoDigitsHex(hex.slice(6, 8))
          break
        }

        case 6: {
          r = parseInt(hex.slice(0, 2), 16) / 255
          g = parseInt(hex.slice(2, 4), 16) / 255
          b = parseInt(hex.slice(4, 6), 16) / 255
          break
        }

        case 4: {
          r = parseOneDigitHex(hex[0])
          g = parseOneDigitHex(hex[1])
          b = parseOneDigitHex(hex[2])
          a = parseOneDigitHex(hex[3])
          break
        }

        case 3: {
          r = parseOneDigitHex(hex[0])
          g = parseOneDigitHex(hex[1])
          b = parseOneDigitHex(hex[2])
          break
        }

        default:
          throw new Error(`Unknown color string: ${colorStr}`)
      }
    } else {
      throw new Error(`Unknown color string: ${colorStr}`)
    }

    return new Color(r, g, b, a)
  }

  /** 色情報を複製する
   *
   * @return 複製した色情報
   */
  copy(): Color {
    return new Color(this.r, this.g, this.b, this.a)
  }

  /** `rgba()`関数に変換し、文字列として返す
   *
   * @return rgba()関数の文字列に変換した色
   */
  toString(): string {
    return `rgba(${[this.r, this.g, this.b, this.a]
      .map((n) => `${(n * 100).toFixed(2)}%`)
      .join(',')})`
  }
}

function parseTwoDigitsHex(h: string): number {
  return parseInt(h, 16) / 255
}

function parseOneDigitHex(h: string): number {
  return parseInt(h + h, 16) / 255
}
