import { GetServerSideProps } from 'next'
import { FC } from 'react'
import { Pictures } from '../components/Pictures'

const BoardsPage: FC = () => <Pictures />
export default BoardsPage

export const getServerSideProps: GetServerSideProps<{}> = async () => ({ props: {} })
