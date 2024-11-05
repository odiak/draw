import { parse } from 'cookie'
import { dedent } from '@qnighy/dedent'
import { getAccessToken } from 'web-auth-library/google'

type OgpInfo = {
  title: string
  imageUrl: string
  url: string
}

type Env = {
  GOOGLE_APPLICATION_CREDENTIALS: string
  imageServer: Fetcher
}

const reservedImages = ['/favicon.png', '/kakeru-icon.svg']
const imageUrlPattern = /^\/[-\w]+\.(?:png|svg)$/

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)

  if (url.hostname === 'dev.kakeru.app') {
    url.hostname = 'kakeru.app'
    return Response.redirect(url.toString(), 302)
  }

  const { pathname } = url
  if (!reservedImages.includes(pathname) && imageUrlPattern.test(pathname)) {
    const newUrl = new URL(url)
    newUrl.hostname = 'i.kakeru.app'
    return context.env.imageServer.fetch(newUrl)
  }

  const res = await context.next()

  const noOgp = parse(context.request.headers.get('cookie') ?? '')['kakeru_no_ogp']
  if (noOgp || context.request.method !== 'GET') {
    return res
  }

  if (url.pathname === '/') {
    return putOgp(res, {
      title: 'Kakeru',
      imageUrl: 'https://i.kakeru.app/3479fc77f3e5a0074a87e844cc44712f-w500-h300-opaque.png',
      url: 'https://kakeru.app'
    })
  }

  const pictureId = url.pathname.match(/^\/([0-9a-f]{8,})$/)?.[1]
  if (pictureId) {
    const data = await fetchDataFromFirestore(
      pictureId,
      context.env.GOOGLE_APPLICATION_CREDENTIALS,
      context.waitUntil
    )
    if (data && data.fields.accessibility?.stringValue !== 'private') {
      return putOgp(res, {
        title: data.fields.title?.stringValue ?? 'Untitled',
        imageUrl: `https://i.kakeru.app/${pictureId}-w500-h280-x70-opaque.png`,
        url: `https://kakeru.app/${pictureId}`
      })
    }
  }

  return res
}

function escaped(strings: TemplateStringsArray, ...values: string[]): string {
  return [strings[0], ...values.map(escape).flatMap((v, i) => [v, strings[i + 1]])].join('')
}

function escape(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (match) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[match] ?? '')
  )
}

async function fetchDataFromFirestore(
  pictureId: string,
  credentialsJson: string,
  waitUntil: (p: Promise<unknown>) => void
): Promise<any> {
  const credentials = JSON.parse(credentialsJson)
  const { project_id: projectId } = credentials
  try {
    const token = await getAccessToken({
      credentials,
      scope: ['https://www.googleapis.com/auth/datastore'],
      waitUntil
    })
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pictures/${pictureId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    if (!res.ok) return undefined
    return res.json()
  } catch (e) {
    console.error(e)
    return undefined
  }
}

function putOgp(res: Response, ogp: OgpInfo): Response {
  return new HTMLRewriter()
    .on('head', {
      element: (element) => {
        element.append(
          dedent(escaped)`\
          <meta property="og:title" content="${ogp.title}" />
          <meta property="og:type" content="article"/>
          <meta property="og:image" content="${ogp.imageUrl}" />
          <meta property="og:url" content="${ogp.url}" />
          <meta property="og:description" content="Whiteboard on the Web"/>
          <meta name="twitter:card" content="summary_large_image"/>`,
          { html: true }
        )
      }
    })
    .transform(res)
}
