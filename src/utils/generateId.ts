const nBytes = 16

export function generateId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(nBytes)))
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}
