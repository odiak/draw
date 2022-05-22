import { createContext } from 'react'

export type Language = 'en' | 'ja'
export const languages: Language[] = ['en', 'ja']
export const defaultLanguage: Language = 'en'
export const LanguageContext = createContext<Language | undefined>(undefined)
