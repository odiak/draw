import { FC, useContext } from 'react'
import { Args, Keys, translate } from '../i18n/translate'
import { LanguageContext } from '../LanguageContext'

type Props<K extends Keys> = {
  children?: (_text: string) => ReturnType<FC>
  name: K
} & (Args<K> extends [] ? { args?: undefined } : { args: Args<K> })

export function Translate<K extends Keys>({ name, args, children }: Props<K>): ReturnType<FC> {
  const lang = useContext(LanguageContext)
  const text = translate(lang, name, ...((args ?? []) as Args<K>))

  if (children) {
    return children(text)
  }

  return <>{text}</>
}
