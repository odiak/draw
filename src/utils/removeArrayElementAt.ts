export function removeArrayElementAt<T>(array: Array<T>, i: number): Array<T> {
  const newArray = array.slice()
  newArray.splice(i, 1)
  return newArray
}
