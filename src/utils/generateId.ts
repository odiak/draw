import cryptoModule from 'crypto'

const nBytes = 16

export function generateId(): string {
  return Array.from(
    typeof window !== 'undefined'
      ? crypto.getRandomValues(new Uint8Array(nBytes))
      : cryptoModule.randomBytes(16)
  )
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}
