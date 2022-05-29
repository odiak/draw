import React, { FC } from 'react'
import { Link } from 'react-router-dom'
import { Title } from '../components/Title'
import { useTranslate } from '../i18n/translate'

export const NotFound: FC = () => {
  const t = useTranslate('notFound')

  return (
    <>
      <Title>{t('shortMessage')}</Title>

      <h1>404</h1>
      <p>{t('message')}</p>
      <p>
        <Link to="/boards">{t('goToBoardsList')}</Link>
      </p>
    </>
  )
}
