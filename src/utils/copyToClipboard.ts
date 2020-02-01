export function copyToClipboard(text: string) {
  const input = document.createElement('input')
  input.style.visibility = 'invisible'
  input.style.position = 'fixed'
  document.body.appendChild(input)
  input.value = text
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}
