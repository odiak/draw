import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { FC, useEffect } from 'react'
import { TitleAndOgp } from '../components/TitleAndOgp'
import { baseUrl } from '../constants'
import { generateId } from '../utils/generateId'

const NewPicture: FC = () => {
  const router = useRouter()
  useEffect(() => {
    router.replace(`/${generateId()}`)
  }, [router])

  return (
    <TitleAndOgp
      noSiteName
      noSuffix
      title="Kakeru"
      description="Whiteboard on the Web"
      url={baseUrl}
    />
  )
}
export default NewPicture

export const getServerSideProps: GetServerSideProps<{}> = async () => ({ props: {} })
