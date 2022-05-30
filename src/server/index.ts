import dotenv from 'dotenv'
import express from 'express'
import { readFile } from 'fs/promises'
import { initializeApp } from 'firebase-admin/app'
import { firestore } from 'firebase-admin'

async function getOriginalHtml(): Promise<string> {
  return readFile('dist/index.html', 'utf-8')
}

async function addOgpToHtml(ogpDefs: string): Promise<string> {
  const originalHtml = await getOriginalHtml()
  return originalHtml.replace('</head>', `${ogpDefs}\n</head>`)
}

async function getPicture(
  pictureId: string
): Promise<{ title?: string; accessibilityLevel?: string }> {
  const raw = await db
    .collection('pictures')
    .doc(pictureId)
    .get()
    .catch(() => undefined)
  if (raw === undefined) return {}

  const data = raw.data()
  const rawAccessibilityLevel = data?.accessibilityLevel
  const rawTitle = data?.title
  return {
    accessibilityLevel:
      typeof rawAccessibilityLevel === 'string' ? rawAccessibilityLevel : undefined,
    title: typeof rawTitle === 'string' ? rawTitle : undefined
  }
}

dotenv.config({ path: '.env.local' })

initializeApp()
const db = firestore()

const app = express()

app.get('/', async (req, res) => {
  res.send(
    await addOgpToHtml(`
      <meta property="og:title" content="Kakeru"/>
      <meta property="og:type" content="article"/>
      <meta property="og:image" content="https://i.kakeru.app/3479fc77f3e5a0074a87e844cc44712f-w500-h300-opaque.png"/>
      <meta property="og:url" content="https://kakeru.app"/>
      <meta property="og:description" content="Whiteboard on the Web"/>
      <meta name="twitter:card" content="summary_large_image"/>
    `)
  )
})

const idPattern = /^[0-9a-f]{32}$/

app.get('/:pictureId', async (req, res) => {
  const { pictureId } = req.params
  if (!idPattern.test(pictureId)) {
    res.send(await getOriginalHtml())
    return
  }

  const { accessibilityLevel, title } = await getPicture(pictureId)

  if (accessibilityLevel === 'private') {
    res.send(await getOriginalHtml())
    return
  }

  res.send(
    await addOgpToHtml(`
      <meta property="og:title" content="${title || 'Untitled'}"/>
      <meta property="og:type" content="article"/>
      <meta property="og:image" content="https://i.kakeru.app/${pictureId}-w500-h280-x70-opaque.png"/>
      <meta property="og:url" content="https://kakeru.app/${pictureId}"/>
      <meta property="og:site_name" content="Kakeru"/>
      <meta name="twitter:card" content="summary_large_image"/>
    `)
  )
})

app.get('/:anything*', async (req, res) => {
  res.send(await getOriginalHtml())
})

const port = Number(process.env.PORT || 9000)
app.listen(port, () => {
  console.log(`listening on ${port}`)
})
