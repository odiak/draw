import { FC } from 'react'
import { TitleAndOgp } from '../components/TitleAndOgp'

const NotFound: FC = () => (
  <>
    <TitleAndOgp noOgp title="Not Found" />
    <p>404 Not found</p>
  </>
)
export default NotFound
