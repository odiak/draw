import Head from 'next/head'
import { FC } from 'react'
import { baseUrl, imageBaseUrl } from '../constants'

type Props = {
  title: string
  noOgp?: boolean
  url?: string
  image?: string
  noSiteName?: boolean
  description?: string
  noSuffix?: boolean
}

export const TitleAndOgp: FC<Props> = ({
  title,
  noOgp,
  url,
  image,
  noSiteName,
  description,
  noSuffix
}) => {
  const baseTitle = 'Kakeru'
  const compountTitle = noSuffix ? title : `${title} - ${baseTitle}`

  return (
    <Head>
      <title key="title">{compountTitle}</title>
      {!noOgp && (
        <>
          <meta property="og:title" content={title} />
          <meta property="og:type" content="article" />
          <meta
            property="og:image"
            content={
              image ?? `${imageBaseUrl}/3479fc77f3e5a0074a87e844cc44712f-w500-h300-opaque.png`
            }
          />
          <meta property="og:url" content={url ?? baseUrl} />
          {!noSiteName && <meta property="og:site_name" content="Kakeru" />}
          {description !== undefined && <meta property="og:description" content={description} />}
          <meta name="twitter:card" content="summary_large_image" />
        </>
      )}
    </Head>
  )
}
