import { parse } from 'cookie'
import { dedent } from '@qnighy/dedent'

type OgpInfo = {
  title: string
  imageUrl: string
  url: string
}

type Env = {
  PROJECT_ID: string
  GOOGLE_TOKEN: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const noOgp = parse(context.request.headers.get('cookie') ?? '')['kakeru_no_ogp']
  if (noOgp) {
    return await context.next()
  }

  const url = new URL(context.request.url)
  const res = await context.next()

  if (url.pathname === '/') {
    return putOgp(res, {
      title: 'Kakeru',
      imageUrl: 'https://i.kakeru.app/3479fc77f3e5a0074a87e844cc44712f-w500-h300-opaque.png',
      url: 'https://kakeru.app'
    })
  }

  const pictureId = url.pathname.match(/^\/([0-9a-f]{8,})$/)?.[1]
  if (pictureId) {
    console.log(context.env)
    const data = await fetchDataFromFirestore(
      pictureId,
      context.env.PROJECT_ID,
      context.env.GOOGLE_TOKEN
    )
    console.log(data)
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
  projectId: string,
  token: string
): Promise<any> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pictures/${pictureId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  if (!res.ok) return undefined
  return res.json()
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
