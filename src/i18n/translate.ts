import { defaultLanguage, Language, languages } from '../LanguageContext'
import { en } from './en'
import { ja } from './ja'

type Value = string | ((..._args: any[]) => string)
type AllKeys<Data, Keys = keyof Data> = Keys extends keyof Data
  ? Keys extends string
    ? Data[Keys] extends Value
      ? Keys
      : `${Keys}.${AllKeys<Data[Keys]>}`
    : never
  : never

type Dig<Data, Keys extends string> = Keys extends `${infer Key}.${infer Rest}`
  ? Key extends keyof Data
    ? Dig<Data[Key], Rest>
    : never
  : Keys extends keyof Data
  ? Data[Keys]
  : never

type Data = typeof en
export type Keys = AllKeys<Data>

export type Args<K extends Keys> = Dig<Data, K> extends (..._args: infer A) => string ? A : []

const dataByLanguage: Record<Language, Data> = { en, ja }

export function translate<K extends Keys>(
  lang: Language | undefined,
  key: K,
  ...args: Args<K>
): string {
  if (lang === undefined) {
    if (typeof window === 'undefined') {
      lang = defaultLanguage
    } else {
      const language = navigator.language
      lang = languages.find((lg) => language.startsWith(lg)) ?? defaultLanguage
    }
  }

  const value = key
    .split('.')
    .reduce((v: Record<string, any>, k) => v[k], dataByLanguage[lang]) as Dig<Data, K>

  if (typeof value === 'string') return value
  return (value as (..._args: any[]) => string)(...args)
}
