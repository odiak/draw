import Link from 'next/link'
import { FC } from 'react'
import { TitleAndOgp } from '../components/TitleAndOgp'
import { Translate } from '../components/Translate'

const NotFound: FC = () => (
  <>
    <Translate name="notFound.shortMessage">
      {(text) => <TitleAndOgp noOgp title={text} />}
    </Translate>

    <h1>404</h1>
    <p>
      <Translate name="notFound.message" />
    </p>
    <p>
      <Link href="/boards" passHref>
        <a>
          <Translate name="notFound.goToBoardsList" />
        </a>
      </Link>
    </p>
  </>
)
export default NotFound
