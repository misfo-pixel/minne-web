import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/en/sublet/[id]'>) {
  return detailMetadata('sublet', props.params, 'en')
}

export default function Page(props: PageProps<'/en/sublet/[id]'>) {
  return <DetailPage type="sublet" lang="en" params={props.params} />
}
