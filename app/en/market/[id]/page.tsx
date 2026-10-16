import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/en/market/[id]'>) {
  return detailMetadata('item', props.params, 'en')
}

export default function Page(props: PageProps<'/en/market/[id]'>) {
  return <DetailPage type="item" lang="en" params={props.params} />
}
