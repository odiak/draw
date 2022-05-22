import Link from 'next/link'
import { FC } from 'react'
import { TitleAndOgp } from '../components/TitleAndOgp'
import { useTranslate } from '../i18n/translate'

const NotFound: FC = () => {
  const t = useTranslate('notFound')

  return (
    <>
      <TitleAndOgp noOgp title={t('shortMessage')} />

      <h1>404</h1>
      <p>{t('message')}</p>
      <p>
        <Link href="/boards" passHref>
          <a>{t('goToBoardsList')}</a>
        </Link>
      </p>
    </>
  )
}
export default NotFound
