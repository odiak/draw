import { useContext, useMemo } from 'react'
import { defaultLanguage, Language, LanguageContext, languages } from '../LanguageContext'
import { en } from './en'
import { ja } from './ja'

type Value = string | ((...args: any[]) => string)
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

type RemovePrefix<
  Keys extends string,
  Prefix extends string
> = Keys extends `${Prefix}.${infer Rest}` ? Rest : Prefix extends '' ? Keys : never

type AllPrefixes<Keys extends string> = Keys extends `${infer Prefix}.${infer Rest}`
  ? Prefix | `${Prefix}.${AllPrefixes<Rest>}`
  : never

// ↑ general things

type Data = typeof en
export type Keys = AllKeys<Data>
type KeysWithoutPrefix<Prefix extends string> = RemovePrefix<Keys, Prefix>
type Prefixes = AllPrefixes<Keys> | ''

export type Args<K> = K extends Keys
  ? Dig<Data, K> extends (...args: infer A) => string
    ? A
    : []
  : []

const dataByLanguage: Record<Language, Data> = { en, ja }

function fallbackLanguage(): Language {
  const language = navigator.language
  return languages.find((lg) => language.startsWith(lg)) ?? defaultLanguage
}

export function translate<K extends Keys>(
  lang: Language | undefined,
  key: K,
  ...args: Args<K>
): string {
  if (lang === undefined) {
    lang = fallbackLanguage()
  }

  const value = key
    .split('.')
    .reduce((v: Record<string, any>, k) => v[k], dataByLanguage[lang]) as Dig<Data, K>

  if (typeof value === 'string') return value
  return (value as (...args: any[]) => string)(...args)
}

type UseTranslateResult<Prefix extends string = ''> = <K extends KeysWithoutPrefix<Prefix>>(
  key: K,
  ...args: Args<Prefix extends '' ? K : `${Prefix}.${K}`>
) => string

export function useTranslate(): UseTranslateResult
export function useTranslate<Prefix extends Exclude<Prefixes, ''>>(
  prefix: Prefix
): UseTranslateResult<Prefix>
export function useTranslate<Prefix extends Prefixes>(prefix?: Prefix): UseTranslateResult<Prefix> {
  const lang = useContext(LanguageContext)

  const t = useMemo(() => {
    const normalizedLang = lang ?? fallbackLanguage()

    if (prefix === undefined || prefix === '') {
      return ((key: Keys, ...args: Args<Keys>) =>
        translate(normalizedLang, key, ...args)) as UseTranslateResult<''>
    } else {
      return (restKey: KeysWithoutPrefix<Prefix>, ...args: Args<Keys>) =>
        translate(normalizedLang, `${prefix}.${restKey}` as Keys, ...args)
    }
  }, [prefix, lang])

  return t as UseTranslateResult<Prefix>
}
