import { GetServerSideProps } from 'next'
import { FC } from 'react'
import { generateId } from '../utils/generateId'

const NewPicture: FC = () => null
export default NewPicture

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { permanent: false, destination: `/${generateId()}` }
})
