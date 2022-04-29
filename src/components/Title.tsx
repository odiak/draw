import React from 'react'
import Head from 'next/head'

export const Title: React.FC<{ children: string }> = ({ children: title }) => {
  const baseTitle = 'Kakeru'
  const compountTitle = /^\s*$/.test(title) ? baseTitle : `${title} - ${baseTitle}`

  return (
    <Head>
      <title key="title">{compountTitle}</title>
    </Head>
  )
}
