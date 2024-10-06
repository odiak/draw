import { getFunctions as getFunctionsOriginal } from 'firebase/functions'

export function getFunctions() {
  return getFunctionsOriginal(undefined, 'asia-northeast1')
}
