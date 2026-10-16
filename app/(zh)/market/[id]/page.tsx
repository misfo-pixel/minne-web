import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/market/[id]'>) {
  return detailMetadata('item', props.params, 'zh')
}

export default function Page(props: PageProps<'/market/[id]'>) {
  return <DetailPage type="item" lang="zh" params={props.params} />
}
